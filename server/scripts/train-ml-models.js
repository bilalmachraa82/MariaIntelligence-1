#!/usr/bin/env node

/**
 * ML Model Training Script for MariaIntelligence
 * Trains and validates machine learning models for property management analytics
 * 
 * Usage:
 * node server/scripts/train-ml-models.js [--model=MODEL_NAME] [--validate] [--export]
 */

import { mlPatternRecognition } from '../services/ml-pattern-recognition.service.js';
import { db } from '../db/index.js';
import fs from 'fs/promises';
import path from 'path';

// Training configuration
const TRAINING_CONFIG = {
  validation_split: 0.2,
  test_split: 0.1,
  min_samples_required: 100,
  max_training_time_hours: 2
};

// Sample data generators for development/testing
class DataGenerator {
  static generateRevenueData(samples = 1000) {
    const data = {
      features: [],
      labels: [],
      metadata: {
        date_range: [
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
          new Date()
        ],
        data_points: samples
      }
    };

    for (let i = 0; i < samples; i++) {
      const date = new Date(Date.now() - (365 - i) * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay();
      const month = date.getMonth();
      
      // Generate realistic features
      const occupancyRate = 0.6 + Math.sin(month / 12 * 2 * Math.PI) * 0.2 + Math.random() * 0.2;
      const seasonalIndex = 0.8 + Math.sin(month / 12 * 2 * Math.PI) * 0.3;
      const weekendBoost = dayOfWeek >= 5 ? 1.2 : 1.0;
      const localEvents = Math.random() > 0.9 ? 1.5 : 1.0; // 10% chance of local event
      const competitorPricing = 80 + Math.random() * 40;
      const propertyRating = 4.0 + Math.random() * 1.0;
      
      const features = [
        occupancyRate,
        seasonalIndex,
        localEvents,
        competitorPricing,
        propertyRating,
        dayOfWeek,
        month
      ];
      
      // Generate target revenue based on features
      const baseRevenue = 100;
      const revenue = baseRevenue * occupancyRate * seasonalIndex * weekendBoost * 
                     localEvents * (propertyRating / 4.5) + Math.random() * 20;
      
      data.features.push(features);
      data.labels.push(revenue);
    }

    return data;
  }

  static generateOccupancyData(samples = 1000) {
    const data = {
      features: [],
      labels: [],
      metadata: {
        date_range: [
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          new Date()
        ],
        data_points: samples
      }
    };

    for (let i = 0; i < samples; i++) {
      const pricePerNight = 50 + Math.random() * 200;
      const locationScore = 1 + Math.random() * 9; // 1-10 scale
      const reviewsCount = Math.floor(Math.random() * 500);
      const rating = 3.0 + Math.random() * 2.0;
      const competitorAvailability = Math.random();
      const seasonalDemand = 0.5 + Math.sin(i / 365 * 2 * Math.PI) * 0.3;
      const bookingLeadTime = 1 + Math.random() * 90;
      
      const features = [
        pricePerNight,
        locationScore,
        reviewsCount,
        rating,
        competitorAvailability,
        seasonalDemand,
        bookingLeadTime
      ];
      
      // Generate occupancy rate based on features
      const priceScore = Math.max(0, 1 - (pricePerNight - 100) / 200);
      const occupancyRate = Math.min(1, Math.max(0, 
        priceScore * 0.3 + 
        (locationScore / 10) * 0.25 + 
        (rating / 5) * 0.2 + 
        seasonalDemand * 0.15 + 
        (1 - competitorAvailability) * 0.1 +
        Math.random() * 0.2
      ));
      
      data.features.push(features);
      data.labels.push(occupancyRate);
    }

    return data;
  }

  static generateMaintenanceData(samples = 800) {
    const data = {
      features: [],
      labels: [],
      metadata: {
        date_range: [
          new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
          new Date()
        ],
        data_points: samples
      }
    };

    for (let i = 0; i < samples; i++) {
      const equipmentAge = Math.random() * 120; // months
      const usageHours = Math.random() * 8760; // hours per year
      const maintenanceHistory = Math.floor(Math.random() * 20); // number of past issues
      const environmentalConditions = Math.random(); // 0-1 scale
      const performanceMetrics = 0.5 + Math.random() * 0.5;
      const failureIndicators = Math.random() * 10;
      const seasonalWear = 0.5 + Math.sin(i / 365 * 2 * Math.PI) * 0.3;
      
      const features = [
        equipmentAge,
        usageHours,
        maintenanceHistory,
        environmentalConditions,
        performanceMetrics,
        failureIndicators,
        seasonalWear
      ];
      
      // Generate failure probability
      const ageScore = equipmentAge / 120;
      const usageScore = usageHours / 8760;
      const historyScore = maintenanceHistory / 20;
      
      const failureProbability = Math.min(1, Math.max(0,
        ageScore * 0.4 +
        usageScore * 0.3 +
        historyScore * 0.2 +
        (1 - performanceMetrics) * 0.1 +
        Math.random() * 0.2
      ));
      
      data.features.push(features);
      data.labels.push(failureProbability);
    }

    return data;
  }

  static generateGuestBehaviorData(samples = 1500) {
    const data = {
      features: [],
      labels: [],
      metadata: {
        date_range: [
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          new Date()
        ],
        data_points: samples
      }
    };

    const clusterTypes = [
      'budget_travelers', 'luxury_seekers', 'business_travelers',
      'family_groups', 'couples', 'digital_nomads'
    ];

    for (let i = 0; i < samples; i++) {
      const stayDuration = 1 + Math.random() * 14; // days
      const priceSensitivity = Math.random();
      const amenityPreferences = Math.floor(Math.random() * 8); // bitmask for amenities
      const reviewBehavior = Math.random() > 0.7 ? 1 : 0; // 30% leave reviews
      const rebookingLikelihood = Math.random();
      const seasonalPreferences = Math.floor(Math.random() * 4); // seasons 0-3
      const groupSize = 1 + Math.floor(Math.random() * 6);
      
      const features = [
        stayDuration,
        priceSensitivity,
        amenityPreferences,
        reviewBehavior,
        rebookingLikelihood,
        seasonalPreferences,
        groupSize
      ];
      
      // Assign to cluster based on features
      let clusterIndex = 0;
      if (priceSensitivity > 0.7) clusterIndex = 0; // budget_travelers
      else if (priceSensitivity < 0.3) clusterIndex = 1; // luxury_seekers
      else if (stayDuration < 3) clusterIndex = 2; // business_travelers
      else if (groupSize > 3) clusterIndex = 3; // family_groups
      else if (groupSize === 2) clusterIndex = 4; // couples
      else clusterIndex = 5; // digital_nomads
      
      data.features.push(features);
      data.labels.push(clusterIndex);
    }

    return data;
  }

  static generateDemandData(samples = 2000) {
    const data = {
      features: [],
      labels: [],
      metadata: {
        date_range: [
          new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000),
          new Date()
        ],
        data_points: samples
      }
    };

    for (let i = 0; i < samples; i++) {
      const date = new Date(Date.now() - (365 * 3 - i) * 24 * 60 * 60 * 1000);
      const searchVolume = 100 + Math.random() * 400;
      const priceTrends = 80 + Math.random() * 60;
      const eventCalendar = Math.random() > 0.95 ? 2 : Math.random() > 0.85 ? 1.5 : 1.0;
      const weatherScore = 0.3 + Math.random() * 0.7;
      const marketSentiment = -0.5 + Math.random();
      const competitorActivity = Math.random();
      const economicIndicators = -0.2 + Math.random() * 0.4;
      
      const features = [
        searchVolume,
        priceTrends,
        eventCalendar,
        weatherScore,
        marketSentiment,
        competitorActivity,
        economicIndicators
      ];
      
      // Generate booking demand based on features
      const baseDemand = 50;
      const demand = baseDemand + 
                    (searchVolume / 500) * 30 +
                    eventCalendar * 20 +
                    weatherScore * 15 +
                    Math.max(0, marketSentiment) * 10 +
                    (1 - competitorActivity) * 8 +
                    Math.max(0, economicIndicators) * 5 +
                    Math.random() * 10;
      
      data.features.push(features);
      data.labels.push(Math.max(0, demand));
    }

    return data;
  }
}

// Training orchestrator
class ModelTrainer {
  constructor() {
    this.results = {};
    this.startTime = new Date();
  }

  async trainAllModels(specificModel = null) {
    console.log('🚀 Starting ML model training...');
    console.log(`Training started at: ${this.startTime.toISOString()}`);

    const modelsToTrain = specificModel ? [specificModel] : [
      'revenue_forecast',
      'occupancy_optimization', 
      'maintenance_prediction',
      'guest_behavior',
      'demand_patterns'
    ];

    for (const modelName of modelsToTrain) {
      try {
        console.log(`\n📊 Training ${modelName}...`);
        await this.trainSingleModel(modelName);
        console.log(`✅ ${modelName} training completed`);
      } catch (error) {
        console.error(`❌ Failed to train ${modelName}:`, error.message);
        this.results[modelName] = {
          success: false,
          error: error.message
        };
      }
    }

    await this.generateTrainingReport();
    return this.results;
  }

  async trainSingleModel(modelName) {
    const startTime = Date.now();
    
    // Generate training data based on model type
    let trainingData;
    switch (modelName) {
      case 'revenue_forecast':
        trainingData = DataGenerator.generateRevenueData(1200);
        break;
      case 'occupancy_optimization':
        trainingData = DataGenerator.generateOccupancyData(1000);
        break;
      case 'maintenance_prediction':
        trainingData = DataGenerator.generateMaintenanceData(800);
        break;
      case 'guest_behavior':
        trainingData = DataGenerator.generateGuestBehaviorData(1500);
        break;
      case 'demand_patterns':
        trainingData = DataGenerator.generateDemandData(2000);
        break;
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }

    console.log(`  📈 Generated ${trainingData.features.length} training samples`);
    
    // Train the model
    const result = await mlPatternRecognition.trainModel(
      modelName, 
      trainingData, 
      TRAINING_CONFIG.validation_split
    );

    const trainingTime = Date.now() - startTime;
    
    // Store results
    this.results[modelName] = {
      success: result.success,
      accuracy: result.metrics.accuracy,
      validation_accuracy: result.metrics.val_accuracy || null,
      training_time_ms: trainingTime,
      samples_used: result.model_info.samples_count,
      features_count: result.model_info.features_count
    };

    console.log(`  🎯 Accuracy: ${(result.metrics.accuracy * 100).toFixed(2)}%`);
    console.log(`  ⏱️ Training time: ${(trainingTime / 1000).toFixed(2)}s`);
    
    return result;
  }

  async validateModels() {
    console.log('\n🧪 Running model validation...');
    
    for (const [modelName, result] of Object.entries(this.results)) {
      if (!result.success) continue;
      
      try {
        console.log(`\n🔍 Validating ${modelName}...`);
        
        // Generate test features based on model type
        const testFeatures = this.generateTestFeatures(modelName);
        
        // Make prediction
        const prediction = await mlPatternRecognition.predict(modelName, testFeatures, {
          return_confidence: true,
          explain_prediction: true
        });

        console.log(`  ✅ Prediction successful: ${JSON.stringify(prediction.prediction)}`);
        console.log(`  🎯 Confidence: ${(prediction.confidence * 100).toFixed(2)}%`);
        console.log(`  ⚡ Processing time: ${prediction.processing_time_ms}ms`);

        result.validation = {
          prediction_test: true,
          confidence: prediction.confidence,
          processing_time_ms: prediction.processing_time_ms
        };

      } catch (error) {
        console.error(`❌ Validation failed for ${modelName}:`, error.message);
        result.validation = {
          prediction_test: false,
          error: error.message
        };
      }
    }
  }

  generateTestFeatures(modelName) {
    switch (modelName) {
      case 'revenue_forecast':
        return [0.75, 1.2, 1.0, 120, 4.5, 5, 6]; // occupancy, seasonal, events, competitor_price, rating, day, month
      case 'occupancy_optimization':
        return [150, 8.5, 200, 4.2, 0.3, 0.8, 14]; // price, location, reviews, rating, competitor, seasonal, lead_time
      case 'maintenance_prediction':
        return [36, 4000, 5, 0.7, 0.85, 3, 0.6]; // age, usage, history, env, performance, indicators, seasonal
      case 'guest_behavior':
        return [5, 0.6, 7, 1, 0.7, 2, 2]; // duration, price_sens, amenities, reviews, rebooking, seasonal, group_size
      case 'demand_patterns':
        return [250, 100, 1.5, 0.8, 0.2, 0.4, 0.1]; // search, price, events, weather, sentiment, competitor, economic
      default:
        return [1, 2, 3, 4, 5]; // default test features
    }
  }

  async generateTrainingReport() {
    const totalTime = Date.now() - this.startTime.getTime();
    const successfulModels = Object.values(this.results).filter(r => r.success).length;
    const totalModels = Object.keys(this.results).length;

    const report = {
      summary: {
        training_session_id: Date.now().toString(),
        start_time: this.startTime.toISOString(),
        end_time: new Date().toISOString(),
        total_time_ms: totalTime,
        models_trained: totalModels,
        successful_models: successfulModels,
        success_rate: successfulModels / totalModels
      },
      models: this.results,
      performance_targets: {
        revenue_forecast: { target: 0.85, achieved: this.results.revenue_forecast?.accuracy || 0 },
        occupancy_optimization: { target: 0.80, achieved: this.results.occupancy_optimization?.accuracy || 0 },
        maintenance_prediction: { target: 0.90, achieved: this.results.maintenance_prediction?.accuracy || 0 },
        guest_behavior: { target: 0.75, achieved: this.results.guest_behavior?.accuracy || 0 },
        demand_patterns: { target: 0.82, achieved: this.results.demand_patterns?.accuracy || 0 }
      }
    };

    // Save report to file
    const reportPath = path.join(process.cwd(), 'logs', `ml-training-report-${Date.now()}.json`);
    
    try {
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Training report saved to: ${reportPath}`);
    } catch (error) {
      console.warn(`⚠️ Could not save report: ${error.message}`);
    }

    // Print summary
    console.log('\n📊 TRAINING SUMMARY');
    console.log('===================');
    console.log(`Models trained: ${successfulModels}/${totalModels}`);
    console.log(`Total time: ${(totalTime / 1000 / 60).toFixed(2)} minutes`);
    console.log(`Success rate: ${(report.summary.success_rate * 100).toFixed(1)}%`);
    
    console.log('\n🎯 TARGET ACHIEVEMENT:');
    for (const [model, targets] of Object.entries(report.performance_targets)) {
      const achieved = targets.achieved;
      const target = targets.target;
      const status = achieved >= target ? '✅' : '⚠️';
      console.log(`  ${status} ${model}: ${(achieved * 100).toFixed(1)}% (target: ${(target * 100)}%)`);
    }

    return report;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const modelArg = args.find(arg => arg.startsWith('--model='));
  const specificModel = modelArg ? modelArg.split('=')[1] : null;
  const shouldValidate = args.includes('--validate');
  const shouldExport = args.includes('--export');

  try {
    const trainer = new ModelTrainer();
    
    // Train models
    await trainer.trainAllModels(specificModel);
    
    // Validate models if requested
    if (shouldValidate) {
      await trainer.validateModels();
    }
    
    // Export models if requested
    if (shouldExport) {
      console.log('\n📦 Exporting models...');
      const metrics = await mlPatternRecognition.getModelMetrics();
      
      const exportPath = path.join(process.cwd(), 'models', `ml-models-export-${Date.now()}.json`);
      await fs.mkdir(path.dirname(exportPath), { recursive: true });
      await fs.writeFile(exportPath, JSON.stringify(metrics, null, 2));
      
      console.log(`✅ Models exported to: ${exportPath}`);
    }
    
    console.log('\n🎉 ML training completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Training failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ModelTrainer, DataGenerator };