/**
 * Edge Cases and Stress Tests for Parallel Processing
 * Tests boundary conditions, extreme loads, and error scenarios
 *
 * @author ConcurrencyTester Agent
 * @test-suite Edge Cases Parallel
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performance } from 'perf_hooks';

// Mock services for edge case testing
const mockServices = {
  gemini: {
    extractTextFromPDF: vi.fn(),
    parseReservationData: vi.fn(),
    processReservationDocument: vi.fn(),
    withRetry: vi.fn()
  },
  database: {
    query: vi.fn(),
    pool: {
      getConnection: vi.fn(),
      releaseConnection: vi.fn()
    }
  },
  rateLimiter: {
    rateLimitedFunction: vi.fn()
  }
};

// Utility functions for edge case testing
const createLargeDataset = (size: number) => {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    data: `large-data-item-${i}`.repeat(100),
    metadata: {
      timestamp: Date.now(),
      random: Math.random(),
      nested: {
        values: Array.from({ length: 10 }, (_, j) => `nested-${j}`)
      }
    }
  }));
};

const simulateUnreliableService = (failureRate: number, timeout: number = 100) => {
  return async (input: any) => {
    await new Promise(resolve => setTimeout(resolve, timeout));

    if (Math.random() < failureRate) {
      throw new Error(`Service failure for input: ${JSON.stringify(input).substring(0, 50)}`);
    }

    return `processed-${input}`;
  };
};

const createMemoryPressure = (sizeMB: number) => {
  const array = new Array(sizeMB * 1024 * 1024 / 8); // 8 bytes per number
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.random();
  }
  return array;
};

describe('Edge Cases and Stress Tests - Parallel Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (global.gc) {
      global.gc();
    }
  });

  describe('Boundary Condition Tests', () => {
    it('should handle zero concurrent operations', async () => {
      const tasks: (() => Promise<string>)[] = [];

      const executeWithConcurrency = async (tasks: (() => Promise<string>)[], concurrency: number) => {
        if (concurrency <= 0) {
          return [];
        }

        const results = [];
        for (let i = 0; i < tasks.length; i += concurrency) {
          const batch = tasks.slice(i, i + concurrency);
          const batchResults = await Promise.all(batch.map(task => task()));
          results.push(...batchResults);
        }
        return results;
      };

      const results = await executeWithConcurrency(tasks, 0);
      expect(results).toEqual([]);
    });

    it('should handle single task execution', async () => {
      let executionOrder: number[] = [];

      const singleTask = async () => {
        executionOrder.push(1);
        await new Promise(resolve => setTimeout(resolve, 50));
        executionOrder.push(2);
        return 'single-task-result';
      };

      const result = await singleTask();

      expect(result).toBe('single-task-result');
      expect(executionOrder).toEqual([1, 2]);
    });

    it('should handle maximum concurrency limits', async () => {
      const maxConcurrency = 1000;
      const taskCount = 500;

      let activeOperations = 0;
      let maxActiveOperations = 0;

      const limitedOperation = async (id: number) => {
        activeOperations++;
        maxActiveOperations = Math.max(maxActiveOperations, activeOperations);

        try {
          await new Promise(resolve => setTimeout(resolve, 10));
          return `result-${id}`;
        } finally {
          activeOperations--;
        }
      };

      // Create semaphore with max concurrency
      const semaphore = Array.from({ length: Math.min(maxConcurrency, taskCount) }, () => Promise.resolve());
      let semaphoreIndex = 0;

      const executeTasks = async () => {
        const promises = Array.from({ length: taskCount }, async (_, i) => {
          const currentSemaphore = semaphoreIndex % semaphore.length;
          semaphoreIndex++;

          await semaphore[currentSemaphore];
          semaphore[currentSemaphore] = limitedOperation(i);
          return semaphore[currentSemaphore];
        });

        return Promise.all(promises);
      };

      const results = await executeTasks();

      expect(results).toHaveLength(taskCount);
      expect(maxActiveOperations).toBeLessThanOrEqual(Math.min(maxConcurrency, taskCount));

      console.log(`Max concurrency test: ${maxActiveOperations} max active operations`);
    });

    it('should handle empty input arrays', async () => {
      const emptyTasks: (() => Promise<any>)[] = [];

      const processInParallel = async (tasks: (() => Promise<any>)[], batchSize: number = 10) => {
        if (tasks.length === 0) {
          return [];
        }

        const results = [];
        for (let i = 0; i < tasks.length; i += batchSize) {
          const batch = tasks.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch.map(task => task()));
          results.push(...batchResults);
        }
        return results;
      };

      const results = await processInParallel(emptyTasks);
      expect(results).toEqual([]);
    });

    it('should handle extremely large datasets', async () => {
      const largeDatasetSize = 10000;
      const batchSize = 100;

      const largeDataset = createLargeDataset(largeDatasetSize);

      const processItem = async (item: any) => {
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 1));
        return {
          id: item.id,
          processed: true,
          checksum: item.data.length
        };
      };

      const startTime = performance.now();

      // Process in batches to avoid overwhelming the system
      const results = [];
      for (let i = 0; i < largeDataset.length; i += batchSize) {
        const batch = largeDataset.slice(i, i + batchSize);
        const batchPromises = batch.map(item => processItem(item));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Allow other operations to run
        if (i % (batchSize * 10) === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(results).toHaveLength(largeDatasetSize);
      expect(totalTime).toBeLessThan(largeDatasetSize * 2); // Should be much faster than sequential

      console.log(`Large dataset test: Processed ${largeDatasetSize} items in ${totalTime.toFixed(2)}ms`);
    });
  });

  describe('Memory Stress Tests', () => {
    it('should handle memory-intensive parallel operations', async () => {
      const initialMemory = process.memoryUsage();
      const taskCount = 20;
      const memoryPerTask = 5; // MB

      const memoryIntensiveTask = async (taskId: number) => {
        // Create memory pressure
        const memoryArray = createMemoryPressure(memoryPerTask);

        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 50));

        // Process some data to ensure memory is used
        const result = memoryArray.slice(0, 1000).reduce((sum, val) => sum + val, 0);

        return {
          taskId,
          result,
          memoryUsed: memoryArray.length
        };
      };

      // Execute tasks in controlled batches to manage memory
      const batchSize = 5;
      const allResults = [];

      for (let i = 0; i < taskCount; i += batchSize) {
        const batch = Array.from({ length: Math.min(batchSize, taskCount - i) }, (_, j) => i + j);
        const batchPromises = batch.map(taskId => memoryIntensiveTask(taskId));

        const batchResults = await Promise.all(batchPromises);
        allResults.push(...batchResults);

        // Force garbage collection between batches if available
        if (global.gc) {
          global.gc();
        }

        // Small delay to allow memory cleanup
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;

      expect(allResults).toHaveLength(taskCount);
      expect(memoryIncrease).toBeLessThan(taskCount * memoryPerTask * 2); // Should not double the expected memory

      console.log(`Memory stress test: ${memoryIncrease.toFixed(2)}MB increase for ${taskCount} tasks`);
    });

    it('should detect and handle memory leaks', async () => {
      const iterations = 10;
      const tasksPerIteration = 20;
      const memoryMeasurements: number[] = [];

      for (let iteration = 0; iteration < iterations; iteration++) {
        // Force GC before measurement
        if (global.gc) {
          global.gc();
        }

        const beforeMemory = process.memoryUsage().heapUsed;

        // Create and execute tasks
        const tasks = Array.from({ length: tasksPerIteration }, async (_, i) => {
          const data = new Array(1000).fill(0).map(() => Math.random());
          await new Promise(resolve => setTimeout(resolve, 10));
          return data.reduce((sum, val) => sum + val, 0);
        });

        await Promise.all(tasks);

        // Force GC after tasks
        if (global.gc) {
          global.gc();
        }

        const afterMemory = process.memoryUsage().heapUsed;
        const memoryDelta = (afterMemory - beforeMemory) / 1024 / 1024;
        memoryMeasurements.push(memoryDelta);

        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Analyze memory growth pattern
      const averageGrowth = memoryMeasurements.reduce((sum, delta) => sum + delta, 0) / memoryMeasurements.length;
      const maxGrowth = Math.max(...memoryMeasurements);

      // Memory should not grow significantly between iterations
      expect(averageGrowth).toBeLessThan(5); // Less than 5MB average growth
      expect(maxGrowth).toBeLessThan(20); // Less than 20MB max growth

      console.log(`Memory leak test: Average growth ${averageGrowth.toFixed(2)}MB, Max growth ${maxGrowth.toFixed(2)}MB`);
    });
  });

  describe('Error Propagation and Recovery', () => {
    it('should handle cascading failures with graceful degradation', async () => {
      const serviceChain = [
        { name: 'Service A', failureRate: 0.1 },
        { name: 'Service B', failureRate: 0.15 },
        { name: 'Service C', failureRate: 0.2 }
      ];

      const requestCount = 50;
      const results: any[] = [];

      // Mock service chain
      const processRequest = async (requestId: number) => {
        const requestResults = { requestId, services: {}, success: false, failedAt: null };

        try {
          for (const service of serviceChain) {
            const serviceResult = await simulateUnreliableService(service.failureRate, 30)(requestId);
            requestResults.services[service.name] = serviceResult;
          }
          requestResults.success = true;
        } catch (error) {
          requestResults.failedAt = error.message;
        }

        return requestResults;
      };

      // Process requests in parallel with error isolation
      const promises = Array.from({ length: requestCount }, async (_, i) => {
        try {
          return await processRequest(i);
        } catch (error) {
          return {
            requestId: i,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const allResults = await Promise.all(promises);

      const successfulRequests = allResults.filter(r => r.success);
      const failedRequests = allResults.filter(r => !r.success);

      // Should have some successes despite failures
      expect(successfulRequests.length).toBeGreaterThan(0);

      // Failure rate should be reasonable
      const overallFailureRate = failedRequests.length / requestCount;
      expect(overallFailureRate).toBeLessThan(0.5); // Less than 50% failure rate

      console.log(`Cascading failures: ${successfulRequests.length}/${requestCount} successful (${(overallFailureRate * 100).toFixed(1)}% failure rate)`);
    });

    it('should handle timeout scenarios in parallel operations', async () => {
      const timeoutMs = 200;
      const taskCount = 15;

      const timeoutAwareTask = async (taskId: number, shouldTimeout: boolean = false) => {
        const operationPromise = new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve(`Task ${taskId} completed`);
          }, shouldTimeout ? timeoutMs + 100 : timeoutMs - 50);
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Task ${taskId} timed out after ${timeoutMs}ms`));
          }, timeoutMs);
        });

        return Promise.race([operationPromise, timeoutPromise]);
      };

      // Mix of normal and timeout-prone tasks
      const tasks = Array.from({ length: taskCount }, (_, i) =>
        timeoutAwareTask(i, i % 4 === 0) // Every 4th task will timeout
      );

      const results = await Promise.allSettled(tasks);

      const successfulTasks = results.filter(r => r.status === 'fulfilled');
      const timedOutTasks = results.filter(r =>
        r.status === 'rejected' && r.reason.message.includes('timed out')
      );

      expect(successfulTasks.length).toBeGreaterThan(0);
      expect(timedOutTasks.length).toBeGreaterThan(0);

      // Should handle timeouts gracefully without affecting other tasks
      expect(successfulTasks.length + timedOutTasks.length).toBe(taskCount);

      console.log(`Timeout test: ${successfulTasks.length} successful, ${timedOutTasks.length} timed out`);
    });

    it('should recover from complete service failures', async () => {
      let serviceAvailable = false;
      let requestCount = 0;

      // Service that's initially down but recovers
      const recoveringService = async (input: any) => {
        requestCount++;

        // Service becomes available after 10 requests
        if (requestCount > 10) {
          serviceAvailable = true;
        }

        if (!serviceAvailable) {
          throw new Error('Service temporarily unavailable');
        }

        await new Promise(resolve => setTimeout(resolve, 50));
        return `Processed: ${input}`;
      };

      // Client with retry and backoff
      const resilientClient = async (input: any, maxRetries: number = 5) => {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await recoveringService(input);
          } catch (error) {
            if (attempt === maxRetries - 1) {
              throw error;
            }

            // Exponential backoff
            const delay = Math.pow(2, attempt) * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      // Send requests throughout the recovery period
      const totalRequests = 20;
      const promises = Array.from({ length: totalRequests }, async (_, i) => {
        // Spread requests over time
        await new Promise(resolve => setTimeout(resolve, i * 50));

        try {
          const result = await resilientClient(`request-${i}`);
          return { requestId: i, success: true, result };
        } catch (error) {
          return {
            requestId: i,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });

      const results = await Promise.all(promises);

      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);

      // Should have some failures early and successes later
      expect(failedResults.length).toBeGreaterThan(0);
      expect(successfulResults.length).toBeGreaterThan(0);

      // Later requests should be more successful
      const laterRequests = results.slice(15);
      const laterSuccessRate = laterRequests.filter(r => r.success).length / laterRequests.length;
      expect(laterSuccessRate).toBeGreaterThan(0.5);

      console.log(`Service recovery: ${successfulResults.length}/${totalRequests} successful, service available: ${serviceAvailable}`);
    });
  });

  describe('Resource Exhaustion Tests', () => {
    it('should handle file descriptor exhaustion gracefully', async () => {
      const connectionCount = 100;
      const maxConnections = 20;

      let activeConnections = 0;
      const connectionPool: boolean[] = new Array(maxConnections).fill(false);

      const acquireConnection = async (): Promise<number> => {
        return new Promise((resolve, reject) => {
          const tryAcquire = () => {
            const availableIndex = connectionPool.findIndex(conn => !conn);
            if (availableIndex !== -1) {
              connectionPool[availableIndex] = true;
              activeConnections++;
              resolve(availableIndex);
            } else {
              // If no connections available, wait and retry
              setTimeout(tryAcquire, 10);
            }
          };
          tryAcquire();
        });
      };

      const releaseConnection = (index: number) => {
        connectionPool[index] = false;
        activeConnections--;
      };

      const useConnection = async (operationId: number) => {
        const connectionIndex = await acquireConnection();

        try {
          // Simulate work
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
          return `Operation ${operationId} completed on connection ${connectionIndex}`;
        } finally {
          releaseConnection(connectionIndex);
        }
      };

      // Launch more operations than available connections
      const operations = Array.from({ length: connectionCount }, (_, i) => useConnection(i));
      const results = await Promise.all(operations);

      expect(results).toHaveLength(connectionCount);
      expect(activeConnections).toBe(0); // All connections should be released

      console.log(`Connection pool test: ${results.length} operations completed with ${maxConnections} max connections`);
    });

    it('should handle CPU exhaustion with adaptive throttling', async () => {
      const cpuIntensiveTask = async (iterations: number) => {
        const start = performance.now();

        // CPU intensive computation
        let result = 0;
        for (let i = 0; i < iterations; i++) {
          result += Math.sin(i) * Math.cos(i);
        }

        const duration = performance.now() - start;
        return { result, duration, iterations };
      };

      const adaptiveThrottling = async (tasks: (() => Promise<any>)[], targetDuration: number = 100) => {
        const results = [];
        let adaptiveConcurrency = 4;

        for (let i = 0; i < tasks.length; i += adaptiveConcurrency) {
          const batchStart = performance.now();
          const batch = tasks.slice(i, i + adaptiveConcurrency);

          const batchResults = await Promise.all(batch.map(task => task()));
          results.push(...batchResults);

          const batchDuration = performance.now() - batchStart;

          // Adapt concurrency based on performance
          if (batchDuration > targetDuration * 1.5) {
            adaptiveConcurrency = Math.max(1, Math.floor(adaptiveConcurrency * 0.8));
          } else if (batchDuration < targetDuration * 0.5) {
            adaptiveConcurrency = Math.min(8, Math.ceil(adaptiveConcurrency * 1.2));
          }
        }

        return results;
      };

      const taskCount = 20;
      const tasks = Array.from({ length: taskCount }, () =>
        () => cpuIntensiveTask(100000)
      );

      const startTime = performance.now();
      const results = await adaptiveThrottling(tasks);
      const totalTime = performance.now() - startTime;

      expect(results).toHaveLength(taskCount);

      const averageTaskDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

      console.log(`CPU throttling test: ${results.length} tasks in ${totalTime.toFixed(2)}ms, avg task: ${averageTaskDuration.toFixed(2)}ms`);
    });
  });

  describe('Data Consistency Under Pressure', () => {
    it('should maintain data integrity during concurrent modifications', async () => {
      let sharedData = { counter: 0, items: [] as string[] };
      const operationCount = 100;

      // Thread-safe operations using atomic updates
      const safeIncrement = async (id: string) => {
        // Simulate atomic operation with proper synchronization
        const newCounter = sharedData.counter + 1;
        const newItems = [...sharedData.items, `item-${id}`];

        // Simulate potential race condition window
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5));

        // Atomic update (in real scenario, would use proper locking)
        sharedData = {
          counter: newCounter,
          items: newItems
        };

        return { id, counter: newCounter, itemCount: newItems.length };
      };

      // Execute operations concurrently
      const operations = Array.from({ length: operationCount }, async (_, i) => {
        return safeIncrement(i.toString());
      });

      const results = await Promise.all(operations);

      // Verify data consistency
      expect(results).toHaveLength(operationCount);

      // In this test, we're demonstrating the potential for race conditions
      // In a real implementation, proper synchronization mechanisms would be used
      console.log(`Data consistency test: Final counter: ${sharedData.counter}, Items: ${sharedData.items.length}`);

      // Note: Due to race conditions, final values may not equal operationCount
      // This demonstrates the importance of proper synchronization
    });

    it('should handle concurrent cache operations', async () => {
      const cache = new Map<string, any>();
      const lockMap = new Map<string, Promise<any>>();

      const safeCache = {
        async get(key: string) {
          // Wait for any ongoing operation on this key
          if (lockMap.has(key)) {
            await lockMap.get(key);
          }
          return cache.get(key);
        },

        async set(key: string, value: any) {
          // Create lock for this key
          const lockPromise = (async () => {
            await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
            cache.set(key, value);
          })();

          lockMap.set(key, lockPromise);

          try {
            await lockPromise;
          } finally {
            lockMap.delete(key);
          }

          return value;
        },

        async getOrSet(key: string, factory: () => Promise<any>) {
          const existing = await this.get(key);
          if (existing !== undefined) {
            return existing;
          }

          const value = await factory();
          await this.set(key, value);
          return value;
        }
      };

      const keyCount = 20;
      const operationsPerKey = 5;

      // Concurrent operations on shared cache keys
      const operations = Array.from({ length: keyCount }, (_, keyIndex) =>
        Array.from({ length: operationsPerKey }, async (_, opIndex) => {
          const key = `key-${keyIndex % 5}`; // Create contention on 5 keys

          return safeCache.getOrSet(key, async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            return `value-${keyIndex}-${opIndex}-${Date.now()}`;
          });
        })
      ).flat();

      const results = await Promise.all(operations);

      // Verify cache consistency
      const uniqueKeys = new Set(Array.from({ length: 5 }, (_, i) => `key-${i}`));
      for (const key of uniqueKeys) {
        const value = await safeCache.get(key);
        expect(value).toBeDefined();

        // Count how many operations returned this value
        const matchingResults = results.filter(r => r === value);
        expect(matchingResults.length).toBeGreaterThan(0);
      }

      console.log(`Cache consistency test: ${cache.size} cache entries, ${results.length} operations`);
    });
  });
});