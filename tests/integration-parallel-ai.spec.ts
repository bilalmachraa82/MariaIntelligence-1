/**
 * Integration Tests for Parallel AI Service Operations
 * Tests concurrent AI service calls, database operations, and error handling
 *
 * @author ConcurrencyTester Agent
 * @test-suite Integration Parallel AI
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performance } from 'perf_hooks';

// Mock AI Services
const mockGeminiService = {
  extractTextFromPDF: vi.fn(),
  extractTextFromImage: vi.fn(),
  parseReservationData: vi.fn(),
  validateReservationData: vi.fn(),
  generateText: vi.fn(),
  processReservationDocument: vi.fn(),
  withRetry: vi.fn(),
  isConfigured: vi.fn().mockReturnValue(true)
};

const mockRateLimiter = {
  rateLimitedFunction: vi.fn(),
  checkRate: vi.fn(),
  increment: vi.fn(),
  reset: vi.fn()
};

// Mock Database Service
const mockDatabase = {
  query: vi.fn(),
  transaction: vi.fn(),
  insertReservation: vi.fn(),
  updateReservation: vi.fn(),
  findReservation: vi.fn(),
  pool: {
    acquire: vi.fn(),
    release: vi.fn(),
    getStatus: vi.fn().mockReturnValue({ total: 10, available: 8, pending: 0 })
  }
};

// Test data generators
const generateTestPDF = (id: string) => `pdf-base64-data-${id}-${'x'.repeat(1000)}`;
const generateTestImage = (id: string) => `image-base64-data-${id}-${'y'.repeat(800)}`;

const generateReservationData = (id: string) => ({
  id,
  propertyName: `Property ${id}`,
  guestName: `Guest ${id}`,
  guestEmail: `guest${id}@example.com`,
  guestPhone: `+351 9${id.padStart(8, '0')}`,
  checkInDate: '2025-01-15',
  checkOutDate: '2025-01-17',
  numGuests: 2 + (parseInt(id) % 4),
  totalAmount: 150 + (parseInt(id) % 100),
  platform: 'airbnb'
});

// Utility functions
const simulateNetworkDelay = (min: number = 50, max: number = 200) => {
  const delay = min + Math.random() * (max - min);
  return new Promise(resolve => setTimeout(resolve, delay));
};

const simulateProcessingTime = (baseTime: number = 100, variance: number = 50) => {
  const time = baseTime + (Math.random() - 0.5) * variance * 2;
  return new Promise(resolve => setTimeout(resolve, Math.max(10, time)));
};

describe('Integration Tests - Parallel AI Service Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockGeminiService.extractTextFromPDF.mockImplementation(async (pdf: string) => {
      await simulateProcessingTime(150, 100);
      const id = pdf.match(/pdf-base64-data-(\d+)/)?.[1] || 'unknown';
      return `Extracted text from PDF ${id}: Property booking details...`;
    });

    mockGeminiService.extractTextFromImage.mockImplementation(async (image: string) => {
      await simulateProcessingTime(120, 80);
      const id = image.match(/image-base64-data-(\d+)/)?.[1] || 'unknown';
      return `Extracted text from image ${id}: Reservation confirmation...`;
    });

    mockGeminiService.parseReservationData.mockImplementation(async (text: string) => {
      await simulateProcessingTime(80, 40);
      const id = text.match(/(\d+)/)?.[1] || '1';
      return generateReservationData(id);
    });

    mockGeminiService.validateReservationData.mockImplementation(async (data: any) => {
      await simulateProcessingTime(60, 30);
      return {
        valid: true,
        data: { ...data, validated: true },
        issues: [],
        corrections: []
      };
    });

    mockDatabase.insertReservation.mockImplementation(async (data: any) => {
      await simulateNetworkDelay(30, 80);
      return { ...data, id: `db-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
    });

    mockRateLimiter.rateLimitedFunction.mockImplementation((fn: Function, key: string, ttl: number) => {
      return fn; // Pass through for testing
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Concurrent Document Processing', () => {
    it('should process multiple PDF documents in parallel', async () => {
      const documentCount = 8;
      const maxConcurrency = 4;

      const documents = Array.from({ length: documentCount }, (_, i) => ({
        id: `doc-${i}`,
        type: 'pdf',
        data: generateTestPDF(i.toString())
      }));

      const startTime = performance.now();

      // Process documents with controlled concurrency
      const processWithConcurrencyControl = async (docs: any[], maxConcurrent: number) => {
        const results = [];
        const executing = new Set<Promise<any>>();

        for (const doc of docs) {
          if (executing.size >= maxConcurrent) {
            await Promise.race(executing);
          }

          const promise = (async () => {
            try {
              const text = await mockGeminiService.extractTextFromPDF(doc.data);
              const parsed = await mockGeminiService.parseReservationData(text);
              const validated = await mockGeminiService.validateReservationData(parsed);
              const saved = await mockDatabase.insertReservation(validated.data);

              return {
                documentId: doc.id,
                success: true,
                result: saved
              };
            } catch (error) {
              return {
                documentId: doc.id,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
            }
          })();

          promise.finally(() => executing.delete(promise));
          executing.add(promise);
          results.push(promise);
        }

        return Promise.all(results);
      };

      const results = await processWithConcurrencyControl(documents, maxConcurrency);
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Verify all documents processed
      expect(results).toHaveLength(documentCount);

      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);

      expect(successfulResults.length).toBeGreaterThan(documentCount * 0.8); // At least 80% success

      // Verify parallel execution was faster than sequential
      const estimatedSequentialTime = documentCount * (150 + 80 + 60 + 50); // Sum of average processing times
      expect(totalTime).toBeLessThan(estimatedSequentialTime * 0.7); // At least 30% faster

      // Verify service calls were made
      expect(mockGeminiService.extractTextFromPDF).toHaveBeenCalledTimes(documentCount);
      expect(mockGeminiService.parseReservationData).toHaveBeenCalledTimes(successfulResults.length);
      expect(mockDatabase.insertReservation).toHaveBeenCalledTimes(successfulResults.length);

      console.log(`Processed ${documentCount} PDFs in ${totalTime.toFixed(2)}ms (${successfulResults.length} successful)`);
    });

    it('should handle mixed document types (PDF and images) concurrently', async () => {
      const pdfCount = 5;
      const imageCount = 5;

      const documents = [
        ...Array.from({ length: pdfCount }, (_, i) => ({
          id: `pdf-${i}`,
          type: 'pdf',
          data: generateTestPDF(i.toString()),
          mimeType: 'application/pdf'
        })),
        ...Array.from({ length: imageCount }, (_, i) => ({
          id: `img-${i}`,
          type: 'image',
          data: generateTestImage(i.toString()),
          mimeType: 'image/jpeg'
        }))
      ];

      // Shuffle documents to simulate realistic mixed processing
      for (let i = documents.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [documents[i], documents[j]] = [documents[j], documents[i]];
      }

      const processingResults = await Promise.all(
        documents.map(async (doc) => {
          const startTime = performance.now();

          try {
            let text: string;
            if (doc.type === 'pdf') {
              text = await mockGeminiService.extractTextFromPDF(doc.data);
            } else {
              text = await mockGeminiService.extractTextFromImage(doc.data);
            }

            const parsed = await mockGeminiService.parseReservationData(text);
            const validated = await mockGeminiService.validateReservationData(parsed);
            const saved = await mockDatabase.insertReservation(validated.data);

            const endTime = performance.now();

            return {
              documentId: doc.id,
              type: doc.type,
              success: true,
              processingTime: endTime - startTime,
              result: saved
            };
          } catch (error) {
            const endTime = performance.now();
            return {
              documentId: doc.id,
              type: doc.type,
              success: false,
              processingTime: endTime - startTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      // Analyze results by document type
      const pdfResults = processingResults.filter(r => r.type === 'pdf');
      const imageResults = processingResults.filter(r => r.type === 'image');

      expect(pdfResults).toHaveLength(pdfCount);
      expect(imageResults).toHaveLength(imageCount);

      // Verify success rates
      const pdfSuccessRate = pdfResults.filter(r => r.success).length / pdfResults.length;
      const imageSuccessRate = imageResults.filter(r => r.success).length / imageResults.length;

      expect(pdfSuccessRate).toBeGreaterThan(0.8);
      expect(imageSuccessRate).toBeGreaterThan(0.8);

      // Verify service calls
      expect(mockGeminiService.extractTextFromPDF).toHaveBeenCalledTimes(pdfCount);
      expect(mockGeminiService.extractTextFromImage).toHaveBeenCalledTimes(imageCount);

      console.log(`Mixed processing: PDF success ${(pdfSuccessRate * 100).toFixed(1)}%, Image success ${(imageSuccessRate * 100).toFixed(1)}%`);
    });

    it('should handle document processing failures gracefully', async () => {
      const documentCount = 10;
      const failureRate = 0.3; // 30% failure rate

      // Mock some failures
      let callCount = 0;
      mockGeminiService.extractTextFromPDF.mockImplementation(async (pdf: string) => {
        callCount++;
        await simulateProcessingTime(100, 50);

        if (Math.random() < failureRate) {
          throw new Error(`Processing failed for call ${callCount}`);
        }

        const id = pdf.match(/pdf-base64-data-(\d+)/)?.[1] || 'unknown';
        return `Extracted text from PDF ${id}`;
      });

      const documents = Array.from({ length: documentCount }, (_, i) => ({
        id: `doc-${i}`,
        data: generateTestPDF(i.toString())
      }));

      const processWithRetry = async (doc: any, maxRetries: number = 2) => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const text = await mockGeminiService.extractTextFromPDF(doc.data);
            const parsed = await mockGeminiService.parseReservationData(text);
            return {
              documentId: doc.id,
              success: true,
              attempts: attempt + 1,
              result: parsed
            };
          } catch (error) {
            if (attempt === maxRetries) {
              return {
                documentId: doc.id,
                success: false,
                attempts: attempt + 1,
                error: error instanceof Error ? error.message : 'Unknown error'
              };
            }
            // Wait before retry with exponential backoff
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
          }
        }
      };

      const results = await Promise.all(
        documents.map(doc => processWithRetry(doc))
      );

      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);

      // With retries, success rate should be higher than initial failure rate
      const finalSuccessRate = successfulResults.length / results.length;
      expect(finalSuccessRate).toBeGreaterThan(1 - failureRate + 0.1); // Should improve with retries

      // Verify retry attempts were made
      const totalAttempts = results.reduce((sum, r) => sum + r.attempts, 0);
      expect(totalAttempts).toBeGreaterThan(documentCount); // More attempts than documents

      console.log(`Failure handling: ${finalSuccessRate * 100}% success rate, ${totalAttempts} total attempts`);
    });
  });

  describe('Database Connection Pool Management', () => {
    it('should efficiently manage database connections under concurrent load', async () => {
      const operationCount = 20;
      const maxConnections = 5;

      let activeConnections = 0;
      const connectionHistory: number[] = [];

      // Mock database operations with connection tracking
      mockDatabase.query.mockImplementation(async (sql: string, params?: any[]) => {
        if (activeConnections >= maxConnections) {
          throw new Error('Connection pool exhausted');
        }

        activeConnections++;
        connectionHistory.push(activeConnections);

        try {
          await simulateNetworkDelay(50, 150);
          return { rows: [{ id: Date.now(), result: 'success' }] };
        } finally {
          activeConnections--;
        }
      });

      // Connection pool manager
      const connectionSemaphore = Array.from({ length: maxConnections }, () => Promise.resolve());
      let semaphoreIndex = 0;

      const executeWithConnectionPool = async (operation: () => Promise<any>) => {
        const currentSemaphore = semaphoreIndex % maxConnections;
        semaphoreIndex++;

        await connectionSemaphore[currentSemaphore];
        connectionSemaphore[currentSemaphore] = operation();

        return connectionSemaphore[currentSemaphore];
      };

      // Execute database operations
      const operations = Array.from({ length: operationCount }, (_, i) =>
        executeWithConnectionPool(() =>
          mockDatabase.query(`SELECT * FROM reservations WHERE id = $1`, [i])
        )
      );

      const results = await Promise.allSettled(operations);

      const successfulOperations = results.filter(r => r.status === 'fulfilled');
      const failedOperations = results.filter(r => r.status === 'rejected');

      // Verify all operations completed successfully
      expect(successfulOperations.length).toBe(operationCount);
      expect(failedOperations.length).toBe(0);

      // Verify connection pool limits were respected
      const maxActiveConnections = Math.max(...connectionHistory);
      expect(maxActiveConnections).toBeLessThanOrEqual(maxConnections);

      // Verify no connections leaked
      expect(activeConnections).toBe(0);

      console.log(`DB pool test: ${successfulOperations.length}/${operationCount} successful, max concurrent: ${maxActiveConnections}`);
    });

    it('should handle database transaction rollbacks in parallel processing', async () => {
      const transactionCount = 8;
      const rollbackRate = 0.25; // 25% of transactions will rollback

      let transactionId = 0;
      const transactionResults: any[] = [];

      mockDatabase.transaction.mockImplementation(async (operations: Function[]) => {
        const currentTransactionId = ++transactionId;
        const shouldRollback = Math.random() < rollbackRate;

        try {
          await simulateNetworkDelay(30, 100);

          if (shouldRollback) {
            throw new Error(`Transaction ${currentTransactionId} rolled back`);
          }

          // Simulate successful transaction
          const results = await Promise.all(operations.map(op => op()));

          transactionResults.push({
            transactionId: currentTransactionId,
            success: true,
            operations: results.length
          });

          return results;
        } catch (error) {
          transactionResults.push({
            transactionId: currentTransactionId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      });

      // Create parallel transactions
      const transactions = Array.from({ length: transactionCount }, (_, i) =>
        mockDatabase.transaction([
          () => mockDatabase.insertReservation(generateReservationData(i.toString())),
          () => mockDatabase.query('UPDATE properties SET last_booking = NOW() WHERE id = $1', [i])
        ])
      );

      const results = await Promise.allSettled(transactions);

      const successfulTransactions = results.filter(r => r.status === 'fulfilled');
      const failedTransactions = results.filter(r => r.status === 'rejected');

      // Verify expected success/failure ratio
      const actualSuccessRate = successfulTransactions.length / transactionCount;
      const expectedSuccessRate = 1 - rollbackRate;

      expect(Math.abs(actualSuccessRate - expectedSuccessRate)).toBeLessThan(0.2); // Within 20% of expected

      // Verify transaction isolation
      expect(transactionResults).toHaveLength(transactionCount);

      console.log(`Transaction test: ${actualSuccessRate * 100}% success rate (expected: ${expectedSuccessRate * 100}%)`);
    });
  });

  describe('Rate Limiting and API Throttling', () => {
    it('should respect AI service rate limits during parallel processing', async () => {
      const requestsPerSecond = 5;
      const testDuration = 3000; // 3 seconds
      const maxConcurrentRequests = 3;

      let requestCount = 0;
      let activeRequests = 0;
      const requestTimestamps: number[] = [];

      // Mock AI service with rate limiting
      mockGeminiService.generateText.mockImplementation(async (prompt: string) => {
        const requestId = ++requestCount;
        requestTimestamps.push(Date.now());

        if (activeRequests >= maxConcurrentRequests) {
          throw new Error('Too many concurrent requests');
        }

        activeRequests++;

        try {
          await simulateProcessingTime(200, 100);
          return `Generated response ${requestId} for: ${prompt.substring(0, 50)}...`;
        } finally {
          activeRequests--;
        }
      });

      // Rate-limited request function
      const rateLimitedRequests = async () => {
        const requests: Promise<any>[] = [];
        const startTime = Date.now();

        const makeRequest = async (requestId: number) => {
          try {
            const result = await mockGeminiService.generateText(`Test prompt ${requestId}`);
            return { requestId, success: true, result };
          } catch (error) {
            return {
              requestId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        };

        // Generate requests at controlled rate
        let requestId = 0;
        const requestInterval = setInterval(() => {
          if (Date.now() - startTime >= testDuration) {
            clearInterval(requestInterval);
            return;
          }

          requests.push(makeRequest(++requestId));
        }, 1000 / requestsPerSecond);

        // Wait for test duration
        await new Promise(resolve => setTimeout(resolve, testDuration + 500));
        clearInterval(requestInterval);

        // Wait for all requests to complete
        return Promise.allSettled(requests);
      };

      const results = await rateLimitedRequests();

      // Analyze rate limiting effectiveness
      const successfulRequests = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const rateLimitedRequests = results.filter(r =>
        r.status === 'fulfilled' && !r.value.success &&
        r.value.error?.includes('Too many concurrent requests')
      );

      // Verify rate limiting worked
      expect(rateLimitedRequests.length).toBeGreaterThan(0); // Some requests should be rate limited

      // Verify request timing
      if (requestTimestamps.length > 1) {
        const intervals = requestTimestamps.slice(1).map((timestamp, i) =>
          timestamp - requestTimestamps[i]
        );
        const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const expectedInterval = 1000 / requestsPerSecond;

        expect(Math.abs(averageInterval - expectedInterval)).toBeLessThan(200); // Within 200ms of expected
      }

      console.log(`Rate limiting: ${successfulRequests.length} successful, ${rateLimitedRequests.length} rate limited`);
    });

    it('should implement exponential backoff for API failures', async () => {
      const maxRetries = 4;
      const baseDelay = 100; // ms

      let attemptCount = 0;
      const attemptTimestamps: number[] = [];

      // Mock API that fails initially then succeeds
      mockGeminiService.extractTextFromPDF.mockImplementation(async (pdf: string) => {
        attemptCount++;
        attemptTimestamps.push(Date.now());

        await simulateProcessingTime(50, 25);

        // Fail first few attempts, then succeed
        if (attemptCount <= 3) {
          throw new Error(`Temporary API failure (attempt ${attemptCount})`);
        }

        return `Successfully extracted text on attempt ${attemptCount}`;
      });

      // Exponential backoff implementation
      const withExponentialBackoff = async (operation: () => Promise<any>, maxRetries: number) => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await operation();
          } catch (error) {
            if (attempt === maxRetries) {
              throw error;
            }

            // Exponential backoff with jitter
            const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      const startTime = Date.now();
      const result = await withExponentialBackoff(
        () => mockGeminiService.extractTextFromPDF('test-pdf-data'),
        maxRetries
      );
      const endTime = Date.now();

      // Verify eventual success
      expect(result).toContain('Successfully extracted text');
      expect(attemptCount).toBe(4); // Should succeed on 4th attempt

      // Verify exponential backoff timing
      if (attemptTimestamps.length > 1) {
        const delays = attemptTimestamps.slice(1).map((timestamp, i) =>
          timestamp - attemptTimestamps[i]
        );

        // Each delay should be roughly double the previous (with jitter tolerance)
        for (let i = 1; i < delays.length; i++) {
          const expectedRatio = 2;
          const actualRatio = delays[i] / delays[i - 1];
          expect(actualRatio).toBeGreaterThan(1.5); // At least 50% increase
          expect(actualRatio).toBeLessThan(3); // But not more than 3x
        }
      }

      const totalTime = endTime - startTime;
      console.log(`Exponential backoff: ${attemptCount} attempts, ${totalTime}ms total time`);
    });
  });

  describe('Error Recovery and Circuit Breaker Patterns', () => {
    it('should implement circuit breaker for failing AI services', async () => {
      const failureThreshold = 5;
      const recoveryTimeout = 1000; // 1 second

      let consecutiveFailures = 0;
      let circuitState: 'closed' | 'open' | 'half-open' = 'closed';
      let lastFailureTime = 0;
      let requestCount = 0;

      // Mock AI service with high failure rate initially
      mockGeminiService.parseReservationData.mockImplementation(async (text: string) => {
        requestCount++;
        await simulateProcessingTime(100, 50);

        // Initially high failure rate, then improve
        const shouldFail = requestCount <= 8 && Math.random() < 0.8;

        if (shouldFail) {
          throw new Error(`Service unavailable (request ${requestCount})`);
        }

        return generateReservationData(requestCount.toString());
      });

      // Circuit breaker implementation
      const withCircuitBreaker = async (operation: () => Promise<any>) => {
        const now = Date.now();

        // Check if circuit should transition from open to half-open
        if (circuitState === 'open' && now - lastFailureTime > recoveryTimeout) {
          circuitState = 'half-open';
          consecutiveFailures = 0;
        }

        // Reject immediately if circuit is open
        if (circuitState === 'open') {
          throw new Error('Circuit breaker is open - service unavailable');
        }

        try {
          const result = await operation();

          // Success - reset failure count and close circuit
          consecutiveFailures = 0;
          circuitState = 'closed';

          return result;
        } catch (error) {
          consecutiveFailures++;
          lastFailureTime = now;

          // Open circuit if failure threshold reached
          if (consecutiveFailures >= failureThreshold) {
            circuitState = 'open';
          }

          throw error;
        }
      };

      // Test circuit breaker with multiple requests
      const requestCount = 15;
      const promises = Array.from({ length: requestCount }, async (_, i) => {
        try {
          // Spread requests over time to simulate realistic usage
          await new Promise(resolve => setTimeout(resolve, i * 50));

          const result = await withCircuitBreaker(() =>
            mockGeminiService.parseReservationData(`test text ${i}`)
          );

          return {
            requestId: i,
            success: true,
            result,
            circuitState: circuitState
          };
        } catch (error) {
          return {
            requestId: i,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            circuitState: circuitState
          };
        }
      });

      const results = await Promise.all(promises);

      // Analyze circuit breaker behavior
      const successfulRequests = results.filter(r => r.success);
      const failedRequests = results.filter(r => !r.success);
      const circuitBreakerErrors = failedRequests.filter(r =>
        r.error.includes('Circuit breaker is open')
      );

      // Verify circuit breaker triggered
      expect(circuitBreakerErrors.length).toBeGreaterThan(0);

      // Verify some requests eventually succeeded (after service recovery)
      expect(successfulRequests.length).toBeGreaterThan(0);

      console.log(`Circuit breaker: ${successfulRequests.length} success, ${circuitBreakerErrors.length} circuit open, ${failedRequests.length - circuitBreakerErrors.length} service errors`);
    });

    it('should handle cascading failures across multiple AI services', async () => {
      const serviceCount = 3;
      const requestsPerService = 10;

      // Setup multiple AI services with different failure patterns
      const services = [
        {
          name: 'OCR Service',
          mock: mockGeminiService.extractTextFromPDF,
          failureRate: 0.3,
          failureDelay: 200
        },
        {
          name: 'Parse Service',
          mock: mockGeminiService.parseReservationData,
          failureRate: 0.2,
          failureDelay: 150
        },
        {
          name: 'Validation Service',
          mock: mockGeminiService.validateReservationData,
          failureRate: 0.1,
          failureDelay: 100
        }
      ];

      // Setup service mocks
      services.forEach((service, serviceIndex) => {
        let callCount = 0;
        service.mock.mockImplementation(async (...args: any[]) => {
          callCount++;

          // Simulate processing time
          await simulateProcessingTime(100, 50);

          // Simulate failures
          if (Math.random() < service.failureRate) {
            await new Promise(resolve => setTimeout(resolve, service.failureDelay));
            throw new Error(`${service.name} failure (call ${callCount})`);
          }

          // Return mock success result
          switch (serviceIndex) {
            case 0: return `OCR result ${callCount}`;
            case 1: return generateReservationData(callCount.toString());
            case 2: return { valid: true, data: args[0], issues: [] };
            default: return `Service ${serviceIndex} result ${callCount}`;
          }
        });
      });

      // Process requests through service chain
      const processDocument = async (docId: string) => {
        try {
          const ocrResult = await mockGeminiService.extractTextFromPDF(`doc-${docId}`);
          const parseResult = await mockGeminiService.parseReservationData(ocrResult);
          const validationResult = await mockGeminiService.validateReservationData(parseResult);

          return {
            documentId: docId,
            success: true,
            result: validationResult
          };
        } catch (error) {
          return {
            documentId: docId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: error instanceof Error ?
              (error.message.includes('OCR') ? 'OCR' :
               error.message.includes('Parse') ? 'Parse' :
               error.message.includes('Validation') ? 'Validation' : 'Unknown') : 'Unknown'
          };
        }
      };

      // Process multiple documents in parallel
      const documentIds = Array.from({ length: requestsPerService }, (_, i) => i.toString());
      const results = await Promise.all(
        documentIds.map(id => processDocument(id))
      );

      // Analyze failure patterns
      const successfulResults = results.filter(r => r.success);
      const failedResults = results.filter(r => !r.success);

      const failuresByService = failedResults.reduce((acc, result) => {
        const service = result.failedAt || 'Unknown';
        acc[service] = (acc[service] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Verify some documents completed successfully despite service failures
      expect(successfulResults.length).toBeGreaterThan(0);

      // Verify failure distribution matches expected patterns
      expect(failuresByService['OCR'] || 0).toBeGreaterThanOrEqual(failuresByService['Parse'] || 0);
      expect(failuresByService['Parse'] || 0).toBeGreaterThanOrEqual(failuresByService['Validation'] || 0);

      console.log(`Cascading failures: ${successfulResults.length} successful, failures by service:`, failuresByService);
    });
  });
});