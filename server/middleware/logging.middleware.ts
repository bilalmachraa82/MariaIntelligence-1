/**
 * Logging Middleware - MariaIntelligence 2025
 * Structured logging with pino for better observability
 */

import type { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';

// Configure logger
const logger = pino({
  name: 'mariaintelligence-api',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname',
      messageFormat: '{levelLabel} - {msg}',
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
});

// HTTP logging middleware
const httpLogger = pinoHttp({
  logger,
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent';
    }
    return 'info';
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        'content-type': res.getHeader('content-type'),
        'content-length': res.getHeader('content-length'),
      },
    }),
  },
  // Redact sensitive information
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-api-key"]',
      'req.body.password',
      'req.body.token',
      'req.query.apiKey',
      'req.query.token',
    ],
    remove: true,
  },
});

/**
 * Enhanced logging middleware with additional context
 */
export function loggingMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Add request ID to logger context
    const requestId = (req as any).requestId || 'unknown';
    req.log = logger.child({ requestId });
    
    // Skip logging for health checks in production
    if (process.env.NODE_ENV === 'production' && 
        (req.path === '/health' || req.path.endsWith('/health'))) {
      return next();
    }
    
    // Apply pino-http logging
    httpLogger(req, res, next);
  };
}

/**
 * Security event logger
 */
export function logSecurityEvent(
  event: string,
  details: any,
  req?: Request
): void {
  const securityLogger = logger.child({ component: 'security' });
  
  securityLogger.warn({
    event,
    details,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    url: req?.originalUrl,
    method: req?.method,
    timestamp: new Date().toISOString(),
  }, `Security event: ${event}`);
}

/**
 * Performance logger
 */
export function logPerformanceEvent(
  metric: string,
  value: number,
  unit: string = 'ms',
  context?: any
): void {
  const performanceLogger = logger.child({ component: 'performance' });
  
  performanceLogger.info({
    metric,
    value,
    unit,
    context,
    timestamp: new Date().toISOString(),
  }, `Performance metric: ${metric} = ${value}${unit}`);
}

/**
 * Business logic logger
 */
export function logBusinessEvent(
  event: string,
  details: any,
  userId?: string
): void {
  const businessLogger = logger.child({ component: 'business' });
  
  businessLogger.info({
    event,
    details,
    userId,
    timestamp: new Date().toISOString(),
  }, `Business event: ${event}`);
}

/**
 * Error logger with context
 */
export function logError(
  error: Error,
  context?: any,
  req?: Request
): void {
  const errorLogger = logger.child({ component: 'error' });
  
  errorLogger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    request: req ? {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    } : undefined,
    timestamp: new Date().toISOString(),
  }, error.message);
}

// Export logger instance
export { logger };