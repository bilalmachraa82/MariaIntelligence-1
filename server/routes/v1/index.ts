/**
 * API v1 Routes - MariaIntelligence 2025
 * Modular route organization with OpenAPI documentation
 */

import type { Express } from 'express';
import { Router } from 'express';
import { API_CONFIG } from '../../config/api.config.js';

// Import route modules
import { propertiesRoutes } from './properties.routes.js';
import propertiesRouter from '../properties.js';

/**
 * Setup all v1 API routes
 */
export async function setupV1Routes(app: Express): Promise<void> {
  const v1Router = Router();

  // Apply versioned middleware
  v1Router.use((req, res, next) => {
    // Add version info to response headers
    res.set('API-Version', API_CONFIG.version);
    res.set('API-Documentation', API_CONFIG.documentation.path);
    next();
  });

  // Register route modules
  v1Router.use('/properties', propertiesRoutes);
  v1Router.use('/properties-api', propertiesRouter);

  // Mount v1 router
  app.use(API_CONFIG.prefix, v1Router);

  console.log(`✅ API v1 routes registered at ${API_CONFIG.prefix}`);
}