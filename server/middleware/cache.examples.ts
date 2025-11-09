/**
 * Redis Cache Middleware - Usage Examples
 * MariaIntelligence 2025
 *
 * This file demonstrates various caching patterns and best practices
 * for the Redis caching middleware.
 */

import { Router, Request, Response } from 'express';
import { cacheMiddleware, cacheInvalidation } from './cache.middleware.js';

// Example 1: Basic caching for a GET route
// Cache properties list for 5 minutes (300 seconds)
const propertiesRouter = Router();

propertiesRouter.get(
  '/api/v1/properties',
  cacheMiddleware(300), // 5 minutes cache
  async (req: Request, res: Response) => {
    // This handler will only run on cache MISS
    // On cache HIT, response is returned immediately from Redis
    const properties = await db.select().from(propertiesTable);
    res.json({ success: true, data: properties });
  }
);

// Example 2: Invalidate cache on mutations
propertiesRouter.post(
  '/api/v1/properties',
  async (req: Request, res: Response) => {
    const newProperty = await db.insert(propertiesTable).values(req.body);

    // Invalidate the properties list cache after creating a new property
    await cacheInvalidation.invalidateRoute('/api/v1/properties');

    res.json({ success: true, data: newProperty });
  }
);

propertiesRouter.put(
  '/api/v1/properties/:id',
  async (req: Request, res: Response) => {
    const updated = await db.update(propertiesTable)
      .set(req.body)
      .where(eq(propertiesTable.id, req.params.id));

    // Invalidate both the list and potentially related caches
    await cacheInvalidation.invalidateRoute('/api/v1/properties');
    await cacheInvalidation.invalidateRoute('/api/v1/dashboard'); // Affects dashboard stats

    res.json({ success: true, data: updated });
  }
);

propertiesRouter.delete(
  '/api/v1/properties/:id',
  async (req: Request, res: Response) => {
    await db.delete(propertiesTable).where(eq(propertiesTable.id, req.params.id));

    // Clear all related caches
    await cacheInvalidation.invalidateRoute('/api/v1/properties');
    await cacheInvalidation.invalidateRoute('/api/v1/dashboard');
    await cacheInvalidation.invalidateRoute('/api/v1/financial'); // May affect reports

    res.json({ success: true });
  }
);

// Example 3: Different cache durations for different endpoints
const dashboardRouter = Router();

// Real-time stats - cache for 2 minutes
dashboardRouter.get(
  '/api/v1/dashboard/stats',
  cacheMiddleware(120), // 2 minutes
  async (req: Request, res: Response) => {
    const stats = await calculateDashboardStats();
    res.json({ success: true, data: stats });
  }
);

// Financial reports - cache for 10 minutes (expensive computation)
dashboardRouter.get(
  '/api/v1/dashboard/financial-summary',
  cacheMiddleware(600), // 10 minutes
  async (req: Request, res: Response) => {
    const summary = await generateFinancialSummary();
    res.json({ success: true, data: summary });
  }
);

// Example 4: Monitoring cache performance
const adminRouter = Router();

adminRouter.get(
  '/api/v1/admin/cache/stats',
  async (req: Request, res: Response) => {
    const stats = await cacheInvalidation.getStats();

    if (!stats) {
      return res.json({
        success: true,
        message: 'Redis cache is not available',
        enabled: false
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
  }
);

// Manual cache invalidation endpoint (admin only)
adminRouter.post(
  '/api/v1/admin/cache/invalidate',
  async (req: Request, res: Response) => {
    const { route, all } = req.body;

    if (all) {
      await cacheInvalidation.invalidateAll();
      res.json({ success: true, message: 'All cache cleared' });
    } else if (route) {
      await cacheInvalidation.invalidateRoute(route);
      res.json({ success: true, message: `Cache cleared for route: ${route}` });
    } else {
      res.status(400).json({ success: false, message: 'Specify route or all=true' });
    }
  }
);

// Example 5: Cache with query parameters
// Note: Different query params create different cache keys automatically
const reservationsRouter = Router();

reservationsRouter.get(
  '/api/v1/reservations',
  cacheMiddleware(180), // 3 minutes
  async (req: Request, res: Response) => {
    // Query params like ?status=active&page=1 will create unique cache keys
    // e.g., "api:/api/v1/reservations?status=active&page=1"
    const { status, page = 1, limit = 20 } = req.query;

    const reservations = await db.query.reservations.findMany({
      where: status ? eq(reservations.status, status) : undefined,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    });

    res.json({ success: true, data: reservations });
  }
);

// Example 6: Selective caching based on conditions
const reportsRouter = Router();

reportsRouter.get(
  '/api/v1/reports/monthly',
  async (req: Request, res: Response) => {
    const { month, year } = req.query;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Only cache reports for past months (they won't change)
    const isPastMonth =
      Number(year) < currentYear ||
      (Number(year) === currentYear && Number(month) < currentMonth);

    if (isPastMonth) {
      // Apply long cache for historical data - 1 day
      return cacheMiddleware(86400)(req, res, async () => {
        const report = await generateMonthlyReport(Number(month), Number(year));
        res.json({ success: true, data: report });
      });
    } else {
      // Current month - short cache or no cache
      const report = await generateMonthlyReport(Number(month), Number(year));
      res.json({ success: true, data: report });
    }
  }
);

// Example 7: Cache warming on application startup
export async function warmupCache() {
  console.log('🔥 Warming up cache...');

  try {
    // Pre-populate cache with frequently accessed data
    const criticalEndpoints = [
      { url: '/api/v1/properties', ttl: 300 },
      { url: '/api/v1/dashboard/stats', ttl: 120 },
      { url: '/api/v1/owners', ttl: 300 }
    ];

    for (const endpoint of criticalEndpoints) {
      // Simulate request to populate cache
      // In real implementation, you'd call the actual handler functions
      console.log(`  ↳ Warming cache for ${endpoint.url}`);
    }

    console.log('✅ Cache warmup completed');
  } catch (error) {
    console.error('Cache warmup failed:', error);
  }
}

// Example 8: Batch cache invalidation pattern
export async function invalidatePropertyRelatedCaches() {
  /**
   * When properties change, invalidate all related caches
   * This ensures data consistency across the application
   */
  const relatedRoutes = [
    '/api/v1/properties',
    '/api/v1/dashboard',
    '/api/v1/reports',
    '/api/v1/financial'
  ];

  await Promise.all(
    relatedRoutes.map(route => cacheInvalidation.invalidateRoute(route))
  );

  console.log(`♻️  Invalidated ${relatedRoutes.length} related caches`);
}

/**
 * Cache Recommendations by Feature:
 *
 * 1. Static/Reference Data: 15-30 minutes
 *    - Owner list, property amenities, cleaning teams
 *
 * 2. Moderate Change Data: 3-5 minutes
 *    - Properties, reservations, financial documents
 *
 * 3. Real-time Data: 1-2 minutes
 *    - Dashboard stats, activity feeds, notifications
 *
 * 4. Computed/Expensive Data: 10-15 minutes
 *    - Reports, analytics, aggregations
 *
 * 5. Historical Data: 1 day or more
 *    - Past month reports, archived data
 *
 * Always consider:
 * - Data freshness requirements
 * - Computation cost
 * - User expectations
 * - Storage capacity
 */
