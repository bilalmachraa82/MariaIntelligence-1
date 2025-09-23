/**
 * Response Utilities for MariaIntelligence 2025
 * Standardized response formatting and error handling
 */

import type { Response } from 'express';
import type { ApiResponse, ValidationErrorResponse } from '../types/api.types.js';
import { HTTP_STATUS, API_RESPONSE_FORMATS } from '../config/api.config.js';

/**
 * Sends a successful response with data
 */
export function sendSuccessResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    metadata: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  };

  return res.status(statusCode).json(response);
}

/**
 * Sends a paginated response
 */
export function sendPaginatedResponse<T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
): Response {
  const response: ApiResponse<T[]> = {
    success: true,
    data,
    message,
    metadata: {
      timestamp: new Date().toISOString(),
      version: 'v1',
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
    },
  };

  return res.status(HTTP_STATUS.OK).json(response);
}

/**
 * Sends an error response
 */
export function sendErrorResponse(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && details instanceof Error) {
    response.error!.stack = details.stack;
  }

  return res.status(statusCode).json(response);
}

/**
 * Sends a validation error response
 */
export function sendValidationErrorResponse(
  res: Response,
  message: string,
  validationErrors: Array<{
    field: string;
    message: string;
    code: string;
  }>
): Response {
  const response: ValidationErrorResponse = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message,
      details: validationErrors,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  };

  return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(response);
}

/**
 * Sends a not found response
 */
export function sendNotFoundResponse(
  res: Response,
  resource: string,
  id?: string | number
): Response {
  const message = id
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;

  return sendErrorResponse(
    res,
    HTTP_STATUS.NOT_FOUND,
    API_RESPONSE_FORMATS.NOT_FOUND.toUpperCase(),
    message
  );
}

/**
 * Sends an unauthorized response
 */
export function sendUnauthorizedResponse(
  res: Response,
  message: string = 'Unauthorized access'
): Response {
  return sendErrorResponse(
    res,
    HTTP_STATUS.UNAUTHORIZED,
    API_RESPONSE_FORMATS.UNAUTHORIZED.toUpperCase(),
    message
  );
}

/**
 * Sends a forbidden response
 */
export function sendForbiddenResponse(
  res: Response,
  message: string = 'Access forbidden'
): Response {
  return sendErrorResponse(
    res,
    HTTP_STATUS.FORBIDDEN,
    'FORBIDDEN',
    message
  );
}

/**
 * Sends a conflict response
 */
export function sendConflictResponse(
  res: Response,
  message: string
): Response {
  return sendErrorResponse(
    res,
    HTTP_STATUS.CONFLICT,
    'CONFLICT',
    message
  );
}

/**
 * Sends a rate limit exceeded response
 */
export function sendRateLimitResponse(
  res: Response,
  message: string = 'Too many requests'
): Response {
  return sendErrorResponse(
    res,
    HTTP_STATUS.TOO_MANY_REQUESTS,
    'RATE_LIMIT_EXCEEDED',
    message
  );
}

/**
 * Sends a service unavailable response
 */
export function sendServiceUnavailableResponse(
  res: Response,
  message: string = 'Service temporarily unavailable'
): Response {
  return sendErrorResponse(
    res,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
    'SERVICE_UNAVAILABLE',
    message
  );
}

/**
 * Handles async route errors
 */
export function asyncHandler<T>(
  fn: (req: any, res: Response, next: any) => Promise<T>
) {
  return (req: any, res: Response, next: any): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Wraps a route handler with error handling
 */
export function withErrorHandling<T>(
  handler: (req: any, res: Response, next: any) => Promise<T> | T
) {
  return asyncHandler(handler);
}