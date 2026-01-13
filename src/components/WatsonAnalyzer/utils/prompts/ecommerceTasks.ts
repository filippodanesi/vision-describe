export const buildEcomOptimizePrompt = (ctx: {
  title?: string;
  description?: string;
  shortHint?: string;
  language?: string;
  wiringInfo?: string;
  paddingInfo?: string;
  productGroup?: string;
  usps?: string;
  seriesDescription?: string;
  styleDescription?: string;
}) => `
TASK: Optimize the long description for e-commerce (1–3 paragraphs), plain text.
CONTEXT:
${ctx.title ? `- Title/Series: ${ctx.title}\n` : ''}
${ctx.seriesDescription ? `- Series Description: ${ctx.seriesDescription}\n` : ''}
${ctx.styleDescription ? `- Style Description: ${ctx.styleDescription}\n` : ''}
${ctx.usps ? `- USPs: ${ctx.usps}\n` : ''}
${ctx.shortHint ? `- Short hint: ${ctx.shortHint}\n` : ''}
${ctx.description ? `- Long description: ${ctx.description}\n` : ''}
${ctx.wiringInfo ? `- Wiring Type: ${ctx.wiringInfo}\n` : ''}
${ctx.paddingInfo ? `- Padding Type: ${ctx.paddingInfo}\n` : ''}
${ctx.productGroup ? `- Product Group: ${ctx.productGroup}\n` : ''}
LANGUAGE: ${ctx.language || 'en'}

IMPORTANT: If Wiring Type and/or Padding Type are provided, include them as the FIRST bullet point in the format: "[Wiring], [padding] bra for [benefit]"
Return ONLY the optimized description.`;


