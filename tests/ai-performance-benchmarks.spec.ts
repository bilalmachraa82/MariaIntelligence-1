/**
 * AI Performance Benchmarks and Load Testing
 * Comprehensive performance analysis for all AI functionalities
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AIAdapter, aiService } from '../server/services/ai-adapter.service';
import { GeminiService } from '../server/services/gemini.service';
import { OpenRouterService } from '../server/services/openrouter.service';
import { mistralOCRService } from '../server/services/mistral-ocr.service';
import { rateLimiter } from '../server/services/rate-limiter.service';

const TEST_TIMEOUT = 60000; // 60 seconds for performance tests

describe('AI Performance Benchmarks', () => {
  let performanceData: {
    test: string;
    service: string;
    operation: string;
    startTime: number;
    endTime: number;
    duration: number;
    success: boolean;
    error?: string;
    inputSize?: number;
    outputSize?: number;
    throughput?: number;
  }[] = [];

  const recordPerformance = (
    test: string,
    service: string,
    operation: string,
    startTime: number,
    endTime: number,
    success: boolean,
    error?: string,
    inputSize?: number,
    outputSize?: number
  ) => {
    const duration = endTime - startTime;
    const throughput = inputSize ? (inputSize / duration) * 1000 : undefined; // bytes/second

    performanceData.push({
      test,
      service,
      operation,
      startTime,
      endTime,
      duration,
      success,
      error,
      inputSize,
      outputSize,
      throughput
    });

    console.log(`⏱️  [${service}] ${operation}: ${duration}ms ${success ? '✅' : '❌'} ${error ? `(${error})` : ''}`);
  };

  afterAll(() => {
    console.log('\n📊 Performance Analysis Summary:');
    console.log('=' .repeat(100));

    // Group by service and operation
    const groupedData = performanceData.reduce((acc, data) => {
      const key = `${data.service}_${data.operation}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(data);
      return acc;
    }, {} as Record<string, typeof performanceData>);

    // Calculate statistics for each group
    Object.entries(groupedData).forEach(([key, data]) => {
      const [service, operation] = key.split('_');
      const successful = data.filter(d => d.success);
      const durations = successful.map(d => d.duration);
      
      if (durations.length > 0) {
        const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);
        const p95 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];
        const successRate = (successful.length / data.length) * 100;

        console.log(`📈 ${service} - ${operation}:`);
        console.log(`   Success Rate: ${successRate.toFixed(1)}% (${successful.length}/${data.length})`);
        console.log(`   Average: ${avg.toFixed(0)}ms`);
        console.log(`   Min/Max: ${min}ms / ${max}ms`);
        console.log(`   95th Percentile: ${p95}ms`);
        
        if (successful.some(d => d.throughput)) {
          const avgThroughput = successful.filter(d => d.throughput).reduce((sum, d) => sum + (d.throughput || 0), 0) / 
                               successful.filter(d => d.throughput).length;
          console.log(`   Average Throughput: ${(avgThroughput / 1024).toFixed(2)} KB/s`);
        }
        console.log('');
      }
    });

    // Overall statistics
    const totalTests = performanceData.length;
    const successfulTests = performanceData.filter(d => d.success).length;
    const avgDuration = performanceData.filter(d => d.success).reduce((sum, d) => sum + d.duration, 0) / successfulTests;

    console.log(`🎯 Overall Performance:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`   Average Duration: ${avgDuration.toFixed(0)}ms`);
    console.log('=' .repeat(100));
  });

  describe('Individual Service Benchmarks', () => {
    it('should benchmark Gemini service performance', async () => {
      if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        console.log('⏸️  Skipping Gemini benchmarks - no API key');
        return;
      }

      const geminiService = new GeminiService();
      const tests = [
        {
          name: 'Short Text Generation',
          operation: 'generateText',
          test: () => geminiService.generateText('Say hello in one word', 0.1, 10),
          inputSize: 25
        },
        {
          name: 'Medium Text Generation',
          operation: 'generateText',
          test: () => geminiService.generateText('Write a brief professional email response confirming a booking request', 0.3, 100),
          inputSize: 85
        },
        {
          name: 'Text Parsing',
          operation: 'parseReservationData',
          test: () => geminiService.parseReservationData('Guest: John Doe, Check-in: 2024-01-15, Check-out: 2024-01-20, Property: Beach House'),
          inputSize: 95
        },
        {
          name: 'Document Classification',
          operation: 'classifyDocument',
          test: () => geminiService.classifyDocument('RESERVATION CONFIRMATION\nGuest: Jane Smith\nProperty: Apartment Lisboa\nDates: 15/03/2024 - 20/03/2024'),
          inputSize: 115
        }
      ];

      for (const test of tests) {
        // Run each test multiple times for statistical significance
        for (let i = 0; i < 3; i++) {
          const startTime = Date.now();
          try {
            const result = await test.test();
            const endTime = Date.now();
            const outputSize = typeof result === 'string' ? result.length : JSON.stringify(result).length;
            
            recordPerformance(
              test.name,
              'Gemini',
              test.operation,
              startTime,
              endTime,
              true,
              undefined,
              test.inputSize,
              outputSize
            );
          } catch (error: any) {
            const endTime = Date.now();
            recordPerformance(
              test.name,
              'Gemini',
              test.operation,
              startTime,
              endTime,
              false,
              error.message,
              test.inputSize
            );
          }

          // Add delay to respect rate limits
          if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      expect(performanceData.filter(d => d.service === 'Gemini' && d.success).length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    it('should benchmark OpenRouter service performance', async () => {
      if (!process.env.OPENROUTER_API_KEY) {
        console.log('⏸️  Skipping OpenRouter benchmarks - no API key');
        return;
      }

      const openRouterService = new OpenRouterService();
      
      // Test OCR performance with different image sizes
      const testImages = [
        {
          name: 'Tiny Image OCR',
          operation: 'ocrImage',
          buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWJqNGwAAAABJRU5ErkJggg==', 'base64'),
          mimeType: 'image/png'
        }
      ];

      for (const testImage of testImages) {
        for (let i = 0; i < 2; i++) {
          const startTime = Date.now();
          try {
            const result = await openRouterService.ocrImage(testImage.buffer, testImage.mimeType);
            const endTime = Date.now();
            
            recordPerformance(
              testImage.name,
              'OpenRouter',
              testImage.operation,
              startTime,
              endTime,
              !result.error,
              result.error,
              testImage.buffer.length,
              result.full_text.length
            );
          } catch (error: any) {
            const endTime = Date.now();
            recordPerformance(
              testImage.name,
              'OpenRouter',
              testImage.operation,
              startTime,
              endTime,
              false,
              error.message,
              testImage.buffer.length
            );
          }

          if (i < 1) await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }, TEST_TIMEOUT);

    it('should benchmark Mistral OCR service performance', async () => {
      if (!process.env.MISTRAL_API_KEY) {
        console.log('⏸️  Skipping Mistral OCR benchmarks - no API key');
        return;
      }

      const testImages = [
        {
          name: 'Small Image Processing',
          operation: 'processImage',
          buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWJqNGwAAAABJRU5ErkJggg==', 'base64'),
          mimeType: 'image/png'
        }
      ];

      for (const testImage of testImages) {
        for (let i = 0; i < 2; i++) {
          const startTime = Date.now();
          try {
            const result = await mistralOCRService.processImage(testImage.buffer, testImage.mimeType);
            const endTime = Date.now();
            
            recordPerformance(
              testImage.name,
              'Mistral',
              testImage.operation,
              startTime,
              endTime,
              true,
              undefined,
              testImage.buffer.length,
              result.text.length
            );
          } catch (error: any) {
            const endTime = Date.now();
            recordPerformance(
              testImage.name,
              'Mistral',
              testImage.operation,
              startTime,
              endTime,
              false,
              error.message,
              testImage.buffer.length
            );
          }

          if (i < 1) await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }, TEST_TIMEOUT);
  });

  describe('Load Testing and Concurrent Operations', () => {
    it('should test concurrent text generation requests', async () => {
      const adapter = AIAdapter.getInstance();
      
      if (!adapter.isServiceAvailable()) {
        console.log('⏸️  Skipping concurrent tests - no AI services available');
        return;
      }

      const concurrentRequests = 5;
      const promises = Array(concurrentRequests).fill(null).map(async (_, index) => {
        const startTime = Date.now();
        try {
          const result = await adapter.generateText({
            prompt: `Generate a unique response #${index + 1}. Say hello in different languages.`
          });
          const endTime = Date.now();
          
          recordPerformance(
            'Concurrent Text Generation',
            'AIAdapter',
            'generateText',
            startTime,
            endTime,
            true,
            undefined,
            50,
            result.length
          );
          
          return { success: true, index, result };
        } catch (error: any) {
          const endTime = Date.now();
          recordPerformance(
            'Concurrent Text Generation',
            'AIAdapter',
            'generateText',
            startTime,
            endTime,
            false,
            error.message,
            50
          );
          
          return { success: false, index, error: error.message };
        }
      });

      const results = await Promise.all(promises);
      const successfulRequests = results.filter(r => r.success).length;

      expect(successfulRequests).toBeGreaterThan(0);
      console.log(`🔄 Concurrent requests: ${successfulRequests}/${concurrentRequests} successful`);
    }, TEST_TIMEOUT);

    it('should test rate limiter performance under load', async () => {
      // Test the rate limiter itself with high-frequency requests
      const testFunction = rateLimiter.rateLimitedFunction(
        async () => 'cached result',
        'performance-test-key',
        5000 // 5 second cache
      );

      const requests = 10;
      const startTime = Date.now();
      
      const promises = Array(requests).fill(null).map(async (_, index) => {
        const requestStart = Date.now();
        try {
          const result = await testFunction();
          const requestEnd = Date.now();
          
          recordPerformance(
            'Rate Limiter Load Test',
            'RateLimiter',
            'rateLimitedFunction',
            requestStart,
            requestEnd,
            true,
            undefined,
            20,
            result.length
          );
          
          return { success: true, duration: requestEnd - requestStart };
        } catch (error: any) {
          const requestEnd = Date.now();
          recordPerformance(
            'Rate Limiter Load Test',
            'RateLimiter',
            'rateLimitedFunction',
            requestStart,
            requestEnd,
            false,
            error.message,
            20
          );
          
          return { success: false, error: error.message };
        }
      });

      const results = await Promise.all(promises);
      const totalDuration = Date.now() - startTime;
      
      const successful = results.filter(r => r.success).length;
      const avgRequestTime = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r as any).duration, 0) / successful;

      expect(successful).toBe(requests); // All should be successful with rate limiter
      expect(avgRequestTime).toBeLessThan(100); // Should be very fast due to caching

      console.log(`⚡ Rate limiter performance: ${successful}/${requests} requests in ${totalDuration}ms (avg: ${avgRequestTime.toFixed(0)}ms per request)`);
    }, TEST_TIMEOUT);

    it('should measure memory usage during AI operations', async () => {
      const adapter = AIAdapter.getInstance();
      
      if (!adapter.isServiceAvailable()) {
        console.log('⏸️  Skipping memory tests - no AI services available');
        return;
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage();
      console.log('📊 Initial memory usage:', {
        heap: Math.round(initialMemory.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(initialMemory.external / 1024 / 1024) + ' MB'
      });

      // Perform multiple AI operations
      const operations = [
        () => adapter.generateText({ prompt: 'Generate a test response' }),
        () => adapter.parseReservationData('Guest: Test, Date: 2024-01-01'),
        () => adapter.classifyDocument('Test document content')
      ];

      for (let i = 0; i < 3; i++) {
        for (const operation of operations) {
          try {
            await operation();
            
            const currentMemory = process.memoryUsage();
            const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
            
            console.log(`🧠 Memory after operation ${i + 1}: +${Math.round(memoryIncrease / 1024 / 1024)} MB`);
            
            // Memory increase should be reasonable (less than 100MB for basic operations)
            expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
          } catch (error) {
            console.warn('Operation failed during memory test:', error);
          }
        }
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const totalMemoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log('📊 Final memory usage:', {
        heap: Math.round(finalMemory.heapUsed / 1024 / 1024) + ' MB',
        increase: Math.round(totalMemoryIncrease / 1024 / 1024) + ' MB'
      });

      // Total memory increase should be manageable
      expect(totalMemoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB increase
    }, TEST_TIMEOUT);
  });

  describe('Cost and Efficiency Analysis', () => {
    it('should measure token usage efficiency', async () => {
      const adapter = AIAdapter.getInstance();
      
      if (!adapter.isServiceAvailable()) {
        console.log('⏸️  Skipping token efficiency tests - no AI services available');
        return;
      }

      const testCases = [
        {
          name: 'Short Response',
          prompt: 'Say yes',
          expectedTokens: 5,
          maxTokens: 10
        },
        {
          name: 'Medium Response',
          prompt: 'Write a brief thank you message',
          expectedTokens: 20,
          maxTokens: 50
        },
        {
          name: 'Structured Data',
          prompt: 'Extract data from: Guest John, Date 2024-01-01',
          expectedTokens: 50,
          maxTokens: 100
        }
      ];

      const tokenEfficiencyResults: any[] = [];

      for (const testCase of testCases) {
        const startTime = Date.now();
        try {
          const result = await adapter.generateText({
            prompt: testCase.prompt,
            maxTokens: testCase.maxTokens
          });
          const endTime = Date.now();
          
          // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
          const estimatedTokens = Math.ceil(result.length / 4);
          const efficiency = estimatedTokens / testCase.maxTokens;
          
          tokenEfficiencyResults.push({
            name: testCase.name,
            prompt: testCase.prompt,
            responseLength: result.length,
            estimatedTokens,
            maxTokens: testCase.maxTokens,
            efficiency,
            duration: endTime - startTime,
            success: true
          });

          recordPerformance(
            testCase.name,
            'TokenEfficiency',
            'generateText',
            startTime,
            endTime,
            true,
            undefined,
            testCase.prompt.length,
            result.length
          );

        } catch (error: any) {
          const endTime = Date.now();
          tokenEfficiencyResults.push({
            name: testCase.name,
            success: false,
            error: error.message,
            duration: endTime - startTime
          });

          recordPerformance(
            testCase.name,
            'TokenEfficiency',
            'generateText',
            startTime,
            endTime,
            false,
            error.message,
            testCase.prompt.length
          );
        }

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Analyze token efficiency
      const successfulTests = tokenEfficiencyResults.filter(r => r.success);
      if (successfulTests.length > 0) {
        const avgEfficiency = successfulTests.reduce((sum, r) => sum + r.efficiency, 0) / successfulTests.length;
        const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;

        console.log('🪙 Token Efficiency Analysis:');
        successfulTests.forEach(result => {
          console.log(`  ${result.name}: ${result.estimatedTokens}/${result.maxTokens} tokens (${(result.efficiency * 100).toFixed(1)}% efficiency)`);
        });
        console.log(`  Average Efficiency: ${(avgEfficiency * 100).toFixed(1)}%`);
        console.log(`  Average Response Time: ${avgDuration.toFixed(0)}ms`);

        expect(avgEfficiency).toBeGreaterThan(0);
        expect(avgEfficiency).toBeLessThan(1); // Should not exceed token limits
      }
    }, TEST_TIMEOUT);

    it('should estimate operational costs', async () => {
      // Cost estimation for different AI services based on typical usage patterns
      const costEstimations = [
        {
          service: 'Gemini',
          operation: 'Text Generation (1K tokens)',
          estimatedCost: 0.00025, // $0.00025 per 1K input tokens (approximate)
          currency: 'USD'
        },
        {
          service: 'OpenRouter',
          operation: 'OCR Processing (per image)',
          estimatedCost: 0.002, // Varies by model
          currency: 'USD'
        },
        {
          service: 'Mistral',
          operation: 'Vision Processing (per request)',
          estimatedCost: 0.001,
          currency: 'USD'
        }
      ];

      // Simulate usage patterns
      const dailyUsageEstimate = {
        textGeneration: 100, // requests per day
        ocrProcessing: 50,
        visionProcessing: 25
      };

      const monthlyCostEstimate = 
        (costEstimations[0].estimatedCost * dailyUsageEstimate.textGeneration * 30) +
        (costEstimations[1].estimatedCost * dailyUsageEstimate.ocrProcessing * 30) +
        (costEstimations[2].estimatedCost * dailyUsageEstimate.visionProcessing * 30);

      console.log('💰 Cost Estimation Analysis:');
      console.log('  Daily Usage Estimate:');
      console.log(`    Text Generation: ${dailyUsageEstimate.textGeneration} requests`);
      console.log(`    OCR Processing: ${dailyUsageEstimate.ocrProcessing} requests`);
      console.log(`    Vision Processing: ${dailyUsageEstimate.visionProcessing} requests`);
      console.log(`  Estimated Monthly Cost: $${monthlyCostEstimate.toFixed(2)} USD`);
      console.log(`  Cost per Request (avg): $${(monthlyCostEstimate / ((dailyUsageEstimate.textGeneration + dailyUsageEstimate.ocrProcessing + dailyUsageEstimate.visionProcessing) * 30)).toFixed(4)} USD`);

      // Cost should be reasonable for a small to medium business
      expect(monthlyCostEstimate).toBeLessThan(100); // Less than $100/month for estimated usage

      recordPerformance(
        'Cost Analysis',
        'CostEstimation',
        'calculateMonthlyCost',
        Date.now(),
        Date.now() + 1,
        true,
        undefined,
        Object.keys(dailyUsageEstimate).length,
        monthlyCostEstimate
      );
    });
  });
});