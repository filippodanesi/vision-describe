/**
 * Task builder and response parser for the About You use case.
 */

export interface AboutYouProductData {
  styleNo: string;
  styleName: string;
  colorNameSupplier: string;
  colorTranslation: string;
  size: string;
  productGroup: string;
  existingStyleWording?: string;
  existingLongDescription?: string;
}

export function buildAboutYouPrompt(data: AboutYouProductData): string {
  const lines = [
    'TASK: Write a style name and long description for About You.',
    '',
    'PRODUCT DATA:',
    `- Style No: ${data.styleNo}`,
    `- Style Name: ${data.styleName}`,
    `- Product Group: ${data.productGroup || '(not specified)'}`,
    `- Colour: ${data.colorNameSupplier}${data.colorTranslation ? ` (About You standard: ${data.colorTranslation})` : ''}`,
    `- Size: ${data.size || '(not specified)'}`,
  ];

  if (data.existingStyleWording) {
    lines.push(`- Existing Style Wording: ${data.existingStyleWording}`);
  }
  if (data.existingLongDescription) {
    lines.push(`- Existing Long Description: ${data.existingLongDescription}`);
  }

  lines.push(
    '',
    'INSTRUCTIONS:',
    '- Style Name: Create a short, catchy product name (max 80 chars) appealing to an 18-35 trend-conscious audience.',
    '- Long Description: Write an engaging product description (max 500 chars) highlighting fit, feel, and style.',
    '- Use ONLY information from the Product Data above. Do not invent details.',
    '- If existing text is provided, improve it while preserving factual accuracy.',
    '',
    'Return ONLY valid JSON:',
    '{"style_name":"<max 80 chars>","long_description":"<max 500 chars>"}',
  );

  return lines.join('\n');
}

export interface AboutYouParsedResponse {
  styleName: string;
  longDescription: string;
}

export function parseAboutYouResponse(response: string): AboutYouParsedResponse | null {
  try {
    let cleaned = response.trim();
    // Remove markdown JSON fences if present
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.style_name && parsed.long_description) {
      return {
        styleName: String(parsed.style_name).trim().slice(0, 80),
        longDescription: String(parsed.long_description).trim().slice(0, 500),
      };
    }
    return null;
  } catch {
    return null;
  }
}
