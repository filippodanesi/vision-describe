# Cost Tracking Guide - AI Copy Assistant

## Overview

The AI Copy Assistant includes a comprehensive cost tracking system that monitors token usage and calculates costs in real-time for all AI operations.

## Features

### ✅ Real-Time Cost Calculation
- Tracks **actual tokens** from API responses (not estimates)
- Calculates costs based on current provider pricing
- Updates budget and totals automatically after each operation

### ✅ Multi-Provider Support
- **OpenAI**: o4-mini, o3, o3-mini, o3-pro, GPT-4o, GPT-4o-mini
- **Anthropic**: Claude Sonnet 4.5, Claude Sonnet 4, Claude Opus 4, Claude Haiku 3.5

### ✅ Use Case Coverage
- E-commerce product descriptions
- Amazon marketplace listings
- **Partoo store descriptions** (with full cost tracking)

---

## Current Pricing (January 2025)

### OpenAI Models

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| **o4-mini** | $1.10 | $4.40 |
| o3-mini | $1.10 | $4.40 |
| o3 | $2.00 | $8.00 |
| o3-pro | $20.00 | $80.00 |
| GPT-4o | $2.50 | $10.00 |
| GPT-4o-mini | $0.15 | $0.60 |

### Anthropic Models

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| **Claude Sonnet 4.5** | $3.00 | $15.00 |
| Claude Sonnet 4 | $3.00 | $15.00 |
| Claude Opus 4 | $15.00 | $75.00 |
| Claude Haiku 3.5 | $0.80 | $4.00 |

---

## Partoo Cost Tracking

### How It Works

For each Partoo store processed:

1. **API Call** → Sends prompt to AI (system + user prompt)
2. **Response** → Receives generated descriptions + token counts
3. **Cost Calculation**:
   ```
   Input Cost  = (Input Tokens / 1,000,000) × Input Price per 1M
   Output Cost = (Output Tokens / 1,000,000) × Output Price per 1M
   Total Cost  = Input Cost + Output Cost
   ```
4. **Tracking** → Records cost in history and updates totals
5. **Logging** → Shows cost details in processing logs

### Example Log Output

```
[14:23:45] store-1 | partoo | Triumph Milano | Milano | lang=it-IT | closed=false
[14:23:45] store-1 | partoo | Calling AI (Claude Sonnet 4.5)...
[14:23:47] store-1 | partoo | COST: $0.0052 (1097→257 = 1354 tokens)
[14:23:47] store-1 | partoo | SUCCESS: Generated short=42w, long=115w
```

### Reading the Cost Log

- **$0.0052** = Total cost for this store
- **1097→257** = Input tokens → Output tokens
- **1354 tokens** = Total tokens used

---

## Cost Estimation Examples

### Partoo Store (Claude Sonnet 4.5)

**Typical prompt**:
- System prompt: ~500 tokens
- User prompt (store data): ~600 tokens
- **Total input**: ~1,100 tokens

**Typical response**:
- Short description (40 words): ~60 tokens
- Long description (110 words): ~170 tokens
- JSON structure overhead: ~30 tokens
- **Total output**: ~260 tokens

**Cost calculation**:
```
Input:  1,100 tokens / 1,000,000 × $3.00 = $0.0033
Output:   260 tokens / 1,000,000 × $15.00 = $0.0039
TOTAL: $0.0072 per store
```

**Batch estimates** (Claude Sonnet 4.5):
- 10 stores: ~$0.07
- 50 stores: ~$0.36
- 100 stores: ~$0.72
- 500 stores: ~$3.60

### Partoo Store (OpenAI o4-mini)

**Same prompt/response structure**:

**Cost calculation**:
```
Input:  1,100 tokens / 1,000,000 × $1.10 = $0.0012
Output:   260 tokens / 1,000,000 × $4.40 = $0.0011
TOTAL: $0.0023 per store
```

**Batch estimates** (o4-mini):
- 10 stores: ~$0.02
- 50 stores: ~$0.12
- 100 stores: ~$0.23
- 500 stores: ~$1.15

---

## Validating Cost Accuracy

### Method 1: Manual Spot Check

1. **Process 1 store** with known input
2. **Check logs** for token counts
3. **Calculate manually**:
   ```
   (Input Tokens × Input Price + Output Tokens × Output Price) / 1,000,000
   ```
4. **Compare** with logged cost (should match within $0.0001)

### Method 2: API Provider Dashboard

1. **Process a batch** (e.g., 10 stores)
2. **Note total cost** from Cost Summary
3. **Check provider dashboard**:
   - OpenAI: https://platform.openai.com/usage
   - Anthropic: https://console.anthropic.com/settings/usage
4. **Compare totals** (should match within 1-2%)

### Method 3: Test File

Use the test file with 3 stores:
1. Process `test_partoo_3stores.xlsx`
2. Expected cost (Claude Sonnet 4.5): ~$0.02
3. Expected cost (o4-mini): ~$0.007
4. Verify logs show 3 cost entries

---

## Cost Summary Display

At the end of processing, you'll see:

```
╔═══════════════════════════════════════════════════════════╗
║              COST SUMMARY - PARTOO PROCESSING             ║
╠═══════════════════════════════════════════════════════════╣
║ Model: Claude Sonnet 4.5                                  ║
║ Stores Processed: 50                                      ║
║                                                            ║
║ Total Input Tokens:  55,120                               ║
║ Total Output Tokens: 13,045                               ║
║ Total Tokens:        68,165                               ║
║                                                            ║
║ Total Cost: $0.36                                         ║
║ Average Cost per Store: $0.0072                           ║
║                                                            ║
║ Remaining Budget: $99.64                                  ║
╚═══════════════════════════════════════════════════════════╝
```

### Key Metrics

- **Total Tokens**: Sum of input + output tokens across all stores
- **Total Cost**: Actual cost based on real token usage from API
- **Average Cost per Store**: Total cost / Number of stores processed
- **Remaining Budget**: Initial budget ($100) minus total spent

---

## Budget Management

### Default Budgets

- OpenAI: $100 (sufficient for ~4,300 stores with o4-mini)
- Anthropic: $100 (sufficient for ~1,400 stores with Claude Sonnet 4.5)

### Setting Custom Budget

In the UI:
1. Go to Settings (⚙️ icon)
2. Select provider (OpenAI / Anthropic)
3. Enter new budget amount
4. Click "Update Budget"

### Budget Warnings

- **Warning at 80%**: Yellow indicator, suggests monitoring
- **Warning at 90%**: Orange indicator, suggests refill soon
- **Exceeded**: Red indicator, processing may be blocked

---

## Troubleshooting

### ❌ Cost Shows $0.0000

**Problem**: API not returning token counts  
**Solution**: Check API response format - ensure tokens are being extracted

### ❌ Cost Seems Too High

**Problem**: May be using expensive model or long prompts  
**Solution**: 
- Check which model is selected
- Review prompt templates (system + user)
- Verify token counts in logs are reasonable

### ❌ Cost Doesn't Match Provider Dashboard

**Problem**: Timing delay or different billing period  
**Solution**: 
- Wait 5-10 minutes for provider dashboard to update
- Check if dashboard is showing different time range
- Verify model ID matches (e.g., claude-sonnet-4-5-20250929)

### ❌ "Model cost data not available"

**Problem**: Model ID not in cost tracker  
**Solution**: Add model to `MODEL_COSTS` in `useCostTracker.ts`

---

## Best Practices

### 1. Monitor Costs During Processing

- Keep Cost Summary visible
- Check logs for per-store costs
- Stop processing if costs seem unusual

### 2. Test with Small Batches First

- Process 5-10 stores first
- Validate cost per store
- Scale up once confirmed

### 3. Choose Cost-Effective Models

For Partoo stores:
- **Best value**: o4-mini (~$0.0023/store)
- **Best quality**: Claude Sonnet 4.5 (~$0.0072/store)
- **Premium**: o3 or Claude Opus 4 (if needed)

### 4. Review Cost History

- Check localStorage for `ai_cost_history`
- Export cost data periodically
- Track costs by use case

---

## Advanced: Cost Tracker API

### Track a Custom Operation

```typescript
import { useCostTracker } from './hooks/useCostTracker';

const costTracker = useCostTracker();

const costRecord = costTracker.trackOperation(
  'claude-sonnet-4-5-20250929',  // Model ID
  userPrompt,                     // Input text
  responseText,                   // Output text
  {
    inputTokens: 1097,            // Actual input tokens from API
    outputTokens: 257             // Actual output tokens from API
  }
);

console.log('Cost:', costRecord?.actualCost);
```

### Get Session Statistics

```typescript
const stats = costTracker.getSessionStats();

console.log('Total operations:', stats.totalOperations);
console.log('Total cost:', stats.totalActualCost);
console.log('Total tokens:', stats.totalTokens);
```

### Reset Tracking

```typescript
// Reset everything
costTracker.resetTracking();

// Reset only OpenAI
costTracker.resetTracking('openai');

// Reset only Anthropic
costTracker.resetTracking('anthropic');
```

---

## FAQ

**Q: Why are there two cost values (estimated vs actual)?**  
A: Estimated uses character count approximation (fallback). Actual uses real tokens from API response. We always use actual when available.

**Q: Does cost include system prompts?**  
A: Yes! Input tokens include both system prompt and user prompt.

**Q: Are costs rounded?**  
A: No, costs are calculated to full precision ($0.0001). Only display is rounded.

**Q: Can I export cost history?**  
A: Yes, it's stored in localStorage as `ai_cost_history` (JSON array). You can export it via browser dev tools.

**Q: What if I run out of budget?**  
A: The system will warn you but won't block processing. Update your budget or reset tracking.

---

**Last Updated**: October 2, 2025  
**Version**: 2.0  
**Owner**: Filippo Danesi


