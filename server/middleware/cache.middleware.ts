/**
 * Redis Caching Middleware - MariaIntelligence 2025
 * Provides intelligent API response caching with Redis backend
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// Initialize Redis client
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      // Gracefully handle connection errors
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('Redis connection failed after 3 attempts, disabling cache');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true, // Don't connect until first command
    });

// Track if Redis is available
let redisAvailable = false;

// Test Redis connection
redis.ping()
  .then(() => {
    redisAvailable = true;
    console.log('✅ Redis cache connected successfully');
  })
  .catch((err) => {
    console.warn('⚠️  Redis cache unavailable, caching disabled:', err.message);
  });

/**
 * Cache middleware for GET requests
 * @param ttl - Time to live in seconds (default: 300 = 5 minutes)
 */
export const cacheMiddleware = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if Redis is not available
    if (!redisAvailable) {
      return next();
    }

    // Generate cache key from URL and query params
    const key = `api:${req.originalUrl}`;

    try {
      // Try to get cached response
      const cached = await redis.get(key);

      if (cached) {
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', key);
        res.json(JSON.parse(cached));
        return;
      }

      // Cache miss - intercept response
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', key);

      const originalJson = res.json.bind(res);
      res.json = function(data: any) {
        // Cache the response asynchronously (don't wait)
        redis.setex(key, ttl, JSON.stringify(data)).catch(err => {
          console.error('Redis cache set error:', err);
        });
        return originalJson(data);
      };

      next();
    } catch (error) {
      // If Redis fails, just continue without caching
      console.error('Redis cache error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  /**
   * Invalidate cache for a specific route
   */
  async invalidateRoute(route: string): Promise<void> {
    if (!redisAvailable) return;

    try {
      const pattern = `api:${route}*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cache invalidated: ${keys.length} keys for pattern ${pattern}`);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  },

  /**
   * Invalidate all cache
   */
  async invalidateAll(): Promise<void> {
    if (!redisAvailable) return;

    try {
      const keys = await redis.keys('api:*');
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cache invalidated: ${keys.length} total keys`);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  },

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memory: string } | null> {
    if (!redisAvailable) return null;

    try {
      const keys = await redis.keys('api:*');
      const info = await redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      return {
        keys: keys.length,
        memory: memoryMatch ? memoryMatch[1] : 'unknown'
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }
};

// Export Redis client for direct use if needed
export { redis };
