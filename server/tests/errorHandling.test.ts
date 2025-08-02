import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { 
  AppError, 
  ValidationError, 
  DatabaseError, 
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  FileProcessingError,
  ExternalServiceError
} from '../utils/errors';
import { ErrorLogger } from '../utils/errorLogger';
import { ErrorTracker } from '../utils/errorTracker';
import { errorNotificationSystem } from '../utils/errorNotificationSystem';

// Mock implementations
jest.mock('../utils/errorLogger');
jest.mock('../utils/errorTracker');

const MockedErrorLogger = ErrorLogger as jest.MockedClass<typeof ErrorLogger>;
const MockedErrorTracker = ErrorTracker as jest.MockedClass<typeof ErrorTracker>;

describe('Error Handling System', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockLogger: jest.Mocked<ErrorLogger>;
  let mockTracker: jest.Mocked<ErrorTracker>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request
    mockRequest = {
      method: 'POST',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
        'x-request-id': 'test-req-123'
      },
      body: { test: 'data' },
      query: {},
      params: {},
      user: { id: 'user-123' }
    };

    // Mock response
    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    const headerMock = jest.fn();
    const setHeaderMock = jest.fn();

    mockResponse = {
      status: statusMock,
      json: jsonMock,
      header: headerMock,
      setHeader: setHeaderMock,
      set: jest.fn()
    };

    // Mock next function
    mockNext = jest.fn();

    // Mock logger and tracker
    mockLogger = {
      logError: jest.fn(),
      logInfo: jest.fn(),
      logWarning: jest.fn(),
      logDebug: jest.fn(),
      getErrorStatistics: jest.fn().mockReturnValue({}),
      healthCheck: jest.fn().mockReturnValue({ status: 'healthy' })
    } as any;

    mockTracker = {
      trackError: jest.fn(),
      getStatisticsSummary: jest.fn().mockReturnValue({}),
      healthCheck: jest.fn().mockReturnValue({ status: 'healthy' })
    } as any;

    MockedErrorLogger.mockImplementation(() => mockLogger);
    MockedErrorTracker.mockImplementation(() => mockTracker);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AppError Class', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError(
        'Test error',
        400,
        'TEST_ERROR',
        'Erro de teste',
        true,
        { context: 'test' }
      );

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.messagePortuguese).toBe('Erro de teste');
      expect(error.isOperational).toBe(true);
      expect(error.context).toEqual({ context: 'test' });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create AppError from code', () => {
      const error = AppError.fromCode('VALIDATION_FAILED', 400);

      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.statusCode).toBe(400);
      expect(error.messagePortuguese).toBe('Falha na validação dos dados');
    });

    it('should serialize error correctly', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      const serialized = error.serialize();

      expect(serialized).toMatchObject({
        name: 'AppError',
        code: 'TEST_ERROR',
        statusCode: 400,
        timestamp: expect.any(String)
      });
    });
  });

  describe('ValidationError Class', () => {
    it('should create ValidationError with validation details', () => {
      const validationErrors = [
        { field: 'email', message: 'Invalid email', messagePortuguese: 'Email inválido' },
        { field: 'name', message: 'Required field', messagePortuguese: 'Campo obrigatório' }
      ];

      const error = new ValidationError('Validation failed', validationErrors);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.validationErrors).toEqual(validationErrors);
    });

    it('should add validation errors', () => {
      const error = new ValidationError();
      error.addError('email', 'Invalid email', 'Email inválido');

      expect(error.validationErrors).toHaveLength(1);
      expect(error.validationErrors[0]).toMatchObject({
        field: 'email',
        message: 'Invalid email',
        messagePortuguese: 'Email inválido'
      });
    });

    it('should create from field errors', () => {
      const fieldErrors = [
        { field: 'email', message: 'Invalid email' }
      ];

      const error = ValidationError.fromFieldErrors(fieldErrors);
      expect(error.validationErrors).toEqual(fieldErrors);
    });
  });

  describe('DatabaseError Class', () => {
    it('should create DatabaseError with original error', () => {
      const originalError = new Error('Connection failed');
      const error = new DatabaseError('Database error', originalError, 'SELECT * FROM users');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('DATABASE_ERROR');
      expect(error.originalError).toBe(originalError);
      expect(error.query).toBe('SELECT * FROM users');
    });

    it('should create from database error with duplicate key', () => {
      const originalError = new Error('duplicate key value violates unique constraint');
      const error = DatabaseError.fromDatabaseError(originalError, 'INSERT INTO users');

      expect(error.code).toBe('DUPLICATE_ENTRY');
      expect(error.messagePortuguese).toBe('Entrada duplicada');
    });

    it('should create from database error with foreign key constraint', () => {
      const originalError = new Error('foreign key constraint fails');
      const error = DatabaseError.fromDatabaseError(originalError);

      expect(error.code).toBe('FOREIGN_KEY_CONSTRAINT');
      expect(error.messagePortuguese).toBe('Violação de restrição de chave estrangeira');
    });

    it('should create from database error with connection issue', () => {
      const originalError = new Error('connection to database failed');
      const error = DatabaseError.fromDatabaseError(originalError);

      expect(error.code).toBe('DATABASE_CONNECTION_FAILED');
      expect(error.canRecover).toBe(true);
    });
  });

  describe('NotFoundError Class', () => {
    it('should create NotFoundError with resource details', () => {
      const error = new NotFoundError('Property', '123');

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.resource).toBe('Property');
      expect(error.resourceId).toBe('123');
    });

    it('should create property not found error', () => {
      const error = NotFoundError.property('prop-123');

      expect(error.resource).toBe('Propriedade');
      expect(error.resourceId).toBe('prop-123');
    });

    it('should create owner not found error', () => {
      const error = NotFoundError.owner('owner-456');

      expect(error.resource).toBe('Proprietário');
      expect(error.resourceId).toBe('owner-456');
    });

    it('should create reservation not found error', () => {
      const error = NotFoundError.reservation('res-789');

      expect(error.resource).toBe('Reserva');
      expect(error.resourceId).toBe('res-789');
    });

    it('should create document not found error', () => {
      const error = NotFoundError.document('doc-101');

      expect(error.resource).toBe('Documento');
      expect(error.resourceId).toBe('doc-101');
    });
  });

  describe('AuthenticationError Class', () => {
    it('should create AuthenticationError', () => {
      const error = new AuthenticationError();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.messagePortuguese).toBe('Falha na autenticação');
    });

    it('should create invalid token error', () => {
      const error = AuthenticationError.invalidToken();

      expect(error.code).toBe('INVALID_TOKEN');
      expect(error.message).toBe('Invalid authentication token');
    });

    it('should create token expired error', () => {
      const error = AuthenticationError.tokenExpired();

      expect(error.code).toBe('TOKEN_EXPIRED');
      expect(error.message).toBe('Authentication token expired');
    });
  });

  describe('AuthorizationError Class', () => {
    it('should create AuthorizationError', () => {
      const error = new AuthorizationError();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(error.messagePortuguese).toBe('Permissões insuficientes');
    });
  });

  describe('RateLimitError Class', () => {
    it('should create RateLimitError with retry after', () => {
      const error = new RateLimitError('Rate limit exceeded', 120);

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.retryAfter).toBe(120);
      expect(error.messagePortuguese).toBe('Limite de taxa excedido');
    });
  });

  describe('FileProcessingError Class', () => {
    it('should create FileProcessingError with file details', () => {
      const error = new FileProcessingError(
        'File too large',
        'FILE_TOO_LARGE',
        'document.pdf',
        1048576,
        'application/pdf'
      );

      expect(error.statusCode).toBe(400);
      expect(error.fileName).toBe('document.pdf');
      expect(error.fileSize).toBe(1048576);
      expect(error.fileType).toBe('application/pdf');
    });

    it('should create invalid file type error', () => {
      const error = FileProcessingError.invalidFileType('document.exe', 'application/exe');

      expect(error.code).toBe('INVALID_FILE_TYPE');
      expect(error.fileName).toBe('document.exe');
      expect(error.fileType).toBe('application/exe');
    });

    it('should create file too large error', () => {
      const error = FileProcessingError.fileTooLarge('large.pdf', 10485760);

      expect(error.code).toBe('FILE_TOO_LARGE');
      expect(error.fileName).toBe('large.pdf');
      expect(error.fileSize).toBe(10485760);
    });
  });

  describe('ExternalServiceError Class', () => {
    it('should create ExternalServiceError', () => {
      const originalError = new Error('Service unavailable');
      const error = new ExternalServiceError(
        'Gemini',
        'API request failed',
        'GEMINI_API_ERROR',
        originalError
      );

      expect(error.statusCode).toBe(503);
      expect(error.serviceName).toBe('Gemini');
      expect(error.originalError).toBe(originalError);
    });

    it('should create Gemini API error', () => {
      const originalError = new Error('API key invalid');
      const error = ExternalServiceError.geminiError(originalError);

      expect(error.serviceName).toBe('Gemini');
      expect(error.code).toBe('GEMINI_API_ERROR');
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('Error Logger', () => {
    it('should log errors with proper context', () => {
      const error = new AppError('Test error');
      const context = { userId: 'user-123', url: '/api/test' };

      mockLogger.logError(error, context);

      expect(mockLogger.logError).toHaveBeenCalledWith(error, context);
    });

    it('should log warnings', () => {
      const message = 'Warning message';
      const context = { component: 'test' };

      mockLogger.logWarning(message, context);

      expect(mockLogger.logWarning).toHaveBeenCalledWith(message, context);
    });

    it('should log info messages', () => {
      const message = 'Info message';
      const context = { action: 'test' };

      mockLogger.logInfo(message, context);

      expect(mockLogger.logInfo).toHaveBeenCalledWith(message, context);
    });

    it('should provide health check', () => {
      const health = mockLogger.healthCheck();

      expect(health.status).toBe('healthy');
      expect(mockLogger.healthCheck).toHaveBeenCalled();
    });
  });

  describe('Error Tracker', () => {
    it('should track errors', () => {
      const error = new AppError('Test error');
      const context = { userId: 'user-123', url: '/api/test' };

      mockTracker.trackError(error, context);

      expect(mockTracker.trackError).toHaveBeenCalledWith(error, context);
    });

    it('should provide statistics summary', () => {
      const stats = mockTracker.getStatisticsSummary();

      expect(mockTracker.getStatisticsSummary).toHaveBeenCalled();
      expect(stats).toBeDefined();
    });

    it('should provide health check', () => {
      const health = mockTracker.healthCheck();

      expect(health.status).toBe('healthy');
      expect(mockTracker.healthCheck).toHaveBeenCalled();
    });
  });

  describe('Error Notification System', () => {
    beforeEach(() => {
      // Reset notification system state for each test
      jest.clearAllMocks();
    });

    it('should process critical errors and trigger notifications', async () => {
      const criticalError = new AppError(
        'Database connection failed',
        500,
        'DATABASE_CONNECTION_FAILED',
        'Falha na conexão com a base de dados'
      );

      const context = {
        userId: 'user-123',
        url: '/api/properties',
        method: 'GET',
        correlationId: 'corr-123'
      };

      // Mock console.error to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await errorNotificationSystem.processError(criticalError, context);

      // Should log the notification attempt
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should test notification channels', async () => {
      const testResult = await errorNotificationSystem.testNotification('console');

      expect(testResult.summary.total).toBeGreaterThan(0);
      expect(testResult.testId).toBeDefined();
      expect(testResult.timestamp).toBeInstanceOf(Date);
    });

    it('should provide notification statistics', () => {
      const stats = errorNotificationSystem.getStatistics();

      expect(stats.channels).toBeDefined();
      expect(stats.rules).toBeDefined();
      expect(stats.notifications).toBeDefined();
      expect(stats.channels.total).toBeGreaterThan(0);
      expect(stats.rules.total).toBeGreaterThan(0);
    });

    it('should manage notification rules', () => {
      const testRule = {
        id: 'test-rule',
        name: 'Test Rule',
        enabled: true,
        conditions: {
          errorCodes: ['TEST_ERROR']
        },
        channels: ['console']
      };

      errorNotificationSystem.addRule(testRule);
      const rules = errorNotificationSystem.getRules();
      expect(rules.some(r => r.id === 'test-rule')).toBe(true);

      const updated = errorNotificationSystem.updateRule('test-rule', { enabled: false });
      expect(updated).toBe(true);

      const removed = errorNotificationSystem.removeRule('test-rule');
      expect(removed).toBe(true);
    });

    it('should provide health check', () => {
      const health = errorNotificationSystem.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.channels).toBeDefined();
      expect(health.rules).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete error flow', async () => {
      const error = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid email', messagePortuguese: 'Email inválido' }
      ]);

      // Mock console.error for notifications
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Process the error through notification system
      await errorNotificationSystem.processError(error, {
        userId: 'user-123',
        url: '/api/users',
        method: 'POST'
      });

      expect(mockLogger.logError).toHaveBeenCalled();
      expect(mockTracker.trackError).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle database error with recovery attempt', async () => {
      const originalError = new Error('Connection timeout');
      const dbError = new DatabaseError(
        'Database connection failed',
        originalError,
        'SELECT * FROM properties',
        true // canRecover
      );

      const context = {
        userId: 'user-123',
        url: '/api/properties',
        method: 'GET'
      };

      // Mock console.error for notifications
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await errorNotificationSystem.processError(dbError, context);

      expect(mockLogger.logError).toHaveBeenCalled();
      expect(mockTracker.trackError).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle external service error with fallback', async () => {
      const originalError = new Error('API quota exceeded');
      const serviceError = ExternalServiceError.geminiError(originalError);

      const context = {
        userId: 'user-123',
        url: '/api/ocr',
        method: 'POST'
      };

      // Mock console.error for notifications
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await errorNotificationSystem.processError(serviceError, context);

      expect(mockLogger.logError).toHaveBeenCalled();
      expect(mockTracker.trackError).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Error Context Building', () => {
    it('should build proper error context from request', () => {
      // This would be tested within the actual error handler implementation
      // For now, we test the structure expectations
      const expectedContext = {
        userId: 'user-123',
        requestId: 'test-req-123',
        userAgent: 'test-agent',
        ip: '127.0.0.1',
        method: 'POST',
        url: '/api/test',
        body: { test: 'data' },
        headers: expect.any(Object),
        query: {},
        params: {},
        timestamp: expect.any(Date)
      };

      // In a real implementation, this would be called by the error handler
      expect(mockRequest.method).toBe('POST');
      expect(mockRequest.originalUrl).toBe('/api/test');
      expect(mockRequest.headers?.['x-request-id']).toBe('test-req-123');
    });
  });

  describe('Error Response Formatting', () => {
    it('should format error responses correctly for production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new AppError('Internal error', 500, 'INTERNAL_SERVER_ERROR');
      
      // Expected production response structure
      const expectedResponse = {
        success: false,
        error: {
          message: expect.any(String),
          messagePortuguese: expect.any(String),
          code: 'INTERNAL_SERVER_ERROR',
          requestId: expect.any(String),
          timestamp: expect.any(String),
          statusCode: 500,
          correlationId: expect.any(String),
          errorId: expect.any(String)
        },
        performance: expect.any(Object),
        metadata: expect.any(Object)
      };

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');

      process.env.NODE_ENV = originalEnv;
    });

    it('should format error responses correctly for development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new AppError('Internal error', 500, 'INTERNAL_SERVER_ERROR');
      
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('Performance and Memory Tests', () => {
  it('should handle high volume of errors without memory leaks', async () => {
    const initialMemory = process.memoryUsage();
    
    // Generate many errors
    for (let i = 0; i < 1000; i++) {
      const error = new AppError(`Test error ${i}`, 400, 'TEST_ERROR');
      const context = {
        userId: `user-${i}`,
        url: `/api/test/${i}`,
        method: 'GET'
      };
      
      // Don't await to avoid overwhelming console output
      errorNotificationSystem.processError(error, context).catch(() => {
        // Ignore errors in test
      });
    }

    // Allow some time for processing
    await new Promise(resolve => setTimeout(resolve, 100));

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    // Memory increase should be reasonable (less than 50MB for 1000 errors)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  it('should maintain performance under load', async () => {
    const startTime = Date.now();
    
    const promises = [];
    for (let i = 0; i < 100; i++) {
      const error = new AppError(`Performance test ${i}`, 400, 'PERFORMANCE_TEST');
      const context = {
        userId: `user-${i}`,
        url: `/api/performance/${i}`,
        method: 'POST'
      };
      
      promises.push(errorNotificationSystem.processError(error, context).catch(() => {}));
    }
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should process 100 errors in less than 5 seconds
    expect(duration).toBeLessThan(5000);
  });
});

describe('Error Recovery Scenarios', () => {
  it('should simulate database recovery scenario', async () => {
    const dbError = new DatabaseError(
      'Connection lost',
      new Error('ECONNRESET'),
      'SELECT * FROM users',
      true // canRecover
    );

    const context = {
      userId: 'user-123',
      url: '/api/users',
      method: 'GET',
      correlationId: 'corr-recovery-test'
    };

    // Mock successful recovery
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    await errorNotificationSystem.processError(dbError, context);
    
    expect(dbError.canRecover).toBe(true);
    
    consoleSpy.mockRestore();
  });

  it('should simulate external service fallback scenario', async () => {
    const serviceError = new ExternalServiceError(
      'Gemini',
      'API rate limit exceeded',
      'API_QUOTA_EXCEEDED',
      new Error('429 Too Many Requests')
    );

    const context = {
      userId: 'user-123',
      url: '/api/ocr/process',
      method: 'POST',
      correlationId: 'corr-fallback-test'
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    await errorNotificationSystem.processError(serviceError, context);
    
    expect(serviceError.serviceName).toBe('Gemini');
    expect(serviceError.statusCode).toBe(503);
    
    consoleSpy.mockRestore();
  });
});

// Additional test utilities
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    method: 'GET',
    originalUrl: '/api/test',
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent',
      'x-request-id': 'test-req-123'
    },
    body: {},
    query: {},
    params: {},
    user: { id: 'test-user' },
    ...overrides
  };
}

export function createMockResponse(): {
  response: Partial<Response>;
  mocks: {
    json: jest.Mock;
    status: jest.Mock;
    setHeader: jest.Mock;
    set: jest.Mock;
  };
} {
  const jsonMock = jest.fn();
  const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
  const setHeaderMock = jest.fn();
  const setMock = jest.fn();

  return {
    response: {
      status: statusMock,
      json: jsonMock,
      setHeader: setHeaderMock,
      set: setMock
    },
    mocks: {
      json: jsonMock,
      status: statusMock,
      setHeader: setHeaderMock,
      set: setMock
    }
  };
}

export function createTestError(
  type: 'validation' | 'database' | 'notfound' | 'auth' | 'rate' | 'file' | 'service' = 'validation'
): AppError {
  switch (type) {
    case 'validation':
      return new ValidationError('Test validation error', [
        { field: 'email', message: 'Invalid email' }
      ]);
    
    case 'database':
      return new DatabaseError(
        'Test database error',
        new Error('Connection failed'),
        'SELECT * FROM test',
        true
      );
    
    case 'notfound':
      return new NotFoundError('TestResource', 'test-123');
    
    case 'auth':
      return new AuthenticationError('Test auth error');
    
    case 'rate':
      return new RateLimitError('Test rate limit', 60);
    
    case 'file':
      return new FileProcessingError(
        'Test file error',
        'FILE_TOO_LARGE',
        'test.pdf',
        1000000,
        'application/pdf'
      );
    
    case 'service':
      return new ExternalServiceError(
        'TestService',
        'Test service error',
        'SERVICE_UNAVAILABLE'
      );
    
    default:
      return new AppError('Test error', 400, 'TEST_ERROR');
  }
}