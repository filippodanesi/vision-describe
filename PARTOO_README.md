# Partoo Store Descriptions - Implementation Guide

## Overview

This module generates and optimizes store descriptions for Triumph retail locations on the Partoo platform. It automatically detects the appropriate language from the country code and generates localized content following Triumph's brand Tone of Voice guidelines.

## Features

- **Automatic Language Detection**: Maps country codes to appropriate languages
- **Multi-language Support**: IT, FR, PT, DE, ES, NL, EN with regional variants
- **Switzerland Handling**: Detects city-specific languages (de-CH, fr-CH, it-CH)
- **Closed Store Management**: Standardized messages for permanently closed locations
- **Smart Overwrite Policy**: Fill-only or fill-and-improve generic descriptions
- **Brand ToV Compliance**: Follows Triumph brand guidelines strictly
- **Format Validation**: Ensures plain text output (no HTML, emojis, links)
- **Word Count Control**: Short (35-50 words), Long (90-140 words)

## Input Format

### Required Columns
- `Name`: Store name
- `City`: Store city
- `Country`: Country code (IT, FR, PT, DE, etc.)

### Optional Columns
- `Address`: Street address
- `Zipcode`: Postal code
- `Status`: Store status (open, permanently closed, etc.)
- `Short description`: Existing short description
- `Long description`: Existing long description
- `business_opening_date`: Opening date (context only, not promised)

### Columns to Skip (Not Used)
- `Business Id` / `Business identification`
- `Code`
- `Local or global`
- `Creation date`
- `Closed date`
- `SIRET`
- `Address complement`
- `Unnamed: *` (technical/container columns)

## Language Detection

### Country → Language Mapping

| Country Code | Language  | Notes |
|--------------|-----------|-------|
| IT           | it-IT     | Italian |
| FR           | fr-FR     | French (formal) |
| PT           | pt-PT     | Portuguese (formal) |
| DE           | de-DE     | German |
| AT           | de-AT     | Austrian German |
| ES           | es-ES     | Spanish |
| NL           | nl-NL     | Dutch |
| UK / GB      | en-GB     | British English |
| IE           | en-IE     | Irish English |
| US           | en-US     | American English |
| CH           | *varies*  | See Switzerland section |

### Switzerland Special Handling

For Switzerland (CH), language is detected by city:

**German-speaking cities**: Zürich, Basel, Bern, Luzern, Winterthur, St. Gallen → `de-CH`

**French-speaking cities**: Genève, Lausanne, Neuchâtel, Fribourg, Sion → `fr-CH`

**Italian-speaking cities**: Lugano, Bellinzona, Locarno → `it-CH`

**Default**: If city is not recognized → `en-GB`

## Overwrite Policies

### Fill Only
- Generates content ONLY for empty fields
- Leaves existing descriptions unchanged

### Fill + Improve (Default)
- Fills empty fields
- **Rewrites** descriptions that are:
  - Less than 40 characters
  - Boilerplate (e.g., "Welcome to our store")
  - Missing BOTH city reference AND category (lingerie/fitting/bras)
- **Improves** adequate descriptions for:
  - Better local specificity
  - Clearer mention of services (fitting, coordinated sets)
  - Tone of Voice refinement

## Permanently Closed Stores

When `Status` indicates permanent closure, the system generates a standardized neutral message in the appropriate language:

### Examples:

**English (en-GB)**:
```
Short: The Triumph store in London is permanently closed. Please visit the brand website for other locations.
Long: The Triumph store in London is permanently closed. Please visit the brand website for other locations.
```

**Italian (it-IT)**:
```
Short: Il negozio Triumph di Milano è chiuso definitivamente. Visita il sito del brand per trovare altri punti vendita.
Long: Il negozio Triumph di Milano è chiuso definitivamente. Visita il sito del brand per trovare altri punti vendita.
```

**French (fr-FR)**:
```
Short: Le magasin Triumph de Paris est fermé définitivement. Veuillez consulter le site de la marque pour trouver d'autres points de vente.
Long: Le magasin Triumph de Paris est fermé définitivement. Veuillez consulter le site de la marque pour trouver d'autres points de vente.
```

## Output Examples

### Example 1: Italian Store (Open)

**Input**:
```
Name: Triumph Centro
City: Milano
Country: IT
Address: Via Dante 15
Zipcode: 20100
Status: open
```

**Output Short (~40 words)**:
```
Triumph Centro a Milano offre consulenza di bra fitting e intimo per ogni giorno. In Via Dante 15 trovi una selezione di reggiseni, coordinati e loungewear pensati per comfort e sostegno. Passa in negozio per trovare la misura giusta.
```

**Output Long (~110 words)**:
```
Presso Triumph Centro a Milano ti accogliamo con una consulenza di fitting accurata per trovare il sostegno che senti davvero tuo. In negozio trovi reggiseni e lingerie per il quotidiano, set coordinati e proposte confortevoli da indossare ogni giorno. Siamo in Via Dante 15, 20100 Milano (IT). Ti aspettiamo per un'esperienza semplice e curata, con suggerimenti pratici su modelli e vestibilità.
```

### Example 2: French Store (Open)

**Input**:
```
Name: Triumph Paris Rivoli
City: Paris
Country: FR
Address: 45 Rue de Rivoli
Zipcode: 75001
Status: open
```

**Output Short (~45 words, formal "vous")**:
```
Triumph Paris Rivoli vous propose un service de fitting expert et une lingerie adaptée au quotidien. Au 45 Rue de Rivoli, découvrez des soutiens-gorge, des ensembles coordonnés et des pièces confortables. Passez en boutique pour bénéficier de conseils personnalisés sur votre taille.
```

**Output Long (~120 words, formal "vous")**:
```
Chez Triumph Paris Rivoli, nous vous accueillons avec un service de fitting personnalisé pour trouver le soutien qui vous correspond vraiment. En magasin, vous découvrez des soutiens-gorge et de la lingerie pour le quotidien, des ensembles coordonnés et des propositions confortables à porter chaque jour. Nous sommes situés au 45 Rue de Rivoli, 75001 Paris (FR). Nous vous attendons pour une expérience simple et soignée, avec des suggestions pratiques sur les modèles et l'ajustement.
```

### Example 3: Portuguese Store (Open)

**Input**:
```
Name: Triumph Lisboa
City: Lisboa
Country: PT
Address: Rua Garrett 52
Zipcode: 1200-203
Status: open
```

**Output Short (~42 words, formal)**:
```
A Triumph Lisboa oferece consultoria de fitting especializada e lingerie para o dia a dia. Na Rua Garrett 52, encontra uma seleção de soutiens, conjuntos coordenados e loungewear concebidos para conforto e suporte. Visite-nos para encontrar o tamanho ideal.
```

**Output Long (~115 words, formal)**:
```
Na Triumph Lisboa, recebemo-lo com uma consultoria de fitting cuidadosa para encontrar o suporte que realmente sente como seu. Na loja, encontra soutiens e lingerie para o quotidiano, conjuntos coordenados e propostas confortáveis para usar todos os dias. Estamos na Rua Garrett 52, 1200-203 Lisboa (PT). Esperamos por si para uma experiência simples e cuidada, com sugestões práticas sobre modelos e ajuste.
```

### Example 4: Swiss Store (German-speaking city)

**Input**:
```
Name: Triumph Zürich
City: Zürich
Country: CH
Address: Bahnhofstrasse 45
Zipcode: 8001
Status: open
```

**Detected Language**: `de-CH` (German Swiss)

**Output Short (~40 words)**:
```
Triumph Zürich bietet professionelle BH-Beratung und Unterwäsche für den Alltag. An der Bahnhofstrasse 45 finden Sie eine Auswahl an BHs, koordinierten Sets und bequemer Loungewear. Besuchen Sie uns, um die richtige Größe zu finden.
```

### Example 5: Swiss Store (French-speaking city)

**Input**:
```
Name: Triumph Genève
City: Genève
Country: CH
Address: Rue du Marché 12
Zipcode: 1204
Status: open
```

**Detected Language**: `fr-CH` (French Swiss)

**Output Short (~45 words, formal)**:
```
Triumph Genève vous propose un service de fitting expert et une lingerie pour le quotidien. À la Rue du Marché 12, découvrez des soutiens-gorge, des ensembles coordonnés et des pièces confortables. Passez nous voir pour des conseils personnalisés.
```

## Brand Tone of Voice Guidelines

### DO (Following Triumph Brand Book)

✅ **Direct and intentional**: Clear, purposeful language
✅ **Earnest and personal**: Authentic human connection
✅ **Honest and confident**: Trustworthy without arrogance
✅ **Elegant and respectful**: Professional but warm
✅ **Solution-focused**: Emphasize comfort, expert fitting, support
✅ **Natural city integration**: Mention location smoothly in context
✅ **Service-oriented**: Highlight bra fitting expertise
✅ **Everyday focus**: Lingerie for daily comfort

### DON'T (Strict Prohibitions)

❌ **NO sales speak**: "best", "perfect", "ultimate", "amazing"
❌ **NO hyperboles**: Exaggerated claims or promotional language
❌ **NO paternalism**: Preaching or condescending tone
❌ **NO humor/puns**: Keep professional and straightforward
❌ **NO awards/prizes**: Unverifiable achievements
❌ **NO links/HTML/emojis**: Plain text only
❌ **NO promotional language**: "special offer", "limited time", "discount"

### Formality Rules

- **French (FR)**: MUST use formal "vous" form
- **Portuguese (PT)**: MUST use formal language
- **Other languages**: Professional but warm tone

## Technical Integration

### Processing Function

```typescript
import { processPartooRows } from './processing/processPartoo';

const results = await processPartooRows(
  rows,              // Input data rows
  model,             // AI model (GPT-5, Claude Sonnet 4.5)
  apiKey,            // API key
  mapping,           // Column mapping
  'fill-improve',    // Overwrite policy
  addLog             // Optional logging function
);
```

### Validation Function

```typescript
import { validatePartooOutput } from './processing/processPartoo';

const validation = validatePartooOutput(row);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```

### Output Columns

The processor adds these columns to each row:
- `gen_short_description`: Generated/improved short description
- `gen_long_description`: Generated/improved long description
- `gen_error` (if any): Error message if processing failed

## Quality Assurance

Use the [Partoo ToV Checklist](./PARTOO_TOV_CHECKLIST.md) for manual QA review.

### Automated Validations

The system automatically checks for:
1. Word count (short: 35-50, long: 90-140)
2. HTML tags presence
3. Emoji characters
4. URL links
5. Plain text format

### Manual Review Points

1. **Tone compliance**: Direct, intentional, honest (not salesy)
2. **City mention**: Naturally integrated in context
3. **Service highlight**: Expert fitting clearly communicated
4. **Language formality**: FR/PT must be formal
5. **No prohibitions**: No sales speak, hyperboles, or promotional language

## Error Handling

### Common Issues

**Issue**: Missing required fields (name, city, country)
**Resolution**: Row is skipped, existing descriptions preserved

**Issue**: AI response not parseable as JSON
**Resolution**: Error logged, existing descriptions preserved

**Issue**: Word count out of range
**Resolution**: Warning logged but content is still used (may need manual review)

## Testing

### Test Scenarios

1. **Open store (IT)**: Full generation
2. **Open store (FR)**: Formal language check
3. **Open store (PT)**: Formal language check
4. **Open store (CH - Zürich)**: German Swiss detection
5. **Open store (CH - Genève)**: French Swiss detection
6. **Closed store**: Closure message generation
7. **Generic description**: Rewrite trigger
8. **Good existing description**: Improvement only

## API Costs

Based on official pricing (September 2025):

**GPT-5**: $1.25 input / $10 output per 1M tokens
**Claude Sonnet 4.5**: $3 input / $15 output per 1M tokens

**Estimated cost per store**: ~$0.008-0.015 (depending on model and complexity)

For a batch of 100 stores: ~$0.80-1.50

## Related Documentation

- [Partoo ToV Checklist](./PARTOO_TOV_CHECKLIST.md) - QA quick reference
- [Main README](./README.md) - Overall project documentation
- [Triumph Brand Book](./docs/triumph-brand-book.pdf) - Complete brand guidelines

---

**Last Updated**: September 30, 2025
**Version**: 1.0.0
**Owner**: Filippo Danesi
