# Partoo Prompt V2 - Test Examples

## Test Scenarios

These examples use the same base store information to validate Tone of Voice consistency across languages.

---

## Base Store Information

```
Name: Triumph Lingerie Center
Address: Via Roma 15
City: Milano / Paris / Lisboa
Zipcode: 20100 / 75001 / 1200-203
Country: IT / FR / PT
Status: open
```

---

## Example 1: Italian Store (Milano)

### Input
```
Language: it-IT

INPUTS:
- Name: Triumph Lingerie - Milano Centro
- City: Milano
- Country: IT
- Status: open
- Address: Via Roma 15
- Zipcode: 20100
```

### Expected Output (max 80 / 750 characters)

```json
{
  "short_description": "Triumph a Milano: fitting e intimo in Via Roma 15. Vieni a trovarci!",
  "long_description": "Triumph Lingerie a Milano offre consulenze di bra fitting personalizzate e intimo per il quotidiano. In Via Roma 15 trovi reggiseni, coordinati e loungewear pensati per comfort e sostegno. Vieni a trovarci per trovare la tua misura ideale."
}
```

### ✅ ToV Checklist
- ✅ Diretto, chiaro (non "sales speak")
- ✅ Milano menzionata naturalmente
- ✅ Fitting esperto + comfort quotidiano
- ✅ 69 / 226 caratteri
- ✅ Nessuna storia/mission corporate
- ✅ Solo info fornite

---

## Example 2: French Store (Paris) - FORMAL "vous"

### Input
```
Language: fr-FR

INPUTS:
- Name: Triumph Paris Centre
- City: Paris
- Country: FR
- Status: open
- Address: Rue de Rivoli 45
- Zipcode: 75001
```

### Expected Output (max 80 / 750 characters)

```json
{
  "short_description": "Triumph Paris: fitting expert, 45 Rue de Rivoli. Bienvenue!",
  "long_description": "Triumph Paris Centre vous propose un service de fitting expert et une lingerie adaptée au quotidien. Au 45 Rue de Rivoli, découvrez des soutiens-gorge, des ensembles coordonnés et des pièces confortables. Passez nous voir pour des conseils personnalisés."
}
```

### ✅ ToV Checklist
- ✅ Formal "vous" throughout
- ✅ Paris mentioned naturally
- ✅ Fitting expert + confort quotidien
- ✅ 60 / 248 caractères
- ✅ No corporate history
- ✅ Only provided info

---

## Example 3: Portuguese Store (Lisboa) - FORMAL

### Input
```
Language: pt-PT

INPUTS:
- Name: Triumph Lisboa Centro
- City: Lisboa
- Country: PT
- Status: open
- Address: Rua Garrett 52
- Zipcode: 1200-203
```

### Expected Output (max 80 / 750 characters)

```json
{
  "short_description": "Triumph Lisboa: fitting e lingerie na Rua Garrett 52. Visite-nos!",
  "long_description": "A Triumph Lisboa Centro oferece consultoria de fitting especializada e lingerie para o dia a dia. Na Rua Garrett 52, encontra uma seleção de soutiens, conjuntos coordenados e loungewear concebidos para conforto e suporte. Visite-nos para encontrar o seu tamanho ideal."
}
```

### ✅ ToV Checklist
- ✅ Formal Portuguese ("recebemo-lo", "esperamos por si")
- ✅ Lisboa mentioned naturally
- ✅ Fitting + conforto diário
- ✅ 67 / 265 caractères
- ✅ No corporate history
- ✅ Only provided info

---

## Example 4: Generic Corporate Description (BEFORE) → Localized (AFTER)

### Input with Generic Existing Description
```
Language: it-IT

INPUTS:
- Name: Triumph Lingerie - Milano Cordusio
- City: Milano
- Country: IT
- Status: open
- Address: Piazza Cordusio
- Zipcode: 20123
- Existing long: Triumph realizza lingerie da oltre 130 anni per far sentire e apparire le donne al meglio. Dal 1886, Triumph ha capito che solo grazie a una vestibilità perfetta si ottiene una lingerie che sostiene nel modo corretto, offrendo un supporto quotidiano alle donne, indipendentemente dalla loro taglia e forma del corpo, in tutto il mondo. Triumph International è una delle più grandi aziende di abbigliamento intimo su scala mondiale. È presente in oltre 120 paesi con i brand Triumph® and sloggi®. Globalmente l'azienda è supportata da 40'000 clienti wholesales, 4'050 negozi monomarca e dall'e-commerce. Triumph fa parte del Business Social Compliance Initiative (BSCI).

NOTE: Existing text is GENERIC (corporate/boilerplate). REWRITE FULLY using only the specific store details above. Do NOT copy corporate history, global statistics, or brand background.
```

### Expected Output (AFTER - Localized, max 80 / 750 characters)

```json
{
  "short_description": "Triumph a Milano Cordusio: fitting e intimo in Piazza Cordusio. Vieni!",
  "long_description": "Triumph a Milano Cordusio offre consulenze di bra fitting e intimo per ogni giorno. In Piazza Cordusio trovi reggiseni, coordinati e loungewear pensati per comfort e sostegno. Vieni a trovarci per la tua misura giusta."
}
```

### 🎯 Key Changes
- ❌ REMOVED: "130 anni", "Dal 1886", "Triumph International", "120 paesi", "40'000 clienti", "4'050 negozi", "BSCI"
- ✅ ADDED: Milano, Piazza Cordusio, local store experience, fitting service, everyday comfort
- ✅ Transformed from corporate brand history → local boutique description

---

## Example 5: Permanently Closed Store (Hungarian)

### Input
```
Language: hu-HU

INPUTS:
- Name: Triumph Partner Győr
- City: Győr
- Country: HU
- Status: permanently closed
```

### Expected Output (Closure Notice in Hungarian)

```json
{
  "short_description": "A Győr-i Triumph üzlet véglegesen bezárt. Kérjük, látogassa meg a márka weboldalát más helyszínekért.",
  "long_description": "A Győr-i Triumph üzlet véglegesen bezárt. Kérjük, látogassa meg a márka weboldalát más helyszínekért."
}
```

### ✅ ToV Checklist
- ✅ Translated to Hungarian
- ✅ Same meaning as English template
- ✅ Same text for both short and long
- ✅ No promotional content

---

## QA Validation Checklist (for any output)

Use this checklist to validate generated descriptions:

### Content
- [ ] City mentioned naturally (required)
- [ ] Address mentioned if provided in inputs
- [ ] Expert bra fitting highlighted
- [ ] Everyday comfort / lingerie focus
- [ ] Coordinated sets mentioned (if appropriate)

### Exclusions (must NOT appear)
- [ ] NO company history (130 years, since 1886, etc.)
- [ ] NO global stats (120 countries, 40,000 customers, 4,050 stores)
- [ ] NO corporate names (Triumph International)
- [ ] NO certifications (BSCI, sustainability programs)
- [ ] NO invented details (hours, prices, phone, email)
- [ ] NO promotional language (special offers, discounts, loyalty)
- [ ] NO superlatives (best, perfect, ultimate)

### Format
- [ ] Short: max 80 characters
- [ ] Long: max 750 characters
- [ ] Plain text (no HTML, markdown, emojis, links)
- [ ] Correct language (no mixing)
- [ ] Valid JSON with exact keys: "short_description", "long_description"

### Tone of Voice
- [ ] Direct, intentional, clear
- [ ] Professional but warm (or formal for FR/PT)
- [ ] No sales speak or preachy tone
- [ ] Focuses on solutions (fitting, comfort)
- [ ] Sounds like local boutique, not global corporation

---

## Testing Instructions

1. **Run test inputs** through the updated prompt system
2. **Validate outputs** against the QA checklist above
3. **Compare character counts**: Use a character counter to verify max 80 / 750 limits
4. **Language check**: Ensure no language mixing (especially for CH stores)
5. **Generic detection**: Confirm corporate descriptions are flagged and rewritten

---

**Last Updated**: October 2, 2025  
**Version**: 2.0 (Production-Ready)  
**Owner**: Filippo Danesi

