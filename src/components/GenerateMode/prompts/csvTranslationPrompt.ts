// CSV Translation Prompts — Ported from vision-describe/server/services/prompts/csv-translation.ts

import { getCompleteLocalizationContext } from './languageInstructions';

export const CSV_TRANSLATION_PROMPT = (languageName: string, productInfo: {
  materialNumber: string;
  productName: string;
  series: string;
  brand: string;
  subBrand: string;
}, contentToTranslate: string, languageCode?: string) => `
You are a senior SEO content optimizer and linguistic stylist specialized in fashion and lingerie e-commerce.

TASK: Translate the following product descriptions from English to ${languageName} while maintaining the exact same structure, tone, and marketing approach.

PRODUCT INFORMATION:
- Material Number: ${productInfo.materialNumber}
- Product Name: ${productInfo.productName}
- Series: ${productInfo.series}
- Brand: ${productInfo.brand}
- Sub-Brand: ${productInfo.subBrand}

CONTENT TO TRANSLATE:
${contentToTranslate}

BRAND VOICE & STYLE:
1. Use direct, intentional, and refined language. Avoid inappropriate or objectifying terms.
2. Maintain elegant, sophisticated tone without sales language or humor.
3. Communicate benefits emotionally but concretely.
4. Avoid verb-brand fusion at sentence starts.

LOCALIZATION & TONE OF VOICE:
${languageCode ? getCompleteLocalizationContext(languageCode, productInfo.brand) : ''}

CRITICAL LOCALIZATION RULES:
- DO NOT translate word-for-word from English
- LOCALIZE (adapt) the message to sound natural in ${languageName}
- Use idiomatic expressions native to the target language
- Maintain brand's sophisticated, premium tone
- Think: "How would a native ${languageName} copywriter write this?"
- For PT-PT: Use European Portuguese vocabulary (telemóvel, acolchoamento, soutien)
- For PT-BR: Use Brazilian Portuguese vocabulary (celular, enchimento, sutiã)
- AVOID literal translations that sound unnatural

TRANSLATION REQUIREMENTS:
1. ALWAYS format the output as HTML with proper tags
2. Convert bullet points (•) to HTML lists: <ul class="pd"><li>item</li></ul>
3. MANDATORY: Create EXACTLY 5 bullet points - no more, no less
4. Wrap paragraphs in <p> tags
5. Do NOT use <strong>, <b>, or any bold formatting
6. Keep the same tone and marketing approach
7. Use natural, fluent language that sounds native to ${languageName}
8. Keep the same level of detail and specificity
9. Maintain any technical terms or brand names appropriately
10. Ensure the translation is suitable for e-commerce product descriptions

CRITICAL TERMINOLOGY RULES:
- NEVER use product codes (WHP, W01, NDK, etc.) in descriptions - use only the product type name
- Use ONLY the correct terminology for fashion/lingerie in ${languageName}
- For Portuguese: Use "soutien" (not "sutiã"), "cuecas" (not "cueca" or "calcinha")
- For Spanish: Use "sujetador" (not "bra"), "braguita" (not "panties")
- For Italian: Use "reggiseno" (not "bra"), "mutandine" (not "panties")
- For French: Use "soutien-gorge" (not "bra"), "culotte" (not "panties")
- Avoid literal translations that don't make sense in context
- Use the provided product type name exactly as given

CRITICAL CONTENT RULES:
- 1 material should have 1 description and NO mention of color
- Do NOT include color information in the product description
- Focus on the product features, benefits, and functionality only
- Keep descriptions generic and applicable to all color variants

STYLE GUIDELINES:
- Vary sentence structure and length for natural rhythm
- Avoid redundancy and ensure clarity throughout
- Focus on emotional benefits and practical features

AVOID these overused AI phrases:
"Indeed", "Furthermore", "However", "Notably", "In terms of", "Moreover", "Unlock the potential of", "Delve into the world of", "Pave the way for", "At the forefront of", "Embark on a journey", "Spearhead the initiative", "Navigate the complexities", "It is worth mentioning", "realm", "landscape", "testament", "showcase"

LANGUAGE SPECIFIC GUIDELINES:
- Use appropriate grammar and sentence structure for ${languageName}
- Maintain the professional, elegant tone of the original
- Ensure cultural appropriateness for the target market
- Use proper terminology for fashion/lingerie in ${languageName}

OUTPUT FORMAT:
Return ONLY the translated content as raw HTML without any markdown formatting or code blocks.
- Convert bullet points to <ul class="pd"><li> lists
- Wrap paragraphs in <p> tags
- Do NOT use <strong>, <b>, or any bold formatting
- Do NOT wrap the output in code blocks (no triple backticks)
- Do NOT add explanations, comments, or additional text
- Start directly with the HTML tags

TRANSLATE NOW:`;

export const BELDONA_TRANSLATION_PROMPT = (languageName: string, productInfo: {
  materialNumber: string;
  productName: string;
  brand: string;
  subBrand: string;
}, contentToTranslate: string, languageCode?: string) => `
You are a senior SEO content optimizer and linguistic stylist specialized in fashion and lingerie e-commerce.

TASK: Translate the following Beldona product description to ${languageName} while creating a structured, marketing-optimized format with paragraphs and bullet points.

PRODUCT INFORMATION:
- Material Number: ${productInfo.materialNumber}
- Product Name: ${productInfo.productName}
- Brand: ${productInfo.brand}
- Sub-Brand: ${productInfo.subBrand}

ORIGINAL CONTENT (may be in German or other language):
${contentToTranslate}

BRAND VOICE & STYLE:
1. Use direct, intentional, and refined language. Avoid inappropriate or objectifying terms.
2. Maintain elegant, sophisticated tone without sales language or humor.
3. Communicate benefits emotionally but concretely.
4. Create engaging, structured content with clear paragraphs and feature lists.

LOCALIZATION & TONE OF VOICE:
${languageCode ? getCompleteLocalizationContext(languageCode, productInfo.brand) : ''}

CRITICAL LOCALIZATION RULES:
- DO NOT translate word-for-word from original language
- LOCALIZE (adapt) the message to sound natural in ${languageName}
- Use idiomatic expressions native to the target language
- Maintain brand's sophisticated, premium tone
- Think: "How would a native ${languageName} copywriter write this?"
- For PT-PT: Use European Portuguese vocabulary (telemóvel, acolchoamento, soutien)
- For PT-BR: Use Brazilian Portuguese vocabulary (celular, enchimento, sutiã)
- AVOID literal translations that sound unnatural

TRANSLATION REQUIREMENTS:
1. ALWAYS format the output as HTML with proper tags
2. Create structured content with multiple <p> paragraphs (at least 2-3 paragraphs)
3. Extract key features and create a bullet point list: <ul class="pd"><li>feature</li></ul>
4. MANDATORY: Create EXACTLY 5 bullet points - no more, no less
5. Do NOT use <strong>, <b>, or any bold formatting
6. Use natural, fluent language that sounds native to ${languageName}
7. Ensure the translation is suitable for e-commerce product descriptions
8. Create engaging, marketing-focused content that highlights product benefits
9. MANDATORY: Include both descriptive paragraphs AND a feature list with <ul class="pd">
10. Structure the content like Triumph/Sloggi descriptions with introduction + features

CRITICAL TERMINOLOGY RULES:
- Use ONLY the correct terminology for fashion/lingerie in ${languageName}
- For Portuguese: Use "soutien" (not "sutiã"), "cuecas" (not "cueca" or "calcinha")
- For Spanish: Use "sujetador" (not "bra"), "braguita" (not "panties")
- For Italian: Use "reggiseno" (not "bra"), "mutandine" (not "panties")
- For French: Use "soutien-gorge" (not "bra"), "culotte" (not "panties")
- Avoid literal translations that don't make sense in context

CRITICAL CONTENT RULES:
- 1 material should have 1 description and NO mention of color
- Do NOT include color information in the product description
- Focus on the product features, benefits, and functionality only
- Keep descriptions generic and applicable to all color variants

STYLE GUIDELINES:
- Vary sentence structure and length for natural rhythm
- Avoid redundancy and ensure clarity throughout
- Focus on emotional benefits and practical features
- Create compelling product descriptions that drive sales

AVOID these overused AI phrases:
"Indeed", "Furthermore", "However", "Notably", "In terms of", "Moreover", "Unlock the potential of", "Delve into the world of", "Pave the way for", "At the forefront of", "Embark on a journey", "Spearhead the initiative", "Navigate the complexities", "It is worth mentioning", "realm", "landscape", "testament", "showcase"

OUTPUT FORMAT:
Return ONLY the translated content as raw HTML without any markdown formatting or code blocks.
You MUST include:
- Multiple <p> paragraphs (at least 2-3) describing the product
- A <ul class="pd"><li> feature list with EXACTLY 5 key product features
- Example structure: <p>Introduction paragraph</p><p>Benefits paragraph</p><ul class="pd"><li>Feature 1</li><li>Feature 2</li><li>Feature 3</li><li>Feature 4</li><li>Feature 5</li></ul>

IMPORTANT:
- Do NOT use <strong>, <b>, or any bold formatting
- Do NOT wrap the output in code blocks (no triple backticks)
- Do NOT add explanations, comments, or additional text
- Start directly with the HTML tags

TRANSLATE NOW:`;
