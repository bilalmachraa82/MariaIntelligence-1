/**
 * ML Pattern Recognition Service Tests
 * Comprehensive test suite for machine learning models and predictions
 */

import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mlPatternRecognition } from '../server/services/ml-pattern-recognition.service.js';
import { modelValidation } from '../server/utils/model-validation.utils.js';
import mlPredictionsRouter from '../server/routes/predictions.route.js';
import { describeIf, FULL_STACK_ENABLED, logSkip } from './utils/testFlags';

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/predictions', mlPredictionsRouter);

describe('ML Pattern Recognition Service', () => {
  beforeAll(async () => {
    // Initialize test environment
    vi.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup after tests
    vi.restoreAllMocks();
  });

  describe('Model Training', () => {
    test('should train revenue forecasting model successfully', async () => {
      const trainingData = {
        features: [
          [0.75, 1.2, 1.0, 120, 4.5, 5, 6],
          [0.80, 1.1, 1.2, 110, 4.3, 6, 6],
          [0.65, 0.9, 0.8, 130, 4.7, 0, 7]
        ],
        labels: [150, 140, 120],
        metadata: {
          date_range: [new Date('2024-01-01'), new Date('2024-12-31')],
          data_points: 3
        }
      };

      const result = await mlPatternRecognition.trainModel('revenue_forecast', trainingData);
      
      expect(result.success).toBe(true);
      expect(result.metrics.accuracy).toBeGreaterThan(0.5);
      expect(result.metrics.training_time_ms).toBeGreaterThan(0);
      expect(result.model_info.features_count).toBe(7);
      expect(result.model_info.samples_count).toBe(3);
    }, 10000);

    test('should train occupancy optimization model successfully', async () => {
      const trainingData = {
        features: [
          [150, 8.5, 200, 4.2, 0.3, 0.8, 14],
          [120, 7.0, 150, 4.0, 0.5, 0.6, 7],
          [200, 9.0, 300, 4.8, 0.2, 0.9, 21]
        ],
        labels: [0.85, 0.70, 0.95],
        metadata: {
          date_range: [new Date('2024-01-01'), new Date('2024-12-31')],
          data_points: 3
        }
      };

      const result = await mlPatternRecognition.trainModel('occupancy_optimization', trainingData);
      
      expect(result.success).toBe(true);
      expect(result.metrics.accuracy).toBeGreaterThan(0.5);
      expect(result.model_info.features_count).toBe(7);
    }, 10000);

    test('should handle training with insufficient data', async () => {
      const trainingData = {
        features: [[1, 2, 3]],
        labels: [100],
        metadata: {
          date_range: [new Date(), new Date()],
          data_points: 1
        }
      };

      const result = await mlPatternRecognition.trainModel('revenue_forecast', trainingData);
      expect(result.success).toBe(true); // Service handles small datasets gracefully
    });

    test('should reject invalid model name', async () => {
      const trainingData = {
        features: [[1, 2, 3]],
        labels: [100],
        metadata: {
          date_range: [new Date(), new Date()],
          data_points: 1
        }
      };

      await expect(mlPatternRecognition.trainModel('invalid_model', trainingData))
        .rejects.toThrow('not found');
    });
  });

  describe('Model Predictions', () => {
    test('should make revenue forecast prediction', async () => {
      const features = [0.75, 1.2, 1.0, 120, 4.5, 5, 6];
      const result = await mlPatternRecognition.predict('revenue_forecast', features, {
        return_confidence: true,
        explain_prediction: true
      });

      expect(result.prediction).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.model_used).toBe('revenue_forecast');
      expect(result.processing_time_ms).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.feature_importance).toBeDefined();
    });

    test('should make occupancy optimization prediction', async () => {
      const features = [150, 8.5, 200, 4.2, 0.3, 0.8, 14];
      const result = await mlPatternRecognition.predict('occupancy_optimization', features);

      expect(result.prediction).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.model_used).toBe('occupancy_optimization');
    });

    test('should make maintenance prediction', async () => {
      const features = [36, 4000, 5, 0.7, 0.85, 3, 0.6];
      const result = await mlPatternRecognition.predict('maintenance_prediction', features);

      expect(result.prediction).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.model_used).toBe('maintenance_prediction');
    });

    test('should make guest behavior prediction', async () => {
      const features = [5, 0.6, 7, 1, 0.7, 2, 2];
      const result = await mlPatternRecognition.predict('guest_behavior', features);

      expect(result.prediction).toBeDefined();
      expect(typeof result.prediction).toBe('number');
      expect(result.prediction).toBeGreaterThanOrEqual(0);
      expect(result.prediction).toBeLessThan(6); // 6 clusters
    });

    test('should make demand pattern prediction', async () => {
      const features = [250, 100, 1.5, 0.8, 0.2, 0.4, 0.1];
      const result = await mlPatternRecognition.predict('demand_patterns', features);

      expect(result.prediction).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.model_used).toBe('demand_patterns');
    });

    test('should handle prediction with invalid model', async () => {
      await expect(mlPatternRecognition.predict('invalid_model', [1, 2, 3]))
        .rejects.toThrow('not found');
    });

    test('should handle prediction with empty features', async () => {
      await expect(mlPatternRecognition.predict('revenue_forecast', []))
        .rejects.toThrow();
    });
  });

  describe('Pattern Analysis', () => {
    test('should analyze patterns in time series data', async () => {
      const data = [
        { timestamp: new Date('2024-01-01'), value: 100 },
        { timestamp: new Date('2024-01-02'), value: 110 },
        { timestamp: new Date('2024-01-03'), value: 95 },
        { timestamp: new Date('2024-01-04'), value: 120 },
        { timestamp: new Date('2024-01-05'), value: 105 },
        { timestamp: new Date('2024-01-06'), value: 130 },
        { timestamp: new Date('2024-01-07'), value: 125 },
        { timestamp: new Date('2024-01-08'), value: 200 } // Outlier
      ];

      const result = await mlPatternRecognition.analyzePatterns(data, {
        detect_anomalies: true,
        seasonal_analysis: true,
        trend_analysis: true
      });

      expect(result.patterns_detected).toContain('weekly_seasonality');
      expect(result.seasonality).toBeDefined();
      expect(result.seasonality.weekly).toHaveLength(7);
      expect(result.trends).toBeDefined();
      expect(['increasing', 'decreasing', 'stable']).toContain(result.trends.direction);
      expect(result.anomalies).toBeDefined();
      expect(result.anomalies.length).toBeGreaterThan(0); // Should detect outlier
    });

    test('should handle small datasets gracefully', async () => {
      const data = [
        { timestamp: new Date('2024-01-01'), value: 100 },
        { timestamp: new Date('2024-01-02'), value: 110 }
      ];

      const result = await mlPatternRecognition.analyzePatterns(data);
      
      expect(result.patterns_detected).toBeDefined();
      expect(result.seasonality).toBeDefined();
      expect(result.trends).toBeDefined();
    });

    test('should analyze trends correctly', async () => {
      // Generate increasing trend data
      const increasingData = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        value: 100 + i * 10
      }));

      const result = await mlPatternRecognition.analyzePatterns(increasingData, {
        trend_analysis: true
      });

      expect(result.trends.direction).toBe('increasing');
      expect(result.trends.strength).toBeGreaterThan(0);
      expect(result.trends.r_squared).toBeGreaterThan(0.8); // Strong linear relationship
    });
  });

  describe('Model Metrics and Health', () => {
    test('should retrieve model metrics', async () => {
      const metrics = await mlPatternRecognition.getModelMetrics('revenue_forecast');
      
      expect(metrics).toBeDefined();
      // Metrics structure will depend on whether model is trained
    });

    test('should retrieve all model metrics', async () => {
      const allMetrics = await mlPatternRecognition.getModelMetrics();
      
      expect(allMetrics).toBeDefined();
      expect(typeof allMetrics).toBe('object');
    });

    test('should detect model drift', async () => {
      const newData = Array.from({ length: 50 }, () => 
        Array.from({ length: 5 }, () => Math.random())
      );

      const driftResult = await mlPatternRecognition.detectDrift('revenue_forecast', newData);
      
      expect(driftResult).toBeDefined();
      expect(typeof driftResult.drift_detected).toBe('boolean');
      expect(driftResult.drift_score).toBeGreaterThanOrEqual(0);
      expect(driftResult.drift_score).toBeLessThanOrEqual(1);
      expect(driftResult.recommendation).toBeDefined();
      expect(typeof driftResult.retrain_recommended).toBe('boolean');
    });

    test('should handle drift detection for invalid model', async () => {
      const newData = [[1, 2, 3]];
      
      await expect(mlPatternRecognition.detectDrift('invalid_model', newData))
        .rejects.toThrow('not found');
    });
  });
});

describe('Model Validation Utils', () => {
  test('should perform comprehensive model validation', async () => {
    const results = await modelValidation.validateModel('revenue_forecast', {
      accuracy_test: true,
      performance_test: true,
      stability_test: true
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    
    results.forEach(result => {
      expect(result.model_name).toBe('revenue_forecast');
      expect(result.validation_type).toBeDefined();
      expect(typeof result.passed).toBe('boolean');
      expect(result.timestamp).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  test('should perform cross-validation', async () => {
    const result = await modelValidation.performCrossValidation('revenue_forecast', 3);
    
    expect(result.fold_scores).toHaveLength(3);
    expect(result.mean_score).toBeGreaterThan(0);
    expect(result.std_deviation).toBeGreaterThanOrEqual(0);
    expect(result.confidence_interval).toHaveLength(2);
    expect(result.stability_score).toBeGreaterThanOrEqual(0);
    expect(result.stability_score).toBeLessThanOrEqual(1);
  });

  test('should check model health', async () => {
    const health = await modelValidation.checkModelHealth('revenue_forecast');
    
    expect(health.model_name).toBe('revenue_forecast');
    expect(typeof health.is_healthy).toBe('boolean');
    expect(health.health_score).toBeGreaterThanOrEqual(0);
    expect(health.health_score).toBeLessThanOrEqual(1);
    expect(Array.isArray(health.issues)).toBe(true);
    expect(health.performance_metrics).toBeDefined();
    expect(Array.isArray(health.recommendations)).toBe(true);
  });

  test('should export validation report', async () => {
    const reportPath = await modelValidation.exportValidationReport('revenue_forecast');
    
    expect(reportPath).toBeDefined();
    expect(typeof reportPath).toBe('string');
    expect(reportPath).toMatch(/\.json$/);
  });
});

const describeFullStack = describeIf(FULL_STACK_ENABLED);

if (!FULL_STACK_ENABLED) {
  logSkip('Skipping ML Predictions API tests (ENABLE_FULL_STACK_TESTS=true to enable)');
}

describeFullStack('ML Predictions API', () => {
  test('GET /api/predictions/models - should return available models', async () => {
    const response = await request(app)
      .get('/api/predictions/models')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.models).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });

  test('GET /api/predictions/models/:modelName - should return model metrics', async () => {
    const response = await request(app)
      .get('/api/predictions/models/revenue_forecast')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.model).toBe('revenue_forecast');
    expect(response.body.metrics).toBeDefined();
  });

  test('POST /api/predictions/predict - should make prediction', async () => {
    const response = await request(app)
      .post('/api/predictions/predict')
      .send({
        model: 'revenue_forecast',
        features: [0.75, 1.2, 1.0, 120, 4.5, 5, 6],
        options: {
          return_confidence: true,
          explain_prediction: true
        }
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.prediction).toBeDefined();
    expect(response.body.confidence).toBeGreaterThan(0);
    expect(response.body.model_used).toBe('revenue_forecast');
    expect(response.body.processing_time_ms).toBeGreaterThan(0);
  });

  test('POST /api/predictions/predict - should validate request data', async () => {
    const response = await request(app)
      .post('/api/predictions/predict')
      .send({
        model: 'invalid_model',
        features: []
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  test('POST /api/predictions/batch-predict - should handle batch predictions', async () => {
    const response = await request(app)
      .post('/api/predictions/batch-predict')
      .send({
        predictions: [
          {
            model: 'revenue_forecast',
            features: [0.75, 1.2, 1.0, 120, 4.5, 5, 6]
          },
          {
            model: 'occupancy_optimization',
            features: [150, 8.5, 200, 4.2, 0.3, 0.8, 14]
          }
        ]
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.batch_size).toBe(2);
    expect(response.body.results).toHaveLength(2);
    expect(response.body.successful_predictions).toBeGreaterThan(0);
  });

  test('POST /api/predictions/analyze-patterns - should analyze patterns', async () => {
    const response = await request(app)
      .post('/api/predictions/analyze-patterns')
      .send({
        data: [
          { timestamp: '2024-01-01T00:00:00Z', value: 100 },
          { timestamp: '2024-01-02T00:00:00Z', value: 110 },
          { timestamp: '2024-01-03T00:00:00Z', value: 95 },
          { timestamp: '2024-01-04T00:00:00Z', value: 120 }
        ],
        options: {
          detect_anomalies: true,
          seasonal_analysis: true,
          trend_analysis: true
        }
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.analysis).toBeDefined();
    expect(response.body.analysis.patterns_detected).toBeDefined();
    expect(response.body.analysis.trends).toBeDefined();
  });

  test('GET /api/predictions/drift/:modelName - should check drift', async () => {
    const response = await request(app)
      .get('/api/predictions/drift/revenue_forecast')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.model).toBe('revenue_forecast');
    expect(response.body.drift_analysis).toBeDefined();
    expect(typeof response.body.drift_analysis.drift_detected).toBe('boolean');
  });

  test('GET /api/predictions/health - should return health status', async () => {
    const response = await request(app)
      .get('/api/predictions/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.health).toBeDefined();
    expect(response.body.health.status).toBe('healthy');
    expect(response.body.health.models_available).toBeGreaterThan(0);
  });

  test('should handle rate limiting', async () => {
    // Make multiple requests rapidly to test rate limiting
    const promises = Array.from({ length: 15 }, () => 
      request(app).get('/api/predictions/health')
    );

    const responses = await Promise.all(promises);
    
    // At least one response should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  }, 15000);
});

describe('Performance Tests', () => {
  test('prediction should complete within 2 seconds', async () => {
    const startTime = Date.now();
    
    await mlPatternRecognition.predict('revenue_forecast', [0.75, 1.2, 1.0, 120, 4.5, 5, 6]);
    
    const processingTime = Date.now() - startTime;
    expect(processingTime).toBeLessThan(2000);
  });

  test('batch predictions should be efficient', async () => {
    const startTime = Date.now();
    
    const promises = Array.from({ length: 5 }, () =>
      mlPatternRecognition.predict('revenue_forecast', [0.75, 1.2, 1.0, 120, 4.5, 5, 6])
    );
    
    await Promise.all(promises);
    
    const totalTime = Date.now() - startTime;
    const avgTimePerPrediction = totalTime / 5;
    
    expect(avgTimePerPrediction).toBeLessThan(2000);
  });

  test('pattern analysis should handle large datasets efficiently', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
      value: 100 + Math.sin(i / 10) * 20 + Math.random() * 10
    }));

    const startTime = Date.now();
    
    const result = await mlPatternRecognition.analyzePatterns(largeDataset, {
      detect_anomalies: true,
      seasonal_analysis: true,
      trend_analysis: true
    });

    const processingTime = Date.now() - startTime;
    
    expect(result).toBeDefined();
    expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
  });
});
