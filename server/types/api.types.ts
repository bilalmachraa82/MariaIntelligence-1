/**
 * Modern API Types for MariaIntelligence 2025
 * TypeScript definitions for API requests, responses, and middleware
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

// Enhanced Request with validation support
export interface ValidatedRequest<T = any> extends Request {
  validatedBody?: T;
  validatedQuery?: Record<string, any>;
  validatedParams?: Record<string, any>;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Standardized API Response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  };
  metadata?: {
    timestamp: string;
    version: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Validation Error Response
export interface ValidationErrorResponse extends ApiResponse {
  success: false;
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      field: string;
      message: string;
      code: string;
    }[];
  };
}

// Pagination parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter parameters for list endpoints
export interface FilterQuery {
  search?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  [key: string]: any;
}

// Combined query interface
export interface ListQuery extends PaginationQuery, FilterQuery {}

// Middleware types
export type AsyncRequestHandler<T = any> = (
  req: ValidatedRequest<T>,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

export type RequestHandler<T = any> = (
  req: ValidatedRequest<T>,
  res: Response,
  next: NextFunction
) => void | Response;

// Validation middleware options
export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

// Rate limiting types
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

// OpenAPI documentation types
export interface OpenApiOperation {
  summary: string;
  description?: string;
  tags?: string[];
  operationId?: string;
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses: Record<string, OpenApiResponse>;
  security?: OpenApiSecurityRequirement[];
}

export interface OpenApiParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema: OpenApiSchema;
}

export interface OpenApiRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, { schema: OpenApiSchema }>;
}

export interface OpenApiResponse {
  description: string;
  content?: Record<string, { schema: OpenApiSchema }>;
  headers?: Record<string, OpenApiHeader>;
}

export interface OpenApiHeader {
  description?: string;
  schema: OpenApiSchema;
}

export interface OpenApiSchema {
  type: string;
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  required?: string[];
  example?: any;
  description?: string;
  format?: string;
  enum?: any[];
}

export interface OpenApiSecurityRequirement {
  [key: string]: string[];
}

// Performance monitoring types
export interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

// Error types
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public validationErrors: ZodError) {
    super(422, 'VALIDATION_ERROR', message, validationErrors.errors);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id?: string | number) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized access') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access forbidden') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
    this.name = 'RateLimitError';
  }
}