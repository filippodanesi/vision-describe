export const buildEcomOptimizePrompt = (ctx: {
  title?: string;
  description?: string;
  shortHint?: string;
  language?: string;
}) => `
TASK: Optimize the long description for e-commerce (1–3 paragraphs), plain text.
CONTEXT:
${ctx.title ? `- Title: ${ctx.title}\n` : ''}
${ctx.shortHint ? `- Short hint: ${ctx.shortHint}\n` : ''}
${ctx.description ? `- Long description: ${ctx.description}\n` : ''}
LANGUAGE: ${ctx.language || 'en'}
Return ONLY the optimized description.`;


