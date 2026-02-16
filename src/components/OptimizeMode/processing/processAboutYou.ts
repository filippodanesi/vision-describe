/**
 * Core processing logic for About You product descriptions.
 * Handles AI-powered content generation for Triumph lingerie products
 * on the About You marketplace.
 *
 * Processing Flow:
 * 1. Extract product data using column mapping
 * 2. Apply color translation (deterministic, writes to Colortranslation column)
 * 3. Call AI to generate style_name + long_description
 * 4. Parse and sanitize AI response
 * 5. Update existing columns in-place (Style wording, Long Description)
 */

import { Model } from '@/lib/models';
import { optimizeTextWithAI } from '../utils/optimizationUtils';
import { ABOUTYOU_SYSTEM_PROMPT } from '../utils/prompts/aboutYouSystemPrompt';
import {
  buildAboutYouPrompt,
  parseAboutYouResponse,
  type AboutYouProductData,
} from '../utils/prompts/aboutYouTasks';
import {
  sanitizeStyleName,
  sanitizeLongDescription,
  validateAboutYouOutput,
} from '../utils/sanitizers/aboutYouSanitizer';
import { translateColor, type ColorMapping } from '../utils/translations/colorTranslations';

export interface AboutYouMapping {
  styleNo?: string;
  styleName?: string;
  colorNameSupplier?: string;
  colorTranslation?: string;
  size?: string;
  productGroup?: string;
  styleWording?: string;
  longDescription?: string;
}

/**
 * Processes About You product rows and generates optimized descriptions.
 *
 * @param rows - Array of product data rows from Excel
 * @param model - AI model configuration
 * @param apiKey - API key for the selected model
 * @param mapping - Column mapping configuration for About You fields
 * @param colorMappings - Color translation table (user-reviewed)
 * @param addLog - Optional logging function for progress tracking
 * @param costTracker - Optional cost tracking utility
 * @returns Promise<any[]> - Processed rows with generated descriptions
 */
export async function processAboutYouRows(
  rows: any[],
  model: Model,
  apiKey: string,
  mapping: AboutYouMapping,
  colorMappings: ColorMapping[],
  addLog?: (msg: string) => void,
  costTracker?: any,
): Promise<any[]> {
  const out: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const processed = { ...row } as any;

    // Extract column keys from mapping
    const styleNoKey = mapping.styleNo || 'Style No supplier';
    const styleNameKey = mapping.styleName || 'Style name supplier';
    const colorNameKey = mapping.colorNameSupplier || 'Color name supplier';
    const colorTransKey = mapping.colorTranslation || 'Colortranslation for About You';
    const sizeKey = mapping.size || 'Size';
    const productGroupKey = mapping.productGroup || 'Product group';
    const styleWordingKey = mapping.styleWording || 'Supplier Style Name (Style wording for Shop)';
    const longDescKey = mapping.longDescription || 'Style Long Description for Shop';

    const styleNo = String(row[styleNoKey] ?? '').trim();
    const styleName = String(row[styleNameKey] ?? '').trim();
    const colorNameSupplier = String(row[colorNameKey] ?? '').trim();
    const existingColorTrans = String(row[colorTransKey] ?? '').trim();
    const size = String(row[sizeKey] ?? '').trim();
    const productGroup = String(row[productGroupKey] ?? '').trim();
    const existingStyleWording = String(row[styleWordingKey] ?? '').trim() || undefined;
    const existingLongDesc = String(row[longDescKey] ?? '').trim() || undefined;

    const rowId = styleNo || `row-${i + 1}`;

    // Validate required fields
    if (!styleNo && !styleName) {
      addLog?.(`${rowId} | aboutyou | SKIP: Missing required fields (styleNo/styleName)`);
      out.push(processed);
      continue;
    }

    // Step 1: Apply color translation (deterministic)
    let colorTranslation = existingColorTrans;
    if (!colorTranslation && colorNameSupplier) {
      colorTranslation = translateColor(colorNameSupplier, colorMappings);
      if (colorTranslation !== colorNameSupplier) {
        processed[colorTransKey] = colorTranslation;
        addLog?.(`${rowId} | aboutyou | COLOR: "${colorNameSupplier}" -> "${colorTranslation}"`);
      }
    }

    // Step 1b: Translate Color name supplier to English
    if (colorNameSupplier && colorTranslation && colorTranslation !== colorNameSupplier) {
      processed[colorNameKey] = colorTranslation;
      addLog?.(`${rowId} | aboutyou | SUPPLIER COLOUR: "${colorNameSupplier}" -> "${colorTranslation}"`);
    }

    addLog?.(`${rowId} | aboutyou | ${styleName} | color=${colorNameSupplier} | group=${productGroup}`);

    // Step 2: Build prompt and call AI
    const productData: AboutYouProductData = {
      styleNo,
      styleName,
      colorNameSupplier,
      colorTranslation,
      size,
      productGroup,
      existingStyleWording,
      existingLongDescription: existingLongDesc,
    };

    const userPrompt = buildAboutYouPrompt(productData);

    try {
      addLog?.(`${rowId} | aboutyou | Calling AI (${model.name})...`);

      const rawResponse = await optimizeTextWithAI(
        userPrompt,
        [],
        {},
        model,
        apiKey,
        ABOUTYOU_SYSTEM_PROMPT,
      );

      // Track cost
      if (costTracker && rawResponse.tokens) {
        const costRecord = costTracker.trackOperation(
          model.id,
          userPrompt,
          rawResponse.content || '',
          {
            inputTokens: rawResponse.tokens.inputTokens,
            outputTokens: rawResponse.tokens.outputTokens,
          },
        );

        if (costRecord) {
          const cost = costRecord.actualCost || costRecord.estimatedCost;
          const totalTokens = rawResponse.tokens.inputTokens + rawResponse.tokens.outputTokens;
          const costType = costRecord.actualCost ? 'ACTUAL' : 'ESTIMATED';
          addLog?.(
            `${rowId} | aboutyou | COST: $${cost.toFixed(2)} (${costType}: ${rawResponse.tokens.inputTokens}->${rawResponse.tokens.outputTokens} = ${totalTokens} tokens)`,
          );
        }
      }

      // Step 3: Parse response
      const responseText = rawResponse.content || '';
      const parsed = parseAboutYouResponse(responseText);

      if (!parsed) {
        addLog?.(`${rowId} | aboutyou | ERROR: Could not parse AI response`);
        processed.gen_error = 'Failed to parse AI response';
      } else {
        // Step 4: Sanitize output
        const cleanStyleWording = sanitizeStyleName(parsed.styleName);
        const cleanLongDesc = sanitizeLongDescription(parsed.longDescription);

        // Validate
        const validation = validateAboutYouOutput(cleanStyleWording, cleanLongDesc);
        if (validation.styleName.hasForbiddenWords) {
          addLog?.(
            `${rowId} | aboutyou | WARN: Style name has forbidden words: ${validation.styleName.forbiddenWords.join(', ')}`,
          );
        }
        if (validation.copyDesignFeatures?.hasForbiddenWords || validation.longDescription.hasForbiddenWords) {
          const desc = validation.longDescription;
          addLog?.(
            `${rowId} | aboutyou | WARN: Long description has forbidden words: ${desc.forbiddenWords.join(', ')}`,
          );
        }

        // Step 5: Update existing columns in-place
        processed[styleWordingKey] = cleanStyleWording;
        processed[longDescKey] = cleanLongDesc;

        addLog?.(
          `${rowId} | aboutyou | SUCCESS: style=${cleanStyleWording.length}ch, desc=${cleanLongDesc.length}ch`,
        );
      }
    } catch (error) {
      addLog?.(`${rowId} | aboutyou | ERROR: ${error}`);
      processed.gen_error = String(error);
    }

    out.push(processed);
  }

  return out;
}
