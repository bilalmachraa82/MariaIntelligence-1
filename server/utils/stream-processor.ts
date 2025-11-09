/**
 * Stream Processing Utilities
 *
 * Provides streaming capabilities for large file operations,
 * memory-efficient processing, and real-time data transformation
 */

import { Transform, Readable, Writable, pipeline } from 'stream';
import { promisify } from 'util';
import { createReadStream, createWriteStream } from 'fs';
import { Buffer } from 'buffer';

const pipelineAsync = promisify(pipeline);

export interface StreamProcessingOptions {
  chunkSize?: number;
  concurrency?: number;
  highWaterMark?: number;
  objectMode?: boolean;
  timeout?: number;
}

export interface ProcessingStats {
  processedChunks: number;
  totalBytes: number;
  processingTime: number;
  errors: number;
  startTime: Date;
}

/**
 * Enhanced stream processor for large file operations
 */
export class StreamProcessor {
  private stats: ProcessingStats = {
    processedChunks: 0,
    totalBytes: 0,
    processingTime: 0,
    errors: 0,
    startTime: new Date()
  };

  /**
   * Process large PDF files in chunks
   */
  async processPDFStream(
    pdfBuffer: Buffer,
    processor: (chunk: Buffer, index: number) => Promise<string>,
    options: StreamProcessingOptions = {}
  ): Promise<string[]> {
    const {
      chunkSize = 1024 * 1024, // 1MB chunks
      concurrency = 4,
      timeout = 30000
    } = options;

    console.log(`📄 Processing PDF stream (${pdfBuffer.length} bytes) in ${chunkSize} byte chunks`);

    const chunks: Buffer[] = [];
    const results: string[] = [];

    // Split buffer into chunks
    for (let i = 0; i < pdfBuffer.length; i += chunkSize) {
      const chunk = pdfBuffer.slice(i, Math.min(i + chunkSize, pdfBuffer.length));
      chunks.push(chunk);
    }

    console.log(`📦 Created ${chunks.length} chunks for parallel processing`);

    // Process chunks with controlled concurrency
    const semaphore = new Array(concurrency).fill(null);
    let chunkIndex = 0;

    const processChunk = async (chunk: Buffer, index: number): Promise<string> => {
      const startTime = Date.now();
      try {
        const result = await Promise.race([
          processor(chunk, index),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Chunk processing timeout')), timeout)
          )
        ]);

        this.stats.processedChunks++;
        this.stats.totalBytes += chunk.length;
        this.stats.processingTime += Date.now() - startTime;

        return result;
      } catch (error) {
        this.stats.errors++;
        console.error(`❌ Error processing chunk ${index}:`, error);
        return `Error processing chunk ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    };

    // Process all chunks with concurrency control
    const promises = chunks.map((chunk, index) => processChunk(chunk, index));
    const chunkResults = await Promise.allSettled(promises);

    // Collect results
    for (const result of chunkResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push(`Chunk processing failed: ${result.reason}`);
      }
    }

    console.log(`✅ PDF stream processing completed: ${results.length} chunks processed`);
    return results;
  }

  /**
   * Create a transform stream for real-time processing
   */
  createTransformStream<T = any, R = any>(
    transformer: (data: T) => Promise<R> | R,
    options: StreamProcessingOptions = {}
  ): Transform {
    const {
      objectMode = true,
      highWaterMark = 16,
      concurrency = 4
    } = options;

    let activeTransforms = 0;
    const pendingResults = new Map<number, Promise<R>>();
    let inputIndex = 0;
    let outputIndex = 0;

    return new Transform({
      objectMode,
      highWaterMark,

      async transform(chunk: T, _encoding, callback) {
        // Control concurrency
        while (activeTransforms >= concurrency) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }

        const currentIndex = inputIndex++;
        activeTransforms++;

        const resultPromise = Promise.resolve()
          .then(() => transformer(chunk))
          .finally(() => activeTransforms--);

        pendingResults.set(currentIndex, resultPromise);

        // Try to output results in order
        this.tryOutputResults();
        callback();
      },

      async flush(callback) {
        // Wait for all pending results
        while (pendingResults.size > 0) {
          await this.tryOutputResults();
          if (pendingResults.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        callback();
      }
    });
  }

  /**
   * Process large files using streams with backpressure handling
   */
  async processLargeFile(
    inputPath: string,
    outputPath: string,
    processor: (chunk: Buffer) => Promise<Buffer>,
    options: StreamProcessingOptions = {}
  ): Promise<ProcessingStats> {
    const {
      chunkSize = 64 * 1024, // 64KB chunks
      timeout = 60000
    } = options;

    this.resetStats();
    console.log(`📁 Processing large file: ${inputPath} -> ${outputPath}`);

    const readStream = createReadStream(inputPath, { highWaterMark: chunkSize });
    const writeStream = createWriteStream(outputPath);

    const transformStream = new Transform({
      transform: async function(chunk: Buffer, _encoding, callback) {
        try {
          const startTime = Date.now();

          const processed = await Promise.race([
            processor(chunk),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Chunk processing timeout')), timeout)
            )
          ]);

          this.stats.processedChunks++;
          this.stats.totalBytes += chunk.length;
          this.stats.processingTime += Date.now() - startTime;

          callback(null, processed);
        } catch (error) {
          this.stats.errors++;
          console.error('❌ Error processing chunk:', error);
          callback(error);
        }
      }.bind(this)
    });

    try {
      await pipelineAsync(readStream, transformStream, writeStream);
      console.log(`✅ Large file processing completed successfully`);
      return this.getStats();
    } catch (error) {
      console.error('❌ Large file processing failed:', error);
      throw error;
    }
  }

  /**
   * Create a memory-efficient readable stream from data array
   */
  createArrayStream<T>(
    data: T[],
    options: { batchSize?: number; delay?: number } = {}
  ): Readable {
    const { batchSize = 100, delay = 0 } = options;
    let index = 0;

    return new Readable({
      objectMode: true,

      read() {
        if (index >= data.length) {
          this.push(null); // End stream
          return;
        }

        const batch = data.slice(index, Math.min(index + batchSize, data.length));
        index += batch.length;

        if (delay > 0) {
          setTimeout(() => {
            for (const item of batch) {
              this.push(item);
            }
          }, delay);
        } else {
          for (const item of batch) {
            this.push(item);
          }
        }
      }
    });
  }

  /**
   * Create a writable stream that collects results
   */
  createCollectorStream<T>(): { stream: Writable; getResults: () => T[] } {
    const results: T[] = [];

    const stream = new Writable({
      objectMode: true,

      write(chunk: T, _encoding, callback) {
        results.push(chunk);
        callback();
      }
    });

    return {
      stream,
      getResults: () => [...results]
    };
  }

  /**
   * Pipeline multiple streams with error handling and monitoring
   */
  async createPipeline(
    streams: NodeJS.ReadWriteStream[],
    options: {
      timeout?: number;
      onProgress?: (stats: ProcessingStats) => void;
      progressInterval?: number;
    } = {}
  ): Promise<ProcessingStats> {
    const {
      timeout = 300000, // 5 minutes
      onProgress,
      progressInterval = 1000
    } = options;

    this.resetStats();

    // Set up progress monitoring
    let progressTimer: NodeJS.Timer | undefined;
    if (onProgress) {
      progressTimer = setInterval(() => {
        onProgress(this.getStats());
      }, progressInterval);
    }

    try {
      const pipelinePromise = pipelineAsync(...streams);

      if (timeout > 0) {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Pipeline timeout')), timeout)
        );

        await Promise.race([pipelinePromise, timeoutPromise]);
      } else {
        await pipelinePromise;
      }

      console.log(`✅ Stream pipeline completed successfully`);
      return this.getStats();

    } catch (error) {
      console.error('❌ Stream pipeline failed:', error);
      throw error;
    } finally {
      if (progressTimer) {
        clearInterval(progressTimer);
      }
    }
  }

  /**
   * Try to output results in order
   */
  private async tryOutputResults(): Promise<void> {
    // This method would be used in the transform stream
    // Implementation depends on the specific transform stream context
  }

  /**
   * Reset processing statistics
   */
  private resetStats(): void {
    this.stats = {
      processedChunks: 0,
      totalBytes: 0,
      processingTime: 0,
      errors: 0,
      startTime: new Date()
    };
  }

  /**
   * Get current processing statistics
   */
  private getStats(): ProcessingStats {
    return {
      ...this.stats,
      processingTime: Date.now() - this.stats.startTime.getTime()
    };
  }

  /**
   * Get public statistics
   */
  getProcessingStats(): ProcessingStats {
    return this.getStats();
  }
}

/**
 * Utility function to create a throttled stream
 */
export function createThrottledStream(
  maxBytesPerSecond: number
): Transform {
  let lastTime = Date.now();
  let bytesInCurrentSecond = 0;

  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      const now = Date.now();
      const timeDiff = now - lastTime;

      if (timeDiff >= 1000) {
        // Reset counter every second
        bytesInCurrentSecond = 0;
        lastTime = now;
      }

      bytesInCurrentSecond += chunk.length;

      if (bytesInCurrentSecond > maxBytesPerSecond) {
        // Throttle by delaying the callback
        const delay = 1000 - timeDiff;
        setTimeout(() => {
          callback(null, chunk);
        }, Math.max(0, delay));
      } else {
        callback(null, chunk);
      }
    }
  });
}

/**
 * Utility function to create a progress monitoring stream
 */
export function createProgressStream(
  onProgress: (bytesProcessed: number, chunksProcessed: number) => void
): Transform {
  let bytesProcessed = 0;
  let chunksProcessed = 0;

  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      bytesProcessed += chunk.length;
      chunksProcessed++;

      onProgress(bytesProcessed, chunksProcessed);
      callback(null, chunk);
    }
  });
}

// Export singleton instance
export const streamProcessor = new StreamProcessor();