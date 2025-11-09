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
import reservationRoutes from '../../features/reservations/presentation/reservation.routes.js';
import propertyRoutes from '../../features/properties/presentation/property.routes.js';
import ownersRoutes from './owners.routes.js';
import financialRoutes from './financial.routes.js';
import ocrRoutes from '../ocr-processing.route.js';
import validationRoutes from '../validation.route.js';
import knowledgeRoutes from '../knowledge.route.js';
import predictionsRoutes from '../predictions.route.js';
// import databaseRoutes from '../database.js'; // Commented out for Vercel build compatibility

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
  // Properties
  v1Router.use('/properties', propertiesRoutes);
  v1Router.use('/properties-api', propertiesRouter);
  v1Router.use('/properties-features', propertyRoutes);

  // Reservations
  v1Router.use('/reservations', reservationRoutes);

  // Owners
  v1Router.use('/owners', ownersRoutes);

  // Financial Documents
  v1Router.use('/financial', financialRoutes);

  // OCR & AI Processing
  v1Router.use('/ocr', ocrRoutes);

  // Validation & Predictions
  v1Router.use('/validation', validationRoutes);
  v1Router.use('/predictions', predictionsRoutes);

  // Knowledge Base
  v1Router.use('/knowledge', knowledgeRoutes);

  // Database utilities
  // v1Router.use('/database', databaseRoutes); // Commented out for Vercel build compatibility

  // Mount v1 router
  app.use(API_CONFIG.prefix, v1Router);

  console.log(`✅ API v1 routes registered at ${API_CONFIG.prefix}`);
  console.log(`   - ${API_CONFIG.prefix}/properties`);
  console.log(`   - ${API_CONFIG.prefix}/reservations`);
  console.log(`   - ${API_CONFIG.prefix}/owners`);
  console.log(`   - ${API_CONFIG.prefix}/financial`);
  console.log(`   - ${API_CONFIG.prefix}/ocr`);
  console.log(`   - ${API_CONFIG.prefix}/validation`);
  console.log(`   - ${API_CONFIG.prefix}/predictions`);
  console.log(`   - ${API_CONFIG.prefix}/knowledge`);
  // console.log(`   - ${API_CONFIG.prefix}/database`); // Commented for Vercel compatibility
}