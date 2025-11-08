/**
 * Quick Start Example - Redis Cache Middleware
 * Copy this pattern to your route files
 */

import { Router } from 'express';
import { cacheMiddleware, cacheInvalidation } from './middleware/index.js';
// Or: import { cacheMiddleware, cacheInvalidation } from './cache.middleware.js';

const router = Router();

// ============================================================================
// STEP 1: Add caching to GET routes
// ============================================================================

// Cache properties list for 5 minutes (300 seconds)
router.get('/api/v1/properties',
  cacheMiddleware(300),  // <-- Add this middleware
  async (req, res) => {
    // Your existing handler code stays the same
    const properties = await db.select().from(propertiesTable);
    res.json({ success: true, data: properties });
  }
);

// Cache dashboard stats for 2 minutes (frequently updated)
router.get('/api/v1/dashboard/stats',
  cacheMiddleware(120),  // <-- Shorter TTL for real-time data
  async (req, res) => {
    const stats = await calculateStats();
    res.json({ success: true, data: stats });
  }
);

// Cache financial reports for 10 minutes (expensive computation)
router.get('/api/v1/reports/financial',
  cacheMiddleware(600),  // <-- Longer TTL for heavy queries
  async (req, res) => {
    const report = await generateFinancialReport();
    res.json({ success: true, data: report });
  }
);

// ============================================================================
// STEP 2: Invalidate cache on mutations (POST, PUT, DELETE)
// ============================================================================

// Create new property - invalidate properties cache
router.post('/api/v1/properties', async (req, res) => {
  const newProperty = await db.insert(propertiesTable).values(req.body);

  // Clear the cache after creating
  await cacheInvalidation.invalidateRoute('/api/v1/properties');

  res.json({ success: true, data: newProperty });
});

// Update property - invalidate multiple related caches
router.put('/api/v1/properties/:id', async (req, res) => {
  const updated = await db.update(propertiesTable)
    .set(req.body)
    .where(eq(propertiesTable.id, req.params.id));

  // Clear all related caches
  await cacheInvalidation.invalidateRoute('/api/v1/properties');
  await cacheInvalidation.invalidateRoute('/api/v1/dashboard'); // Affects stats
  await cacheInvalidation.invalidateRoute('/api/v1/reports');   // Affects reports

  res.json({ success: true, data: updated });
});

// Delete property
router.delete('/api/v1/properties/:id', async (req, res) => {
  await db.delete(propertiesTable).where(eq(propertiesTable.id, req.params.id));

  // Clear all related caches
  await cacheInvalidation.invalidateRoute('/api/v1/properties');
  await cacheInvalidation.invalidateRoute('/api/v1/dashboard');

  res.json({ success: true });
});

// ============================================================================
// STEP 3: Optional - Add cache monitoring endpoint
// ============================================================================

router.get('/api/v1/admin/cache/stats', async (req, res) => {
  const stats = await cacheInvalidation.getStats();

  if (!stats) {
    return res.json({
      success: true,
      enabled: false,
      message: 'Redis cache is not available'
    });
  }

  res.json({
    success: true,
    enabled: true,
    data: {
      cachedKeys: stats.keys,
      memoryUsage: stats.memory,
      timestamp: new Date().toISOString()
    }
  });
});

// Manual cache clear endpoint (admin only)
router.post('/api/v1/admin/cache/clear', async (req, res) => {
  await cacheInvalidation.invalidateAll();
  res.json({ success: true, message: 'All cache cleared' });
});

export default router;

/**
 * SETUP CHECKLIST:
 *
 * 1. Environment Variables (.env):
 *    REDIS_URL=redis://localhost:6379
 *
 * 2. Import in your route files:
 *    import { cacheMiddleware, cacheInvalidation } from './middleware/index.js';
 *
 * 3. Add middleware to GET routes:
 *    router.get('/path', cacheMiddleware(TTL_IN_SECONDS), handler);
 *
 * 4. Invalidate on mutations:
 *    await cacheInvalidation.invalidateRoute('/api/v1/path');
 *
 * 5. Monitor in browser DevTools:
 *    Look for X-Cache: HIT or X-Cache: MISS headers
 *
 * That's it! The middleware handles everything else automatically.
 */
