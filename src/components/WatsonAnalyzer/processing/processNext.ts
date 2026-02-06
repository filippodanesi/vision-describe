/**
 * Core processing logic for NEXT product descriptions.
 * Handles AI-powered content generation for Triumph lingerie products
 * on the NEXT UK marketplace.
 *
 * Processing Flow:
 * 1. Extract product data using column mapping
 * 2. Apply SIZE translation EU->GB (deterministic, writes to Size column)
 * 3. Apply COLOR translation (deterministic, writes to Standard Colour column)
 * 4. Call AI to generate product_title + copy_design_features
 * 5. Parse and sanitize AI response
 * 6. Update existing columns in-place (Product Description, Copy Design Features)
 */

import { Model } from '@/lib/models';
import { optimizeTextWithAI } from '../utils/optimizationUtils';
import { NEXT_SYSTEM_PROMPT } from '../utils/prompts/nextSystemPrompt';
import {
  buildNextPrompt,
  parseNextResponse,
  type NextProductData,
} from '../utils/prompts/nextTasks';
import {
  sanitizeProductTitle,
  sanitizeCopyDesignFeatures,
  validateNextOutput,
} from '../utils/sanitizers/nextSanitizer';
import { translateColor, type ColorMapping } from '../utils/translations/colorTranslations';
import { translateSize, type SizeMapping } from '../utils/translations/sizeTranslations';

export interface NextMapping {
  supplierCode?: string;
  styleNo?: string;
  productTitle?: string;
  colorName?: string;
  standardColor?: string;
  size?: string;
  copyDesignFeatures?: string;
  composition?: string;
  fit?: string;
  padding?: string;
  rise?: string;
  support?: string;
  lingerieType?: string;
  wiring?: string;
}

/**
 * Processes NEXT product rows and generates optimized descriptions.
 *
 * @param rows - Array of product data rows from Excel
 * @param model - AI model configuration
 * @param apiKey - API key for the selected model
 * @param mapping - Column mapping configuration for NEXT fields
 * @param colorMappings - Color translation table (user-reviewed)
 * @param sizeMappings - Size translation table (user-reviewed)
 * @param addLog - Optional logging function for progress tracking
 * @param costTracker - Optional cost tracking utility
 * @returns Promise<any[]> - Processed rows with generated descriptions
 */
export async function processNextRows(
  rows: any[],
  model: Model,
  apiKey: string,
  mapping: NextMapping,
  colorMappings: ColorMapping[],
  sizeMappings: SizeMapping[],
  addLog?: (msg: string) => void,
  costTracker?: any,
): Promise<any[]> {
  const out: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const processed = { ...row } as any;

    // Extract column keys from mapping
    const supplierCodeKey = mapping.supplierCode || 'Next Supplier Code';
    const styleNoKey = mapping.styleNo || 'Manufacturers Style No';
    const productTitleKey = mapping.productTitle || 'Product Description (Item Title)';
    const colorNameKey = mapping.colorName || 'Manufacturers Colour Name';
    const standardColorKey = mapping.standardColor || 'Standard Colour';
    const sizeKey = mapping.size || 'Size';
    const copyFeaturesKey = mapping.copyDesignFeatures || 'Copy Design Features (Tone of Voice)';
    const compositionKey = mapping.composition || 'Garment Composition';
    const fitKey = mapping.fit || 'Fit';
    const paddingKey = mapping.padding || 'Padding';
    const riseKey = mapping.rise || 'Rise';
    const supportKey = mapping.support || 'Support';
    const lingerieTypeKey = mapping.lingerieType || 'Type';
    const wiringKey = mapping.wiring || 'Wiring';

    const supplierCode = String(row[supplierCodeKey] ?? '').trim();
    const styleNo = String(row[styleNoKey] ?? '').trim();
    const existingTitle = String(row[productTitleKey] ?? '').trim();
    const colorName = String(row[colorNameKey] ?? '').trim();
    const existingStdColor = String(row[standardColorKey] ?? '').trim();
    const existingSize = String(row[sizeKey] ?? '').trim();
    const existingCopy = String(row[copyFeaturesKey] ?? '').trim();
    const composition = String(row[compositionKey] ?? '').trim();

    // Lingerie attributes
    const fit = String(row[fitKey] ?? '').trim() || undefined;
    const padding = String(row[paddingKey] ?? '').trim() || undefined;
    const rise = String(row[riseKey] ?? '').trim() || undefined;
    const support = String(row[supportKey] ?? '').trim() || undefined;
    const lingerieType = String(row[lingerieTypeKey] ?? '').trim() || undefined;
    const wiring = String(row[wiringKey] ?? '').trim() || undefined;

    const rowId = supplierCode || styleNo || `row-${i + 1}`;

    // Validate required fields
    if (!supplierCode && !styleNo) {
      addLog?.(`${rowId} | next | SKIP: Missing required fields (supplierCode/styleNo)`);
      out.push(processed);
      continue;
    }

    // Step 1: Apply SIZE translation EU->GB (deterministic)
    let sizeValue = existingSize;
    if (existingSize) {
      const gbSize = translateSize(existingSize, sizeMappings);
      if (gbSize !== existingSize) {
        sizeValue = gbSize;
        processed[sizeKey] = gbSize;
        addLog?.(`${rowId} | next | SIZE: "${existingSize}" -> "${gbSize}"`);
      }
    }

    // Step 2: Apply COLOR translation (deterministic)
    let standardColor = existingStdColor;
    if (!standardColor && colorName) {
      standardColor = translateColor(colorName, colorMappings);
      if (standardColor !== colorName) {
        processed[standardColorKey] = standardColor;
        addLog?.(`${rowId} | next | COLOR: "${colorName}" -> "${standardColor}"`);
      }
    }

    addLog?.(
      `${rowId} | next | ${existingTitle.slice(0, 40)}... | color=${colorName} | size=${sizeValue}`,
    );

    // Step 3: Build prompt and call AI
    const productData: NextProductData = {
      supplierCode,
      styleNo,
      existingTitle,
      colorName,
      standardColor,
      size: sizeValue,
      existingCopy,
      composition,
      fit,
      padding,
      rise,
      support,
      lingerieType,
      wiring,
    };

    const userPrompt = buildNextPrompt(productData);

    try {
      addLog?.(`${rowId} | next | Calling AI (${model.name})...`);

      const rawResponse = await optimizeTextWithAI(
        userPrompt,
        [],
        {},
        model,
        apiKey,
        NEXT_SYSTEM_PROMPT,
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
            `${rowId} | next | COST: $${cost.toFixed(2)} (${costType}: ${rawResponse.tokens.inputTokens}->${rawResponse.tokens.outputTokens} = ${totalTokens} tokens)`,
          );
        }
      }

      // Step 4: Parse response
      const responseText = rawResponse.content || '';
      const parsed = parseNextResponse(responseText);

      if (!parsed) {
        addLog?.(`${rowId} | next | ERROR: Could not parse AI response`);
        processed.gen_error = 'Failed to parse AI response';
      } else {
        // Step 5: Sanitize output
        const cleanTitle = sanitizeProductTitle(parsed.productTitle);
        const cleanCopy = sanitizeCopyDesignFeatures(parsed.copyDesignFeatures);

        // Validate
        const validation = validateNextOutput(cleanTitle, cleanCopy);
        if (validation.productTitle.hasForbiddenWords) {
          addLog?.(
            `${rowId} | next | WARN: Title has forbidden words: ${validation.productTitle.forbiddenWords.join(', ')}`,
          );
        }
        if (validation.copyDesignFeatures.hasForbiddenWords) {
          addLog?.(
            `${rowId} | next | WARN: Copy has forbidden words: ${validation.copyDesignFeatures.forbiddenWords.join(', ')}`,
          );
        }

        // Step 6: Update existing columns in-place
        processed[productTitleKey] = cleanTitle;
        processed[copyFeaturesKey] = cleanCopy;

        addLog?.(
          `${rowId} | next | SUCCESS: title=${cleanTitle.length}ch, copy=${cleanCopy.length}ch`,
        );
      }
    } catch (error) {
      addLog?.(`${rowId} | next | ERROR: ${error}`);
      processed.gen_error = String(error);
    }

    out.push(processed);
  }

  return out;
}
