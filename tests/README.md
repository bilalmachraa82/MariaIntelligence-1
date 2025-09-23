# MariaIntelligence Testing Suite

Comprehensive testing framework for the MariaIntelligence property management application, covering all 47 routes with detailed page-by-page analysis.

## Overview

This testing suite provides complete coverage of:
- **Page Loading & Rendering**: All 47 application routes
- **Interactive Elements**: Forms, buttons, navigation
- **Mobile Responsiveness**: Touch interactions and responsive layouts
- **Translation Coverage**: Portuguese i18n implementation
- **Error Handling**: Network failures, edge cases, validation
- **Performance Metrics**: Load times, memory usage, optimization

## Test Structure

### 📁 Test Files

| File | Purpose | Priority | Tests |
|------|---------|----------|--------|
| `page-test-framework.test.tsx` | Core page loading and routing | Critical | 47 routes |
| `individual-page-tests.test.tsx` | Page-specific functionality | Critical | 8 key pages |
| `translation-test.test.tsx` | i18n and Portuguese content | High | All pages |
| `responsive-mobile-tests.test.tsx` | Mobile compatibility | High | Key workflows |
| `error-handling-tests.test.tsx` | Error scenarios and edge cases | Medium | Error boundaries |
| `performance-metrics-tests.test.tsx` | Load times and optimization | Medium | Performance budgets |

### 🎯 Page Coverage

**Critical Pages (4)**:
- Dashboard (`/`, `/painel`, `/painel-completo`)
- Properties (`/propriedades`)
- Reservations (`/reservas`)
- Financial Documents (`/financeiro/documentos`)

**High Priority (8)**:
- Owners, Reports, Payments, etc.

**Medium Priority (15)**:
- Quotations, Document Processing, Budget Calculator, etc.

**Low Priority (20)**:
- Settings, Assistant, Maintenance, Cleaning Teams, Demo Data, etc.

## Quick Start

### Prerequisites
```bash
npm install
# or
yarn install
```

### Run All Tests
```bash
npm run test:all
```

### Run Specific Test Categories
```bash
# Critical functionality only
npm run test:critical

# Performance testing
npm run test:performance

# Mobile responsiveness
npm run test:mobile

# Translation coverage
npm run test:i18n

# Error handling
npm run test:errors
```

### Interactive Testing
```bash
# Watch mode
npm run test:watch

# UI mode
npm run test:ui

# With coverage
npm run test:coverage
```

## Test Commands

| Command | Description |
|---------|-------------|
| `npm run test` | Run all tests in watch mode |
| `npm run test:run` | Run all tests once |
| `npm run test:all` | Execute complete test suite with reporting |
| `npm run test:critical` | Run only critical page tests |
| `npm run test:report` | Generate comprehensive test report |

## Performance Budgets

### Page Load Times
- **Critical Pages**: < 2 seconds
- **High Priority**: < 3 seconds  
- **Medium Priority**: < 4 seconds
- **Low Priority**: < 5 seconds

### Mobile Performance
- **Touch Response**: < 100ms
- **Touch Target Size**: ≥ 44px
- **Viewport Adaptation**: All breakpoints

### Translation Coverage
- **Target**: > 85% coverage
- **Critical Terms**: 100% coverage
- **Error Messages**: Portuguese preferred

## Test Results Interpretation

### Success Criteria
- ✅ **All critical tests pass**: Core functionality works
- ✅ **>80% overall pass rate**: Good application quality
- ✅ **<2s critical page loads**: Acceptable performance
- ✅ **Mobile tests pass**: Responsive design works

### Warning Signs
- ⚠️ **Critical test failures**: Production blocker
- ⚠️ **<70% pass rate**: Quality issues need attention
- ⚠️ **>5s page loads**: Performance optimization needed
- ⚠️ **Mobile failures**: UX problems on mobile devices

## Generated Reports

### After Test Execution
1. **`comprehensive-test-report.md`**: Detailed analysis with severity levels
2. **`test-execution-report.json`**: Machine-readable results
3. **`test-execution-summary.md`**: Executive summary with recommendations

### Report Contents
- Page-by-page functionality analysis
- Performance metrics and bottlenecks
- Translation coverage assessment
- Mobile compatibility evaluation
- Error handling validation
- Priority-based issue classification
- Actionable recommendations

## Common Issues & Solutions

### Test Environment Setup
```bash
# If tests fail to run, check dependencies
npm install --save-dev @testing-library/jest-dom @testing-library/react vitest

# Ensure TypeScript paths are configured
npm run type-check
```

### Mock Configuration
The test suite includes comprehensive mocks for:
- Browser APIs (localStorage, sessionStorage, matchMedia)
- Network requests (fetch API)
- Performance monitoring
- Resize/Intersection observers

### Performance Testing
```bash
# For detailed performance analysis
npm run test:performance

# Monitor memory usage during tests
NODE_OPTIONS="--expose-gc" npm run test:performance
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: MariaIntelligence Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:all
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: tests/*.md
```

### Quality Gates
- All critical tests must pass
- Overall success rate > 80%
- Performance budgets met
- No high-severity issues in production builds

## Contributing

### Adding New Tests
1. Identify the page/functionality to test
2. Choose appropriate test file based on category
3. Follow existing test patterns and naming
4. Include performance and accessibility checks
5. Update documentation as needed

### Test Maintenance
- Review test results regularly
- Update performance budgets as application grows
- Maintain translation coverage
- Address flaky tests promptly
- Keep test environment mocks current

## Troubleshooting

### Common Test Failures
1. **Route not found**: Check if route exists in App.tsx
2. **Translation missing**: Update i18n files
3. **Performance timeout**: Increase test timeout or optimize code
4. **Mobile test failure**: Check responsive CSS implementation
5. **Mock not working**: Verify mock configuration in test-setup.ts

### Debug Mode
```bash
# Run with debugging
DEBUG=true npm run test:all

# Run specific test with logging
npx vitest run --reporter=verbose specific-test.test.tsx
```

## Architecture

The testing framework follows these principles:
- **Comprehensive Coverage**: Every page and major workflow tested
- **Realistic Testing**: Uses actual React components and routing
- **Performance-Aware**: Includes timing and memory metrics
- **Mobile-First**: Validates responsive design and touch interactions
- **User-Centric**: Tests from user perspective, not implementation details
- **Maintainable**: Clear structure and comprehensive documentation

---

*For detailed results and recommendations, run `npm run test:report` and review the generated reports.*