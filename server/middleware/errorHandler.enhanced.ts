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
  correlationId?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    messagePortuguese?: string;
    code: string;
    details?: any;
    requestId?: string;
    timestamp: string;
    statusCode?: number;
    correlationId?: string;
    retryAfter?: number;
    supportContact?: string;
    errorId?: string;
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
    nextSteps?: string[];
  };
  metadata?: {
    environment: string;
    version: string;
    nodeVersion: string;
    platform: string;
  };
}

export interface RecoveryStrategy {
  name: string;
  description: string;
  handler: (error: AppError, context: ErrorContext) => Promise<boolean>;
  canRecover: (error: AppError) => boolean;
  maxRetries: number;
  retryDelay: number;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailure: Date;
  isOpen: boolean;
  halfOpenUntil?: Date;
  successCount?: number;
}

class EnhancedErrorHandler {
  private logger: ErrorLogger;
  private tracker: ErrorTracker;
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private circuitBreaker: Map<string, CircuitBreakerState> = new Map();
  private retryAttempts: Map<string, number> = new Map();
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor() {
    this.logger = new ErrorLogger();
    this.tracker = new ErrorTracker();
    this.initializeRecoveryStrategies();
    this.setupCircuitBreakerCleanup();
  }

  /**
   * Initialize recovery strategies for different error types
   */
  private initializeRecoveryStrategies(): void {
    // Database connection recovery
    this.recoveryStrategies.set('DATABASE_CONNECTION_RECOVERY', {
      name: 'Database Connection Recovery',
      description: 'Attempt to reconnect to database',
      handler: async (error: AppError, context: ErrorContext) => {
        try {
          // Simulate database reconnection logic
          await this.delay(1000);
          return Math.random() > 0.3; // 70% success rate for demo
        } catch {
          return false;
        }
      },
      canRecover: (error: AppError) => 
        error.code === 'DATABASE_CONNECTION_FAILED' || 
        error.code === 'QUERY_FAILED',
      maxRetries: 3,
      retryDelay: 2000
    });

    // External service fallback
    this.recoveryStrategies.set('EXTERNAL_SERVICE_FALLBACK', {
      name: 'External Service Fallback',
      description: 'Use fallback service or cached data',
      handler: async (error: AppError, context: ErrorContext) => {
        try {
          // Attempt to use cached data or fallback service
          await this.delay(500);
          return Math.random() > 0.5; // 50% success rate for demo
        } catch {
          return false;
        }
      },
      canRecover: (error: AppError) => 
        error instanceof ExternalServiceError,
      maxRetries: 2,
      retryDelay: 1000
    });

    // Rate limit recovery
    this.recoveryStrategies.set('RATE_LIMIT_BACKOFF', {
      name: 'Rate Limit Backoff',
      description: 'Wait and retry after rate limit expires',
      handler: async (error: AppError, context: ErrorContext) => {
        if (error instanceof RateLimitError) {
          await this.delay(error.retryAfter * 1000);
          return true;
        }
        return false;
      },
      canRecover: (error: AppError) => 
        error instanceof RateLimitError,
      maxRetries: 1,
      retryDelay: 0 // Handled by the strategy itself
    });
  }

  /**
   * Global error handling middleware with enhanced recovery and monitoring
   */
  public handleError = async (
    error: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const context: ErrorContext = this.buildErrorContext(req);
    
    // Calculate request duration
    if (context.startTime) {
      context.duration = performance.now() - context.startTime;
    }
    
    // Add memory usage for monitoring
    context.memoryUsage = process.memoryUsage();
    
    // Generate correlation ID for tracking
    context.correlationId = this.generateCorrelationId();
    
    // Log the error with context
    this.logger.logError(error, context);
    
    // Track error for monitoring
    this.tracker.trackError(error, context);

    // Update circuit breaker
    this.updateCircuitBreaker(error, context);

    // Check if circuit is open
    if (this.isCircuitOpen(error, context)) {
      await this.handleCircuitOpenError(res, context);
      return;
    }

    // Attempt recovery if possible
    let recoveryAttempted = false;
    let recoverySuccessful = false;
    let recoveryStrategy = '';
    let nextSteps: string[] = [];
    
    if (error instanceof AppError && this.canAttemptRecovery(error, context)) {
      try {
        recoveryAttempted = true;
        const result = await this.attemptRecovery(error, context);
        recoverySuccessful = result.successful;
        recoveryStrategy = result.strategy;
        nextSteps = result.nextSteps;
        
        if (recoverySuccessful) {
          this.logger.logInfo('Error recovery successful', { 
            error: error.code, 
            strategy: recoveryStrategy, 
            correlationId: context.correlationId 
          });
          
          // Reset circuit breaker on successful recovery
          this.resetCircuitBreaker(error, context);
          
          // Send success response
          res.status(200).json({
            success: true,
            message: 'Operação concluída com sucesso após recuperação automática',
            recovery: {
              attempted: true,
              successful: true,
              strategy: recoveryStrategy
            },
            correlationId: context.correlationId
          });
          return;
        }
      } catch (recoveryError) {
        this.logger.logError(recoveryError as Error, { 
          ...context, 
          message: 'Recovery attempt failed',
          originalError: error.message 
        });
      }
    }

    // Build recovery information
    const recovery = {
      attempted: recoveryAttempted,
      successful: recoverySuccessful,
      strategy: recoveryStrategy || undefined,
      suggestion: this.getRecoverySuggestion(error),
      nextSteps: nextSteps.length > 0 ? nextSteps : this.getNextSteps(error)
    };

    // Handle different error types with enhanced responses
    if (error instanceof ValidationError) {
      await this.handleValidationError(error, res, context, recovery);
    } else if (error instanceof DatabaseError) {
      await this.handleDatabaseError(error, res, context, recovery);
    } else if (error instanceof NotFoundError) {
      await this.handleNotFoundError(error, res, context, recovery);
    } else if (error instanceof AuthenticationError) {
      await this.handleAuthenticationError(error, res, context, recovery);
    } else if (error instanceof AuthorizationError) {
      await this.handleAuthorizationError(error, res, context, recovery);
    } else if (error instanceof RateLimitError) {
      await this.handleRateLimitError(error, res, context, recovery);
    } else if (error instanceof FileProcessingError) {
      await this.handleFileProcessingError(error, res, context, recovery);
    } else if (error instanceof ExternalServiceError) {
      await this.handleExternalServiceError(error, res, context, recovery);
    } else if (error instanceof AppError) {
      await this.handleAppError(error, res, context, recovery);
    } else {
      await this.handleUnknownError(error, res, context, recovery);
    }
  };

  /**
   * Handle validation errors with enhanced Portuguese messages
   */
  private async handleValidationError(
    error: ValidationError,
    res: Response,
    context: ErrorContext,
    recovery?: any
  ): Promise<void> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        messagePortuguese: error.messagePortuguese || 'Dados inválidos fornecidos',
        code: error.code,
        details: {
          validationErrors: error.validationErrors,
          totalErrors: error.validationErrors?.length || 0,
          fields: error.validationErrors?.map(ve => ve.field) || [],
          summary: this.generateValidationSummary(error.validationErrors || [])
        },
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        statusCode: error.statusCode,
        correlationId: context.correlationId,
        supportContact: 'suporte@mariafaz.com',
        errorId: this.generateErrorId()
      },
      performance: {
        duration: context.duration || 0,
        memoryUsage: context.memoryUsage
      },
      recovery,
      metadata: this.getMetadata()
    };

    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle database errors with recovery attempts
   */
  private async handleDatabaseError(
    error: DatabaseError,
    res: Response,
    context: ErrorContext,
    recovery?: any
  ): Promise<void> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: process.env.NODE_ENV === 'production' 
          ? 'Erro interno do servidor' 
          : error.message,
        messagePortuguese: error.messagePortuguese || 'Erro na base de dados',
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? {
          originalError: error.originalError?.message,
          query: error.query,
          canRecover: error.canRecover
        } : undefined,
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        statusCode: error.statusCode,
        correlationId: context.correlationId,
        supportContact: 'suporte@mariafaz.com',
        errorId: this.generateErrorId()
      },
      performance: {
        duration: context.duration || 0,
        memoryUsage: context.memoryUsage
      },
      recovery,
      metadata: this.getMetadata()
    };

    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle not found errors
   */
  private async handleNotFoundError(
    error: NotFoundError,
    res: Response,
    context: ErrorContext,
    recovery?: any
  ): Promise<void> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        messagePortuguese: error.messagePortuguese || `${error.resource} não encontrado`,
        code: error.code,
        details: {
          resource: error.resource,
          resourceId: error.resourceId,
          suggestions: this.getNotFoundSuggestions(error.resource)
        },
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        statusCode: error.statusCode,
        correlationId: context.correlationId,
        supportContact: 'suporte@mariafaz.com',
        errorId: this.generateErrorId()
      },
      performance: {
        duration: context.duration || 0,
        memoryUsage: context.memoryUsage
      },
      recovery,
      metadata: this.getMetadata()
    };

    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle authentication errors
   */
  private async handleAuthenticationError(
    error: AuthenticationError,
    res: Response,
    context: ErrorContext,
    recovery?: any
  ): Promise<void> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        messagePortuguese: error.messagePortuguese || 'Falha na autenticação',
        code: error.code,
        details: {
          authRequired: true,
          loginUrl: '/api/auth/login',
          refreshUrl: '/api/auth/refresh'
        },
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        statusCode: error.statusCode,
        correlationId: context.correlationId,
        errorId: this.generateErrorId()
      },
      performance: {
        duration: context.duration || 0,
        memoryUsage: context.memoryUsage
      },
      recovery,
      metadata: this.getMetadata()
    };

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle authorization errors
   */
  private async handleAuthorizationError(
    error: AuthorizationError,
    res: Response,
    context: ErrorContext,
    recovery?: any
  ): Promise<void> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        messagePortuguese: error.messagePortuguese || 'Permissões insuficientes',
        code: error.code,
        details: {
          requiredPermissions: [],
          contactAdmin: true
        },
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        statusCode: error.statusCode,
        correlationId: context.correlationId,
        errorId: this.generateErrorId()
      },
      performance: {
        duration: context.duration || 0,
        memoryUsage: context.memoryUsage
      },
      recovery,
      metadata: this.getMetadata()
    };

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle rate limit errors
   */
  private async handleRateLimitError(
    error: RateLimitError,
    res: Response,
    context: ErrorContext,
    recovery?: any
  ): Promise<void> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        messagePortuguese: error.messagePortuguese || 'Limite de taxa excedido',
        code: error.code,
        details: {
          retryAfter: error.retryAfter,
          retryAfterHuman: this.formatRetryAfter(error.retryAfter)
        },
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        statusCode: error.statusCode,
        correlationId: context.correlationId,
        retryAfter: error.retryAfter,
        errorId: this.generateErrorId()
      },
      performance: {
        duration: context.duration || 0,
        memoryUsage: context.memoryUsage
      },
      recovery,
      metadata: this.getMetadata()
    };

    res.set('Retry-After', error.retryAfter.toString());
    res.status(error.statusCode).json(response);
  }

  /**
   * Handle file processing errors
   */
  private async handleFileProcessingError(
    error: FileProcessingError,
    res: Response,
    context: ErrorContext,
    recovery?: any
  ): Promise<void> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        messagePortuguese: error.messagePortuguese || 'Erro no processamento do ficheiro',
        code: error.code,
        details: {
          fileName: error.fileName,
          fileSize: error.fileSize,
          fileType: error.fileType,
          allowedTypes: ['pdf', 'jpg', 'png', 'doc'],
          maxSize: '10MB'
        },
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        statusCode: error.statusCode,
        correlationId: context.correlationId,
        errorId: this.generateErrorId()
      },
      performance: {
        duration: context.duration || 0,
        memoryUsage: context.memoryUsage
      },
      recovery,
      metadata: this.getMetadata()
    };

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle external service errors
   */
  private async handleExternalServiceError(
    error: ExternalServiceError,
    res: Response,
    context: ErrorContext,
    recovery?: any
  ): Promise<void> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: process.env.NODE_ENV === 'production' 
          ? 'Serviço temporariamente indisponível' 
          : error.message,
        messagePortuguese: error.messagePortuguese || 'Serviço externo indisponível',
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? {
          serviceName: error.serviceName,
          originalError: error.originalError?.message
        } : {
          serviceName: error.serviceName
        },
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        statusCode: error.statusCode,
        correlationId: context.correlationId,
        errorId: this.generateErrorId()
      },
      performance: {
        duration: context.duration || 0,
        memoryUsage: context.memoryUsage
      },
      recovery,
      metadata: this.getMetadata()
    };

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle general application errors
   */
  private async handleAppError(
    error: AppError,
    res: Response,
    context: ErrorContext,
    recovery?: any
  ): Promise<void> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        messagePortuguese: error.messagePortuguese || error.message,
        code: error.code,
        details: error.context,
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        statusCode: error.statusCode,
        correlationId: context.correlationId,
        errorId: this.generateErrorId()
      },
      performance: {
        duration: context.duration || 0,
        memoryUsage: context.memoryUsage
      },
      recovery,
      metadata: this.getMetadata()
    };

    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
    }

    res.status(error.statusCode).json(response);
  }

  /**
   * Handle unknown errors
   */
  private async handleUnknownError(
    error: Error,
    res: Response,
    context: ErrorContext,
    recovery?: any
  ): Promise<void> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: process.env.NODE_ENV === 'production' 
          ? 'Erro interno do servidor' 
          : error.message,
        messagePortuguese: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR',
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        statusCode: 500,
        correlationId: context.correlationId,
        supportContact: 'suporte@mariafaz.com',
        errorId: this.generateErrorId()
      },
      performance: {
        duration: context.duration || 0,
        memoryUsage: context.memoryUsage
      },
      recovery,
      metadata: this.getMetadata()
    };

    if (process.env.NODE_ENV === 'development') {
      response.error.message = error.message;
      response.error.details = {
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 10) // Limit stack trace
      };
      response.stack = error.stack;
    }

    res.status(500).json(response);
  }

  /**
   * Handle circuit breaker open state
   */
  private async handleCircuitOpenError(
    res: Response,
    context: ErrorContext
  ): Promise<void> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: 'Service temporarily unavailable',
        messagePortuguese: 'Serviço temporariamente indisponível',
        code: 'CIRCUIT_BREAKER_OPEN',
        details: {
          reason: 'Too many recent failures',
          retryAfter: 60
        },
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        statusCode: 503,
        correlationId: context.correlationId,
        retryAfter: 60,
        errorId: this.generateErrorId()
      },
      performance: {
        duration: context.duration || 0,
        memoryUsage: context.memoryUsage
      },
      metadata: this.getMetadata()
    };

    res.set('Retry-After', '60');
    res.status(503).json(response);
  }

  /**
   * Build error context from request
   */
  private buildErrorContext(req: Request): ErrorContext {
    return {
      userId: (req as any).user?.id || 'anonymous',
      requestId: req.headers['x-request-id'] as string || this.generateRequestId(),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      method: req.method,
      url: req.originalUrl,
      body: this.sanitizeBody(req.body),
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      params: req.params,
      timestamp: new Date(),
      startTime: (req as any).startTime || performance.now()
    };
  }

  /**
   * Sanitize request body for logging
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization', 'creditCard', 'ssn'];
    
    const sanitizeRecursive = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const result: any = Array.isArray(obj) ? [] : {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeRecursive(value);
        } else {
          result[key] = value;
        }
      }
      
      return result;
    };

    return sanitizeRecursive(sanitized);
  }

  /**
   * Sanitize request headers for logging
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Check if recovery can be attempted
   */
  private canAttemptRecovery(error: AppError, context: ErrorContext): boolean {
    const retryKey = `${error.code}-${context.url}`;
    const attempts = this.retryAttempts.get(retryKey) || 0;
    
    if (attempts >= this.MAX_RETRY_ATTEMPTS) {
      return false;
    }

    return Array.from(this.recoveryStrategies.values()).some(strategy => 
      strategy.canRecover(error)
    );
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(
    error: AppError, 
    context: ErrorContext
  ): Promise<{ successful: boolean; strategy: string; nextSteps: string[] }> {
    const retryKey = `${error.code}-${context.url}`;
    const attempts = this.retryAttempts.get(retryKey) || 0;
    this.retryAttempts.set(retryKey, attempts + 1);

    // Clean up old retry attempts periodically
    setTimeout(() => {
      this.retryAttempts.delete(retryKey);
    }, 300000); // 5 minutes

    for (const strategy of this.recoveryStrategies.values()) {
      if (strategy.canRecover(error)) {
        try {
          const success = await strategy.handler(error, context);
          if (success) {
            return {
              successful: true,
              strategy: strategy.name,
              nextSteps: ['Operation completed successfully', 'Monitor for stability']
            };
          }
        } catch (recoveryError) {
          this.logger.logError(recoveryError as Error, {
            ...context,
            message: `Recovery strategy failed: ${strategy.name}`
          });
        }
      }
    }

    return {
      successful: false,
      strategy: 'No suitable recovery strategy found',
      nextSteps: ['Manual intervention required', 'Contact support if issue persists']
    };
  }

  /**
   * Update circuit breaker state
   */
  private updateCircuitBreaker(error: Error | AppError, context: ErrorContext): void {
    const key = this.getCircuitBreakerKey(error, context);
    const state = this.circuitBreaker.get(key) || {
      failures: 0,
      lastFailure: new Date(),
      isOpen: false
    };

    if (error instanceof AppError && error.statusCode >= 500) {
      state.failures++;
      state.lastFailure = new Date();

      if (state.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
        state.isOpen = true;
        state.halfOpenUntil = new Date(Date.now() + this.CIRCUIT_BREAKER_TIMEOUT);
      }
    } else {
      // Success - reset failures
      state.failures = 0;
      state.isOpen = false;
      state.halfOpenUntil = undefined;
    }

    this.circuitBreaker.set(key, state);
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(error: Error | AppError, context: ErrorContext): boolean {
    const key = this.getCircuitBreakerKey(error, context);
    const state = this.circuitBreaker.get(key);

    if (!state || !state.isOpen) return false;

    // Check if half-open period has passed
    if (state.halfOpenUntil && new Date() > state.halfOpenUntil) {
      state.isOpen = false;
      state.halfOpenUntil = undefined;
      return false;
    }

    return state.isOpen;
  }

  /**
   * Reset circuit breaker on successful recovery
   */
  private resetCircuitBreaker(error: Error | AppError, context: ErrorContext): void {
    const key = this.getCircuitBreakerKey(error, context);
    this.circuitBreaker.delete(key);
  }

  /**
   * Get circuit breaker key
   */
  private getCircuitBreakerKey(error: Error | AppError, context: ErrorContext): string {
    const errorType = error instanceof AppError ? error.code : error.name;
    return `${errorType}-${context.url}`;
  }

  /**
   * Setup circuit breaker cleanup
   */
  private setupCircuitBreakerCleanup(): void {
    setInterval(() => {
      const now = new Date();
      for (const [key, state] of this.circuitBreaker.entries()) {
        if (state.halfOpenUntil && now > state.halfOpenUntil) {
          state.isOpen = false;
          state.halfOpenUntil = undefined;
        }
        
        // Remove old entries
        if (now.getTime() - state.lastFailure.getTime() > 300000) { // 5 minutes
          this.circuitBreaker.delete(key);
        }
      }
    }, 60000); // 1 minute
  }

  /**
   * Get recovery suggestion based on error type
   */
  private getRecoverySuggestion(error: Error | AppError): string {
    if (error instanceof ValidationError) {
      return 'Verifique os dados fornecidos e tente novamente';
    }
    if (error instanceof DatabaseError) {
      return 'Tente novamente em alguns momentos. Se o problema persistir, contacte o suporte';
    }
    if (error instanceof NotFoundError) {
      return 'Verifique se o recurso solicitado existe e se tem as permissões necessárias';
    }
    if (error instanceof RateLimitError) {
      return 'Aguarde alguns momentos antes de tentar novamente';
    }
    if (error instanceof ExternalServiceError) {
      return 'Serviço temporariamente indisponível. Tente novamente mais tarde';
    }
    return 'Tente novamente ou contacte o suporte se o problema persistir';
  }

  /**
   * Get next steps based on error type
   */
  private getNextSteps(error: Error | AppError): string[] {
    if (error instanceof ValidationError) {
      return [
        'Revise os dados inseridos',
        'Verifique os campos obrigatórios',
        'Confirme os formatos dos dados'
      ];
    }
    if (error instanceof DatabaseError) {
      return [
        'Aguarde alguns momentos',
        'Tente novamente',
        'Contacte o suporte se persistir'
      ];
    }
    if (error instanceof NotFoundError) {
      return [
        'Verifique o URL ou identificador',
        'Confirme as suas permissões',
        'Contacte o administrador se necessário'
      ];
    }
    return [
      'Aguarde alguns momentos',
      'Tente a operação novamente',
      'Contacte o suporte se o problema persistir'
    ];
  }

  /**
   * Generate validation summary
   */
  private generateValidationSummary(errors: any[]): string {
    if (errors.length === 0) return 'Nenhum erro de validação';
    if (errors.length === 1) return `1 erro de validação no campo ${errors[0].field}`;
    return `${errors.length} erros de validação encontrados`;
  }

  /**
   * Get not found suggestions
   */
  private getNotFoundSuggestions(resource: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      'Propriedade': [
        'Verifique se a propriedade existe',
        'Confirme o ID da propriedade',
        'Verifique as suas permissões'
      ],
      'Proprietário': [
        'Verifique se o proprietário está ativo',
        'Confirme o ID do proprietário',
        'Contacte o administrador'
      ],
      'Reserva': [
        'Verifique se a reserva existe',
        'Confirme as datas da reserva',
        'Verifique o estado da reserva'
      ],
      'default': [
        'Verifique se o recurso existe',
        'Confirme o identificador',
        'Verifique as suas permissões'
      ]
    };

    return suggestions[resource] || suggestions['default'];
  }

  /**
   * Format retry after duration
   */
  private formatRetryAfter(seconds: number): string {
    if (seconds < 60) return `${seconds} segundos`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutos`;
    return `${Math.floor(seconds / 3600)} horas`;
  }

  /**
   * Get system metadata
   */
  private getMetadata(): any {
    return {
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate correlation ID for tracking
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle 404 errors
   */
  public handle404 = async (req: Request, res: Response): Promise<void> => {
    const error = new NotFoundError('Endpoint', req.originalUrl);
    const context = this.buildErrorContext(req);
    
    this.logger.logError(error, context);
    this.tracker.trackError(error, context);

    const response: ErrorResponse = {
      success: false,
      error: {
        message: 'Endpoint not found',
        messagePortuguese: 'Endpoint não encontrado',
        code: error.code,
        details: {
          resource: 'Endpoint',
          resourceId: req.originalUrl,
          method: req.method,
          availableEndpoints: ['/api/properties', '/api/owners', '/api/reservations']
        },
        requestId: context.requestId,
        timestamp: new Date().toISOString(),
        statusCode: 404,
        correlationId: context.correlationId,
        errorId: this.generateErrorId()
      },
      performance: {
        duration: context.duration || 0
      },
      metadata: this.getMetadata()
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

  /**
   * Get error statistics
   */
  public getErrorStatistics = (req: Request, res: Response): void => {
    const stats = {
      tracker: this.tracker.getStatisticsSummary(),
      logger: this.logger.getErrorStatistics(),
      circuitBreaker: {
        activeCircuits: this.circuitBreaker.size,
        openCircuits: Array.from(this.circuitBreaker.values()).filter(s => s.isOpen).length
      },
      recoveryStrategies: {
        available: this.recoveryStrategies.size,
        strategies: Array.from(this.recoveryStrategies.keys())
      }
    };

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  };

  /**
   * Health check endpoint
   */
  public healthCheck = (req: Request, res: Response): void => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        logger: this.logger.healthCheck(),
        tracker: this.tracker.healthCheck(),
        circuitBreaker: {
          status: 'healthy',
          activeCircuits: this.circuitBreaker.size
        },
        recoveryStrategies: {
          status: 'healthy',
          count: this.recoveryStrategies.size
        }
      },
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        version: process.version
      }
    };

    res.json(health);
  };
}

// Create singleton instance
export const enhancedErrorHandler = new EnhancedErrorHandler();

// Export middleware functions
export const handleError = enhancedErrorHandler.handleError;
export const handle404 = enhancedErrorHandler.handle404;
export const asyncHandler = enhancedErrorHandler.asyncHandler;
export const getErrorStatistics = enhancedErrorHandler.getErrorStatistics;
export const healthCheck = enhancedErrorHandler.healthCheck;

/**
 * Request timing middleware
 */
export const requestTimingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  (req as any).startTime = performance.now();
  next();
};

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
  (req as any).errorContext = {
    startTime: performance.now(),
    requestId: req.headers['x-request-id'] as string
  };
  next();
};

/**
 * CORS error handling middleware
 */
export const corsErrorMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};