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

### Expected Output (35-50 / 90-140 words)

```json
{
  "short_description": "Triumph Lingerie a Milano offre consulenze di bra fitting personalizzate e intimo per il quotidiano. In Via Roma 15 trovi reggiseni, coordinati e loungewear pensati per comfort e sostegno. Vieni a trovarci per trovare la tua misura ideale.",
  "long_description": "Da Triumph Lingerie in Via Roma 15 a Milano ti accogliamo con un servizio di bra fitting accurato per trovare il sostegno che davvero ti serve. In negozio trovi reggiseni e lingerie per ogni giorno, set coordinati e proposte confortevoli da indossare quotidianamente. Siamo a Milano, in Via Roma 15, 20100. Ti aspettiamo per un'esperienza semplice e curata, con consigli pratici su modelli e vestibilità che rispondono alle tue esigenze reali."
}
```

### ✅ ToV Checklist
- ✅ Diretto, chiaro (non "sales speak")
- ✅ Milano menzionata naturalmente
- ✅ Fitting esperto + comfort quotidiano
- ✅ 42 / 112 parole
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

### Expected Output (35-50 / 90-140 words)

```json
{
  "short_description": "Triumph Paris Centre vous propose un service de fitting expert et une lingerie adaptée au quotidien. Au 45 Rue de Rivoli, découvrez des soutiens-gorge, des ensembles coordonnés et des pièces confortables. Passez nous voir pour des conseils personnalisés sur votre taille.",
  "long_description": "Chez Triumph Paris Centre, nous vous accueillons avec un service de fitting personnalisé pour trouver le soutien qui vous correspond vraiment. En magasin, vous découvrez des soutiens-gorge et de la lingerie pour le quotidien, des ensembles coordonnés et des propositions confortables à porter chaque jour. Nous sommes situés au 45 Rue de Rivoli, 75001 Paris. Nous vous attendons pour une expérience simple et soignée, avec des suggestions pratiques sur les modèles et l'ajustement qui répondent à vos besoins réels."
}
```

### ✅ ToV Checklist
- ✅ Formal "vous" throughout
- ✅ Paris mentioned naturally
- ✅ Fitting expert + confort quotidien
- ✅ 44 / 118 words
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

### Expected Output (35-50 / 90-140 words)

```json
{
  "short_description": "A Triumph Lisboa Centro oferece consultoria de fitting especializada e lingerie para o dia a dia. Na Rua Garrett 52, encontra uma seleção de soutiens, conjuntos coordenados e loungewear concebidos para conforto e suporte. Visite-nos para encontrar o seu tamanho ideal.",
  "long_description": "Na Triumph Lisboa Centro, recebemo-lo com uma consultoria de fitting cuidadosa para encontrar o suporte que realmente sente como seu. Na loja, encontra soutiens e lingerie para o quotidiano, conjuntos coordenados e propostas confortáveis para usar todos os dias. Estamos na Rua Garrett 52, 1200-203 Lisboa. Esperamos por si para uma experiência simples e cuidada, com sugestões práticas sobre modelos e ajuste que respondem às suas necessidades reais."
}
```

### ✅ ToV Checklist
- ✅ Formal Portuguese ("recebemo-lo", "esperamos por si")
- ✅ Lisboa mentioned naturally
- ✅ Fitting + conforto diário
- ✅ 41 / 110 words
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

### Expected Output (AFTER - Localized)

```json
{
  "short_description": "Triumph a Milano Cordusio offre consulenze di bra fitting e intimo per ogni giorno. In Piazza Cordusio trovi reggiseni, coordinati e loungewear pensati per comfort e sostegno. Vieni a trovarci per la tua misura giusta.",
  "long_description": "Da Triumph in Piazza Cordusio a Milano ti accogliamo con un servizio di fitting accurato per trovare il sostegno che davvero ti serve. In negozio trovi reggiseni e lingerie per il quotidiano, set coordinati e proposte confortevoli da indossare ogni giorno. Siamo in Piazza Cordusio, 20123 Milano. Ti aspettiamo per un'esperienza curata, con suggerimenti pratici su modelli e vestibilità che rispondono alle tue esigenze."
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
- [ ] Short: 35-50 words
- [ ] Long: 90-140 words
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
3. **Compare word counts**: Use a word counter to verify 35-50 / 90-140 ranges
4. **Language check**: Ensure no language mixing (especially for CH stores)
5. **Generic detection**: Confirm corporate descriptions are flagged and rewritten

---

**Last Updated**: October 2, 2025  
**Version**: 2.0 (Production-Ready)  
**Owner**: Filippo Danesi

