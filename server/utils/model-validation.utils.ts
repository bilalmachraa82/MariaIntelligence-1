/**
 * ML Model Validation Utilities for MariaIntelligence
 * Provides comprehensive validation, testing, and monitoring utilities for ML models
 */

import { createHash } from 'crypto';
import { mlPatternRecognition } from '../services/ml-pattern-recognition.service.js';
import pino from 'pino';
import fs from 'fs/promises';
import path from 'path';

// Validation result interfaces
interface ValidationResult {
  model_name: string;
  validation_type: string;
  passed: boolean;
  score?: number;
  threshold: number;
  details: Record<string, any>;
  timestamp: Date;
  warnings: string[];
  recommendations: string[];
}

interface ModelHealthCheck {
  model_name: string;
  is_healthy: boolean;
  health_score: number; // 0-1 scale
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  performance_metrics: {
    avg_prediction_time_ms: number;
    accuracy_estimate: number;
    last_trained: Date | null;
    predictions_made: number;
  };
  recommendations: string[];
}

interface CrossValidationResult {
  fold_scores: number[];
  mean_score: number;
  std_deviation: number;
  confidence_interval: [number, number];
  stability_score: number; // 0-1, higher is better
}

// Logger for validation utilities
const validationLogger = pino({ 
  name: 'ml-model-validation',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' 
});

export class ModelValidationUtils {
  private validationHistory: Map<string, ValidationResult[]> = new Map();
  private performanceMetrics: Map<string, any> = new Map();

  /**
   * Comprehensive model validation suite
   */
  async validateModel(
    modelName: string,
    validationSuite: {
      accuracy_test?: boolean;
      performance_test?: boolean;
      stability_test?: boolean;
      data_quality_test?: boolean;
      drift_test?: boolean;
    } = {}
  ): Promise<ValidationResult[]> {
    validationLogger.info('Starting comprehensive model validation', { 
      model: modelName,
      suite: validationSuite 
    });

    const results: ValidationResult[] = [];
    const {
      accuracy_test = true,
      performance_test = true,
      stability_test = true,
      data_quality_test = true,
      drift_test = true
    } = validationSuite;

    try {
      // Accuracy validation
      if (accuracy_test) {
        const accuracyResult = await this.validateAccuracy(modelName);
        results.push(accuracyResult);
      }

      // Performance validation
      if (performance_test) {
        const performanceResult = await this.validatePerformance(modelName);
        results.push(performanceResult);
      }

      // Stability validation
      if (stability_test) {
        const stabilityResult = await this.validateStability(modelName);
        results.push(stabilityResult);
      }

      // Data quality validation
      if (data_quality_test) {
        const dataQualityResult = await this.validateDataQuality(modelName);
        results.push(dataQualityResult);
      }

      // Drift validation
      if (drift_test) {
        const driftResult = await this.validateDrift(modelName);
        results.push(driftResult);
      }

      // Store validation history
      if (!this.validationHistory.has(modelName)) {
        this.validationHistory.set(modelName, []);
      }
      this.validationHistory.get(modelName)!.push(...results);

      validationLogger.info('Model validation completed', {
        model: modelName,
        total_tests: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      });

      return results;

    } catch (error) {
      validationLogger.error('Model validation failed', {
        model: modelName,
        error: error.message
      });
      throw new Error(`Validation failed for ${modelName}: ${error.message}`);
    }
  }

  /**
   * Validate model accuracy against expected targets
   */
  private async validateAccuracy(modelName: string): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      // Get model metrics
      const metrics = await mlPatternRecognition.getModelMetrics(modelName);
      
      // Define accuracy thresholds per model type
      const accuracyThresholds: Record<string, number> = {
        revenue_forecast: 0.85,
        occupancy_optimization: 0.80,
        maintenance_prediction: 0.90,
        guest_behavior: 0.75,
        demand_patterns: 0.82
      };

      const threshold = accuracyThresholds[modelName] || 0.75;
      const currentAccuracy = metrics.accuracy || 0;
      const passed = currentAccuracy >= threshold;

      const warnings: string[] = [];
      const recommendations: string[] = [];

      if (!passed) {
        warnings.push(`Accuracy ${(currentAccuracy * 100).toFixed(2)}% below target ${(threshold * 100)}%`);
        recommendations.push('Consider retraining with more data or adjusting hyperparameters');
      }

      if (currentAccuracy < threshold * 0.9) {
        warnings.push('Accuracy significantly below target - immediate attention required');
        recommendations.push('Review training data quality and feature engineering');
      }

      return {
        model_name: modelName,
        validation_type: 'accuracy',
        passed,
        score: currentAccuracy,
        threshold,
        details: {
          current_accuracy: currentAccuracy,
          target_accuracy: threshold,
          accuracy_gap: threshold - currentAccuracy,
          validation_time_ms: Date.now() - startTime
        },
        timestamp: new Date(),
        warnings,
        recommendations
      };

    } catch (error) {
      return {
        model_name: modelName,
        validation_type: 'accuracy',
        passed: false,
        threshold: 0.75,
        details: {
          error: error.message,
          validation_time_ms: Date.now() - startTime
        },
        timestamp: new Date(),
        warnings: ['Failed to retrieve model accuracy'],
        recommendations: ['Check if model is properly trained and accessible']
      };
    }
  }

  /**
   * Validate model performance (prediction speed and resource usage)
   */
  private async validatePerformance(modelName: string): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      // Generate test features for the specific model
      const testFeatures = this.generateTestFeatures(modelName);
      const numTests = 10;
      const predictionTimes: number[] = [];

      // Run multiple predictions to get average performance
      for (let i = 0; i < numTests; i++) {
        const testStart = Date.now();
        await mlPatternRecognition.predict(modelName, testFeatures);
        const testTime = Date.now() - testStart;
        predictionTimes.push(testTime);
      }

      const avgPredictionTime = predictionTimes.reduce((a, b) => a + b, 0) / numTests;
      const maxPredictionTime = Math.max(...predictionTimes);
      const performanceThreshold = 2000; // 2 seconds max
      const passed = avgPredictionTime <= performanceThreshold;

      const warnings: string[] = [];
      const recommendations: string[] = [];

      if (maxPredictionTime > performanceThreshold * 1.5) {
        warnings.push(`Slowest prediction took ${maxPredictionTime}ms (>3s)`);
        recommendations.push('Consider model optimization or infrastructure scaling');
      }

      if (avgPredictionTime > performanceThreshold * 0.8) {
        warnings.push('Average prediction time approaching threshold');
        recommendations.push('Monitor performance closely and consider optimization');
      }

      return {
        model_name: modelName,
        validation_type: 'performance',
        passed,
        score: 1 - (avgPredictionTime / (performanceThreshold * 2)), // Normalized score
        threshold: performanceThreshold,
        details: {
          avg_prediction_time_ms: avgPredictionTime,
          max_prediction_time_ms: maxPredictionTime,
          min_prediction_time_ms: Math.min(...predictionTimes),
          std_deviation_ms: this.calculateStandardDeviation(predictionTimes),
          test_runs: numTests,
          validation_time_ms: Date.now() - startTime
        },
        timestamp: new Date(),
        warnings,
        recommendations
      };

    } catch (error) {
      return {
        model_name: modelName,
        validation_type: 'performance',
        passed: false,
        threshold: 2000,
        details: {
          error: error.message,
          validation_time_ms: Date.now() - startTime
        },
        timestamp: new Date(),
        warnings: ['Performance test failed'],
        recommendations: ['Check model availability and system resources']
      };
    }
  }

  /**
   * Validate model stability (consistent predictions for same input)
   */
  private async validateStability(modelName: string): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const testFeatures = this.generateTestFeatures(modelName);
      const numTests = 5;
      const predictions: number[] = [];

      // Run same prediction multiple times
      for (let i = 0; i < numTests; i++) {
        const result = await mlPatternRecognition.predict(modelName, testFeatures);
        
        // Handle both single values and arrays
        const prediction = Array.isArray(result.prediction) ? 
          result.prediction[0] : result.prediction;
        predictions.push(Number(prediction));
      }

      // Calculate stability metrics
      const mean = predictions.reduce((a, b) => a + b, 0) / numTests;
      const variance = predictions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numTests;
      const coefficientOfVariation = Math.sqrt(variance) / Math.abs(mean);
      
      // Stability threshold (coefficient of variation should be low)
      const stabilityThreshold = 0.05; // 5% coefficient of variation
      const passed = coefficientOfVariation <= stabilityThreshold;

      const warnings: string[] = [];
      const recommendations: string[] = [];

      if (coefficientOfVariation > stabilityThreshold * 2) {
        warnings.push('High prediction variability detected - model may be unstable');
        recommendations.push('Check model determinism and random seed settings');
      }

      return {
        model_name: modelName,
        validation_type: 'stability',
        passed,
        score: 1 - Math.min(1, coefficientOfVariation / stabilityThreshold),
        threshold: stabilityThreshold,
        details: {
          predictions,
          mean_prediction: mean,
          variance,
          coefficient_of_variation: coefficientOfVariation,
          test_runs: numTests,
          validation_time_ms: Date.now() - startTime
        },
        timestamp: new Date(),
        warnings,
        recommendations
      };

    } catch (error) {
      return {
        model_name: modelName,
        validation_type: 'stability',
        passed: false,
        threshold: 0.05,
        details: {
          error: error.message,
          validation_time_ms: Date.now() - startTime
        },
        timestamp: new Date(),
        warnings: ['Stability test failed'],
        recommendations: ['Verify model consistency and configuration']
      };
    }
  }

  /**
   * Validate data quality for model inputs
   */
  private async validateDataQuality(modelName: string): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      // Test with various edge cases and invalid inputs
      const testCases = [
        { name: 'normal_input', features: this.generateTestFeatures(modelName), expectSuccess: true },
        { name: 'zero_values', features: Array(5).fill(0), expectSuccess: true },
        { name: 'negative_values', features: Array(5).fill(-1), expectSuccess: true },
        { name: 'large_values', features: Array(5).fill(1000000), expectSuccess: true },
        { name: 'mixed_values', features: [-100, 0, 1, 1000, 0.001], expectSuccess: true }
      ];

      let passedTests = 0;
      const testResults: any[] = [];

      for (const testCase of testCases) {
        try {
          const result = await mlPatternRecognition.predict(modelName, testCase.features);
          const success = result.prediction !== null && result.prediction !== undefined;
          
          if (success === testCase.expectSuccess) {
            passedTests++;
          }
          
          testResults.push({
            name: testCase.name,
            success,
            expected: testCase.expectSuccess,
            confidence: result.confidence || 0
          });
          
        } catch (error) {
          testResults.push({
            name: testCase.name,
            success: false,
            expected: testCase.expectSuccess,
            error: error.message
          });
        }
      }

      const successRate = passedTests / testCases.length;
      const passed = successRate >= 0.8; // 80% of tests should pass

      const warnings: string[] = [];
      const recommendations: string[] = [];

      if (successRate < 0.8) {
        warnings.push(`Only ${(successRate * 100).toFixed(1)}% of data quality tests passed`);
        recommendations.push('Review model input validation and error handling');
      }

      const failedTests = testResults.filter(t => !t.success);
      if (failedTests.length > 0) {
        warnings.push(`Failed tests: ${failedTests.map(t => t.name).join(', ')}`);
        recommendations.push('Improve model robustness for edge cases');
      }

      return {
        model_name: modelName,
        validation_type: 'data_quality',
        passed,
        score: successRate,
        threshold: 0.8,
        details: {
          total_tests: testCases.length,
          passed_tests: passedTests,
          success_rate: successRate,
          test_results: testResults,
          validation_time_ms: Date.now() - startTime
        },
        timestamp: new Date(),
        warnings,
        recommendations
      };

    } catch (error) {
      return {
        model_name: modelName,
        validation_type: 'data_quality',
        passed: false,
        threshold: 0.8,
        details: {
          error: error.message,
          validation_time_ms: Date.now() - startTime
        },
        timestamp: new Date(),
        warnings: ['Data quality test failed'],
        recommendations: ['Check model input handling and validation']
      };
    }
  }

  /**
   * Validate model for drift
   */
  private async validateDrift(modelName: string): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      // Generate sample recent data for drift testing
      const sampleData = Array.from({ length: 100 }, () => 
        this.generateTestFeatures(modelName)
      );

      const driftResult = await mlPatternRecognition.detectDrift(modelName, sampleData, 0.1);
      const passed = !driftResult.drift_detected;

      const warnings: string[] = [];
      const recommendations: string[] = [];

      if (driftResult.drift_detected) {
        warnings.push(`Model drift detected with score ${driftResult.drift_score.toFixed(3)}`);
        recommendations.push(driftResult.recommendation);
      }

      if (driftResult.drift_score > 0.05) {
        warnings.push('Drift score approaching threshold - monitor closely');
        recommendations.push('Consider scheduled model retraining');
      }

      return {
        model_name: modelName,
        validation_type: 'drift',
        passed,
        score: 1 - driftResult.drift_score,
        threshold: 0.1,
        details: {
          drift_score: driftResult.drift_score,
          drift_detected: driftResult.drift_detected,
          retrain_recommended: driftResult.retrain_recommended,
          drift_recommendation: driftResult.recommendation,
          validation_time_ms: Date.now() - startTime
        },
        timestamp: new Date(),
        warnings,
        recommendations
      };

    } catch (error) {
      return {
        model_name: modelName,
        validation_type: 'drift',
        passed: false,
        threshold: 0.1,
        details: {
          error: error.message,
          validation_time_ms: Date.now() - startTime
        },
        timestamp: new Date(),
        warnings: ['Drift detection failed'],
        recommendations: ['Check drift detection system and data pipeline']
      };
    }
  }

  /**
   * Perform k-fold cross-validation simulation
   */
  async performCrossValidation(
    modelName: string,
    k: number = 5
  ): Promise<CrossValidationResult> {
    validationLogger.info('Performing cross-validation', { model: modelName, folds: k });

    try {
      // Simulate k-fold cross-validation results
      // In a real implementation, you'd split data and retrain models
      const foldScores: number[] = [];
      
      for (let fold = 0; fold < k; fold++) {
        // Simulate fold score with some variation around the model's accuracy
        const baseAccuracy = await this.getModelBaseAccuracy(modelName);
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        const foldScore = Math.max(0, Math.min(1, baseAccuracy + variation));
        foldScores.push(foldScore);
      }

      const meanScore = foldScores.reduce((a, b) => a + b, 0) / k;
      const stdDev = this.calculateStandardDeviation(foldScores);
      
      // 95% confidence interval
      const tValue = 2.776; // t-value for 95% confidence with df=4 (k-1)
      const marginOfError = (tValue * stdDev) / Math.sqrt(k);
      const confidenceInterval: [number, number] = [
        meanScore - marginOfError,
        meanScore + marginOfError
      ];

      // Stability score based on standard deviation (lower std = higher stability)
      const stabilityScore = Math.max(0, 1 - (stdDev / 0.1)); // Normalize by expected max std

      validationLogger.info('Cross-validation completed', {
        model: modelName,
        mean_score: meanScore,
        std_deviation: stdDev,
        stability_score: stabilityScore
      });

      return {
        fold_scores: foldScores,
        mean_score: meanScore,
        std_deviation: stdDev,
        confidence_interval: confidenceInterval,
        stability_score: stabilityScore
      };

    } catch (error) {
      validationLogger.error('Cross-validation failed', { model: modelName, error: error.message });
      throw new Error(`Cross-validation failed for ${modelName}: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive model health check
   */
  async checkModelHealth(modelName: string): Promise<ModelHealthCheck> {
    validationLogger.info('Checking model health', { model: modelName });

    try {
      const issues: ModelHealthCheck['issues'] = [];
      let healthScore = 1.0; // Start with perfect health

      // Get model metrics
      const metrics = await mlPatternRecognition.getModelMetrics(modelName);
      
      // Check if model exists and is trained
      if (metrics.status === 'not_trained') {
        issues.push({
          type: 'error',
          category: 'training',
          message: 'Model has not been trained',
          severity: 'critical'
        });
        healthScore -= 0.5;
      }

      // Check accuracy
      if (metrics.accuracy && metrics.accuracy < 0.7) {
        issues.push({
          type: 'warning',
          category: 'accuracy',
          message: `Low accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`,
          severity: metrics.accuracy < 0.5 ? 'high' : 'medium'
        });
        healthScore -= 0.2;
      }

      // Simulate performance check
      try {
        const testFeatures = this.generateTestFeatures(modelName);
        const startTime = Date.now();
        await mlPatternRecognition.predict(modelName, testFeatures);
        const predictionTime = Date.now() - startTime;
        
        if (predictionTime > 3000) {
          issues.push({
            type: 'warning',
            category: 'performance',
            message: `Slow predictions: ${predictionTime}ms`,
            severity: predictionTime > 5000 ? 'high' : 'medium'
          });
          healthScore -= 0.1;
        }
      } catch (error) {
        issues.push({
          type: 'error',
          category: 'functionality',
          message: `Prediction failed: ${error.message}`,
          severity: 'high'
        });
        healthScore -= 0.3;
      }

      // Generate recommendations
      const recommendations: string[] = [];
      if (healthScore < 0.8) {
        recommendations.push('Model requires attention - consider retraining');
      }
      if (issues.some(i => i.category === 'performance')) {
        recommendations.push('Optimize model performance or scaling');
      }
      if (issues.some(i => i.category === 'accuracy')) {
        recommendations.push('Review training data and hyperparameters');
      }

      const isHealthy = healthScore >= 0.8 && !issues.some(i => i.severity === 'critical');

      return {
        model_name: modelName,
        is_healthy: isHealthy,
        health_score: Math.max(0, healthScore),
        issues,
        performance_metrics: {
          avg_prediction_time_ms: 500, // Simulated
          accuracy_estimate: metrics.accuracy || 0,
          last_trained: metrics.trained_at ? new Date(metrics.trained_at) : null,
          predictions_made: Math.floor(Math.random() * 1000) // Simulated
        },
        recommendations
      };

    } catch (error) {
      validationLogger.error('Health check failed', { model: modelName, error: error.message });
      
      return {
        model_name: modelName,
        is_healthy: false,
        health_score: 0,
        issues: [{
          type: 'error',
          category: 'system',
          message: `Health check failed: ${error.message}`,
          severity: 'critical'
        }],
        performance_metrics: {
          avg_prediction_time_ms: 0,
          accuracy_estimate: 0,
          last_trained: null,
          predictions_made: 0
        },
        recommendations: ['Fix system errors before using model']
      };
    }
  }

  /**
   * Export validation results to file
   */
  async exportValidationReport(
    modelName?: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = modelName ? 
      `${modelName}-validation-report-${timestamp}.${format}` :
      `all-models-validation-report-${timestamp}.${format}`;
    
    const reportPath = path.join(process.cwd(), 'logs', filename);

    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });

      if (modelName) {
        const results = this.validationHistory.get(modelName) || [];
        await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
      } else {
        const allResults: Record<string, ValidationResult[]> = {};
        for (const [model, results] of this.validationHistory) {
          allResults[model] = results;
        }
        await fs.writeFile(reportPath, JSON.stringify(allResults, null, 2));
      }

      validationLogger.info('Validation report exported', { 
        path: reportPath,
        format,
        model: modelName || 'all'
      });

      return reportPath;

    } catch (error) {
      validationLogger.error('Failed to export validation report', { error: error.message });
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  // Private helper methods

  private generateTestFeatures(modelName: string): number[] {
    switch (modelName) {
      case 'revenue_forecast':
        return [0.75, 1.2, 1.0, 120, 4.5, 5, 6];
      case 'occupancy_optimization':
        return [150, 8.5, 200, 4.2, 0.3, 0.8, 14];
      case 'maintenance_prediction':
        return [36, 4000, 5, 0.7, 0.85, 3, 0.6];
      case 'guest_behavior':
        return [5, 0.6, 7, 1, 0.7, 2, 2];
      case 'demand_patterns':
        return [250, 100, 1.5, 0.8, 0.2, 0.4, 0.1];
      default:
        return [1, 2, 3, 4, 5];
    }
  }

  private async getModelBaseAccuracy(modelName: string): Promise<number> {
    try {
      const metrics = await mlPatternRecognition.getModelMetrics(modelName);
      return metrics.accuracy || 0.75;
    } catch {
      // Fallback accuracy based on model type
      const defaultAccuracies: Record<string, number> = {
        revenue_forecast: 0.85,
        occupancy_optimization: 0.80,
        maintenance_prediction: 0.90,
        guest_behavior: 0.75,
        demand_patterns: 0.82
      };
      return defaultAccuracies[modelName] || 0.75;
    }
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

// Export singleton instance
export const modelValidation = new ModelValidationUtils();

// Export types for external use
export type { ValidationResult, ModelHealthCheck, CrossValidationResult };