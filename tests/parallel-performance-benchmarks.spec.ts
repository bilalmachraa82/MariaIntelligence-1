/**
 * Performance Benchmarks for Parallel Processing
 * Measures and validates performance improvements under various conditions
 *
 * @author ConcurrencyTester Agent
 * @test-suite Performance Benchmarks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performance } from 'perf_hooks';

// Performance measurement utilities
class PerformanceProfiler {
  private measurements: Map<string, number[]> = new Map();

  startMeasurement(name: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      const existing = this.measurements.get(name) || [];
      existing.push(duration);
      this.measurements.set(name, existing);
      return duration;
    };
  }

  getStats(name: string) {
    const durations = this.measurements.get(name) || [];
    if (durations.length === 0) return null;

    const sorted = [...durations].sort((a, b) => a - b);
    return {
      count: durations.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  reset() {
    this.measurements.clear();
  }
}

// Memory monitoring utilities
class MemoryMonitor {
  private baseline: NodeJS.MemoryUsage;

  constructor() {
    this.baseline = process.memoryUsage();
  }

  getCurrentUsage() {
    const current = process.memoryUsage();
    return {
      heapUsed: current.heapUsed - this.baseline.heapUsed,
      heapTotal: current.heapTotal - this.baseline.heapTotal,
      external: current.external - this.baseline.external,
      rss: current.rss - this.baseline.rss
    };
  }

  reset() {
    this.baseline = process.memoryUsage();
  }
}

// CPU monitoring utilities
class CPUMonitor {
  private startUsage: NodeJS.CpuUsage;

  constructor() {
    this.startUsage = process.cpuUsage();
  }

  getCurrentUsage() {
    const current = process.cpuUsage(this.startUsage);
    return {
      userCPU: current.user / 1000000, // Convert to seconds
      systemCPU: current.system / 1000000,
      totalCPU: (current.user + current.system) / 1000000
    };
  }

  reset() {
    this.startUsage = process.cpuUsage();
  }
}

// Workload simulation utilities
const createComputeIntensiveTask = (complexity: number) => {
  return async (): Promise<number> => {
    let result = 0;
    for (let i = 0; i < complexity * 1000; i++) {
      result += Math.sin(i) * Math.cos(i);
    }
    return result;
  };
};

const createIOIntensiveTask = (duration: number, size: number = 1000) => {
  return async (): Promise<string> => {
    // Simulate I/O with Promise and data generation
    await new Promise(resolve => setTimeout(resolve, duration));

    // Generate data to simulate I/O result
    const data = Array.from({ length: size }, (_, i) =>
      `data-item-${i}-${Math.random().toString(36).substring(2)}`
    ).join(',');

    return data;
  };
};

const createMemoryIntensiveTask = (dataSize: number) => {
  return async (): Promise<number> => {
    // Create large data structures
    const largeArray = new Array(dataSize).fill(0).map((_, i) => ({
      id: i,
      data: `item-${i}`.repeat(100),
      timestamp: Date.now(),
      metadata: {
        processed: false,
        priority: Math.random(),
        tags: Array.from({ length: 10 }, (_, j) => `tag-${j}`)
      }
    }));

    // Process data
    const processed = largeArray.map(item => ({
      ...item,
      metadata: {
        ...item.metadata,
        processed: true,
        processedAt: Date.now()
      }
    }));

    // Simulate async processing
    await new Promise(resolve => setTimeout(resolve, 10));

    return processed.length;
  };
};

describe('Parallel Processing Performance Benchmarks', () => {
  let profiler: PerformanceProfiler;
  let memoryMonitor: MemoryMonitor;
  let cpuMonitor: CPUMonitor;

  beforeEach(() => {
    profiler = new PerformanceProfiler();
    memoryMonitor = new MemoryMonitor();
    cpuMonitor = new CPUMonitor();
  });

  afterEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('CPU-Bound Task Benchmarks', () => {
    it('should show optimal parallelization for CPU-intensive tasks', async () => {
      const complexityLevels = [10, 50, 100];
      const concurrencyLevels = [1, 2, 4, 8];
      const results: any[] = [];

      for (const complexity of complexityLevels) {
        for (const concurrency of concurrencyLevels) {
          memoryMonitor.reset();
          cpuMonitor.reset();

          const endMeasurement = profiler.startMeasurement(`cpu-${complexity}-${concurrency}`);

          // Create tasks
          const taskCount = 20;
          const tasks = Array.from({ length: taskCount }, () =>
            createComputeIntensiveTask(complexity)
          );

          // Execute with limited concurrency
          const executeBatch = async <T>(tasks: (() => Promise<T>)[], batchSize: number): Promise<T[]> => {
            const results: T[] = [];
            for (let i = 0; i < tasks.length; i += batchSize) {
              const batch = tasks.slice(i, i + batchSize);
              const batchResults = await Promise.all(batch.map(task => task()));
              results.push(...batchResults);
            }
            return results;
          };

          const taskResults = await executeBatch(tasks, concurrency);
          const duration = endMeasurement();

          const memoryUsage = memoryMonitor.getCurrentUsage();
          const cpuUsage = cpuMonitor.getCurrentUsage();

          results.push({
            complexity,
            concurrency,
            duration,
            tasksCompleted: taskResults.length,
            throughput: taskResults.length / (duration / 1000),
            memoryUsage: memoryUsage.heapUsed / 1024 / 1024, // MB
            cpuUsage: cpuUsage.totalCPU
          });
        }
      }

      // Analyze results
      results.forEach(result => {
        expect(result.tasksCompleted).toBe(20);
        expect(result.throughput).toBeGreaterThan(0);
      });

      // Find optimal concurrency for each complexity level
      complexityLevels.forEach(complexity => {
        const complexityResults = results.filter(r => r.complexity === complexity);
        const maxThroughput = Math.max(...complexityResults.map(r => r.throughput));
        const optimal = complexityResults.find(r => r.throughput === maxThroughput);

        console.log(`Complexity ${complexity}: Optimal concurrency ${optimal?.concurrency} (${maxThroughput.toFixed(2)} tasks/sec)`);
      });

      // Verify that parallel execution improves performance
      const sequentialResults = results.filter(r => r.concurrency === 1);
      const parallelResults = results.filter(r => r.concurrency > 1);

      sequentialResults.forEach(seqResult => {
        const bestParallel = parallelResults
          .filter(r => r.complexity === seqResult.complexity)
          .reduce((best, current) => current.throughput > best.throughput ? current : best);

        const speedup = bestParallel.throughput / seqResult.throughput;
        expect(speedup).toBeGreaterThan(1.5); // At least 50% improvement

        console.log(`Complexity ${seqResult.complexity}: ${speedup.toFixed(2)}x speedup with parallelization`);
      });
    });

    it('should measure scalability limits', async () => {
      const concurrencyLevels = [1, 2, 4, 8, 16, 32, 64];
      const taskCount = 100;
      const complexity = 50;

      const scalabilityResults = [];

      for (const concurrency of concurrencyLevels) {
        const endMeasurement = profiler.startMeasurement(`scalability-${concurrency}`);

        const tasks = Array.from({ length: taskCount }, () =>
          createComputeIntensiveTask(complexity)
        );

        // Execute with semaphore pattern
        let running = 0;
        const semaphore = async <T>(task: () => Promise<T>): Promise<T> => {
          while (running >= concurrency) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
          running++;
          try {
            return await task();
          } finally {
            running--;
          }
        };

        const promises = tasks.map(task => semaphore(task));
        const results = await Promise.all(promises);

        const duration = endMeasurement();
        const throughput = results.length / (duration / 1000);

        scalabilityResults.push({
          concurrency,
          duration,
          throughput,
          efficiency: throughput / concurrency // Throughput per concurrent slot
        });
      }

      // Find efficiency sweet spot
      const maxEfficiency = Math.max(...scalabilityResults.map(r => r.efficiency));
      const optimalPoint = scalabilityResults.find(r => r.efficiency === maxEfficiency);

      console.log('Scalability Results:', scalabilityResults);
      console.log(`Optimal concurrency: ${optimalPoint?.concurrency} (efficiency: ${maxEfficiency.toFixed(2)})`);

      // Verify that efficiency doesn't drop too dramatically at high concurrency
      const highConcurrencyResults = scalabilityResults.filter(r => r.concurrency >= 16);
      highConcurrencyResults.forEach(result => {
        expect(result.efficiency).toBeGreaterThan(maxEfficiency * 0.3); // At least 30% of peak efficiency
      });
    });
  });

  describe('I/O-Bound Task Benchmarks', () => {
    it('should optimize I/O-intensive parallel execution', async () => {
      const ioDurations = [10, 50, 100]; // ms
      const concurrencyLevels = [1, 5, 10, 20, 50];
      const taskCount = 50;

      const ioResults = [];

      for (const ioDuration of ioDurations) {
        for (const concurrency of concurrencyLevels) {
          const endMeasurement = profiler.startMeasurement(`io-${ioDuration}-${concurrency}`);

          const tasks = Array.from({ length: taskCount }, (_, i) =>
            createIOIntensiveTask(ioDuration, 100)
          );

          // Use Promise pool for I/O tasks
          const executeWithPool = async <T>(tasks: (() => Promise<T>)[], poolSize: number): Promise<T[]> => {
            const results: T[] = [];
            const pool: Promise<any>[] = [];

            for (const task of tasks) {
              if (pool.length >= poolSize) {
                const completed = await Promise.race(pool);
                pool.splice(pool.indexOf(completed), 1);
              }

              const promise = task().then(result => {
                results.push(result);
                return promise;
              });
              pool.push(promise);
            }

            await Promise.all(pool);
            return results;
          };

          const results = await executeWithPool(tasks, concurrency);
          const duration = endMeasurement();

          ioResults.push({
            ioDuration,
            concurrency,
            duration,
            throughput: results.length / (duration / 1000),
            theoreticalMin: Math.max(ioDuration, (taskCount * ioDuration) / concurrency)
          });
        }
      }

      // Analyze I/O performance
      ioDurations.forEach(ioDuration => {
        const durationResults = ioResults.filter(r => r.ioDuration === ioDuration);
        const maxThroughput = Math.max(...durationResults.map(r => r.throughput));
        const optimal = durationResults.find(r => r.throughput === maxThroughput);

        console.log(`I/O Duration ${ioDuration}ms: Optimal concurrency ${optimal?.concurrency} (${maxThroughput.toFixed(2)} tasks/sec)`);

        // For I/O bound tasks, higher concurrency should generally be better
        const sequential = durationResults.find(r => r.concurrency === 1);
        const highConcurrency = durationResults.find(r => r.concurrency === 50);

        if (sequential && highConcurrency) {
          const speedup = highConcurrency.throughput / sequential.throughput;
          expect(speedup).toBeGreaterThan(10); // I/O should scale very well

          console.log(`I/O Duration ${ioDuration}ms: ${speedup.toFixed(2)}x speedup with high concurrency`);
        }
      });
    });

    it('should handle mixed I/O and CPU workloads', async () => {
      const workloadMixes = [
        { cpuRatio: 1.0, ioRatio: 0.0, name: 'CPU-only' },
        { cpuRatio: 0.8, ioRatio: 0.2, name: 'CPU-heavy' },
        { cpuRatio: 0.5, ioRatio: 0.5, name: 'Mixed' },
        { cpuRatio: 0.2, ioRatio: 0.8, name: 'I/O-heavy' },
        { cpuRatio: 0.0, ioRatio: 1.0, name: 'I/O-only' }
      ];

      const concurrencyLevels = [1, 4, 8, 16];
      const totalTasks = 40;

      const mixedResults = [];

      for (const mix of workloadMixes) {
        for (const concurrency of concurrencyLevels) {
          const endMeasurement = profiler.startMeasurement(`mixed-${mix.name}-${concurrency}`);

          const cpuTasks = Math.floor(totalTasks * mix.cpuRatio);
          const ioTasks = Math.floor(totalTasks * mix.ioRatio);

          const tasks = [
            ...Array.from({ length: cpuTasks }, () => createComputeIntensiveTask(20)),
            ...Array.from({ length: ioTasks }, () => createIOIntensiveTask(50))
          ];

          // Shuffle tasks to simulate realistic mixed workload
          for (let i = tasks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
          }

          // Execute with adaptive pool
          const executeAdaptive = async (tasks: (() => Promise<any>)[], maxConcurrency: number) => {
            const results = [];
            const executing = new Set<Promise<any>>();

            for (const task of tasks) {
              if (executing.size >= maxConcurrency) {
                const completed = await Promise.race(executing);
                executing.delete(completed);
              }

              const promise = task().then(result => {
                results.push(result);
                return promise;
              });
              executing.add(promise);
            }

            await Promise.all(executing);
            return results;
          };

          const results = await executeAdaptive(tasks, concurrency);
          const duration = endMeasurement();

          mixedResults.push({
            workload: mix.name,
            cpuRatio: mix.cpuRatio,
            ioRatio: mix.ioRatio,
            concurrency,
            duration,
            throughput: results.length / (duration / 1000)
          });
        }
      }

      // Analyze mixed workload performance
      workloadMixes.forEach(mix => {
        const workloadResults = mixedResults.filter(r => r.workload === mix.name);
        const maxThroughput = Math.max(...workloadResults.map(r => r.throughput));
        const optimal = workloadResults.find(r => r.throughput === maxThroughput);

        console.log(`${mix.name} workload: Optimal concurrency ${optimal?.concurrency} (${maxThroughput.toFixed(2)} tasks/sec)`);
      });

      // Verify that optimal concurrency varies with workload type
      const cpuOnlyOptimal = mixedResults.filter(r => r.workload === 'CPU-only').reduce((best, current) =>
        current.throughput > best.throughput ? current : best);
      const ioOnlyOptimal = mixedResults.filter(r => r.workload === 'I/O-only').reduce((best, current) =>
        current.throughput > best.throughput ? current : best);

      // I/O-only should have higher optimal concurrency than CPU-only
      expect(ioOnlyOptimal.concurrency).toBeGreaterThanOrEqual(cpuOnlyOptimal.concurrency);

      console.log(`Optimal concurrency: CPU-only ${cpuOnlyOptimal.concurrency}, I/O-only ${ioOnlyOptimal.concurrency}`);
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should monitor memory efficiency in parallel processing', async () => {
      const dataSizes = [1000, 5000, 10000];
      const concurrencyLevels = [1, 4, 8, 16];

      const memoryResults = [];

      for (const dataSize of dataSizes) {
        for (const concurrency of concurrencyLevels) {
          memoryMonitor.reset();

          const endMeasurement = profiler.startMeasurement(`memory-${dataSize}-${concurrency}`);

          const tasks = Array.from({ length: 20 }, () =>
            createMemoryIntensiveTask(dataSize)
          );

          // Monitor memory during execution
          const memorySnapshots = [];
          const monitoringInterval = setInterval(() => {
            memorySnapshots.push(memoryMonitor.getCurrentUsage());
          }, 100);

          try {
            // Execute with controlled concurrency
            const results = [];
            for (let i = 0; i < tasks.length; i += concurrency) {
              const batch = tasks.slice(i, i + concurrency);
              const batchResults = await Promise.all(batch.map(task => task()));
              results.push(...batchResults);
            }

            const duration = endMeasurement();
            clearInterval(monitoringInterval);

            const finalMemory = memoryMonitor.getCurrentUsage();
            const peakMemory = memorySnapshots.reduce((peak, snapshot) =>
              Math.max(peak, snapshot.heapUsed), 0);

            memoryResults.push({
              dataSize,
              concurrency,
              duration,
              throughput: results.length / (duration / 1000),
              peakMemoryMB: peakMemory / 1024 / 1024,
              finalMemoryMB: finalMemory.heapUsed / 1024 / 1024,
              memoryEfficiency: results.length / (peakMemory / 1024 / 1024) // tasks per MB
            });
          } finally {
            clearInterval(monitoringInterval);
          }
        }
      }

      // Analyze memory efficiency
      dataSizes.forEach(dataSize => {
        const sizeResults = memoryResults.filter(r => r.dataSize === dataSize);
        const bestEfficiency = Math.max(...sizeResults.map(r => r.memoryEfficiency));
        const mostEfficient = sizeResults.find(r => r.memoryEfficiency === bestEfficiency);

        console.log(`Data size ${dataSize}: Most memory efficient concurrency ${mostEfficient?.concurrency} (${bestEfficiency.toFixed(2)} tasks/MB)`);

        // Verify memory usage is reasonable
        sizeResults.forEach(result => {
          expect(result.peakMemoryMB).toBeLessThan(500); // Less than 500MB peak
          expect(result.memoryEfficiency).toBeGreaterThan(0); // Positive efficiency
        });
      });

      // Verify that concurrency doesn't dramatically increase memory usage
      const lowConcurrency = memoryResults.filter(r => r.concurrency <= 4);
      const highConcurrency = memoryResults.filter(r => r.concurrency >= 8);

      lowConcurrency.forEach(lowResult => {
        const correspondingHigh = highConcurrency.find(h => h.dataSize === lowResult.dataSize);
        if (correspondingHigh) {
          const memoryIncrease = correspondingHigh.peakMemoryMB / lowResult.peakMemoryMB;
          expect(memoryIncrease).toBeLessThan(3); // Memory shouldn't increase more than 3x
        }
      });
    });

    it('should test garbage collection efficiency during parallel processing', async () => {
      // Force garbage collection if available
      const gcAvailable = typeof global.gc === 'function';
      if (!gcAvailable) {
        console.log('Garbage collection not available, skipping GC test');
        return;
      }

      const iterations = 5;
      const tasksPerIteration = 20;
      const dataSize = 5000;

      const gcResults = [];

      for (let iteration = 0; iteration < iterations; iteration++) {
        memoryMonitor.reset();
        global.gc(); // Force GC before measurement

        const beforeGC = process.memoryUsage();

        // Create memory-intensive tasks
        const tasks = Array.from({ length: tasksPerIteration }, () =>
          createMemoryIntensiveTask(dataSize)
        );

        // Execute all tasks in parallel
        const startTime = performance.now();
        const results = await Promise.all(tasks.map(task => task()));
        const endTime = performance.now();

        const afterExecution = process.memoryUsage();

        // Force garbage collection
        global.gc();
        const afterGC = process.memoryUsage();

        gcResults.push({
          iteration,
          duration: endTime - startTime,
          memoryBeforeGC: beforeGC.heapUsed / 1024 / 1024,
          memoryAfterExecution: afterExecution.heapUsed / 1024 / 1024,
          memoryAfterGC: afterGC.heapUsed / 1024 / 1024,
          memoryFreed: (afterExecution.heapUsed - afterGC.heapUsed) / 1024 / 1024,
          gcEfficiency: (afterExecution.heapUsed - afterGC.heapUsed) / afterExecution.heapUsed
        });
      }

      // Analyze GC efficiency
      const avgGCEfficiency = gcResults.reduce((sum, r) => sum + r.gcEfficiency, 0) / gcResults.length;
      const avgMemoryFreed = gcResults.reduce((sum, r) => sum + r.memoryFreed, 0) / gcResults.length;

      console.log('Garbage Collection Results:', gcResults);
      console.log(`Average GC efficiency: ${(avgGCEfficiency * 100).toFixed(2)}%`);
      console.log(`Average memory freed: ${avgMemoryFreed.toFixed(2)} MB`);

      // Verify garbage collection is working effectively
      expect(avgGCEfficiency).toBeGreaterThan(0.3); // At least 30% of memory should be freed
      expect(avgMemoryFreed).toBeGreaterThan(1); // At least 1MB freed on average

      // Verify memory doesn't grow indefinitely across iterations
      const firstIteration = gcResults[0];
      const lastIteration = gcResults[gcResults.length - 1];
      const memoryGrowth = lastIteration.memoryAfterGC / firstIteration.memoryBeforeGC;

      expect(memoryGrowth).toBeLessThan(2); // Memory shouldn't double across iterations
    });
  });

  describe('Real-World Performance Scenarios', () => {
    it('should benchmark document processing pipeline', async () => {
      const documentCounts = [1, 5, 10, 20];
      const concurrencyLevels = [1, 2, 4, 8];

      // Mock document processing stages
      const ocrStage = async (docId: string) => {
        await createIOIntensiveTask(100)(); // Simulate OCR API call
        return `ocr-result-${docId}`;
      };

      const parseStage = async (ocrResult: string) => {
        await createComputeIntensiveTask(30)(); // Simulate parsing
        return `parsed-${ocrResult}`;
      };

      const validateStage = async (parsedResult: string) => {
        await createIOIntensiveTask(50)(); // Simulate validation API call
        return `validated-${parsedResult}`;
      };

      const pipelineResults = [];

      for (const docCount of documentCounts) {
        for (const concurrency of concurrencyLevels) {
          const endMeasurement = profiler.startMeasurement(`pipeline-${docCount}-${concurrency}`);

          const documents = Array.from({ length: docCount }, (_, i) => `doc-${i}`);

          // Pipeline execution with controlled concurrency
          const processPipeline = async (docs: string[], maxConcurrency: number) => {
            const semaphore = new Array(maxConcurrency).fill(0).map(() => Promise.resolve());
            let semIndex = 0;

            const processDocument = async (docId: string) => {
              const currentSemaphore = semIndex % maxConcurrency;
              semIndex++;

              await semaphore[currentSemaphore];

              semaphore[currentSemaphore] = (async () => {
                const ocrResult = await ocrStage(docId);
                const parsedResult = await parseStage(ocrResult);
                const validatedResult = await validateStage(parsedResult);
                return validatedResult;
              })();

              return semaphore[currentSemaphore];
            };

            return Promise.all(docs.map(processDocument));
          };

          const results = await processPipeline(documents, concurrency);
          const duration = endMeasurement();

          pipelineResults.push({
            docCount,
            concurrency,
            duration,
            throughput: results.length / (duration / 1000),
            avgTimePerDoc: duration / results.length
          });
        }
      }

      // Analyze pipeline performance
      documentCounts.forEach(docCount => {
        const countResults = pipelineResults.filter(r => r.docCount === docCount);
        const maxThroughput = Math.max(...countResults.map(r => r.throughput));
        const optimal = countResults.find(r => r.throughput === maxThroughput);

        console.log(`${docCount} documents: Optimal concurrency ${optimal?.concurrency} (${maxThroughput.toFixed(2)} docs/sec)`);
      });

      // Verify scalability
      const singleDocResults = pipelineResults.filter(r => r.docCount === 1);
      const multiDocResults = pipelineResults.filter(r => r.docCount === 20);

      singleDocResults.forEach(singleResult => {
        const correspondingMulti = multiDocResults.find(m => m.concurrency === singleResult.concurrency);
        if (correspondingMulti) {
          // Processing time per document shouldn't increase significantly with more documents
          const efficiencyRatio = correspondingMulti.avgTimePerDoc / singleResult.avgTimePerDoc;
          expect(efficiencyRatio).toBeLessThan(2); // Less than 2x overhead
        }
      });
    });

    it('should benchmark AI service integration under load', async () => {
      const requestRates = [1, 5, 10, 20]; // requests per second
      const testDuration = 5000; // 5 seconds

      // Mock AI service with realistic behavior
      const mockAIService = {
        processRequest: async (requestId: string) => {
          // Simulate variable processing time
          const processingTime = 100 + Math.random() * 200; // 100-300ms
          await new Promise(resolve => setTimeout(resolve, processingTime));

          // Simulate occasional failures
          if (Math.random() < 0.05) { // 5% failure rate
            throw new Error(`AI service error for request ${requestId}`);
          }

          return `AI-result-${requestId}`;
        }
      };

      const loadTestResults = [];

      for (const rate of requestRates) {
        const requests: string[] = [];
        const responses: any[] = [];
        const errors: any[] = [];

        const startTime = performance.now();

        // Generate requests at specified rate
        const requestGenerator = setInterval(() => {
          const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          requests.push(requestId);

          mockAIService.processRequest(requestId)
            .then(result => responses.push({ requestId, result, timestamp: Date.now() }))
            .catch(error => errors.push({ requestId, error: error.message, timestamp: Date.now() }));
        }, 1000 / rate);

        // Stop after test duration
        await new Promise(resolve => setTimeout(resolve, testDuration));
        clearInterval(requestGenerator);

        // Wait for remaining responses
        await new Promise(resolve => setTimeout(resolve, 1000));

        const endTime = performance.now();
        const actualDuration = endTime - startTime;

        loadTestResults.push({
          targetRate: rate,
          actualDuration,
          requestsSent: requests.length,
          responsesReceived: responses.length,
          errorsReceived: errors.length,
          actualRate: requests.length / (actualDuration / 1000),
          successRate: responses.length / requests.length,
          errorRate: errors.length / requests.length
        });
      }

      // Analyze load test results
      loadTestResults.forEach(result => {
        console.log(`Rate ${result.targetRate} req/s: ${result.successRate * 100}% success, ${result.errorRate * 100}% errors`);

        // Verify service handles load appropriately
        expect(result.successRate).toBeGreaterThan(0.8); // At least 80% success rate
        expect(result.errorRate).toBeLessThan(0.2); // Less than 20% error rate
      });

      // Verify that higher rates don't drastically reduce success rates
      const lowRateResult = loadTestResults.find(r => r.targetRate === 1);
      const highRateResult = loadTestResults.find(r => r.targetRate === 20);

      if (lowRateResult && highRateResult) {
        const successRateDrop = lowRateResult.successRate - highRateResult.successRate;
        expect(successRateDrop).toBeLessThan(0.3); // Success rate shouldn't drop more than 30%
      }
    });
  });
});