/**
 * Middleware Index - MariaIntelligence 2025
 * Centralized middleware configuration with ES Modules
 */

import type { Express } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { API_CONFIG } from '../config/api.config.js';
import { errorHandler } from './error.middleware.js';
import { rateLimitMiddleware } from './rateLimit.middleware.js';
import { loggingMiddleware } from './logging.middleware.js';
import { securityMiddleware } from './security.middleware.js';
import { performanceMiddleware } from './performance.middleware.js';

/**
 * Setup all application middleware in the correct order
 */
export async function setupMiddleware(app: Express): Promise<void> {
  console.log('🔧 Setting up modern middleware stack...');

  // Trust proxy for accurate IP detection
  app.set('trust proxy', 1);

  // Security middleware (first)
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }));

  // CORS configuration
  app.use(cors(API_CONFIG.cors));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Performance monitoring
  app.use(performanceMiddleware());

  // Logging middleware
  app.use(loggingMiddleware());

  // Security enhancements
  app.use(securityMiddleware());

  // Rate limiting
  app.use(rateLimitMiddleware());

  // Error handling (last)
  app.use(errorHandler);

  console.log('✅ Middleware stack configured successfully');
}