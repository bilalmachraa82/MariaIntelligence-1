/**
 * ML Predictions API Routes for MariaIntelligence
 * Provides REST endpoints for machine learning predictions and analytics
 */

import express from 'express';
import { mlPatternRecognition } from '../services/ml-pattern-recognition.service.js';
import { z } from 'zod';
import pino from 'pino';

const router = express.Router();
const logger = pino({ name: 'ml-predictions-api' });

// Validation schemas
const PredictionRequestSchema = z.object({
  model: z.enum(['revenue_forecast', 'occupancy_optimization', 'maintenance_prediction', 'guest_behavior', 'demand_patterns']),
  features: z.array(z.number()).min(1),
  options: z.object({
    return_confidence: z.boolean().optional(),
    explain_prediction: z.boolean().optional()
  }).optional()
});

const PatternAnalysisRequestSchema = z.object({
  data: z.array(z.object({
    timestamp: z.string().datetime(),
    value: z.number(),
    metadata: z.record(z.any()).optional()
  })).min(2),
  options: z.object({
    detect_anomalies: z.boolean().optional(),
    seasonal_analysis: z.boolean().optional(),
    trend_analysis: z.boolean().optional()
  }).optional()
});

const TrainingRequestSchema = z.object({
  model: z.enum(['revenue_forecast', 'occupancy_optimization', 'maintenance_prediction', 'guest_behavior', 'demand_patterns']),
  features: z.array(z.array(z.number())),
  labels: z.array(z.number()),
  validation_split: z.number().min(0).max(0.5).optional(),
  metadata: z.object({
    property_id: z.string().optional(),
    date_range: z.tuple([z.string().datetime(), z.string().datetime()]),
    data_points: z.number()
  }).optional()
});

// Middleware for request validation
const validateRequest = (schema: z.ZodSchema) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

// Rate limiting for ML endpoints (more restrictive than general API)
const mlRateLimit = express.Router();
mlRateLimit.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Simple rate limiting based on IP
  const clientIp = req.ip || req.socket.remoteAddress;
  const key = `ml_rate_limit_${clientIp}`;
  
  // In production, you'd use Redis or similar for distributed rate limiting
  // For now, using in-memory tracking (not suitable for production)
  if (!global.rateLimitTracker) {
    global.rateLimitTracker = new Map();
  }
  
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 10; // 10 requests per minute for ML endpoints
  
  const clientData = global.rateLimitTracker.get(key) || { count: 0, resetTime: now + windowMs };
  
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + windowMs;
  }
  
  if (clientData.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded for ML endpoints',
      retry_after: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  global.rateLimitTracker.set(key, clientData);
  
  next();
});

// Apply rate limiting to all ML routes
router.use(mlRateLimit);

/**
 * GET /api/predictions/models
 * Get list of available ML models and their status
 */
router.get('/models', async (req: express.Request, res: express.Response) => {
  try {
    logger.info('Fetching ML models status');
    
    const models = await mlPatternRecognition.getModelMetrics();
    
    res.json({
      success: true,
      models,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to fetch models status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models status',
      details: error.message
    });
  }
});

/**
 * GET /api/predictions/models/:modelName
 * Get specific model information and metrics
 */
router.get('/models/:modelName', async (req: express.Request, res: express.Response) => {
  try {
    const { modelName } = req.params;
    
    logger.info('Fetching model metrics', { model: modelName });
    
    const metrics = await mlPatternRecognition.getModelMetrics(modelName);
    
    res.json({
      success: true,
      model: modelName,
      metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to fetch model metrics', { 
      model: req.params.modelName, 
      error: error.message 
    });
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Model not found',
        details: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch model metrics',
        details: error.message
      });
    }
  }
});

/**
 * POST /api/predictions/predict
 * Make predictions using trained ML models
 */
router.post('/predict', validateRequest(PredictionRequestSchema), async (req: express.Request, res: express.Response) => {
  try {
    const { model, features, options = {} } = req.body;
    
    logger.info('Making ML prediction', { 
      model, 
      features_count: features.length,
      options 
    });
    
    const startTime = Date.now();
    const prediction = await mlPatternRecognition.predict(model, features, options);
    const totalTime = Date.now() - startTime;
    
    logger.info('Prediction completed', {
      model,
      total_time_ms: totalTime,
      confidence: prediction.confidence
    });
    
    res.json({
      success: true,
      prediction: prediction.prediction,
      confidence: prediction.confidence,
      model_used: prediction.model_used,
      processing_time_ms: prediction.processing_time_ms,
      total_request_time_ms: totalTime,
      metadata: prediction.metadata,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Prediction failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: 'Prediction failed',
      details: error.message
    });
  }
});

/**
 * POST /api/predictions/batch-predict
 * Make multiple predictions in a single request
 */
router.post('/batch-predict', async (req: express.Request, res: express.Response) => {
  try {
    const { predictions } = req.body;
    
    if (!Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid batch prediction request',
        details: 'predictions array is required and must not be empty'
      });
    }
    
    if (predictions.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Batch size too large',
        details: 'Maximum 50 predictions per batch request'
      });
    }
    
    logger.info('Processing batch predictions', { batch_size: predictions.length });
    
    const startTime = Date.now();
    const results = [];
    
    for (let i = 0; i < predictions.length; i++) {
      const request = predictions[i];
      
      try {
        // Validate individual request
        PredictionRequestSchema.parse(request);
        
        const prediction = await mlPatternRecognition.predict(
          request.model, 
          request.features, 
          request.options || {}
        );
        
        results.push({
          index: i,
          success: true,
          prediction: prediction.prediction,
          confidence: prediction.confidence,
          model_used: prediction.model_used,
          processing_time_ms: prediction.processing_time_ms,
          metadata: prediction.metadata
        });
        
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error.message,
          request: request
        });
      }
    }
    
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    
    logger.info('Batch predictions completed', {
      batch_size: predictions.length,
      successful: successCount,
      failed: predictions.length - successCount,
      total_time_ms: totalTime
    });
    
    res.json({
      success: true,
      batch_size: predictions.length,
      successful_predictions: successCount,
      failed_predictions: predictions.length - successCount,
      results,
      total_processing_time_ms: totalTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Batch prediction failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Batch prediction failed',
      details: error.message
    });
  }
});

/**
 * POST /api/predictions/analyze-patterns
 * Analyze patterns in historical data
 */
router.post('/analyze-patterns', validateRequest(PatternAnalysisRequestSchema), async (req: express.Request, res: express.Response) => {
  try {
    const { data, options = {} } = req.body;
    
    logger.info('Analyzing patterns', { 
      data_points: data.length,
      date_range: [data[0]?.timestamp, data[data.length - 1]?.timestamp],
      options 
    });
    
    // Convert timestamp strings to Date objects
    const processedData = data.map(point => ({
      ...point,
      timestamp: new Date(point.timestamp)
    }));
    
    const startTime = Date.now();
    const analysis = await mlPatternRecognition.analyzePatterns(processedData, options);
    const processingTime = Date.now() - startTime;
    
    logger.info('Pattern analysis completed', {
      patterns_detected: analysis.patterns_detected.length,
      anomalies_found: analysis.anomalies.length,
      processing_time_ms: processingTime
    });
    
    res.json({
      success: true,
      analysis,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Pattern analysis failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Pattern analysis failed',
      details: error.message
    });
  }
});

/**
 * POST /api/predictions/train
 * Train or retrain ML models with new data
 */
router.post('/train', validateRequest(TrainingRequestSchema), async (req: express.Request, res: express.Response) => {
  try {
    const { model, features, labels, validation_split = 0.2, metadata } = req.body;
    
    logger.info('Starting model training', { 
      model, 
      samples: features.length,
      features_per_sample: features[0]?.length || 0,
      validation_split 
    });
    
    const trainingData = {
      features,
      labels,
      metadata: metadata || {
        date_range: [new Date().toISOString(), new Date().toISOString()],
        data_points: features.length
      }
    };
    
    const startTime = Date.now();
    const result = await mlPatternRecognition.trainModel(model, trainingData, validation_split);
    const totalTime = Date.now() - startTime;
    
    logger.info('Model training completed', {
      model,
      accuracy: result.metrics.accuracy,
      total_time_ms: totalTime
    });
    
    res.json({
      success: result.success,
      model,
      metrics: result.metrics,
      model_info: result.model_info,
      total_training_time_ms: totalTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Model training failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: 'Model training failed',
      details: error.message
    });
  }
});

/**
 * GET /api/predictions/drift/:modelName
 * Check for model drift and get retraining recommendations
 */
router.get('/drift/:modelName', async (req: express.Request, res: express.Response) => {
  try {
    const { modelName } = req.params;
    const threshold = parseFloat(req.query.threshold as string) || 0.1;
    
    logger.info('Checking model drift', { model: modelName, threshold });
    
    // In a real implementation, you'd pass recent data to check drift
    // For now, we'll use sample data
    const sampleData = Array.from({ length: 100 }, () => 
      Array.from({ length: 5 }, () => Math.random())
    );
    
    const driftAnalysis = await mlPatternRecognition.detectDrift(modelName, sampleData, threshold);
    
    logger.info('Drift analysis completed', {
      model: modelName,
      drift_detected: driftAnalysis.drift_detected,
      drift_score: driftAnalysis.drift_score
    });
    
    res.json({
      success: true,
      model: modelName,
      drift_analysis: driftAnalysis,
      threshold_used: threshold,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Drift detection failed', { 
      model: req.params.modelName, 
      error: error.message 
    });
    
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: 'Model not found',
        details: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Drift detection failed',
        details: error.message
      });
    }
  }
});

/**
 * GET /api/predictions/health
 * Health check endpoint for ML service
 */
router.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    const models = await mlPatternRecognition.getModelMetrics();
    const modelCount = Object.keys(models).length;
    
    const health = {
      status: 'healthy',
      service: 'ML Pattern Recognition',
      models_available: modelCount,
      timestamp: new Date().toISOString(),
      uptime_ms: process.uptime() * 1000
    };
    
    res.json({
      success: true,
      health
    });
    
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware for ML routes
router.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('ML API error', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack
  });
  
  res.status(500).json({
    success: false,
    error: 'Internal server error in ML service',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Contact support if this persists'
  });
});

export default router;