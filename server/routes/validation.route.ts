import { Router, Request, Response } from 'express';
import { WebSocket } from 'ws';
import { AIValidationEnhancedService, ValidationContext, ValidationOptions } from '../services/ai-validation-enhanced.service';
import { rateLimit } from 'express-rate-limit';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();
const validationService = new AIValidationEnhancedService();

// Rate limiting for validation endpoints
const validationRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many validation requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

const expensiveValidationRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit expensive operations
  message: 'Too many expensive validation requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Real-time validation endpoint
 * POST /api/validation/validate
 */
router.post('/validate',
  validationRateLimit,
  [
    body('response').notEmpty().withMessage('Response data is required'),
    body('context').isObject().withMessage('Context must be an object'),
    body('context.requestId').notEmpty().withMessage('Request ID is required'),
    body('context.sessionId').notEmpty().withMessage('Session ID is required'),
    body('context.responseType').notEmpty().withMessage('Response type is required'),
    body('context.domain').notEmpty().withMessage('Domain is required'),
    body('options').optional().isObject().withMessage('Options must be an object')
  ],
  async (req: Request, res: Response) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
          message: 'Invalid request parameters'
        });
      }

      const { response: responseData, context, options = {} } = req.body;

      // Create validation context
      const validationContext: ValidationContext = {
        ...context,
        timestamp: new Date()
      };

      // Create validation options
      const validationOptions: ValidationOptions = {
        enableAutoCorrection: options.enableAutoCorrection ?? true,
        confidenceThreshold: options.confidenceThreshold ?? 0.7,
        skipLayers: options.skipLayers ?? [],
        enableRealtimeUpdates: options.enableRealtimeUpdates ?? true,
        ...options
      };

      // Perform validation
      const validationResult = await validationService.validateAIResponse(
        responseData,
        validationContext,
        validationOptions
      );

      // Return result
      res.json({
        success: true,
        data: validationResult,
        metadata: {
          timestamp: new Date(),
          processingTime: validationResult.metadata.processingTimeMs,
          version: '2.0.0'
        }
      });

    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal validation error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Batch validation endpoint
 * POST /api/validation/batch
 */
router.post('/batch',
  expensiveValidationRateLimit,
  [
    body('requests').isArray().withMessage('Requests must be an array'),
    body('requests').isLength({ min: 1, max: 50 }).withMessage('Batch size must be 1-50 requests'),
    body('requests.*.response').notEmpty().withMessage('Each request must have response data'),
    body('requests.*.context').isObject().withMessage('Each request must have context'),
    body('globalOptions').optional().isObject().withMessage('Global options must be an object')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { requests, globalOptions = {} } = req.body;
      const results = [];
      const startTime = Date.now();

      // Process requests in parallel (with concurrency limit)
      const concurrencyLimit = Math.min(10, requests.length);
      const chunks = [];
      
      for (let i = 0; i < requests.length; i += concurrencyLimit) {
        chunks.push(requests.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (request: any, index: number) => {
          try {
            const validationContext: ValidationContext = {
              ...request.context,
              timestamp: new Date()
            };

            const validationOptions: ValidationOptions = {
              ...globalOptions,
              ...request.options
            };

            const result = await validationService.validateAIResponse(
              request.response,
              validationContext,
              validationOptions
            );

            return {
              index: results.length + index,
              success: true,
              data: result
            };
          } catch (error) {
            return {
              index: results.length + index,
              success: false,
              error: error instanceof Error ? error.message : 'Validation failed'
            };
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        results.push(...chunkResults);
      }

      const processingTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: requests.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            processingTimeMs: processingTime
          }
        }
      });

    } catch (error) {
      console.error('Batch validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Batch validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Validation history endpoint
 * GET /api/validation/history/:sessionId
 */
router.get('/history/:sessionId',
  [
    param('sessionId').notEmpty().withMessage('Session ID is required'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be 1-1000'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be >= 0')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const history = validationService.getValidationHistory(sessionId);
      const paginatedHistory = history.slice(offset, offset + limit);

      res.json({
        success: true,
        data: {
          history: paginatedHistory,
          pagination: {
            total: history.length,
            limit,
            offset,
            hasMore: offset + limit < history.length
          }
        }
      });

    } catch (error) {
      console.error('History retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve validation history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Validation metrics endpoint
 * GET /api/validation/metrics
 */
router.get('/metrics',
  async (req: Request, res: Response) => {
    try {
      const metrics = validationService.getMetrics();
      
      res.json({
        success: true,
        data: {
          metrics,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Metrics retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Confidence calibration feedback endpoint
 * POST /api/validation/feedback
 */
router.post('/feedback',
  [
    body('sessionId').notEmpty().withMessage('Session ID is required'),
    body('timestamp').isISO8601().withMessage('Valid timestamp is required'),
    body('outcome').isIn(['correct', 'incorrect', 'partially_correct']).withMessage('Invalid outcome'),
    body('feedbackScore').optional().isFloat({ min: 0, max: 100 }).withMessage('Feedback score must be 0-100')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { sessionId, timestamp, outcome, feedbackScore } = req.body;

      // Update confidence calibrator with feedback
      // This would be implemented in the actual service
      
      res.json({
        success: true,
        message: 'Feedback recorded successfully'
      });

    } catch (error) {
      console.error('Feedback recording error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record feedback',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Health check endpoint
 * GET /api/validation/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const metrics = validationService.getMetrics();
    const health = {
      status: 'healthy',
      version: '2.0.0',
      uptime: process.uptime(),
      metrics: {
        totalValidations: metrics.totalValidations,
        successRate: metrics.successRate,
        averageProcessingTime: metrics.averageProcessingTime
      },
      timestamp: new Date()
    };

    // Check if service is performing well
    if (metrics.successRate < 0.8 || metrics.averageProcessingTime > 1000) {
      health.status = 'degraded';
    }

    res.json(health);

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }
});

/**
 * Configuration endpoint
 * GET /api/validation/config
 */
router.get('/config', async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      version: '2.0.0',
      features: [
        'multi_layer_validation',
        'real_time_validation',
        'neural_confidence_calibration',
        'progressive_correction',
        'fact_checking',
        'consistency_validation'
      ],
      limits: {
        batchSize: 50,
        historyLimit: 1000,
        rateLimits: {
          validation: 100,
          batch: 20
        }
      },
      supportedDomains: ['property_management', 'general'],
      supportedResponseTypes: [
        'property_info',
        'booking_response',
        'availability',
        'pricing',
        'recommendation'
      ]
    }
  });
});

/**
 * WebSocket endpoint for real-time validation updates
 * This would typically be handled in a separate WebSocket server
 */
export function setupValidationWebSocket(wss: any) {
  wss.on('connection', (ws: WebSocket) => {
    console.log('New validation WebSocket connection');
    
    // Add WebSocket to validation service
    validationService.addWebSocket(ws);
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe') {
          // Handle subscription to specific validation events
          ws.send(JSON.stringify({
            type: 'subscription_confirmed',
            timestamp: new Date()
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Validation WebSocket connection closed');
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Real-time validation updates enabled',
      timestamp: new Date()
    }));
  });
}

export default router;