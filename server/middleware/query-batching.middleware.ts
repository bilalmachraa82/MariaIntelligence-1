/**
 * Query Batching Middleware - MariaIntelligence 2025
 *
 * Middleware to manage DataLoader cache lifecycle
 * Clears loader caches at the end of each request to prevent:
 * - Memory leaks
 * - Stale data in subsequent requests
 * - Cache growing unbounded
 */

import type { Request, Response, NextFunction } from 'express';
import {
  clearAllLoaders,
  propertyLoader,
  ownerLoader,
  reservationLoader,
  cleaningTeamLoader
} from '../utils/query-batching.js';

/**
 * Middleware to clear all DataLoader caches after each request
 *
 * Usage:
 * ```typescript
 * import { queryBatchingMiddleware } from './middleware/query-batching.middleware.js';
 * app.use(queryBatchingMiddleware);
 * ```
 */
export function queryBatchingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Store loaders on request object for easy access in routes
  (req as any).loaders = {
    property: propertyLoader,
    owner: ownerLoader,
    reservation: reservationLoader,
    cleaningTeam: cleaningTeamLoader
  };

  // Clear caches when response finishes (success or error)
  res.on('finish', () => {
    clearAllLoaders();
  });

  // Also clear on error
  res.on('close', () => {
    if (!res.writableEnded) {
      clearAllLoaders();
    }
  });

  next();
}

/**
 * Enhanced middleware with performance tracking
 * Logs query batching statistics in development mode
 */
export function queryBatchingMiddlewareWithStats(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();
  let queryCount = 0;

  // Track query execution (simplified - in production, use a proper query logger)
  const originalQuery = (req as any).db?.query;

  // Store loaders on request
  (req as any).loaders = {
    property: propertyLoader,
    owner: ownerLoader,
    reservation: reservationLoader,
    cleaningTeam: cleaningTeamLoader
  };

  // Clear and log stats when done
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Query Batching] ${req.method} ${req.path} - ${duration}ms`);
    }

    clearAllLoaders();
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      clearAllLoaders();
    }
  });

  next();
}

/**
 * Type augmentation for Request object
 * Adds loaders to the Request type for TypeScript support
 */
declare global {
  namespace Express {
    interface Request {
      loaders?: {
        property: typeof propertyLoader;
        owner: typeof ownerLoader;
        reservation: typeof reservationLoader;
        cleaningTeam: typeof cleaningTeamLoader;
      };
    }
  }
}

export default queryBatchingMiddleware;
