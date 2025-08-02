/**
 * Comprehensive Security Middleware for Maria Faz Project
 * 
 * This middleware implements multiple layers of security including:
 * - Helmet configuration for security headers
 * - Rate limiting with different limits for API and PDF import
 * - CORS configuration with specific origin allowlist
 * - Request validation middleware
 * - Audit logging for security events
 * - IP-based security controls
 * - Content validation
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { createHash } from 'crypto';
import pino from 'pino';

// Security logger configuration
const securityLogger = pino({
  name: 'security-audit',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname',
    }
  } : undefined,
});

// Security event types for audit logging
export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_REQUEST = 'SUSPICIOUS_REQUEST',
  CORS_VIOLATION = 'CORS_VIOLATION',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  FILE_UPLOAD_REJECTED = 'FILE_UPLOAD_REJECTED',
  IP_BLOCKED = 'IP_BLOCKED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}

// Interface for security event logging
interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  url: string;
  method: string;
  timestamp: Date;
  details?: any;
  userId?: string;
}

// Blocked IPs store (in production, use Redis or database)
const blockedIPs = new Set<string>();
const ipAttempts = new Map<string, { count: number; lastAttempt: Date }>();

/**
 * Helmet Configuration with Enhanced CSP
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for React development
        "'unsafe-eval'", // Required for React development
        "https://cdn.jsdelivr.net", // For external libraries
        "https://unpkg.com", // For external libraries
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "http://localhost:*", // Development only
      ],
      connectSrc: [
        "'self'",
        "https://api.openai.com",
        "https://api.anthropic.com",
        "https://generativelanguage.googleapis.com",
        "https://api.mistral.ai",
        "wss://localhost:*", // WebSocket development
        "ws://localhost:*", // WebSocket development
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:",
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: ["'none'"],
      childSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"],
      manifestSrc: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for file uploads
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

/**
 * CORS Configuration with Specific Origins
 */
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // React dev server
  'http://localhost:5100', // App server
  'https://mariafaz.vercel.app', // Production domain
  'https://mariafaz-git-main-bilals-projects-4c123456.vercel.app', // Vercel preview
  // Add more production domains as needed
];

export const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowlist
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log CORS violation asynchronously
    logSecurityEvent({
      type: SecurityEventType.CORS_VIOLATION,
      severity: 'medium',
      ip: 'unknown',
      userAgent: 'unknown',
      url: 'CORS_CHECK',
      method: 'OPTIONS',
      timestamp: new Date(),
      details: { origin, allowedOrigins }
    }).catch(error => {
      securityLogger.error('Failed to log CORS violation:', error);
    });
    
    callback(new Error('Not allowed by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-File-Type',
    'X-Upload-Type'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
  maxAge: 86400 // 24 hours
});

/**
 * Rate Limiting Configuration
 */

// General API rate limiter - 100 requests per 15 minutes
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas requisições. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 900 // 15 minutes in seconds
  },
  handler: (req, res) => {
    // Log security event asynchronously (don't block response)
    logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: 'medium',
      ip: getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown',
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date(),
      details: { limit: 100, window: '15min' }
    }).catch(error => {
      securityLogger.error('Failed to log rate limit event:', error);
    });
    
    res.status(429).json({
      error: 'Demasiadas requisições. Tente novamente em 15 minutos.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    });
  }
});

// PDF Import rate limiter - 10 requests per hour
export const pdfImportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Limite de importação de PDFs excedido. Tente novamente em 1 hora.',
    code: 'PDF_RATE_LIMIT_EXCEEDED',
    retryAfter: 3600 // 1 hour in seconds
  },
  handler: (req, res) => {
    // Log security event asynchronously
    logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: 'high',
      ip: getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown',
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date(),
      details: { limit: 10, window: '1hour', type: 'pdf_import' }
    }).catch(error => {
      securityLogger.error('Failed to log PDF rate limit event:', error);
    });
    
    res.status(429).json({
      error: 'Limite de importação de PDFs excedido. Tente novamente em 1 hora.',
      code: 'PDF_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600
    });
  }
});

// Strict rate limiter for sensitive operations - 20 requests per hour
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Limite de operações sensíveis excedido. Tente novamente em 1 hora.',
    code: 'STRICT_RATE_LIMIT_EXCEEDED',
    retryAfter: 3600
  },
  handler: (req, res) => {
    // Log security event asynchronously
    logSecurityEvent({
      type: SecurityEventType.RATE_LIMIT_EXCEEDED,
      severity: 'high',
      ip: getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown',
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date(),
      details: { limit: 20, window: '1hour', type: 'sensitive_operation' }
    }).catch(error => {
      securityLogger.error('Failed to log strict rate limit event:', error);
    });
    
    res.status(429).json({
      error: 'Limite de operações sensíveis excedido. Tente novamente em 1 hora.',
      code: 'STRICT_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600
    });
  }
});

/**
 * Request Validation Middleware
 */
export const requestValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIP(req);
  const userAgent = req.get('User-Agent') || '';
  
  // Check if IP is blocked
  if (blockedIPs.has(ip)) {
    logSecurityEvent({
      type: SecurityEventType.IP_BLOCKED,
      severity: 'critical',
      ip,
      userAgent,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date(),
      details: { reason: 'IP blocked due to suspicious activity' }
    }).catch(error => {
      securityLogger.error('Failed to log IP blocked event:', error);
    });
    
    return res.status(403).json({
      error: 'Acesso negado',
      code: 'IP_BLOCKED'
    });
  }
  
  // Validate request headers
  const suspiciousHeaders = [
    'x-forwarded-for-malicious',
    'x-real-ip-spoofed',
    'x-injection-test'
  ];
  
  for (const header of suspiciousHeaders) {
    if (req.headers[header]) {
      logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_REQUEST,
        severity: 'high',
        ip,
        userAgent,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date(),
        details: { suspiciousHeader: header, value: req.headers[header] }
      }).catch(error => {
        securityLogger.error('Failed to log suspicious request event:', error);
      });
      
      return res.status(400).json({
        error: 'Requisição inválida',
        code: 'INVALID_HEADERS'
      });
    }
  }
  
  // Check for suspicious User-Agent patterns
  const suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /burpsuite/i,
    /havij/i,
    /w3af/i
  ];
  
  for (const pattern of suspiciousUserAgents) {
    if (pattern.test(userAgent)) {
      logSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_REQUEST,
        severity: 'high',
        ip,
        userAgent,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date(),
        details: { reason: 'Suspicious User-Agent detected' }
      }).catch(error => {
        securityLogger.error('Failed to log suspicious user agent event:', error);
      });
      
      return res.status(403).json({
        error: 'Acesso negado',
        code: 'SUSPICIOUS_USER_AGENT'
      });
    }
  }
  
  next();
};

/**
 * Content Validation Middleware for POST/PUT requests
 */
export const contentValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }
  
  const ip = getClientIP(req);
  const userAgent = req.get('User-Agent') || '';
  
  // Check for XSS attempts in request body
  if (req.body && typeof req.body === 'object') {
    const bodyStr = JSON.stringify(req.body);
    
    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi
    ];
    
    for (const pattern of xssPatterns) {
      if (pattern.test(bodyStr)) {
        logSecurityEvent({
          type: SecurityEventType.XSS_ATTEMPT,
          severity: 'critical',
          ip,
          userAgent,
          url: req.originalUrl,
          method: req.method,
          timestamp: new Date(),
          details: { pattern: pattern.toString(), detectedContent: bodyStr.substring(0, 200) }
        }).catch(error => {
          securityLogger.error('Failed to log XSS attempt event:', error);
        });
        
        return res.status(400).json({
          error: 'Conteúdo inválido detectado',
          code: 'XSS_DETECTED'
        });
      }
    }
    
    // SQL injection patterns
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(UNION\s+SELECT)/gi,
      /('|\"|;|--|\|\|)/g,
      /(OR\s+1\s*=\s*1)/gi,
      /(AND\s+1\s*=\s*1)/gi
    ];
    
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(bodyStr)) {
        logSecurityEvent({
          type: SecurityEventType.SQL_INJECTION_ATTEMPT,
          severity: 'critical',
          ip,
          userAgent,
          url: req.originalUrl,
          method: req.method,
          timestamp: new Date(),
          details: { pattern: pattern.toString(), detectedContent: bodyStr.substring(0, 200) }
        }).catch(error => {
          securityLogger.error('Failed to log SQL injection attempt event:', error);
        });
        
        return res.status(400).json({
          error: 'Conteúdo inválido detectado',
          code: 'SQL_INJECTION_DETECTED'
        });
      }
    }
  }
  
  next();
};

/**
 * File Upload Security Middleware
 */
export const fileUploadSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only apply to file upload routes
  if (!req.originalUrl.includes('/upload') && !req.files && !req.file) {
    return next();
  }
  
  const ip = getClientIP(req);
  const userAgent = req.get('User-Agent') || '';
  
  // Check file type restrictions
  const file = req.file || (req.files && Array.isArray(req.files) ? req.files[0] : null);
  
  if (file) {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      logSecurityEvent({
        type: SecurityEventType.FILE_UPLOAD_REJECTED,
        severity: 'medium',
        ip,
        userAgent,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date(),
        details: { 
          rejectedMimeType: file.mimetype,
          fileName: file.originalname,
          fileSize: file.size
        }
      }).catch(error => {
        securityLogger.error('Failed to log file upload rejection event:', error);
      });
      
      return res.status(400).json({
        error: `Tipo de arquivo não permitido: ${file.mimetype}`,
        code: 'INVALID_FILE_TYPE'
      });
    }
    
    // Check file size (20MB max for PDFs, 10MB for images)
    const maxSize = file.mimetype === 'application/pdf' ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
    
    if (file.size > maxSize) {
      logSecurityEvent({
        type: SecurityEventType.FILE_UPLOAD_REJECTED,
        severity: 'medium',
        ip,
        userAgent,
        url: req.originalUrl,
        method: req.method,
        timestamp: new Date(),
        details: { 
          fileSize: file.size,
          maxSize,
          fileName: file.originalname,
          mimeType: file.mimetype
        }
      }).catch(error => {
        securityLogger.error('Failed to log file size rejection event:', error);
      });
      
      return res.status(413).json({
        error: `Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`,
        code: 'FILE_TOO_LARGE'
      });
    }
  }
  
  next();
};

/**
 * IP Tracking and Blocking Middleware
 */
export const ipTrackingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIP(req);
  
  // Track failed attempts per IP
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const attempts = ipAttempts.get(ip) || { count: 0, lastAttempt: new Date() };
      attempts.count++;
      attempts.lastAttempt = new Date();
      ipAttempts.set(ip, attempts);
      
      // Block IP after 20 failed attempts within 1 hour
      if (attempts.count >= 20) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (attempts.lastAttempt > oneHourAgo) {
          blockedIPs.add(ip);
          
          logSecurityEvent({
            type: SecurityEventType.IP_BLOCKED,
            severity: 'critical',
            ip,
            userAgent: req.get('User-Agent') || '',
            url: req.originalUrl,
            method: req.method,
            timestamp: new Date(),
            details: { 
              reason: 'Too many failed requests',
              failedAttempts: attempts.count,
              timeWindow: '1 hour'
            }
          }).catch(error => {
            securityLogger.error('Failed to log IP blocking event:', error);
          });
        }
      }
    } else if (res.statusCode < 300) {
      // Reset failed attempts on successful request
      ipAttempts.delete(ip);
    }
  });
  
  next();
};

/**
 * Security Headers Middleware
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Utility Functions
 */

// Get real client IP address
function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

// Log security events and record in audit service
async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  // Log to console/file
  securityLogger.warn({
    event: event.type,
    severity: event.severity,
    ip: event.ip,
    userAgent: event.userAgent,
    url: event.url,
    method: event.method,
    timestamp: event.timestamp,
    details: event.details,
    userId: event.userId
  }, `Security Event: ${event.type}`);
  
  // Record in security audit service
  try {
    const { securityAuditService } = await import('../services/security-audit.service');
    await securityAuditService.recordEvent(event);
  } catch (error) {
    securityLogger.error('Failed to record security event in audit service:', error);
  }
  
  // In production, also send to security monitoring service
  if (process.env.NODE_ENV === 'production' && event.severity === 'critical') {
    // TODO: Implement integration with security monitoring service
    // Example: send to Datadog, Sentry, or custom webhook
    console.error(`CRITICAL SECURITY EVENT: ${event.type}`, event);
  }
}

// Generate security token for sensitive operations
export function generateSecurityToken(): string {
  return createHash('sha256')
    .update(`${Date.now()}-${Math.random()}-${process.env.SECRET_KEY || 'fallback-secret'}`)
    .digest('hex');
}

// Validate security token
export function validateSecurityToken(token: string, maxAge: number = 300000): boolean {
  // Simple token validation - in production, use JWT or similar
  if (!token || token.length !== 64) return false;
  
  // In a real implementation, you would store token metadata
  // and validate expiration, but this is a basic example
  return true;
}

/**
 * Combined Security Middleware Stack
 */
export const securityMiddlewareStack = [
  helmetConfig,
  corsConfig,
  securityHeadersMiddleware,
  ipTrackingMiddleware,
  requestValidationMiddleware,
  contentValidationMiddleware,
  fileUploadSecurityMiddleware
];

/**
 * Export individual middleware for specific use cases
 */
export {
  securityLogger,
  getClientIP,
  logSecurityEvent,
  blockedIPs,
  ipAttempts
};