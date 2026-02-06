/**
 * Task builder and response parser for the NEXT use case.
 */

export interface NextProductData {
  supplierCode: string;
  styleNo: string;
  existingTitle: string;
  colorName: string;
  standardColor: string;
  size: string;
  existingCopy: string;
  composition: string;
  fit?: string;
  padding?: string;
  rise?: string;
  support?: string;
  lingerieType?: string;
  wiring?: string;
}

export function buildNextPrompt(data: NextProductData): string {
  const attrs = [
    data.fit && `Fit: ${data.fit}`,
    data.padding && `Padding: ${data.padding}`,
    data.rise && `Rise: ${data.rise}`,
    data.support && `Support: ${data.support}`,
    data.lingerieType && `Type: ${data.lingerieType}`,
    data.wiring && `Wiring: ${data.wiring}`,
  ].filter(Boolean);

  const lines = [
    'TASK: Rewrite the product title and copy design features for NEXT (UK retailer).',
    '',
    'PRODUCT DATA:',
    `- Supplier Code: ${data.supplierCode || '(not specified)'}`,
    `- Style No: ${data.styleNo}`,
    `- Existing Title: ${data.existingTitle || '(empty)'}`,
    `- Colour: ${data.colorName}${data.standardColor ? ` (Standard: ${data.standardColor})` : ''}`,
    `- Size: ${data.size || '(not specified)'}`,
    `- Composition: ${data.composition || '(not specified)'}`,
    `- Existing Copy: ${data.existingCopy || '(empty)'}`,
  ];

  if (attrs.length > 0) {
    lines.push(`- Lingerie Attributes:`);
    attrs.forEach((a) => lines.push(`  - ${a}`));
  }

  lines.push(
    '',
    'INSTRUCTIONS:',
    '- Product Title: Rewrite as a clear, descriptive title (max 100 chars) for a NEXT customer (30-55, family-oriented).',
    '- Copy Design Features: Write detailed, benefit-led copy (max 1000 chars) in British English.',
    '- Include lingerie attributes naturally in the copy if provided.',
    '- Mention key fabric/composition benefits if composition data is available.',
    '- Use ONLY information from the Product Data above. Do not invent details.',
    '',
    'Return ONLY valid JSON:',
    '{"product_title":"<max 100 chars>","copy_design_features":"<max 1000 chars>"}',
  );

  return lines.join('\n');
}

export interface NextParsedResponse {
  productTitle: string;
  copyDesignFeatures: string;
}

export function parseNextResponse(response: string): NextParsedResponse | null {
  try {
    let cleaned = response.trim();
    // Remove markdown JSON fences if present
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.product_title && parsed.copy_design_features) {
      return {
        productTitle: String(parsed.product_title).trim().slice(0, 100),
        copyDesignFeatures: String(parsed.copy_design_features).trim().slice(0, 1000),
      };
    }
    return null;
  } catch {
    return null;
  }
}
