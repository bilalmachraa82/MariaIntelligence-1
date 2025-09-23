/**
 * Modern Error Handling Middleware - MariaIntelligence 2025
 * Comprehensive error handling with structured responses
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodError } from 'zod';
import {
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
} from '../types/api.types.js';
import { sendErrorResponse } from '../utils/response.utils.js';
import { HTTP_STATUS } from '../config/api.config.js';

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void {
  // If response already sent, pass to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  console.error('🚨 Error occurred:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle specific error types
  if (error instanceof ValidationError) {
    return sendErrorResponse(
      res,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'VALIDATION_ERROR',
      error.message,
      error.details,
    );
  }

  if (error instanceof NotFoundError) {
    return sendErrorResponse(
      res,
      HTTP_STATUS.NOT_FOUND,
      'NOT_FOUND',
      error.message,
    );
  }

  if (error instanceof UnauthorizedError) {
    return sendErrorResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      'UNAUTHORIZED',
      error.message,
    );
  }

  if (error instanceof ForbiddenError) {
    return sendErrorResponse(
      res,
      HTTP_STATUS.FORBIDDEN,
      'FORBIDDEN',
      error.message,
    );
  }

  if (error instanceof ConflictError) {
    return sendErrorResponse(
      res,
      HTTP_STATUS.CONFLICT,
      'CONFLICT',
      error.message,
    );
  }

  if (error instanceof RateLimitError) {
    return sendErrorResponse(
      res,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'RATE_LIMIT_EXCEEDED',
      error.message,
    );
  }

  if (error instanceof ApiError) {
    return sendErrorResponse(
      res,
      error.statusCode,
      error.code,
      error.message,
      error.details,
    );
  }

  // Handle Zod validation errors
  if (error instanceof Error && error.name === 'ZodError') {
    const zodError = error as ZodError;
    return sendErrorResponse(
      res,
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'VALIDATION_ERROR',
      'Request validation failed',
      zodError.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    );
  }

  // Handle Multer file upload errors
  if ((error as { code?: string }).code === 'LIMIT_FILE_SIZE') {
    return sendErrorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      'FILE_TOO_LARGE',
      'File size exceeds the limit',
    );
  }

  if ((error as { code?: string }).code === 'LIMIT_UNEXPECTED_FILE') {
    return sendErrorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      'UNEXPECTED_FILE',
      'Unexpected file field',
    );
  }

  // Handle database errors
  if ((error as { code?: string }).code === '23505') {
    // PostgreSQL unique violation
    return sendErrorResponse(
      res,
      HTTP_STATUS.CONFLICT,
      'DUPLICATE_ENTRY',
      'Resource already exists',
    );
  }

  if ((error as { code?: string }).code === '23503') {
    // PostgreSQL foreign key violation
    return sendErrorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      'FOREIGN_KEY_VIOLATION',
      'Referenced resource does not exist',
    );
  }

  // Handle network/connection errors
  if ((error as { code?: string }).code === 'ECONNREFUSED' || (error as { code?: string }).code === 'ETIMEDOUT') {
    return sendErrorResponse(
      res,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      'SERVICE_UNAVAILABLE',
      'External service temporarily unavailable',
    );
  }

  // Default internal server error
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : error instanceof Error
        ? error.message
        : 'Unknown error';

  const details =
    process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined;

  return sendErrorResponse(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    'INTERNAL_SERVER_ERROR',
    message,
    details,
  );
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  return sendErrorResponse(
    res,
    HTTP_STATUS.NOT_FOUND,
    'ENDPOINT_NOT_FOUND',
    `Endpoint ${req.method} ${req.path} not found`,
  );
}
