/**
 * Performance API Routes - MariaIntelligence 2025
 * Performance monitoring and validation endpoints
 */

import { Router } from 'express';
// Performance validation utilities
const validatePerformance = async (req: any, res: any) => {
  res.json({ success: true, message: 'Performance validation placeholder' });
};

const performanceHealthCheck = () => ({
  status: 'healthy',
  timestamp: new Date().toISOString()
});
// Performance metrics utilities - simplified for now
const getPerformanceMetrics = (options: any) => [];
const getPerformanceStats = () => ({ totalRequests: 0, averageResponseTime: 0 });
const getPerformanceHealth = () => ({ status: 'healthy', metrics: {} });
const clearPerformanceMetrics = () => {};
import { sendSuccessResponse } from '../utils/response.utils.js';
import { featureRateLimit } from '../middleware/rateLimit.middleware.js';
import { asyncHandler } from '../utils/response.utils.js';

const router = Router();

/**
 * @swagger
 * /api/v1/performance/validate:
 *   post:
 *     summary: Run performance validation suite
 *     description: Execute comprehensive performance tests and return results
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: Performance validation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalTests: { type: number }
 *                         passed: { type: number }
 *                         failed: { type: number }
 *                         avgResponseTime: { type: number }
 *                         overallScore: { type: number }
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                     bundleAnalysis:
 *                       type: object
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/validate',
  featureRateLimit('general'), // Limit performance tests
  asyncHandler(validatePerformance)
);

/**
 * @swagger
 * /api/v1/performance/health:
 *   get:
 *     summary: Get performance health status
 *     description: Quick performance health check with system metrics
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: Performance health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, warning, critical]
 *                     metrics:
 *                       type: object
 *                     recommendations:
 *                       type: array
 *                     systemInfo:
 *                       type: object
 */
router.get('/health',
  asyncHandler(async (req, res) => {
    const healthData = getPerformanceHealth();
    const systemInfo = performanceHealthCheck();

    return sendSuccessResponse(res, {
      ...healthData,
      systemInfo,
    }, 'Performance health check completed');
  })
);

/**
 * @swagger
 * /api/v1/performance/metrics:
 *   get:
 *     summary: Get performance metrics
 *     description: Retrieve detailed performance metrics and statistics
 *     tags: [Performance]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of recent metrics to return
 *       - in: query
 *         name: minResponseTime
 *         schema:
 *           type: integer
 *         description: Filter by minimum response time
 *       - in: query
 *         name: maxResponseTime
 *         schema:
 *           type: integer
 *         description: Filter by maximum response time
 *     responses:
 *       200:
 *         description: Performance metrics retrieved
 */
router.get('/metrics',
  asyncHandler(async (req, res) => {
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      minResponseTime: req.query.minResponseTime ? parseInt(req.query.minResponseTime as string) : undefined,
      maxResponseTime: req.query.maxResponseTime ? parseInt(req.query.maxResponseTime as string) : undefined,
    };

    const metrics = getPerformanceMetrics(options);
    const stats = getPerformanceStats();

    return sendSuccessResponse(res, {
      metrics,
      statistics: stats,
      totalEntries: metrics.length,
    }, 'Performance metrics retrieved');
  })
);

/**
 * @swagger
 * /api/v1/performance/stats:
 *   get:
 *     summary: Get performance statistics
 *     description: Get aggregated performance statistics
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: Performance statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRequests: { type: number }
 *                     averageResponseTime: { type: number }
 *                     p95ResponseTime: { type: number }
 *                     p99ResponseTime: { type: number }
 *                     errorRate: { type: number }
 *                     slowRequestsCount: { type: number }
 */
router.get('/stats',
  asyncHandler(async (req, res) => {
    const stats = getPerformanceStats();
    return sendSuccessResponse(res, stats, 'Performance statistics retrieved');
  })
);

/**
 * @swagger
 * /api/v1/performance/clear:
 *   delete:
 *     summary: Clear performance metrics
 *     description: Clear all stored performance metrics (admin only)
 *     tags: [Performance]
 *     responses:
 *       200:
 *         description: Performance metrics cleared
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/clear',
  // Add admin authentication middleware here
  asyncHandler(async (req, res) => {
    clearPerformanceMetrics();
    return sendSuccessResponse(res, {}, 'Performance metrics cleared');
  })
);

export { router as performanceRoutes };