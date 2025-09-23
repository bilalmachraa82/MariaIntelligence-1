/**
 * Modern Rate Limiting Middleware - MariaIntelligence 2025
 * Feature-based rate limiting with Redis support
 */

import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { FEATURE_RATE_LIMITS } from '../config/api.config.js';
import { sendRateLimitResponse } from '../utils/response.utils.js';

/**
 * Create a rate limiter with custom configuration
 */
function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req) => req.ip || 'unknown'),
    handler: (req: Request, res: Response) => {
      return sendRateLimitResponse(
        res,
        options.message || 'Too many requests, please try again later'
      );
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path.endsWith('/health');
    },
  });
}

/**
 * General API rate limiter
 */
export const generalRateLimiter = createRateLimiter({
  windowMs: FEATURE_RATE_LIMITS.general.windowMs,
  max: FEATURE_RATE_LIMITS.general.max,
  message: 'Too many API requests, please try again later',
});

/**
 * File upload rate limiter
 */
export const uploadRateLimiter = createRateLimiter({
  windowMs: FEATURE_RATE_LIMITS.upload.windowMs,
  max: FEATURE_RATE_LIMITS.upload.max,
  message: 'Too many file uploads, please wait before uploading again',
});

/**
 * AI/OCR operations rate limiter
 */
export const aiRateLimiter = createRateLimiter({
  windowMs: FEATURE_RATE_LIMITS.ai.windowMs,
  max: FEATURE_RATE_LIMITS.ai.max,
  message: 'Too many AI requests, please wait before trying again',
});

/**
 * Authentication rate limiter
 */
export const authRateLimiter = createRateLimiter({
  windowMs: FEATURE_RATE_LIMITS.auth.windowMs,
  max: FEATURE_RATE_LIMITS.auth.max,
  message: 'Too many authentication attempts, please try again later',
  keyGenerator: (req) => {
    // Rate limit by IP and email if provided
    const email = req.body?.email || req.query?.email;
    return email ? `${req.ip}:${email}` : req.ip || 'unknown';
  },
});

/**
 * Search operations rate limiter
 */
export const searchRateLimiter = createRateLimiter({
  windowMs: FEATURE_RATE_LIMITS.search.windowMs,
  max: FEATURE_RATE_LIMITS.search.max,
  message: 'Too many search requests, please slow down',
});

/**
 * Apply rate limiting middleware to specific routes
 */
export function rateLimitMiddleware() {
  return (req: Request, res: Response, next: any) => {
    // Apply general rate limiting to all API requests
    if (req.path.startsWith('/api/')) {
      return generalRateLimiter(req, res, next);
    }
    next();
  };
}

/**
 * Feature-specific rate limiting middleware
 */
export function featureRateLimit(feature: keyof typeof FEATURE_RATE_LIMITS) {
  const config = FEATURE_RATE_LIMITS[feature];
  
  return createRateLimiter({
    windowMs: config.windowMs,
    max: config.max,
    message: `Too many ${feature} requests, please try again later`,
  });
}

/**
 * Dynamic rate limiter based on user role or subscription
 */
export function dynamicRateLimit(options: {
  free: { windowMs: number; max: number };
  premium: { windowMs: number; max: number };
  admin: { windowMs: number; max: number };
}) {
  return (req: Request, res: Response, next: any) => {
    // Default to free tier
    let config = options.free;
    
    // Check user role/subscription (from JWT or session)
    const user = (req as any).user;
    if (user) {
      if (user.role === 'admin') {
        config = options.admin;
      } else if (user.subscription === 'premium') {
        config = options.premium;
      }
    }
    
    const limiter = createRateLimiter({
      windowMs: config.windowMs,
      max: config.max,
      keyGenerator: (req) => {
        const userId = (req as any).user?.id;
        return userId ? `user:${userId}` : req.ip || 'unknown';
      },
    });
    
    return limiter(req, res, next);
  };
}