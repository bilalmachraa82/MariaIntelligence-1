/**
 * Custom Error Classes for Maria Faz Application
 * Provides structured error handling with Portuguese messages
 */

export interface ErrorMessages {
  [key: string]: {
    en: string;
    pt: string;
  };
}

export const ERROR_MESSAGES: ErrorMessages = {
  // Validation Errors
  VALIDATION_FAILED: {
    en: 'Validation failed',
    pt: 'Falha na validação dos dados'
  },
  REQUIRED_FIELD: {
    en: 'Required field is missing',
    pt: 'Campo obrigatório não preenchido'
  },
  INVALID_FORMAT: {
    en: 'Invalid format',
    pt: 'Formato inválido'
  },
  INVALID_EMAIL: {
    en: 'Invalid email format',
    pt: 'Formato de email inválido'
  },
  INVALID_DATE: {
    en: 'Invalid date format',
    pt: 'Formato de data inválido'
  },
  INVALID_PRICE: {
    en: 'Invalid price format',
    pt: 'Formato de preço inválido'
  },

  // Authentication Errors
  UNAUTHORIZED: {
    en: 'Unauthorized access',
    pt: 'Acesso não autorizado'
  },
  INVALID_TOKEN: {
    en: 'Invalid authentication token',
    pt: 'Token de autenticação inválido'
  },
  TOKEN_EXPIRED: {
    en: 'Authentication token expired',
    pt: 'Token de autenticação expirado'
  },
  INSUFFICIENT_PERMISSIONS: {
    en: 'Insufficient permissions',
    pt: 'Permissões insuficientes'
  },

  // Database Errors
  DATABASE_CONNECTION_FAILED: {
    en: 'Database connection failed',
    pt: 'Falha na conexão com a base de dados'
  },
  QUERY_FAILED: {
    en: 'Database query failed',
    pt: 'Falha na consulta à base de dados'
  },
  DUPLICATE_ENTRY: {
    en: 'Duplicate entry',
    pt: 'Entrada duplicada'
  },
  FOREIGN_KEY_CONSTRAINT: {
    en: 'Foreign key constraint violation',
    pt: 'Violação de restrição de chave estrangeira'
  },
  TRANSACTION_FAILED: {
    en: 'Transaction failed',
    pt: 'Transação falhada'
  },

  // Resource Errors
  RESOURCE_NOT_FOUND: {
    en: 'Resource not found',
    pt: 'Recurso não encontrado'
  },
  PROPERTY_NOT_FOUND: {
    en: 'Property not found',
    pt: 'Propriedade não encontrada'
  },
  OWNER_NOT_FOUND: {
    en: 'Owner not found',
    pt: 'Proprietário não encontrado'
  },
  RESERVATION_NOT_FOUND: {
    en: 'Reservation not found',
    pt: 'Reserva não encontrada'
  },
  DOCUMENT_NOT_FOUND: {
    en: 'Document not found',
    pt: 'Documento não encontrado'
  },

  // Business Logic Errors
  RESERVATION_CONFLICT: {
    en: 'Reservation dates conflict with existing booking',
    pt: 'Datas da reserva conflituam com reserva existente'
  },
  PROPERTY_UNAVAILABLE: {
    en: 'Property is not available for the selected dates',
    pt: 'Propriedade não está disponível para as datas selecionadas'
  },
  PAYMENT_FAILED: {
    en: 'Payment processing failed',
    pt: 'Falha no processamento do pagamento'
  },
  INSUFFICIENT_BALANCE: {
    en: 'Insufficient account balance',
    pt: 'Saldo insuficiente na conta'
  },

  // File Processing Errors
  FILE_UPLOAD_FAILED: {
    en: 'File upload failed',
    pt: 'Falha no carregamento do ficheiro'
  },
  INVALID_FILE_TYPE: {
    en: 'Invalid file type',
    pt: 'Tipo de ficheiro inválido'
  },
  FILE_TOO_LARGE: {
    en: 'File size exceeds limit',
    pt: 'Tamanho do ficheiro excede o limite'
  },
  PDF_PROCESSING_FAILED: {
    en: 'PDF processing failed',
    pt: 'Falha no processamento do PDF'
  },
  OCR_PROCESSING_FAILED: {
    en: 'OCR processing failed',
    pt: 'Falha no processamento OCR'
  },

  // Rate Limiting Errors
  RATE_LIMIT_EXCEEDED: {
    en: 'Rate limit exceeded',
    pt: 'Limite de taxa excedido'
  },
  TOO_MANY_REQUESTS: {
    en: 'Too many requests',
    pt: 'Demasiados pedidos'
  },

  // External Service Errors
  EXTERNAL_SERVICE_UNAVAILABLE: {
    en: 'External service unavailable',
    pt: 'Serviço externo indisponível'
  },
  API_QUOTA_EXCEEDED: {
    en: 'API quota exceeded',
    pt: 'Quota da API excedida'
  },
  GEMINI_API_ERROR: {
    en: 'Gemini API error',
    pt: 'Erro na API Gemini'
  },

  // System Errors
  INTERNAL_SERVER_ERROR: {
    en: 'Internal server error',
    pt: 'Erro interno do servidor'
  },
  SERVICE_UNAVAILABLE: {
    en: 'Service temporarily unavailable',
    pt: 'Serviço temporariamente indisponível'
  },
  CONFIGURATION_ERROR: {
    en: 'Configuration error',
    pt: 'Erro de configuração'
  }
};

/**
 * Base Application Error Class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly messagePortuguese: string;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    messagePortuguese?: string,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.messagePortuguese = messagePortuguese || this.getPortugueseMessage(code) || message;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }

  private getPortugueseMessage(code: string): string | undefined {
    return ERROR_MESSAGES[code]?.pt;
  }

  /**
   * Serialize error for API response
   */
  public serialize(): object {
    return {
      name: this.name,
      message: this.messagePortuguese || this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context
    };
  }

  /**
   * Create error from code
   */
  public static fromCode(
    code: string,
    statusCode: number = 500,
    context?: any
  ): AppError {
    const messages = ERROR_MESSAGES[code];
    if (!messages) {
      return new AppError('Unknown error', statusCode, code, undefined, true, context);
    }

    return new AppError(
      messages.en,
      statusCode,
      code,
      messages.pt,
      true,
      context
    );
  }
}

/**
 * Validation Error Class
 */
export class ValidationError extends AppError {
  public readonly validationErrors: ValidationErrorDetail[];

  constructor(
    message: string = 'Validation failed',
    validationErrors: ValidationErrorDetail[] = [],
    context?: any
  ) {
    super(
      message,
      400,
      'VALIDATION_FAILED',
      'Falha na validação dos dados',
      true,
      context
    );
    
    this.validationErrors = validationErrors;
  }

  /**
   * Add validation error
   */
  public addError(field: string, message: string, messagePortuguese?: string): void {
    this.validationErrors.push({
      field,
      message,
      messagePortuguese: messagePortuguese || message
    });
  }

  /**
   * Create from field errors
   */
  public static fromFieldErrors(errors: ValidationErrorDetail[]): ValidationError {
    return new ValidationError('Validation failed', errors);
  }
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  messagePortuguese?: string;
  value?: any;
}

/**
 * Database Error Class
 */
export class DatabaseError extends AppError {
  public readonly originalError: Error;
  public readonly query?: string;
  public readonly canRecover: boolean;
  public readonly recoveryStrategy?: () => void;

  constructor(
    message: string,
    originalError: Error,
    query?: string,
    canRecover: boolean = false,
    recoveryStrategy?: () => void,
    context?: any
  ) {
    super(
      message,
      500,
      'DATABASE_ERROR',
      'Erro na base de dados',
      true,
      context
    );

    this.originalError = originalError;
    this.query = query;
    this.canRecover = canRecover;
    this.recoveryStrategy = recoveryStrategy;
  }

  /**
   * Create from database error
   */
  public static fromDatabaseError(
    error: Error,
    query?: string,
    context?: any
  ): DatabaseError {
    let code = 'DATABASE_ERROR';
    let message = 'Database operation failed';
    let canRecover = false;

    // PostgreSQL error codes
    if (error.message.includes('duplicate key')) {
      code = 'DUPLICATE_ENTRY';
      message = 'Duplicate entry';
      canRecover = false;
    } else if (error.message.includes('foreign key constraint')) {
      code = 'FOREIGN_KEY_CONSTRAINT';
      message = 'Foreign key constraint violation';
      canRecover = false;
    } else if (error.message.includes('connection')) {
      code = 'DATABASE_CONNECTION_FAILED';
      message = 'Database connection failed';
      canRecover = true;
    }

    const dbError = new DatabaseError(message, error, query, canRecover, undefined, context);
    dbError.code = code;
    dbError.messagePortuguese = ERROR_MESSAGES[code]?.pt || 'Erro na base de dados';
    
    return dbError;
  }
}

/**
 * Not Found Error Class
 */
export class NotFoundError extends AppError {
  public readonly resource: string;
  public readonly resourceId?: string | number;

  constructor(
    resource: string,
    resourceId?: string | number,
    context?: any
  ) {
    const message = `${resource} not found`;
    const messagePortuguese = `${resource} não encontrado`;

    super(
      message,
      404,
      'RESOURCE_NOT_FOUND',
      messagePortuguese,
      true,
      context
    );

    this.resource = resource;
    this.resourceId = resourceId;
  }

  /**
   * Create property not found error
   */
  public static property(propertyId: string | number): NotFoundError {
    return new NotFoundError('Propriedade', propertyId);
  }

  /**
   * Create owner not found error
   */
  public static owner(ownerId: string | number): NotFoundError {
    return new NotFoundError('Proprietário', ownerId);
  }

  /**
   * Create reservation not found error
   */
  public static reservation(reservationId: string | number): NotFoundError {
    return new NotFoundError('Reserva', reservationId);
  }

  /**
   * Create document not found error
   */
  public static document(documentId: string | number): NotFoundError {
    return new NotFoundError('Documento', documentId);
  }
}

/**
 * Authentication Error Class
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication failed',
    code: string = 'UNAUTHORIZED',
    context?: any
  ) {
    super(
      message,
      401,
      code,
      ERROR_MESSAGES[code]?.pt || 'Falha na autenticação',
      true,
      context
    );
  }

  /**
   * Create invalid token error
   */
  public static invalidToken(): AuthenticationError {
    return new AuthenticationError(
      'Invalid authentication token',
      'INVALID_TOKEN'
    );
  }

  /**
   * Create token expired error
   */
  public static tokenExpired(): AuthenticationError {
    return new AuthenticationError(
      'Authentication token expired',
      'TOKEN_EXPIRED'
    );
  }
}

/**
 * Authorization Error Class
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Insufficient permissions',
    context?: any
  ) {
    super(
      message,
      403,
      'INSUFFICIENT_PERMISSIONS',
      'Permissões insuficientes',
      true,
      context
    );
  }
}

/**
 * Rate Limit Error Class
 */
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter: number = 60,
    context?: any
  ) {
    super(
      message,
      429,
      'RATE_LIMIT_EXCEEDED',
      'Limite de taxa excedido',
      true,
      context
    );

    this.retryAfter = retryAfter;
  }
}

/**
 * File Processing Error Class
 */
export class FileProcessingError extends AppError {
  public readonly fileName?: string;
  public readonly fileSize?: number;
  public readonly fileType?: string;

  constructor(
    message: string,
    code: string = 'FILE_PROCESSING_FAILED',
    fileName?: string,
    fileSize?: number,
    fileType?: string,
    context?: any
  ) {
    super(
      message,
      400,
      code,
      ERROR_MESSAGES[code]?.pt || 'Erro no processamento do ficheiro',
      true,
      context
    );

    this.fileName = fileName;
    this.fileSize = fileSize;
    this.fileType = fileType;
  }

  /**
   * Create invalid file type error
   */
  public static invalidFileType(fileName: string, fileType: string): FileProcessingError {
    return new FileProcessingError(
      'Invalid file type',
      'INVALID_FILE_TYPE',
      fileName,
      undefined,
      fileType
    );
  }

  /**
   * Create file too large error
   */
  public static fileTooLarge(fileName: string, fileSize: number): FileProcessingError {
    return new FileProcessingError(
      'File size exceeds limit',
      'FILE_TOO_LARGE',
      fileName,
      fileSize
    );
  }
}

/**
 * External Service Error Class
 */
export class ExternalServiceError extends AppError {
  public readonly serviceName: string;
  public readonly originalError?: Error;

  constructor(
    serviceName: string,
    message: string,
    code: string = 'EXTERNAL_SERVICE_UNAVAILABLE',
    originalError?: Error,
    context?: any
  ) {
    super(
      message,
      503,
      code,
      ERROR_MESSAGES[code]?.pt || 'Serviço externo indisponível',
      true,
      context
    );

    this.serviceName = serviceName;
    this.originalError = originalError;
  }

  /**
   * Create Gemini API error
   */
  public static geminiError(error: Error): ExternalServiceError {
    return new ExternalServiceError(
      'Gemini',
      'Gemini API error',
      'GEMINI_API_ERROR',
      error
    );
  }
}

/**
 * Check if error is operational (expected) or programming error
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};