# Gemini 2.0 Flash - Implementation Guide

**Practical step-by-step guide for upgrading MariaIntelligence to Gemini 2.0 Flash**

---

## Pre-Implementation Checklist

Before starting:

- [ ] Read the full research report: `GOOGLE-AI-UPGRADE-RESEARCH-REPORT.md`
- [ ] Review current implementation: `server/services/gemini.service.ts`
- [ ] Ensure all tests are passing: `npm run test:ocr-full`
- [ ] Create backup branch: `git checkout -b backup/pre-gemini-2.0-upgrade`
- [ ] Create feature branch: `git checkout -b feature/upgrade-gemini-2.0-flash`

---

## Step-by-Step Implementation

### Step 1: Baseline Metrics (30 minutes)

Before making any changes, capture baseline performance:

```bash
# Run test suite and save results
npm run test:ocr-full > baseline-test-results.txt

# Test with sample document
node -e "
import { geminiService } from './server/services/gemini.service.js';
const start = Date.now();
// Test OCR on sample document
const result = await geminiService.processReservationDocument(sampleBase64, 'application/pdf');
console.log('Processing time:', Date.now() - start, 'ms');
console.log('Success:', result.success);
console.log('Text length:', result.rawText?.length || 0);
" > baseline-sample-test.txt
```

**Record these metrics:**
- Average processing time: _____ seconds
- Success rate: _____ %
- Text extraction length: _____ characters
- Current monthly cost (from GCP console): $_____

---

### Step 2: Update Model Versions (15 minutes)

**File:** `server/services/gemini.service.ts`

**Change 1: Update GeminiModel enum (line 17-22)**

```typescript
// BEFORE:
export enum GeminiModel {
  TEXT = 'gemini-1.5-pro',
  VISION = 'gemini-1.5-pro-vision',
  FLASH = 'gemini-1.5-flash',
  AUDIO = 'gemini-2.5-pro-exp-03-25'
}

// AFTER:
export enum GeminiModel {
  TEXT = 'gemini-2.0-flash',          // ← Updated
  VISION = 'gemini-2.0-flash',        // ← Updated
  FLASH = 'gemini-2.5-flash',         // ← Updated
  AUDIO = 'gemini-2.5-pro-exp-03-25'  // ← No change
}
```

**Change 2: Update generateText model (line 1364)**

```typescript
// BEFORE:
const modelName = 'gemini-1.5-flash';

// AFTER:
const modelName = 'gemini-2.0-flash';  // ← Updated
```

**Change 3: Update generateStructuredOutput model (line 1594)**

```typescript
// BEFORE:
'gemini-1.5-flash' + ':generateContent' +

// AFTER:
'gemini-2.0-flash' + ':generateContent' +  // ← Updated
```

**Optional: Update comments with version info**

```typescript
/**
 * Serviço para interação com o Google Gemini 2.0 Flash
 * Atualizado: 2025-01-07
 * Mudanças: Upgrade para Gemini 2.0 Flash para melhor performance e custo
 */
```

---

### Step 3: Verify Changes (10 minutes)

```bash
# Check TypeScript compilation
npm run check

# Look for any references to old model names
grep -r "gemini-1.5-pro" server/services/gemini.service.ts
grep -r "gemini-1.5-flash" server/services/gemini.service.ts

# Should return no results (except comments)
```

---

### Step 4: Run Tests (20 minutes)

```bash
# Run full OCR test suite
npm run test:ocr-full

# Run specific tests
npm run test:ocr-providers
npm run test:ocr-integration
npm run test:ocr-validation

# Run all tests
npm test

# Expected: All tests should pass with same or better results
```

**If tests fail:**
1. Check error messages carefully
2. Verify API key is still valid: `npm run verify`
3. Check if Gemini 2.0 API is accessible
4. Review rollback section if needed

---

### Step 5: Integration Testing (30 minutes)

**Test 1: Process sample PDF reservation**

```typescript
// Create test script: test-gemini-2.0.ts

import { GeminiService } from './server/services/gemini.service.js';
import fs from 'fs';

async function testGemini20() {
  const geminiService = new GeminiService();

  // Load sample reservation PDF
  const samplePDF = fs.readFileSync('./tests/fixtures/sample-reservation.pdf');
  const base64PDF = samplePDF.toString('base64');

  console.log('Testing Gemini 2.0 Flash with sample reservation...');
  const startTime = Date.now();

  try {
    const result = await geminiService.processReservationDocument(
      base64PDF,
      'application/pdf'
    );

    const processingTime = Date.now() - startTime;

    console.log('\n=== Results ===');
    console.log('Success:', result.success);
    console.log('Processing Time:', processingTime, 'ms');
    console.log('Text Length:', result.rawText?.length || 0);
    console.log('Extracted Data:', JSON.stringify(result.data, null, 2));
    console.log('Provider:', result.documentInfo?.service);

    // Validation
    if (!result.success) {
      throw new Error('Processing failed: ' + result.error);
    }

    if (processingTime > 15000) {
      console.warn('⚠️ Processing took longer than expected');
    }

    if (!result.data?.guestName || !result.data?.checkInDate) {
      console.warn('⚠️ Missing critical fields');
    }

    console.log('\n✅ Gemini 2.0 Flash test PASSED');

  } catch (error) {
    console.error('\n❌ Test FAILED:', error);
    process.exit(1);
  }
}

testGemini20();
```

Run test:
```bash
tsx test-gemini-2.0.ts
```

**Test 2: Process sample image**

```bash
# Test image OCR
# Use existing test in tests/ocr-providers.spec.ts
npm run test:ocr-providers -- --grep "Gemini"
```

**Test 3: API endpoint testing**

```bash
# Start dev server
npm run dev:server

# In another terminal, test API
curl -X POST http://localhost:5000/api/v1/ocr/process \
  -H "Content-Type: application/json" \
  -d '{
    "file": "base64EncodedPDF...",
    "mimeType": "application/pdf"
  }'

# Check response time and accuracy
```

---

### Step 6: Compare Results (15 minutes)

**Create comparison table:**

| Metric | Baseline (1.5) | New (2.0) | Change |
|--------|----------------|-----------|--------|
| Processing Time | _____ s | _____ s | _____ % |
| Success Rate | _____ % | _____ % | _____ % |
| Text Accuracy | _____ % | _____ % | _____ % |
| Cost per Doc | $_____ | $_____ | _____ % |

**Expected improvements:**
- Processing time: 10-30% faster
- Accuracy: 2-5% better
- Cost: 88% reduction

---

### Step 7: Monitor Production-Like Environment (1 hour)

If you have a staging environment:

```bash
# Deploy to staging
git push origin feature/upgrade-gemini-2.0-flash

# Run production-like tests
# Process 10-20 real reservation documents
# Monitor:
# - Processing time
# - Accuracy (manual validation)
# - Error rate
# - Cost (check GCP console)
```

**Manual validation checklist:**
- [ ] Guest names extracted correctly
- [ ] Check-in/out dates in correct format
- [ ] Property names identified
- [ ] Platform (Airbnb/Booking) detected
- [ ] Prices extracted accurately
- [ ] Phone numbers preserved
- [ ] Special characters handled

---

### Step 8: Deploy to Production (30 minutes)

**Only proceed if:**
- ✅ All tests pass
- ✅ Manual validation successful
- ✅ Performance meets or exceeds baseline
- ✅ No critical errors in staging

**Deployment steps:**

```bash
# Commit changes
git add server/services/gemini.service.ts
git commit -m "feat: upgrade to Gemini 2.0 Flash for OCR processing

- Update GeminiModel enum to use gemini-2.0-flash
- Update generateText and generateStructuredOutput
- Expected 88% cost reduction with improved accuracy
- All tests passing

Related: GOOGLE-AI-UPGRADE-RESEARCH-REPORT.md"

# Merge to main
git checkout main
git merge feature/upgrade-gemini-2.0-flash

# Push to production
git push origin main

# Or create PR for review
gh pr create --title "Upgrade to Gemini 2.0 Flash" \
  --body "See docs/GOOGLE-AI-UPGRADE-RESEARCH-REPORT.md for details"
```

---

### Step 9: Post-Deployment Monitoring (1 week)

**Day 1-3: Intensive monitoring**

```bash
# Monitor logs
npm run railway:logs  # or your logging solution

# Check for errors
grep -i "error" logs/production.log | grep -i "gemini"

# Monitor GCP Console
# - API request count
# - Error rate
# - Latency
# - Cost
```

**Metrics to track:**

Daily checklist:
- [ ] Error rate < 5%
- [ ] Processing time < 15 seconds average
- [ ] Cost tracking on target (88% reduction)
- [ ] User complaints = 0
- [ ] Manual validation of 5 random documents

**Week 1 Review:**
- [ ] Total documents processed: _____
- [ ] Success rate: _____ %
- [ ] Average processing time: _____ seconds
- [ ] Total cost: $_____ (vs expected $_____)
- [ ] User feedback: _____

---

## Rollback Procedure

If critical issues occur:

### Emergency Rollback (5 minutes)

```bash
# Option 1: Revert commit
git revert HEAD
git push origin main

# Option 2: Checkout backup branch
git checkout backup/pre-gemini-2.0-upgrade
git push origin main --force  # ONLY in emergency

# Option 3: Manual code change
# Revert GeminiModel enum to:
export enum GeminiModel {
  TEXT = 'gemini-1.5-pro',
  VISION = 'gemini-1.5-pro-vision',
  FLASH = 'gemini-1.5-flash',
  AUDIO = 'gemini-2.5-pro-exp-03-25'
}
```

**When to rollback:**
- Error rate > 10%
- Processing time > 2x baseline
- Data accuracy issues
- Cost unexpectedly high
- Critical functionality broken

---

## Troubleshooting

### Issue: "Model not found" error

**Solution:**
```typescript
// Gemini 2.0 might need different model name format
// Try these variations:
'gemini-2.0-flash-001'  // With version suffix
'gemini-2.0-flash-exp'  // Experimental variant
```

Check Google's model list:
```bash
curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY"
```

### Issue: Slower processing time

**Possible causes:**
1. API region latency
2. Rate limiting adjustments
3. Larger context window causing overhead

**Solutions:**
- Monitor rate limiter: check queue length
- Verify API key quota
- Check GCP region settings

### Issue: Lower accuracy

**Solutions:**
1. Adjust temperature (try 0.1 instead of 0.2)
2. Update prompts for Gemini 2.0 capabilities
3. Add more examples in prompts

### Issue: Higher costs than expected

**Debugging:**
```typescript
// Add cost tracking
console.log('Token usage - Input:', inputTokens, 'Output:', outputTokens);
console.log('Estimated cost:', (inputTokens * 0.15/1000000 + outputTokens * 0.60/1000000));
```

**Check:**
- Token usage in GCP console
- Verify pricing tier
- Check for unexpected retries

---

## Success Criteria

**Phase 1 complete when:**
- ✅ All tests passing
- ✅ Production running smoothly
- ✅ Cost reduction achieved (80%+)
- ✅ Accuracy maintained or improved
- ✅ No user complaints
- ✅ 1 week of stable operation

**Document results:**
- Update CHANGELOG.md
- Update README.md (if needed)
- Create migration notes
- Share learnings with team

---

## Next Steps After Success

**Week 2-4: Optimize**
- Fine-tune prompts for Gemini 2.0
- Adjust temperature and parameters
- Optimize token usage
- Review caching strategy

**Month 2: Evaluate Phase 2**
- Assess user needs for RAG
- Review document knowledge base requirements
- Plan Vertex AI RAG implementation (if needed)

**Month 6: Framework evaluation**
- POC with Genkit
- Compare DX benefits
- Decide on long-term architecture

---

## Support Resources

**Google Support:**
- Gemini API Discord: https://discord.gg/gemini-api
- Google Cloud Support: https://cloud.google.com/support
- Stack Overflow: tag `google-gemini`

**Internal:**
- Research report: `docs/GOOGLE-AI-UPGRADE-RESEARCH-REPORT.md`
- Quick summary: `docs/GOOGLE-AI-UPGRADE-SUMMARY.md`
- Current implementation: `server/services/gemini.service.ts`

**Monitoring:**
- GCP Console: https://console.cloud.google.com
- Gemini API Quotas: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
- Cost tracking: https://console.cloud.google.com/billing

---

## Appendix: Code Snippets

### Add version logging

```typescript
// Add to GeminiService constructor
console.log('🚀 Gemini Service initialized');
console.log('Models: ', Object.values(GeminiModel));
console.log('Version: 2.0 Flash (2025-01-07 upgrade)');
```

### Add performance monitoring

```typescript
// Add to processReservationDocument
const metrics = {
  startTime: Date.now(),
  modelVersion: 'gemini-2.0-flash',
  processingSteps: []
};

// After each step:
metrics.processingSteps.push({
  step: 'text-extraction',
  duration: Date.now() - stepStart,
  success: true
});

// Log at end:
console.log('Performance metrics:', JSON.stringify(metrics));
```

### Add cost estimation

```typescript
// Estimate cost per request
function estimateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = inputTokens * 0.15 / 1_000_000;
  const outputCost = outputTokens * 0.60 / 1_000_000;
  return inputCost + outputCost;
}
```

---

**Implementation Guide Version:** 1.0
**Last Updated:** 2025-01-07
**Author:** Claude Code Research Agent
