/**
 * Comprehensive Concurrency and Parallel Processing Tests
 * Testing race conditions, deadlocks, resource contention and performance
 *
 * @author ConcurrencyTester Agent
 * @test-suite Parallel Processing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performance } from 'perf_hooks';

// Mock implementations for testing
const mockGeminiService = {
  withRetry: vi.fn(),
  extractTextFromPDF: vi.fn(),
  extractTextFromImage: vi.fn(),
  processReservationDocument: vi.fn(),
  parseReservationData: vi.fn(),
  validateReservationData: vi.fn(),
  generateText: vi.fn(),
  isConfigured: vi.fn().mockReturnValue(true)
};

const mockRateLimiter = {
  rateLimitedFunction: vi.fn(),
  checkRate: vi.fn(),
  increment: vi.fn()
};

// Utility for creating test data
const createTestData = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `test-${i}`,
    data: `test-data-${i}`,
    timestamp: Date.now() + i
  }));
};

// Utility for simulating async operations
const asyncOperation = (duration: number, shouldFail = false) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error(`Operation failed after ${duration}ms`));
      } else {
        resolve(`Operation completed in ${duration}ms`);
      }
    }, duration);
  });
};

describe('Concurrency and Parallel Processing Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Race Condition Tests', () => {
    it('should handle concurrent API calls without race conditions', async () => {
      const concurrentCalls = 10;
      const callResults = new Map();

      // Mock API that tracks call order
      const mockAPI = vi.fn().mockImplementation(async (id: string) => {
        const startTime = performance.now();
        await asyncOperation(Math.random() * 100);
        const endTime = performance.now();

        callResults.set(id, {
          startTime,
          endTime,
          duration: endTime - startTime
        });

        return `Result for ${id}`;
      });

      // Execute concurrent calls
      const promises = Array.from({ length: concurrentCalls }, (_, i) =>
        mockAPI(`call-${i}`)
      );

      const results = await Promise.all(promises);

      // Verify all calls completed
      expect(results).toHaveLength(concurrentCalls);
      expect(callResults.size).toBe(concurrentCalls);

      // Verify no data corruption
      results.forEach((result, index) => {
        expect(result).toBe(`Result for call-${index}`);
      });

      // Verify concurrent execution (overlapping time periods)
      const timeRanges = Array.from(callResults.values());
      const hasOverlap = timeRanges.some((range1, i) =>
        timeRanges.some((range2, j) =>
          i !== j &&
          range1.startTime < range2.endTime &&
          range2.startTime < range1.endTime
        )
      );

      expect(hasOverlap).toBe(true);
    });

    it('should prevent race conditions in shared resource access', async () => {
      let sharedCounter = 0;
      const targetCount = 100;
      const incrementDelay = 1; // Small delay to increase chance of race condition

      // Function that increments shared counter (potentially racy)
      const incrementCounter = async () => {
        const current = sharedCounter;
        await asyncOperation(incrementDelay);
        sharedCounter = current + 1;
      };

      // Function with proper locking mechanism
      let lock = Promise.resolve();
      const safeIncrementCounter = async () => {
        lock = lock.then(async () => {
          const current = sharedCounter;
          await asyncOperation(incrementDelay);
          sharedCounter = current + 1;
        });
        return lock;
      };

      // Test unsafe concurrent increments (may have race conditions)
      sharedCounter = 0;
      const unsafePromises = Array.from({ length: targetCount }, () => incrementCounter());
      await Promise.all(unsafePromises);
      const unsafeResult = sharedCounter;

      // Test safe concurrent increments
      sharedCounter = 0;
      const safePromises = Array.from({ length: targetCount }, () => safeIncrementCounter());
      await Promise.all(safePromises);
      const safeResult = sharedCounter;

      // Safe version should always reach target count
      expect(safeResult).toBe(targetCount);

      // Log unsafe result for analysis (may or may not have race condition)
      console.log(`Unsafe concurrent increments result: ${unsafeResult}/${targetCount}`);
    });

    it('should handle concurrent file processing without corruption', async () => {
      const fileCount = 5;
      const processingResults = new Set();

      // Mock file processing that tracks results
      const processFile = async (fileId: string) => {
        await asyncOperation(Math.random() * 50);
        const result = `processed-${fileId}-${Date.now()}`;
        processingResults.add(result);
        return result;
      };

      const fileIds = Array.from({ length: fileCount }, (_, i) => `file-${i}`);
      const promises = fileIds.map(id => processFile(id));

      const results = await Promise.all(promises);

      // Verify all files processed uniquely
      expect(results).toHaveLength(fileCount);
      expect(processingResults.size).toBe(fileCount);
      expect(new Set(results).size).toBe(fileCount); // All results unique
    });
  });

  describe('Deadlock Prevention Tests', () => {
    it('should prevent deadlocks in resource acquisition', async () => {
      const resourceA = { locked: false, queue: [] as any[] };
      const resourceB = { locked: false, queue: [] as any[] };

      const acquireResource = async (resource: any, taskId: string, timeout: number = 500) => {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error(`${taskId} timeout acquiring resource`));
          }, timeout);

          if (!resource.locked) {
            resource.locked = true;
            clearTimeout(timeoutId);
            resolve(true);
          } else {
            resource.queue.push(() => {
              resource.locked = true;
              clearTimeout(timeoutId);
              resolve(true);
            });
          }
        });
      };

      const releaseResource = (resource: any) => {
        if (resource.queue.length > 0) {
          const next = resource.queue.shift();
          next();
        } else {
          resource.locked = false;
        }
      };

      // Task 1: Acquire A then B with ordered acquisition to prevent deadlock
      const task1 = async () => {
        try {
          await acquireResource(resourceA, 'task1');
          await asyncOperation(10);
          await acquireResource(resourceB, 'task1');
          await asyncOperation(10);
          releaseResource(resourceB);
          releaseResource(resourceA);
          return 'task1-complete';
        } catch (error) {
          // Release any acquired resources on timeout
          releaseResource(resourceB);
          releaseResource(resourceA);
          throw error;
        }
      };

      // Task 2: Use same acquisition order to prevent deadlock (A then B)
      const task2 = async () => {
        try {
          await acquireResource(resourceA, 'task2');
          await asyncOperation(10);
          await acquireResource(resourceB, 'task2');
          await asyncOperation(10);
          releaseResource(resourceB);
          releaseResource(resourceA);
          return 'task2-complete';
        } catch (error) {
          // Release any acquired resources on timeout
          releaseResource(resourceB);
          releaseResource(resourceA);
          throw error;
        }
      };

      // Execute tasks with timeout handling
      const results = await Promise.allSettled([task1(), task2()]);

      const successfulTasks = results.filter(r => r.status === 'fulfilled');
      const failedTasks = results.filter(r => r.status === 'rejected');

      // Should have at least one successful task (deadlock prevention working)
      expect(successfulTasks.length).toBeGreaterThan(0);

      console.log(`Deadlock prevention: ${successfulTasks.length} successful, ${failedTasks.length} failed`);
    });

    it('should handle timeout-based deadlock prevention', async () => {
      const resourceTimeout = 500;

      const acquireResourceWithTimeout = async (resourceId: string, timeout: number) => {
        return Promise.race([
          asyncOperation(Math.random() * 200), // Simulate resource acquisition
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout acquiring ${resourceId}`)), timeout)
          )
        ]);
      };

      const tasks = Array.from({ length: 10 }, (_, i) =>
        acquireResourceWithTimeout(`resource-${i}`, resourceTimeout)
      );

      // All tasks should complete or timeout, but not deadlock
      const results = await Promise.allSettled(tasks);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        if (result.status === 'rejected') {
          expect(result.reason.message).toMatch(/Timeout|Operation failed/);
        }
      });
    });
  });

  describe('Resource Contention Tests', () => {
    it('should handle API rate limiting under load', async () => {
      const maxConcurrentCalls = 5;
      const totalCalls = 20;
      let activeCalls = 0;
      let maxActiveCalls = 0;

      const rateLimitedAPI = async (callId: string) => {
        if (activeCalls >= maxConcurrentCalls) {
          throw new Error('Rate limit exceeded');
        }

        activeCalls++;
        maxActiveCalls = Math.max(maxActiveCalls, activeCalls);

        try {
          await asyncOperation(50);
          return `Success: ${callId}`;
        } finally {
          activeCalls--;
        }
      };

      // Test with proper rate limiting
      const semaphore = Array.from({ length: maxConcurrentCalls }, () => Promise.resolve());
      let semaphoreIndex = 0;

      const rateLimitedCall = async (callId: string) => {
        const currentSemaphore = semaphoreIndex % maxConcurrentCalls;
        semaphoreIndex++;

        await semaphore[currentSemaphore];
        semaphore[currentSemaphore] = rateLimitedAPI(callId);

        return semaphore[currentSemaphore];
      };

      const promises = Array.from({ length: totalCalls }, (_, i) =>
        rateLimitedCall(`call-${i}`)
      );

      const results = await Promise.allSettled(promises);

      // Verify rate limiting worked
      expect(maxActiveCalls).toBeLessThanOrEqual(maxConcurrentCalls);

      // Count successful calls
      const successfulCalls = results.filter(r => r.status === 'fulfilled').length;
      expect(successfulCalls).toBeGreaterThan(0);
    });

    it('should manage memory usage during parallel processing', async () => {
      const initialMemory = process.memoryUsage();
      const largeDataSize = 1000;
      const concurrentTasks = 10;

      const memoryIntensiveTask = async (taskId: string) => {
        // Simulate processing large data
        const largeArray = new Array(largeDataSize).fill(0).map((_, i) => ({
          id: `${taskId}-${i}`,
          data: `large-data-${i}`.repeat(100)
        }));

        await asyncOperation(50);

        // Process data
        const processed = largeArray.map(item => ({
          ...item,
          processed: true,
          timestamp: Date.now()
        }));

        return processed.length;
      };

      const promises = Array.from({ length: concurrentTasks }, (_, i) =>
        memoryIntensiveTask(`task-${i}`)
      );

      const results = await Promise.all(promises);
      const finalMemory = process.memoryUsage();

      // Verify all tasks completed
      expect(results).toHaveLength(concurrentTasks);
      results.forEach(result => expect(result).toBe(largeDataSize));

      // Check memory usage (should not increase dramatically)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // Memory increase should be reasonable (less than 100MB for this test)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Load Testing', () => {
    it('should maintain performance under increasing load', async () => {
      const loadLevels = [1, 5, 10, 20, 50];
      const performanceResults: { load: number; avgTime: number; successRate: number }[] = [];

      for (const load of loadLevels) {
        const startTime = performance.now();
        const promises = Array.from({ length: load }, (_, i) =>
          asyncOperation(10 + Math.random() * 20, Math.random() < 0.05) // 5% failure rate
        );

        const results = await Promise.allSettled(promises);
        const endTime = performance.now();

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const avgTime = (endTime - startTime) / load;
        const successRate = successCount / load;

        performanceResults.push({
          load,
          avgTime,
          successRate
        });
      }

      // Verify performance doesn't degrade significantly
      const firstResult = performanceResults[0];
      const lastResult = performanceResults[performanceResults.length - 1];

      // Success rate should remain high
      expect(lastResult.successRate).toBeGreaterThan(0.8);

      // Average time per operation shouldn't increase too much
      const performanceDegradation = lastResult.avgTime / firstResult.avgTime;
      expect(performanceDegradation).toBeLessThan(3); // Less than 3x degradation

      console.log('Performance Results:', performanceResults);
    });

    it('should handle burst traffic patterns', async () => {
      const burstSize = 50;
      const burstInterval = 100; // ms between bursts
      const numBursts = 5;

      const burstResults: number[][] = [];

      for (let burst = 0; burst < numBursts; burst++) {
        if (burst > 0) {
          await asyncOperation(burstInterval);
        }

        const burstStart = performance.now();
        const promises = Array.from({ length: burstSize }, (_, i) =>
          asyncOperation(10 + Math.random() * 30)
        );

        const results = await Promise.allSettled(promises);
        const burstEnd = performance.now();

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const burstDuration = burstEnd - burstStart;

        burstResults.push([successCount, burstDuration]);
      }

      // Verify all bursts handled successfully
      burstResults.forEach(([successCount, duration], index) => {
        expect(successCount).toBeGreaterThan(burstSize * 0.8); // 80% success rate
        console.log(`Burst ${index + 1}: ${successCount}/${burstSize} success, ${duration.toFixed(2)}ms`);
      });
    });
  });

  describe('Error Handling in Parallel Execution', () => {
    it('should handle partial failures gracefully', async () => {
      const taskCount = 10;
      const failureRate = 0.3; // 30% of tasks will fail

      const unreliableTask = async (taskId: string) => {
        await asyncOperation(20 + Math.random() * 30);

        if (Math.random() < failureRate) {
          throw new Error(`Task ${taskId} failed randomly`);
        }

        return `Task ${taskId} completed`;
      };

      const promises = Array.from({ length: taskCount }, (_, i) =>
        unreliableTask(`task-${i}`)
      );

      const results = await Promise.allSettled(promises);

      const successes = results.filter(r => r.status === 'fulfilled');
      const failures = results.filter(r => r.status === 'rejected');

      // Should have some successes and some failures
      expect(successes.length).toBeGreaterThan(0);
      expect(failures.length).toBeGreaterThan(0);
      expect(successes.length + failures.length).toBe(taskCount);

      console.log(`Results: ${successes.length} successes, ${failures.length} failures`);
    });

    it('should implement retry mechanisms for failed operations', async () => {
      let attemptCounts = new Map<string, number>();
      const maxRetries = 3;
      const successThreshold = 0.7; // Succeed after 70% of max retries on average

      const flakyOperation = async (operationId: string) => {
        const attempts = attemptCounts.get(operationId) || 0;
        attemptCounts.set(operationId, attempts + 1);

        await asyncOperation(10);

        // Increase success probability with each attempt
        const successProbability = Math.min(attempts * 0.3, 0.9);

        if (Math.random() > successProbability) {
          throw new Error(`Operation ${operationId} failed on attempt ${attempts + 1}`);
        }

        return `Operation ${operationId} succeeded on attempt ${attempts + 1}`;
      };

      const withRetry = async (operationId: string, maxRetries: number) => {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await flakyOperation(operationId);
          } catch (error) {
            lastError = error as Error;
            if (attempt < maxRetries - 1) {
              await asyncOperation(50 * Math.pow(2, attempt)); // Exponential backoff
            }
          }
        }

        throw lastError;
      };

      const operationCount = 20;
      const promises = Array.from({ length: operationCount }, (_, i) =>
        withRetry(`op-${i}`, maxRetries)
      );

      const results = await Promise.allSettled(promises);
      const successes = results.filter(r => r.status === 'fulfilled');

      // Most operations should eventually succeed with retries
      expect(successes.length).toBeGreaterThan(operationCount * 0.8);

      // Verify retry attempts were made
      const totalAttempts = Array.from(attemptCounts.values()).reduce((sum, count) => sum + count, 0);
      expect(totalAttempts).toBeGreaterThan(operationCount); // More attempts than operations

      console.log(`Retry stats: ${successes.length}/${operationCount} success, total attempts: ${totalAttempts}`);
    });

    it('should handle circuit breaker pattern for failing services', async () => {
      let consecutiveFailures = 0;
      const failureThreshold = 5;
      const recoveryTimeout = 100;
      let circuitState: 'closed' | 'open' | 'half-open' = 'closed';
      let lastFailureTime = 0;

      const circuitBreakerService = async (requestId: string) => {
        const now = Date.now();

        // Check if circuit should move from open to half-open
        if (circuitState === 'open' && now - lastFailureTime > recoveryTimeout) {
          circuitState = 'half-open';
          consecutiveFailures = 0;
        }

        // Reject immediately if circuit is open
        if (circuitState === 'open') {
          throw new Error('Circuit breaker is open - service unavailable');
        }

        // Simulate service call
        await asyncOperation(10);

        // Simulate service being unreliable initially, then recovering
        const shouldFail = consecutiveFailures < failureThreshold && Math.random() < 0.8;

        if (shouldFail) {
          consecutiveFailures++;
          lastFailureTime = now;

          if (consecutiveFailures >= failureThreshold) {
            circuitState = 'open';
          }

          throw new Error(`Service failed for request ${requestId}`);
        } else {
          // Success - reset failure count and close circuit
          consecutiveFailures = 0;
          circuitState = 'closed';
          return `Request ${requestId} succeeded`;
        }
      };

      const requestCount = 20;
      const promises = Array.from({ length: requestCount }, async (_, i) => {
        try {
          await asyncOperation(i * 10); // Spread requests over time
          return await circuitBreakerService(`req-${i}`);
        } catch (error) {
          return error;
        }
      });

      const results = await Promise.all(promises);

      // Should have mix of failures and eventual successes
      const successes = results.filter(r => typeof r === 'string' && !r.includes('Error'));
      const circuitBreakerErrors = results.filter(r =>
        r instanceof Error && r.message.includes('Circuit breaker is open')
      );

      expect(circuitBreakerErrors.length).toBeGreaterThan(0); // Circuit breaker should have triggered
      console.log(`Circuit breaker results: ${successes.length} successes, ${circuitBreakerErrors.length} circuit breaker errors`);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should benchmark parallel vs sequential execution', async () => {
      const taskCount = 100;
      const taskDuration = 10; // ms per task

      // Sequential execution
      const sequentialStart = performance.now();
      const sequentialResults = [];
      for (let i = 0; i < taskCount; i++) {
        const result = await asyncOperation(taskDuration);
        sequentialResults.push(result);
      }
      const sequentialEnd = performance.now();
      const sequentialTime = sequentialEnd - sequentialStart;

      // Parallel execution (with concurrency limit)
      const concurrencyLimit = 10;
      const parallelStart = performance.now();

      const executeWithConcurrencyLimit = async (tasks: (() => Promise<any>)[], limit: number) => {
        const results = [];
        for (let i = 0; i < tasks.length; i += limit) {
          const batch = tasks.slice(i, i + limit);
          const batchResults = await Promise.all(batch.map(task => task()));
          results.push(...batchResults);
        }
        return results;
      };

      const tasks = Array.from({ length: taskCount }, (_, i) =>
        () => asyncOperation(taskDuration)
      );

      const parallelResults = await executeWithConcurrencyLimit(tasks, concurrencyLimit);
      const parallelEnd = performance.now();
      const parallelTime = parallelEnd - parallelStart;

      // Verify results
      expect(sequentialResults).toHaveLength(taskCount);
      expect(parallelResults).toHaveLength(taskCount);

      // Parallel should be significantly faster
      const speedup = sequentialTime / parallelTime;
      expect(speedup).toBeGreaterThan(5); // At least 5x speedup expected

      console.log(`Performance comparison:
        Sequential: ${sequentialTime.toFixed(2)}ms
        Parallel: ${parallelTime.toFixed(2)}ms
        Speedup: ${speedup.toFixed(2)}x`);
    });

    it('should measure throughput under different concurrency levels', async () => {
      const concurrencyLevels = [1, 2, 5, 10, 20, 50];
      const totalTasks = 200;
      const taskDuration = 10;

      const throughputResults = [];

      for (const concurrency of concurrencyLevels) {
        const start = performance.now();

        const executeConcurrent = async (tasks: (() => Promise<any>)[], concurrencyLimit: number) => {
          const results = [];
          const executing = new Set();

          for (const task of tasks) {
            if (executing.size >= concurrencyLimit) {
              await Promise.race(Array.from(executing));
            }

            const promise = task().finally(() => executing.delete(promise));
            executing.add(promise);
            results.push(promise);
          }

          return Promise.all(results);
        };

        const tasks = Array.from({ length: totalTasks }, () =>
          () => asyncOperation(taskDuration)
        );

        await executeConcurrent(tasks, concurrency);

        const end = performance.now();
        const duration = end - start;
        const throughput = totalTasks / (duration / 1000); // tasks per second

        throughputResults.push({
          concurrency,
          duration,
          throughput
        });
      }

      // Find optimal concurrency level
      const maxThroughput = Math.max(...throughputResults.map(r => r.throughput));
      const optimalResult = throughputResults.find(r => r.throughput === maxThroughput);

      expect(optimalResult).toBeDefined();
      console.log('Throughput Results:', throughputResults);
      console.log(`Optimal concurrency: ${optimalResult?.concurrency} (${maxThroughput.toFixed(2)} tasks/sec)`);
    });
  });

  describe('Integration Tests with AI Services', () => {
    it('should handle parallel AI service calls', async () => {
      // Mock AI service responses
      mockGeminiService.extractTextFromPDF.mockImplementation(async (pdf: string) => {
        await asyncOperation(100 + Math.random() * 100);
        return `Extracted text from PDF: ${pdf.substring(0, 10)}...`;
      });

      mockGeminiService.parseReservationData.mockImplementation(async (text: string) => {
        await asyncOperation(50 + Math.random() * 50);
        return {
          guestName: 'Test Guest',
          checkInDate: '2025-01-01',
          checkOutDate: '2025-01-03',
          extractedFrom: text.substring(0, 20)
        };
      });

      const documents = Array.from({ length: 5 }, (_, i) => `pdf-document-${i}-data`);

      // Process documents in parallel
      const startTime = performance.now();
      const promises = documents.map(async (pdf) => {
        const text = await mockGeminiService.extractTextFromPDF(pdf);
        const data = await mockGeminiService.parseReservationData(text);
        return { pdf: pdf.substring(0, 20), text, data };
      });

      const results = await Promise.all(promises);
      const endTime = performance.now();

      // Verify all documents processed
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.pdf).toContain(`pdf-document-${index}`);
        expect(result.data.guestName).toBe('Test Guest');
      });

      // Verify parallel execution was faster than sequential would be
      const parallelTime = endTime - startTime;
      const expectedSequentialTime = 5 * (150 + 75); // 5 docs * (max text + max parse time)

      expect(parallelTime).toBeLessThan(expectedSequentialTime * 0.8); // At least 20% faster

      console.log(`Parallel AI processing: ${parallelTime.toFixed(2)}ms for 5 documents`);
    });

    it('should handle database connection pooling under load', async () => {
      const maxConnections = 5;
      let activeConnections = 0;
      const connectionPool: boolean[] = new Array(maxConnections).fill(false);

      const acquireConnection = async (): Promise<number> => {
        return new Promise((resolve, reject) => {
          const checkForConnection = () => {
            const availableIndex = connectionPool.findIndex(conn => !conn);
            if (availableIndex !== -1) {
              connectionPool[availableIndex] = true;
              activeConnections++;
              resolve(availableIndex);
            } else {
              setTimeout(checkForConnection, 10);
            }
          };
          checkForConnection();
        });
      };

      const releaseConnection = (index: number) => {
        connectionPool[index] = false;
        activeConnections--;
      };

      const databaseOperation = async (operationId: string) => {
        const connectionIndex = await acquireConnection();

        try {
          await asyncOperation(50 + Math.random() * 100); // Simulate DB operation
          return `Operation ${operationId} completed on connection ${connectionIndex}`;
        } finally {
          releaseConnection(connectionIndex);
        }
      };

      const operationCount = 20;
      const promises = Array.from({ length: operationCount }, (_, i) =>
        databaseOperation(`db-op-${i}`)
      );

      const results = await Promise.allSettled(promises);

      // Verify all operations completed
      const successes = results.filter(r => r.status === 'fulfilled');
      expect(successes.length).toBe(operationCount);

      // Verify connection pool wasn't exceeded
      expect(activeConnections).toBe(0); // All connections should be released

      console.log(`Database operations completed: ${successes.length}/${operationCount}`);
    });
  });
});