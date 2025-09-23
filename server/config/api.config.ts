/**
 * API Configuration for MariaIntelligence 2025
 * Modern ES Modules API configuration with versioning support
 */

export interface ApiConfig {
  version: string;
  prefix: string;
  cors: {
    origin: string[] | boolean;
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
  };
  rateLimit: {
    windowMs: number;
    max: number;
    standardHeaders: boolean;
    legacyHeaders: boolean;
  };
  validation: {
    stripUnknown: boolean;
    abortEarly: boolean;
  };
  documentation: {
    enabled: boolean;
    path: string;
    title: string;
    version: string;
    description: string;
  };
}

export const API_CONFIG: ApiConfig = {
  version: 'v1',
  prefix: '/api/v1',
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://mariaintelligence.com', 'https://app.mariaintelligence.com']
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  },
  validation: {
    stripUnknown: true,
    abortEarly: false,
  },
  documentation: {
    enabled: process.env.NODE_ENV !== 'production',
    path: '/api/docs',
    title: 'MariaIntelligence API',
    version: '1.0.0',
    description: 'Modern REST API for property management and reservations',
  },
};

export const FEATURE_RATE_LIMITS = {
  // Standard API operations
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },
  // File upload operations
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
  },
  // AI/OCR operations
  ai: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
  },
  // Authentication operations
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
  },
  // Search operations
  search: {
    windowMs: 60 * 1000, // 1 minute
    max: 30,
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const API_RESPONSE_FORMATS = {
  SUCCESS: 'success',
  ERROR: 'error',
  VALIDATION_ERROR: 'validation_error',
  NOT_FOUND: 'not_found',
  UNAUTHORIZED: 'unauthorized',
} as const;