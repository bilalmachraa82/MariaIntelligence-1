/**
 * Modern Validation Middleware for MariaIntelligence 2025
 * Zod-based request validation with comprehensive error handling
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import type { ValidationOptions, ValidatedRequest, ValidationErrorResponse } from '../types/api.types.js';
import { ValidationError } from '../types/api.types.js';
import { sendErrorResponse } from '../utils/response.utils.js';

/**
 * Creates a validation middleware for request validation
 */
export function validateRequest(options: ValidationOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedReq = req as ValidatedRequest;

      // Validate request body
      if (options.body && req.body) {
        try {
          validatedReq.validatedBody = await options.body.parseAsync(req.body);
        } catch (error) {
          if (error instanceof ZodError) {
            throw new ValidationError('Request body validation failed', error);
          }
          throw error;
        }
      }

      // Validate query parameters
      if (options.query && req.query) {
        try {
          validatedReq.validatedQuery = await options.query.parseAsync(req.query);
        } catch (error) {
          if (error instanceof ZodError) {
            throw new ValidationError('Query parameters validation failed', error);
          }
          throw error;
        }
      }

      // Validate path parameters
      if (options.params && req.params) {
        try {
          validatedReq.validatedParams = await options.params.parseAsync(req.params);
        } catch (error) {
          if (error instanceof ZodError) {
            throw new ValidationError('Path parameters validation failed', error);
          }
          throw error;
        }
      }

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        const response: ValidationErrorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: error.validationErrors.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })),
          },
          metadata: {
            timestamp: new Date().toISOString(),
            version: 'v1',
          },
        };

        res.status(422).json(response);
        return;
      }

      next(error);
    }
  };
}

/**
 * Validates file uploads
 */
export function validateFileUpload(options: {
  required?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const files = req.files as Express.Multer.File[] | Express.Multer.File | undefined;
    const fileArray = Array.isArray(files) ? files : files ? [files] : [];

    // Check if file is required
    if (options.required && fileArray.length === 0) {
      return sendErrorResponse(res, 400, 'FILE_REQUIRED', 'File upload is required');
    }

    // Check maximum number of files
    if (options.maxFiles && fileArray.length > options.maxFiles) {
      return sendErrorResponse(res, 400, 'TOO_MANY_FILES', `Maximum ${options.maxFiles} files allowed`);
    }

    // Validate each file
    for (const file of fileArray) {
      // Check file size
      if (options.maxSize && file.size > options.maxSize) {
        return sendErrorResponse(res, 400, 'FILE_TOO_LARGE', `File size exceeds ${options.maxSize} bytes`);
      }

      // Check file type
      if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
        return sendErrorResponse(res, 400, 'INVALID_FILE_TYPE', `File type ${file.mimetype} not allowed`);
      }
    }

    next();
  };
}

/**
 * Sanitizes request data to prevent XSS and injection attacks
 */
export function sanitizeRequest() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();
  };
}

/**
 * Recursively sanitizes an object
 */
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Sanitizes a string to prevent XSS
 */
function sanitizeString(str: string): string {
  if (typeof str !== 'string') return str;

  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates pagination parameters
 */
export function validatePagination() {
  const schema = ZodSchema.object({
    page: ZodSchema.string().transform(Number).pipe(ZodSchema.number().int().positive()).default('1'),
    limit: ZodSchema.string().transform(Number).pipe(ZodSchema.number().int().positive().max(100)).default('10'),
    sortBy: ZodSchema.string().optional(),
    sortOrder: ZodSchema.enum(['asc', 'desc']).default('asc'),
  });

  return validateRequest({ query: schema });
}