import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError, DatabaseError, NotFoundError, AuthenticationError, AuthorizationError, RateLimitError, FileProcessingError, ExternalServiceError } from '../utils/errors';
import { ErrorLogger } from '../utils/errorLogger';
import { ErrorTracker } from '../utils/errorTracker';
import { performance } from 'perf_hooks';

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  body?: any;
  timestamp?: Date;
  startTime?: number;
  duration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  headers?: any;
  query?: any;
  params?: any;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
    requestId?: string;
    timestamp: string;
    statusCode?: number;
    correlationId?: string;
    retryAfter?: number;
    supportContact?: string;
  };
  stack?: string;
  performance?: {
    duration: number;
    memoryUsage?: NodeJS.MemoryUsage;
  };
  recovery?: {
    attempted: boolean;
    successful?: boolean;
    strategy?: string;
    suggestion?: string;
  };
}

class ErrorHandler {
  private logger: ErrorLogger;
  private tracker: ErrorTracker;

  constructor() {
    this.logger = new ErrorLogger();
    this.tracker = new ErrorTracker();
  }

  /**
   * Global error handling middleware
   */
  public handleError = (
    error: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const context: ErrorContext = this.buildErrorContext(req);
    
    // Log the error with context
    this.logger.logError(error, context);
    
    // Track error for monitoring
    this.tracker.trackError(error, context);

    // Handle different error types
    if (error instanceof ValidationError) {
      this.handleValidationError(error, res, context);
    } else if (error instanceof DatabaseError) {
      this.handleDatabaseError(error, res, context);
    } else if (error instanceof NotFoundError) {
      this.handleNotFoundError(error, res, context);
    } else if (error instanceof AppError) {
      this.handleAppError(error, res, context);
    } else {
      this.handleUnknownError(error, res, context);
    }
  };

  /**
   * Handle validation errors
   */
  private handleValidationError(
    error: ValidationError,
    res: Response,
    context: ErrorContext
  ): void {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.messagePortuguese || error.message,
        code: error.code,
        details: error.validationErrors,
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      }
    };

    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle database errors
   */
  private handleDatabaseError(
    error: DatabaseError,
    res: Response,
    context: ErrorContext
  ): void {
    // Attempt recovery if possible
    if (error.canRecover && this.attemptRecovery(error)) {
      return;
    }

    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.messagePortuguese || 'Erro interno do servidor',
        code: error.code,
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      }
    };

    // Don't expose database details in production
    if (process.env.NODE_ENV === 'development') {
      response.error.details = error.originalError;
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle not found errors
   */
  private handleNotFoundError(
    error: NotFoundError,
    res: Response,
    context: ErrorContext
  ): void {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.messagePortuguese || error.message,
        code: error.code,
        details: {
          resource: error.resource,
          resourceId: error.resourceId
        },
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      }
    };

    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle application errors
   */
  private handleAppError(
    error: AppError,
    res: Response,
    context: ErrorContext
  ): void {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.messagePortuguese || error.message,
        code: error.code,
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      }
    };

    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(
    error: Error,
    res: Response,
    context: ErrorContext
  ): void {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR',
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      }
    };

    if (process.env.NODE_ENV === 'development') {
      response.error.message = error.message;
      response.error.details = error;
      response.stack = error.stack;
    }

    res.status(500).json(response);
  }

  /**
   * Build error context from request
   */
  private buildErrorContext(req: Request): ErrorContext {
    return {
      userId: req.user?.id || 'anonymous',
      requestId: req.headers['x-request-id'] as string || this.generateRequestId(),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      method: req.method,
      url: req.originalUrl,
      body: this.sanitizeBody(req.body),
      timestamp: new Date()
    };
  }

  /**
   * Sanitize request body for logging
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Attempt error recovery
   */
  private attemptRecovery(error: DatabaseError): boolean {
    try {
      if (error.recoveryStrategy) {
        error.recoveryStrategy();
        return true;
      }
    } catch (recoveryError) {
      this.logger.logError(recoveryError, {
        message: 'Error recovery failed',
        originalError: error.message
      });
    }
    return false;
  }

  /**
   * Handle 404 errors
   */
  public handle404 = (req: Request, res: Response): void => {
    const error = new NotFoundError('Endpoint', req.originalUrl);
    const context = this.buildErrorContext(req);
    
    this.logger.logError(error, context);
    this.tracker.trackError(error, context);

    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.messagePortuguese,
        code: error.code,
        details: {
          resource: 'Endpoint',
          resourceId: req.originalUrl
        },
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      }
    };

    res.status(404).json(response);
  };

  /**
   * Async error wrapper
   */
  public asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Export middleware functions
export const handleError = errorHandler.handleError;
export const handle404 = errorHandler.handle404;
export const asyncHandler = errorHandler.asyncHandler;

/**
 * Request ID middleware
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  res.setHeader('X-Request-ID', req.headers['x-request-id'] as string);
  next();
};

/**
 * Error context middleware
 */
export const errorContextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.errorContext = {
    startTime: Date.now(),
    requestId: req.headers['x-request-id'] as string
  };
  next();
};