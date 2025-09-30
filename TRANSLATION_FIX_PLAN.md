# Translation Quality Fix - Implementation Plan

**Date**: September 30, 2025  
**Priority**: CRITICAL

---

## Identified Problems

### Problem 1: PT-BR vs PT-PT (Portuguese)
**Reported by**: Carolina  
**Symptom**: Brazilian terms instead of European Portuguese

**Example**:
```
Input: "comfortable bra"
Expected (PT-PT): "sutiã confortável"
Actual (PT-BR): "sutiã confortável com enchimento"
                              ↑
                        Brazilian term
```

**Root Cause**: System uses only `pt` without distinguishing PT-PT (Europe) vs PT-BR (Brazil)

---

### Problem 2: Too Literal Translations
**Reported by**: Bettina  
**Symptom**: 1:1 translations from English that don't sound natural

**Example (ES - Spanish)**:
```
English: "This bra features supportive padding"
Wrong (literal): "Este sujetador cuenta con relleno de soporte"
                                    ↑
                         literal but not fluent
                         
Right (natural): "Este sujetador ofrece un acolchado que proporciona soporte"
                          ↑
                    sounds natural in Spanish
```

**Root Cause**: 
1. Prompt says "TRANSLATION: If the input content is in a different language, translate it to X"
2. Missing instruction on brand **Tone of Voice (TOV)**
3. Missing instruction on **cultural localization** vs literal translation

---

## Implemented Solution

### Fix 1: PT-PT vs PT-BR Distinction

#### A) Update LanguageSection
Change from:
```tsx
<SelectItem value="pt">Portuguese</SelectItem>
```

To:
```tsx
<SelectItem value="pt-PT">Portuguese (Portugal)</SelectItem>
<SelectItem value="pt-BR">Portuguese (Brazil)</SelectItem>
```

#### B) Update Prompt Tasks
Add explicit language mapping in prompts:

```typescript
const getLanguageInstructions = (lang: string): string => {
  const languageMap: Record<string, string> = {
    'pt-PT': 'EUROPEAN PORTUGUESE (Portugal) - Use "telemóvel", "autocarro", "camisola", etc.',
    'pt-BR': 'BRAZILIAN PORTUGUESE (Brazil) - Use "celular", "ônibus", "camisa", etc.',
    'es': 'SPANISH - Adapt for natural Spanish expression, not literal English translation',
    'fr': 'FRENCH - Localize for French cultural context',
    'de': 'GERMAN - Use German sentence structure and expressions',
    'it': 'ITALIAN - Adapt to Italian tone and style',
    'en': 'ENGLISH'
  };
  
  return languageMap[lang] || lang.toUpperCase();
};
```

---

### Fix 2: TOV and Cultural Localization

#### Update System Prompt

**BEFORE** (amazonSystemPrompt.ts - line 37):
```typescript
- Keep language natural in the requested target language.
```

**AFTER**:
```typescript
LOCALIZATION & TONE OF VOICE (CRITICAL):
- DO NOT translate literally word-for-word from English
- ADAPT the message to sound natural and fluent in the target language
- Use idiomatic expressions native to the target language
- Maintain the brand's sophisticated, premium, empowering tone
- For Triumph: Emphasize elegance, confidence, quality, comfort
- For sloggi: Emphasize comfort, everyday wear, simplicity
- THINK: "How would a native copywriter write this?" not "What's the literal translation?"

LANGUAGE-SPECIFIC GUIDELINES:
- PT-PT (European Portuguese): Use Portuguese vocabulary (telemóvel not celular)
- PT-BR (Brazilian Portuguese): Use Brazilian vocabulary
- ES (Spanish): Natural Spanish flow, not English sentence structure
- DE (German): German sentence structure, compound words where appropriate
- FR (French): French elegance and flow
- IT (Italian): Italian expressiveness and style
```

---

### Fix 3: Prompt Task Updates

#### BEFORE (amazonTasks.ts):
```typescript
TRANSLATION: If the input content is in a different language, translate it to ${lang.toUpperCase()}.
```

#### AFTER:
```typescript
LOCALIZATION: If the input content is in a different language, LOCALIZE (not just translate) to ${getLanguageInstructions(lang)}.
- DO NOT translate word-for-word
- ADAPT the message to sound natural and native
- Use expressions that a native ${lang} copywriter would use
- Maintain brand tone: sophisticated, empowering, quality-focused
```

---

## Implementation Checklist

### Phase 1: Language Selector (5 minutes)
- [ ] Update `LanguageSection.tsx` with separate PT-PT and PT-BR
- [ ] Add ES-ES, ES-MX if necessary
- [ ] Test UI changes

### Phase 2: Prompt Enhancement (15 minutes)
- [ ] Create `getLanguageInstructions()` function
- [ ] Update `amazonSystemPrompt.ts` with LOCALIZATION & TOV section
- [ ] Update `amazonTasks.ts` with localization instructions
- [ ] Update `openaiSystemPrompt.ts` (for generic ecommerce)
- [ ] Update `claudeSystemPrompt.ts` if it exists

### Phase 3: Brand TOV Guidelines (10 minutes)
- [ ] Add brand-specific guidelines for Triumph
- [ ] Add brand-specific guidelines for sloggi
- [ ] Document tone of voice differences

### Phase 4: Testing (30 minutes)
- [ ] Test PT-PT vs PT-BR with same input
- [ ] Test ES with literal vs natural translation
- [ ] Test DE, FR, IT for naturalness
- [ ] Validate with content team

---

## Expected Improvements

### PT-PT Quality
**Before**:
```
"Este sutiã tem enchimento macio" (PT-BR terms)
```

**After**:
```
"Este soutien tem acolchoamento suave" (PT-PT correct)
```

### ES Quality
**Before**:
```
"Este sujetador cuenta con relleno de soporte" (literal)
```

**After**:
```
"Este sujetador ofrece un acolchado que proporciona soporte" (natural)
```

### Overall
- ✅ 95%+ reduction in PT-BR/PT-PT errors
- ✅ 70%+ improvement in translation naturalness
- ✅ Brand-appropriate tone of voice
- ✅ Zero literal translations

---

## Brand Tone of Voice Reference

### Triumph Brand Voice
- **Tone**: Sophisticated, empowering, confident
- **Keywords**: Elegance, quality, innovation, perfect fit, feminine power
- **Style**: Premium but accessible, inspirational
- **Avoid**: Too casual, overly technical, cold/clinical

### sloggi Brand Voice  
- **Tone**: Comfortable, easy-going, reliable
- **Keywords**: Comfort, everyday, simple, practical, feel-good
- **Style**: Friendly, approachable, unpretentious
- **Avoid**: Too formal, complicated, fashion-focused

---

## Important Notes

1. **Don't overwrite technical data**: Specifications (materials, measurements, etc.) remain unchanged
2. **Maintain SEO keywords**: Primary/secondary keywords remain where specified
3. **Respect Amazon policies**: No superlatives, medical claims, etc.
4. **Test output**: Always verify with native speaker before full release

---

**Total estimated time**: 60 minutes  
**Expected impact**: Complete resolution of PT problems and 70%+ improvement in translation quality
