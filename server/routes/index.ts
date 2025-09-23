/**
 * Modern API Routes Index - MariaIntelligence 2025
 * ES Modules with API versioning and OpenAPI documentation
 */

import type { Express } from 'express';
import { API_CONFIG } from '../config/api.config.js';
import { setupMiddleware } from '../middleware/index.js';
import { setupV1Routes } from './v1/index.js';
import { setupDocumentation } from '../utils/swagger.utils.js';

/**
 * Register all API routes with versioning support
 */
export async function registerRoutes(app: Express): Promise<void> {
  console.log('🚀 Initializing modern API routes with ES Modules...');

  // Setup global middleware
  await setupMiddleware(app);

  // Setup API documentation
  if (API_CONFIG.documentation.enabled) {
    await setupDocumentation(app);
    console.log(`📚 API documentation available at ${API_CONFIG.documentation.path}`);
  }

  // Setup versioned routes
  await setupV1Routes(app);

  // Legacy compatibility layer (temporary)
  await setupLegacyCompatibility(app);

  console.log(`✅ API routes initialized with prefix: ${API_CONFIG.prefix}`);
}

/**
 * Setup legacy API compatibility for smooth migration
 */
async function setupLegacyCompatibility(app: Express): Promise<void> {
  // Redirect legacy /api/* routes to versioned endpoints
  app.use('/api/*', (req, res, next) => {
    // Skip if already versioned
    if (req.path.startsWith('/api/v1/')) {
      return next();
    }

    // Redirect to v1
    const newPath = req.path.replace('/api/', '/api/v1/');
    console.log(`🔄 Redirecting legacy route ${req.path} to ${newPath}`);

    // For GET requests, redirect
    if (req.method === 'GET') {
      return res.redirect(301, newPath + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''));
    }

    // For other methods, continue to next middleware
    req.url = newPath + (req.url.includes('?') ? '?' + req.url.split('?')[1] : '');
    next();
  });
}