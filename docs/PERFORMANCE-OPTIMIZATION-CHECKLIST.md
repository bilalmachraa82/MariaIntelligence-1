# Performance Optimization Implementation Checklist

Quick reference for implementing the performance improvements outlined in PERFORMANCE-ANALYSIS-2025.md

---

## Phase 1: Quick Wins (1-2 days) ✓ 60% improvement

### 1. Enable Compression Middleware (2 hours)

- [ ] Install compression package
  ```bash
  npm install compression @types/compression
  ```

- [ ] Update `/home/user/MariaIntelligence-1/server/index.ts`
  ```typescript
  import compression from 'compression';

  // Add BEFORE other middleware (line ~23)
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    }
  }));
  ```

- [ ] Test with curl:
  ```bash
  curl -H "Accept-Encoding: gzip" http://localhost:5100/api/v1/properties -I
  # Should see: Content-Encoding: gzip
  ```

**Expected Result:** API responses -70% size

---

### 2. Implement Route-Based Lazy Loading (6 hours)

- [ ] Update `/home/user/MariaIntelligence-1/client/src/App.tsx`

  **Replace top imports (lines 8-64) with:**
  ```typescript
  import { lazy } from 'react';
  import { LazyWrapper } from '@/shared/components/LazyWrapper';

  // Keep these synchronous (core pages)
  import NotFound from "@/pages/not-found";
  import DashboardFull from "@/pages/dashboard-full";
  import { Layout } from "@/components/layout/layout";

  // Convert ALL other pages to lazy
  const PropertiesPage = lazy(() => import("@/pages/properties"));
  const PropertyDetailPage = lazy(() => import("@/pages/properties/[id]"));
  const PropertyEditPage = lazy(() => import("@/pages/properties/edit"));
  const OwnersPage = lazy(() => import("@/pages/owners"));
  const OwnerDetailPage = lazy(() => import("@/pages/owners/[id]"));
  const OwnerEditPage = lazy(() => import("@/pages/owners/edit"));
  const ReservationsPage = lazy(() => import("@/pages/reservations"));
  const ReservationDetailPage = lazy(() => import("@/pages/reservations/[id]"));
  const ReservationNewPage = lazy(() => import("@/pages/reservations/new"));
  const ReportsPage = lazy(() => import("@/pages/reports"));
  const SettingsPage = lazy(() => import("@/pages/settings"));
  const DocumentScanPage = lazy(() => import("@/pages/pdf-upload"));
  const AssistantPage = lazy(() => import("@/pages/assistant"));
  const ReservationAssistantPage = lazy(() => import("@/pages/reservation-assistant"));
  const DemoDataPage = lazy(() => import("@/pages/demo-data"));
  const ForceResetDemoData = lazy(() => import("@/pages/demo-data/force-reset"));
  const CleaningTeamsPage = lazy(() => import("@/pages/cleaning-teams"));
  const CleaningSchedulesPage = lazy(() => import("@/pages/cleaning-teams/schedules"));
  const CleaningReportsPage = lazy(() => import("@/pages/cleaning-reports"));
  const OwnerReportPage = lazy(() => import("@/pages/reports/owner-report"));
  const TrendsReportPage = lazy(() => import("@/pages/reports/trends"));
  const MonthlyInvoicePage = lazy(() => import("@/pages/reports/monthly-invoice"));
  const BudgetCalculatorPage = lazy(() => import("@/pages/budget-calculator"));
  const MaintenancePending = lazy(() => import("@/pages/maintenance/pending"));
  const MaintenanceRequest = lazy(() => import("@/pages/maintenance/request"));
  const MaintenanceNewTask = lazy(() => import("@/pages/maintenance/new"));
  const PaymentsOutgoing = lazy(() => import("@/pages/payments/outgoing"));
  const PaymentsIncoming = lazy(() => import("@/pages/payments/incoming"));
  const PaymentNewPage = lazy(() => import("@/pages/payments/new"));
  const ReservationApprovalPage = lazy(() => import("@/pages/reservations/approval"));
  const FinancialDocumentsPage = lazy(() => import("@/pages/financial/documents"));
  const DocumentDetailPage = lazy(() => import("@/pages/financial/documents/[id]"));
  const NewDocumentPage = lazy(() => import("@/pages/financial/documents/new"));
  const EditDocumentPage = lazy(() => import("@/pages/financial/documents/edit/[id]"));
  const NewDocumentItemPage = lazy(() => import("@/pages/financial/documents/items/new"));
  const EditDocumentItemPage = lazy(() => import("@/pages/financial/documents/items/edit/[id]"));
  const NewPaymentPage = lazy(() => import("@/pages/financial/documents/payments/new"));
  const EditPaymentPage = lazy(() => import("@/pages/financial/documents/payments/edit/[id]"));
  const PropertyStatisticsPage = lazy(() => import("@/pages/properties/estatisticas"));
  const QuotationsPage = lazy(() => import("@/pages/quotations"));
  const QuotationNewPage = lazy(() => import("@/pages/quotations/new"));
  const QuotationDetailPage = lazy(() => import("@/pages/quotations/[id]"));
  const QuotationEditPage = lazy(() => import("@/pages/quotations/[id]/edit"));
  ```

- [ ] Wrap routes in Router function (update each Route component):
  ```typescript
  <Route path="/propriedades" component={() => (
    <LazyWrapper>
      <PropertiesPage />
    </LazyWrapper>
  )} />
  ```

- [ ] Keep these routes WITHOUT LazyWrapper (already synchronous):
  - `/` (DashboardFull)
  - `/painel` (DashboardFull)
  - 404 (NotFound)

- [ ] Build and test:
  ```bash
  npm run build
  # Check dist/client/assets/js/ - should see many page-*.js files
  ```

**Expected Result:** main.js 1.8MB → ~500KB (-72%)

---

### 3. Enable Tree Shaking (1 hour)

- [ ] Update `/home/user/MariaIntelligence-1/vite.config.ts`

  **Add to build.rollupOptions:**
  ```typescript
  build: {
    rollupOptions: {
      // ... existing config

      // Add tree shaking configuration
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    }
  }
  ```

- [ ] Rebuild and compare sizes:
  ```bash
  npm run build
  du -sh dist/client
  ```

**Expected Result:** Additional -15% bundle size

---

### 4. Phase 1 Validation

- [ ] Run build and check bundle sizes:
  ```bash
  npm run build
  ls -lh dist/client/assets/js/*.js
  gzip -c dist/client/assets/js/main-*.js | wc -c
  ```

- [ ] Expected main bundle gzipped: ~200KB (down from 492KB)

- [ ] Test in browser:
  - Open DevTools → Network
  - Hard refresh (Cmd+Shift+R)
  - Check main.js size
  - Navigate to different pages, verify chunks load

- [ ] Run Lighthouse:
  ```bash
  npm install -g @lhci/cli
  lhci autorun --collect.url=http://localhost:5100
  ```

**Success Criteria:**
- Main bundle: <250KB gzipped ✓
- Lighthouse Performance: >80 ✓
- API responses include gzip header ✓

---

## Phase 2: Medium Impact (3-5 days) ✓ Additional 20% improvement

### 1. Redis Caching Implementation (8 hours)

- [ ] Create `/home/user/MariaIntelligence-1/server/middleware/cache.middleware.ts`
  ```typescript
  import Redis from 'ioredis';
  import type { Request, Response, NextFunction } from 'express';

  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  export const cacheMiddleware = (ttl: number = 300) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (req.method !== 'GET') return next();

      const key = `api:${req.originalUrl}`;

      try {
        const cached = await redis.get(key);
        if (cached) {
          res.set('X-Cache', 'HIT');
          return res.json(JSON.parse(cached));
        }
      } catch (error) {
        console.error('Cache read error:', error);
      }

      const originalJson = res.json.bind(res);
      res.json = function(data: any) {
        redis.setex(key, ttl, JSON.stringify(data)).catch(console.error);
        res.set('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    };
  };

  export const clearCache = async (pattern: string) => {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  };
  ```

- [ ] Apply to routes in `/home/user/MariaIntelligence-1/server/routes/v1/`
  ```typescript
  import { cacheMiddleware } from '../../middleware/cache.middleware.js';

  // Properties - 5 min cache
  router.get('/properties', cacheMiddleware(300), propertiesController.list);

  // Reports - 10 min cache
  router.get('/reports/*', cacheMiddleware(600), reportsController.get);

  // Dashboard - 2 min cache
  router.get('/dashboard/stats', cacheMiddleware(120), dashboardController.stats);
  ```

- [ ] Invalidate cache on mutations
  ```typescript
  import { clearCache } from '../../middleware/cache.middleware.js';

  router.post('/properties', async (req, res) => {
    // ... create property
    await clearCache('api:/api/v1/properties*');
    res.json(result);
  });
  ```

- [ ] Test caching:
  ```bash
  # First request (MISS)
  curl -I http://localhost:5100/api/v1/properties
  # Second request (HIT)
  curl -I http://localhost:5100/api/v1/properties
  # Check for X-Cache: HIT header
  ```

**Expected Result:** API response time 200ms → 5ms (cached)

---

### 2. Database Query Optimization (8 hours)

- [ ] Add prepared statements to frequent queries

  **In `/home/user/MariaIntelligence-1/server/features/properties/services/properties.service.ts`:**
  ```typescript
  import { sql } from 'drizzle-orm';

  // Prepared statement for property by ID
  const getPropertyByIdPrepared = db
    .select()
    .from(properties)
    .where(eq(properties.id, sql.placeholder('id')))
    .prepare('get_property_by_id');

  // Usage
  const property = await getPropertyByIdPrepared.execute({ id: propertyId });
  ```

- [ ] Implement selective field loading
  ```typescript
  // List view - only essential fields
  db.select({
    id: properties.id,
    name: properties.name,
    address: properties.address,
    status: properties.status
    // Exclude: description, notes, metadata
  }).from(properties)
  ```

- [ ] Replace N+1 queries with batch queries
  ```typescript
  // Bad: N queries
  for (const reservation of reservations) {
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, reservation.propertyId)
    });
  }

  // Good: 1 query
  const propertyIds = reservations.map(r => r.propertyId);
  const propertiesMap = await db.query.properties.findMany({
    where: inArray(properties.id, propertyIds)
  }).then(props => new Map(props.map(p => [p.id, p])));
  ```

- [ ] Check database indexes (in migration):
  ```sql
  CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
  CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON reservations(property_id);
  CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
  CREATE INDEX IF NOT EXISTS idx_financial_documents_date ON financial_documents(document_date);
  ```

**Expected Result:** Query time -40%

---

### 3. Component Memoization (6 hours)

- [ ] Memoize expensive list components
  ```typescript
  import { memo } from 'react';

  export const PropertyCard = memo(({ property }) => {
    // ... component
  }, (prev, next) => prev.property.id === next.property.id);
  ```

- [ ] Add useMemo for expensive calculations
  ```typescript
  const sortedProperties = useMemo(
    () => properties.sort((a, b) => a.name.localeCompare(b.name)),
    [properties]
  );
  ```

- [ ] Add useCallback for stable callbacks
  ```typescript
  const handleClick = useCallback(
    (id: number) => navigate(`/propriedades/${id}`),
    [navigate]
  );
  ```

**Priority components:**
- `PropertyCard`
- `ReservationCard`
- Dashboard widgets
- Chart components

**Expected Result:** -30% re-renders

---

### 4. Chart Bundle Optimization (4 hours)

- [ ] Lazy load chart pages
  ```typescript
  const TrendsReportPage = lazy(() => import("@/pages/reports/trends"));
  const ChartsPage = lazy(() => import("@/pages/charts"));
  ```

- [ ] Consider using Tremor (already installed) instead of Recharts for some charts
  ```typescript
  // Tremor is lighter and already installed
  import { BarChart, Card } from '@tremor/react';
  ```

- [ ] Exclude recharts from initial bundle in `vite.config.ts`:
  ```typescript
  optimizeDeps: {
    exclude: ['recharts']
  }
  ```

**Expected Result:** -300KB from initial bundle

---

## Phase 3: Advanced Optimizations (1 week) ✓ Additional 10-15% improvement

### 1. Virtual Scrolling (8 hours)

- [ ] Install react-virtual
  ```bash
  npm install @tanstack/react-virtual
  ```

- [ ] Implement in PropertiesPage
  ```typescript
  import { useVirtualizer } from '@tanstack/react-virtual';

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: properties.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5
  });
  ```

- [ ] Apply to:
  - Properties list
  - Reservations list
  - Financial documents list

**Expected Result:** Smooth scrolling for 100+ items

---

### 2. Bundle Analyzer Setup (2 hours)

- [ ] Install visualizer
  ```bash
  npm install -D rollup-plugin-visualizer
  ```

- [ ] Update `vite.config.ts`:
  ```typescript
  import { visualizer } from 'rollup-plugin-visualizer';

  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html'
    })
  ]
  ```

- [ ] Add script to package.json:
  ```json
  "analyze": "vite build && open dist/stats.html"
  ```

---

### 3. Performance Monitoring Dashboard (8 hours)

- [ ] Integrate performance middleware in `/home/user/MariaIntelligence-1/server/index.ts`:
  ```typescript
  import { performanceMiddleware, getPerformanceStats, getPerformanceHealth } from './middleware/performance.middleware.js';

  app.use(performanceMiddleware());

  app.get('/api/metrics', (req, res) => {
    const stats = getPerformanceStats();
    const health = getPerformanceHealth();
    res.json({ stats, health });
  });
  ```

- [ ] Create admin metrics page at `/home/user/MariaIntelligence-1/client/src/pages/admin/metrics.tsx`

**Expected Result:** Real-time performance insights

---

### 4. Enhanced Vendor Splitting (4 hours)

- [ ] Update `vite.config.ts` manualChunks strategy:
  ```typescript
  manualChunks: (id) => {
    if (id.includes('node_modules')) {
      if (id.includes('react') || id.includes('react-dom')) return 'react-vendor';
      if (id.includes('@radix-ui')) return 'ui-vendor';
      if (id.includes('recharts')) return 'chart-vendor';
      if (id.includes('pdf-lib') || id.includes('jspdf')) return 'pdf-vendor';
      return 'vendor';
    }
    if (id.includes('/pages/')) {
      const page = id.split('/pages/')[1].split('/')[0];
      return `page-${page}`;
    }
  }
  ```

**Expected Result:** Better cache hit rates

---

## Testing & Validation Checklist

### After Each Phase

- [ ] Build production bundle
  ```bash
  npm run build
  ```

- [ ] Check bundle sizes
  ```bash
  ls -lh dist/client/assets/js/*.js
  du -sh dist/client
  ```

- [ ] Test locally
  ```bash
  npm start
  # Navigate through all pages
  # Check Network tab for lazy loading
  ```

- [ ] Run Lighthouse
  ```bash
  lhci autorun --collect.url=http://localhost:5100
  ```

- [ ] Check metrics API
  ```bash
  curl http://localhost:5100/api/metrics
  ```

### Success Criteria

**Phase 1:**
- [ ] Main bundle gzipped: <250KB
- [ ] API responses have gzip encoding
- [ ] Lighthouse score: >80

**Phase 2:**
- [ ] Main bundle gzipped: <150KB
- [ ] Cache headers present (X-Cache)
- [ ] Query response time: <100ms
- [ ] Lighthouse score: >85

**Phase 3:**
- [ ] Main bundle gzipped: <120KB
- [ ] Virtual scrolling smooth (100+ items)
- [ ] Performance metrics dashboard working
- [ ] Lighthouse score: >90

---

## Rollback Plan

If issues occur:

1. **Lazy Loading Issues:**
   ```bash
   git revert <commit-hash>
   npm run build
   ```

2. **Redis Caching Issues:**
   - Comment out cache middleware
   - Restart server
   - Debug cache invalidation logic

3. **Build Issues:**
   ```bash
   rm -rf node_modules package-lock.json dist
   npm install
   npm run build
   ```

---

## Documentation Updates

After completion:

- [ ] Update `/home/user/MariaIntelligence-1/CLAUDE.md`
  - Add bundle optimization section
  - Document lazy loading pattern
  - Add caching strategy

- [ ] Create `/home/user/MariaIntelligence-1/docs/CACHING-STRATEGY.md`
  - Document cache keys
  - Explain invalidation logic
  - Add troubleshooting guide

- [ ] Update README
  - Add performance section
  - Document new npm scripts

---

**Total Estimated Time:** 80 hours
**Expected Total Improvement:** 85%
**Expected ROI:** 2-4 months payback
