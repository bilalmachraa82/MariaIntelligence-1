# MariaIntelligence - Testing Quick Start Guide

## Immediate Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for Basic Testing)

Create `.env` file:
```bash
# Required for database features
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# Required for AI/OCR features
GOOGLE_GEMINI_API_KEY="your-api-key-here"

# Basic configuration
NODE_ENV=development
PORT=5100
HOST=0.0.0.0
```

**Note:** Tests can run with mocks if these are not configured.

## Run Tests

### Quick Test Run
```bash
# Run all tests once
npm test -- --run

# Run specific test category
npm test -- --run tests/ocr-*.spec.ts

# Run with coverage
npm run test:coverage
```

### Specific Test Suites
```bash
# OCR tests
npm run test:ocr

# Security tests
npm test -- --run tests/security-*.spec.ts

# Performance tests
npm test -- --run tests/performance-*.spec.ts

# AI integration tests
npm test -- --run tests/ai-*.spec.ts
```

### Watch Mode (Development)
```bash
npm test
```

## Manual API Testing

### Health Check
```bash
# Start server
npm run dev:server

# Test health endpoint
curl http://localhost:5100/api/health
```

### Test OCR Endpoint
```bash
# Upload a PDF for processing
curl -X POST http://localhost:5100/api/ocr \
  -F "file=@public/Controlo_Aroeira II.pdf"
```

### Test Properties Endpoint
```bash
# Get all properties
curl http://localhost:5100/api/v1/properties

# Create a property
curl -X POST http://localhost:5100/api/v1/properties \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Property",
    "ownerId": 1,
    "active": true
  }'
```

## Common Test Scenarios

### 1. PDF Import Test
```bash
# Test with sample PDFs in /public directory
Files available:
- Controlo_Aroeira II.pdf
- Controlo_5 de Outubro.pdf
- Controlo_Feira da Ladra (Graça 1).pdf
```

### 2. Database Operations Test
```bash
# Test connection
node -e "import('./server/db/index.js').then(m => m.testConnection()).then(console.log)"

# Run migrations
npm run db:push

# Seed demo data
npm run db:seed
```

### 3. Verify Environment
```bash
npm run verify
```

## Expected Test Results

### Without Environment Variables
- ✅ Unit tests: Should pass (use mocks)
- ⚠️ Integration tests: May skip or use mocks
- ❌ E2E tests: May fail without database/API keys

### With Full Configuration
- ✅ Unit tests: Should pass
- ✅ Integration tests: Should pass
- ✅ E2E tests: Should pass
- ✅ Performance tests: Should pass

## Troubleshooting

### Tests Won't Run
```bash
# Check if vitest is installed
npx vitest --version

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Fails
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Test connection manually
npm run verify
```

### AI/OCR Tests Fail
```bash
# Check API key
echo $GOOGLE_GEMINI_API_KEY

# Tests should gracefully skip if key missing
```

### Port Already in Use
```bash
# Kill process on port 5100
lsof -ti:5100 | xargs kill -9

# Or use different port
PORT=5101 npm run dev
```

## Test Reports

### Generate Reports
```bash
# Run tests with verbose output
npm test -- --run --reporter=verbose

# Coverage report
npm run test:coverage

# Output location
./coverage/
./tests/*.md (existing reports)
```

### Review Existing Reports
```bash
cat tests/comprehensive-test-report.md
cat tests/DEPLOYMENT_READINESS_REPORT.md
cat tests/TEST_FIXES_REPORT.md
cat COMPREHENSIVE_QA_TESTING_REPORT.md
```

## Critical Features to Test

### Priority 1 - Core CRUD
- [ ] Properties management
- [ ] Reservations management
- [ ] Owners management
- [ ] Financial documents

### Priority 2 - AI Features
- [ ] PDF upload and OCR
- [ ] Reservation data extraction
- [ ] AI assistant chat

### Priority 3 - Advanced Features
- [ ] Financial reporting
- [ ] Budget calculator
- [ ] Maintenance tasks
- [ ] Cleaning teams

## Quick Health Check Script

```bash
#!/bin/bash
echo "MariaIntelligence Health Check"
echo "=============================="

# 1. Check dependencies
echo "1. Checking dependencies..."
npm list vitest >/dev/null 2>&1 && echo "✅ Vitest installed" || echo "❌ Vitest missing"

# 2. Check environment
echo "2. Checking environment..."
[ -f .env ] && echo "✅ .env file exists" || echo "⚠️  .env file missing"

# 3. Check test files
echo "3. Checking test files..."
test_count=$(find tests -name "*.spec.ts" | wc -l)
echo "✅ Found $test_count test files"

# 4. Check sample PDFs
echo "4. Checking sample PDFs..."
pdf_count=$(find public -name "*.pdf" | wc -l)
echo "✅ Found $pdf_count PDF files for testing"

# 5. Try to run a simple test
echo "5. Running simple test..."
npm test -- --run tests/setup.spec.ts 2>&1 | grep -q "PASS" && echo "✅ Tests can run" || echo "❌ Test execution failed"

echo "=============================="
echo "Health check complete!"
```

Save as `health-check.sh` and run:
```bash
chmod +x health-check.sh
./health-check.sh
```

## Next Steps

1. ✅ Review COMPREHENSIVE_QA_TESTING_REPORT.md
2. ✅ Install dependencies
3. ✅ Run tests and document results
4. ✅ Configure environment for full features
5. ✅ Fix any identified issues
6. ✅ Deploy to staging environment

---

**Quick Reference:**
- Full Report: `COMPREHENSIVE_QA_TESTING_REPORT.md`
- Test Files: `tests/` directory
- Sample Data: `public/` directory
- API Routes: `server/routes.ts`
