/**
 * Parallel Processing Utilities
 *
 * Provides enhanced async patterns, worker thread integration,
 * and stream processing capabilities for CPU-intensive operations
 */

import { Worker } from 'worker_threads';
import { Transform, Readable, Writable } from 'stream';
import { pipeline } from 'stream/promises';
import cluster from 'cluster';
import os from 'os';

// ===== ENHANCED ASYNC PATTERNS =====

/**
 * Enhanced Promise.all with concurrency control and error handling
 */
export class ParallelProcessor {
  private static instance: ParallelProcessor;
  private workers: Map<string, Worker[]> = new Map();
  private readonly maxConcurrency: number;

  private constructor() {
    this.maxConcurrency = Math.min(os.cpus().length, 8);
  }

  public static getInstance(): ParallelProcessor {
    if (!ParallelProcessor.instance) {
      ParallelProcessor.instance = new ParallelProcessor();
    }
    return ParallelProcessor.instance;
  }

  /**
   * Process items in parallel with controlled concurrency
   */
  async processParallel<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    options: {
      concurrency?: number;
      retries?: number;
      failFast?: boolean;
      onProgress?: (completed: number, total: number) => void;
    } = {}
  ): Promise<R[]> {
    const {
      concurrency = this.maxConcurrency,
      retries = 2,
      failFast = false,
      onProgress
    } = options;

    if (items.length === 0) return [];

    const results: R[] = new Array(items.length);
    const errors: Array<{ index: number; error: any }> = [];
    let completed = 0;

    // Create semaphore for concurrency control
    const semaphore = new Semaphore(concurrency);

    const processItem = async (item: T, index: number): Promise<void> => {
      await semaphore.acquire();

      try {
        let lastError: any;

        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            results[index] = await processor(item, index);
            completed++;
            onProgress?.(completed, items.length);
            return;
          } catch (error) {
            lastError = error;
            if (attempt < retries) {
              // Exponential backoff
              await new Promise(resolve =>
                setTimeout(resolve, Math.pow(2, attempt) * 100)
              );
            }
          }
        }

        errors.push({ index, error: lastError });
        if (failFast) {
          throw lastError;
        }
      } finally {
        semaphore.release();
      }
    };

    // Process all items
    await Promise.all(items.map(processItem));

    if (errors.length > 0 && failFast) {
      throw new AggregateError(
        errors.map(e => e.error),
        `Failed to process ${errors.length} items`
      );
    }

    return results;
  }

  /**
   * Enhanced Promise.allSettled with better error reporting
   */
  async processAllSettled<T, R>(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    options: { concurrency?: number } = {}
  ): Promise<Array<{ status: 'fulfilled' | 'rejected'; value?: R; reason?: any; index: number }>> {
    const { concurrency = this.maxConcurrency } = options;

    const results = await this.processParallel(
      items,
      async (item, index) => {
        try {
          const value = await processor(item, index);
          return { status: 'fulfilled' as const, value, index };
        } catch (reason) {
          return { status: 'rejected' as const, reason, index };
        }
      },
      { concurrency, failFast: false }
    );

    return results;
  }

  /**
   * Batch processing with automatic batching
   */
  async processBatches<T, R>(
    items: T[],
    batchProcessor: (batch: T[]) => Promise<R[]>,
    options: {
      batchSize?: number;
      concurrency?: number;
      onBatchComplete?: (batchIndex: number, totalBatches: number) => void;
    } = {}
  ): Promise<R[]> {
    const {
      batchSize = Math.ceil(items.length / this.maxConcurrency),
      concurrency = Math.min(this.maxConcurrency, 4),
      onBatchComplete
    } = options;

    if (items.length === 0) return [];

    // Create batches
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    // Process batches in parallel
    const batchResults = await this.processParallel(
      batches,
      async (batch, index) => {
        const result = await batchProcessor(batch);
        onBatchComplete?.(index + 1, batches.length);
        return result;
      },
      { concurrency }
    );

    // Flatten results
    return batchResults.flat();
  }

  // ===== WORKER THREAD INTEGRATION =====

  /**
   * Create worker pool for CPU-intensive tasks
   */
  async createWorkerPool(
    workerScript: string,
    poolSize: number = this.maxConcurrency
  ): Promise<string> {
    const poolId = `pool_${Date.now()}_${Math.random()}`;
    const workers: Worker[] = [];

    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      workers.push(worker);
    }

    this.workers.set(poolId, workers);
    return poolId;
  }

  /**
   * Execute task in worker pool
   */
  async executeInWorkerPool<T, R>(
    poolId: string,
    data: T,
    options: { timeout?: number } = {}
  ): Promise<R> {
    const workers = this.workers.get(poolId);
    if (!workers || workers.length === 0) {
      throw new Error('Worker pool not found or empty');
    }

    // Find available worker (simple round-robin)
    const worker = workers[Math.floor(Math.random() * workers.length)];

    return new Promise<R>((resolve, reject) => {
      const timeout = options.timeout || 30000;
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        worker.removeAllListeners('message');
        worker.removeAllListeners('error');
      };

      // Set timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Worker execution timeout'));
        }, timeout);
      }

      // Listen for result
      worker.once('message', (result) => {
        cleanup();
        resolve(result);
      });

      // Listen for errors
      worker.once('error', (error) => {
        cleanup();
        reject(error);
      });

      // Send data to worker
      worker.postMessage(data);
    });
  }

  /**
   * Distribute tasks across worker pool
   */
  async distributeToWorkers<T, R>(
    poolId: string,
    tasks: T[],
    options: { timeout?: number; onProgress?: (completed: number) => void } = {}
  ): Promise<R[]> {
    const workers = this.workers.get(poolId);
    if (!workers || workers.length === 0) {
      throw new Error('Worker pool not found or empty');
    }

    return this.processParallel(
      tasks,
      (task) => this.executeInWorkerPool<T, R>(poolId, task, options),
      {
        concurrency: workers.length,
        onProgress: options.onProgress
      }
    );
  }

  /**
   * Cleanup worker pool
   */
  async destroyWorkerPool(poolId: string): Promise<void> {
    const workers = this.workers.get(poolId);
    if (workers) {
      await Promise.all(workers.map(worker => worker.terminate()));
      this.workers.delete(poolId);
    }
  }

  // ===== STREAM PROCESSING =====

  /**
   * Create parallel transform stream
   */
  createParallelTransform<T, R>(
    transformer: (chunk: T) => Promise<R>,
    options: {
      concurrency?: number;
      objectMode?: boolean;
    } = {}
  ): Transform {
    const { concurrency = this.maxConcurrency, objectMode = true } = options;
    const semaphore = new Semaphore(concurrency);
    const pendingResults = new Map<number, Promise<R>>();
    let currentIndex = 0;
    let outputIndex = 0;

    return new Transform({
      objectMode,
      async transform(chunk: T, _encoding, callback) {
        const index = currentIndex++;

        const resultPromise = semaphore.acquire().then(async () => {
          try {
            return await transformer(chunk);
          } finally {
            semaphore.release();
          }
        });

        pendingResults.set(index, resultPromise);

        // Try to output results in order
        while (pendingResults.has(outputIndex)) {
          try {
            const result = await pendingResults.get(outputIndex)!;
            pendingResults.delete(outputIndex);
            this.push(result);
            outputIndex++;
          } catch (error) {
            pendingResults.delete(outputIndex);
            outputIndex++;
            this.emit('error', error);
            return;
          }
        }

        callback();
      },

      async flush(callback) {
        // Wait for all pending results
        while (pendingResults.size > 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        callback();
      }
    });
  }

  /**
   * Process stream in parallel chunks
   */
  async processStreamInParallel<T, R>(
    readable: Readable,
    processor: (chunk: T) => Promise<R>,
    options: {
      concurrency?: number;
      chunkSize?: number;
    } = {}
  ): Promise<R[]> {
    const { concurrency = this.maxConcurrency } = options;
    const results: R[] = [];

    const transform = this.createParallelTransform(processor, { concurrency });

    const writable = new Writable({
      objectMode: true,
      write(chunk: R, _encoding, callback) {
        results.push(chunk);
        callback();
      }
    });

    await pipeline(readable, transform, writable);
    return results;
  }
}

// ===== SEMAPHORE UTILITY =====

class Semaphore {
  private permits: number;
  private waiting: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    const next = this.waiting.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }
}

// ===== CLUSTER UTILITIES =====

export class ClusterManager {
  static isPrimary(): boolean {
    return cluster.isPrimary;
  }

  static isWorker(): boolean {
    return cluster.isWorker;
  }

  static fork(env?: any): cluster.Worker {
    return cluster.fork(env);
  }

  static async forkWorkers(
    count: number = os.cpus().length,
    env?: any
  ): Promise<cluster.Worker[]> {
    if (!cluster.isPrimary) {
      throw new Error('Can only fork workers from primary process');
    }

    const workers: cluster.Worker[] = [];

    for (let i = 0; i < count; i++) {
      const worker = cluster.fork(env);
      workers.push(worker);
    }

    // Wait for all workers to be online
    await Promise.all(
      workers.map(worker => new Promise<void>((resolve) => {
        worker.once('online', resolve);
      }))
    );

    return workers;
  }

  static setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);

      if (cluster.isPrimary) {
        // Disconnect all workers
        for (const worker of Object.values(cluster.workers || {})) {
          worker?.disconnect();
        }

        // Wait for workers to exit
        await new Promise<void>((resolve) => {
          const checkWorkers = () => {
            const aliveWorkers = Object.values(cluster.workers || {})
              .filter(worker => worker && !worker.isDead());

            if (aliveWorkers.length === 0) {
              resolve();
            } else {
              setTimeout(checkWorkers, 100);
            }
          };
          checkWorkers();
        });
      }

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Export singleton instance
export const parallelProcessor = ParallelProcessor.getInstance();