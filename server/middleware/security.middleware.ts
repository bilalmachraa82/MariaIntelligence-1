/**
 * Security Middleware - MariaIntelligence 2025
 * Enhanced security measures with modern best practices
 */

import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logSecurityEvent } from './logging.middleware.js';
import { sendErrorResponse } from '../utils/response.utils.js';
import { HTTP_STATUS } from '../config/api.config.js';

// Suspicious patterns to detect
const SUSPICIOUS_PATTERNS = [
  /(<script[^>]*>.*?<\/script>)/gi, // Script injection
  /(javascript:|data:text\/html|vbscript:)/gi, // XSS attempts
  /(union|select|insert|update|delete|drop|create|alter)/gi, // SQL injection
  /(\.\.[/\\]|\.\.%2f|\.\.%5c)/gi, // Path traversal
  /(%00|\x00)/gi, // Null byte injection
  /(exec\s*\(|eval\s*\(|system\s*\()/gi, // Code execution
];

// Rate limiting store for security events
const securityEventStore = new Map<string, { count: number; firstSeen: number; lastSeen: number }>();
const SECURITY_EVENT_THRESHOLD = 5;
const SECURITY_EVENT_WINDOW = 15 * 60 * 1000; // 15 minutes

/**
 * Main security middleware
 */
export function securityMiddleware() {
  return [
    // Helmet with custom configuration
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          workerSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for API compatibility
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
    }),
    
    // Custom security checks
    securityValidationMiddleware,
    ipWhitelistMiddleware,
    suspiciousPatternDetection,
    securityHeadersMiddleware,
  ];
}

/**
 * Custom security validation
 */
function securityValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check for suspicious user agents
  const userAgent = req.get('User-Agent');
  if (!userAgent || isSuspiciousUserAgent(userAgent)) {
    logSecurityEvent('suspicious_user_agent', { userAgent }, req);
    trackSecurityEvent(req.ip || 'unknown', 'suspicious_user_agent');
  }
  
  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-host', 'x-real-ip', 'x-cluster-client-ip'];
  for (const header of suspiciousHeaders) {
    if (req.get(header) && req.get(header) !== req.get('host')) {
      logSecurityEvent('header_manipulation', { header, value: req.get(header) }, req);
    }
  }
  
  // Check request size
  const contentLength = parseInt(req.get('content-length') || '0');
  if (contentLength > 50 * 1024 * 1024) { // 50MB
    logSecurityEvent('large_request', { contentLength }, req);
    return sendErrorResponse(
      res,
      HTTP_STATUS.BAD_REQUEST,
      'REQUEST_TOO_LARGE',
      'Request payload too large'
    );
  }
  
  next();
}

/**
 * IP whitelist middleware (for admin endpoints)
 */
function ipWhitelistMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only apply to admin endpoints
  if (!req.path.includes('/admin/')) {
    return next();
  }
  
  const allowedIPs = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
  
  if (allowedIPs.length > 0 && !allowedIPs.includes(req.ip || '')) {
    logSecurityEvent('admin_access_denied', { ip: req.ip, path: req.path }, req);
    return sendErrorResponse(
      res,
      HTTP_STATUS.FORBIDDEN,
      'ACCESS_DENIED',
      'Access denied from this IP address'
    );
  }
  
  next();
}

/**
 * Detect suspicious patterns in requests
 */
function suspiciousPatternDetection(req: Request, res: Response, next: NextFunction): void {
  const checkString = (str: string, context: string): boolean => {
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(str)) {
        logSecurityEvent('suspicious_pattern_detected', {
          pattern: pattern.source,
          context,
          value: str.substring(0, 100), // Log first 100 chars
        }, req);
        trackSecurityEvent(req.ip || 'unknown', 'suspicious_pattern');
        return true;
      }
    }
    return false;
  };
  
  // Check URL and query parameters
  checkString(req.originalUrl, 'url');
  
  // Check headers
  Object.entries(req.headers).forEach(([key, value]) => {
    if (typeof value === 'string') {
      checkString(value, `header:${key}`);
    }
  });
  
  // Check body (if it's a string or can be stringified)
  if (req.body && typeof req.body === 'object') {
    try {
      const bodyString = JSON.stringify(req.body);
      checkString(bodyString, 'body');
    } catch (error) {
      // Ignore JSON stringify errors
    }
  } else if (typeof req.body === 'string') {
    checkString(req.body, 'body');
  }
  
  next();
}

/**
 * Add security headers
 */
function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Add custom security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'X-Permitted-Cross-Domain-Policies': 'none',
  });
  
  next();
}

/**
 * Check if user agent is suspicious
 */
function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scanner/i,
    /curl/i,
    /wget/i,
    /python/i,
    /ruby/i,
    /java/i,
    /perl/i,
    /php/i,
    /go-http-client/i,
  ];
  
  // Allow legitimate bots (optional)
  const legitimateBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
  ];
  
  // Check if it's a legitimate bot first
  for (const pattern of legitimateBots) {
    if (pattern.test(userAgent)) {
      return false;
    }
  }
  
  // Check for suspicious patterns
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Track security events and implement temporary blocking
 */
function trackSecurityEvent(ip: string, eventType: string): void {
  const key = `${ip}:${eventType}`;
  const now = Date.now();
  
  const existing = securityEventStore.get(key);
  
  if (existing) {
    // Check if within time window
    if (now - existing.firstSeen < SECURITY_EVENT_WINDOW) {
      existing.count++;
      existing.lastSeen = now;
      
      // Check if threshold exceeded
      if (existing.count >= SECURITY_EVENT_THRESHOLD) {
        logSecurityEvent('security_threshold_exceeded', {
          ip,
          eventType,
          count: existing.count,
          timeWindow: SECURITY_EVENT_WINDOW,
        });
        
        // Here you could implement temporary IP blocking
        // For now, we just log the event
      }
    } else {
      // Reset counter if outside time window
      existing.count = 1;
      existing.firstSeen = now;
      existing.lastSeen = now;
    }
  } else {
    // First occurrence
    securityEventStore.set(key, {
      count: 1,
      firstSeen: now,
      lastSeen: now,
    });
  }
  
  // Clean up old entries
  cleanupSecurityEventStore();
}

/**
 * Clean up old security event entries
 */
function cleanupSecurityEventStore(): void {
  const now = Date.now();
  const cutoff = now - SECURITY_EVENT_WINDOW * 2; // Keep entries for 2x the window
  
  for (const [key, event] of securityEventStore.entries()) {
    if (event.lastSeen < cutoff) {
      securityEventStore.delete(key);
    }
  }
}

/**
 * Get security event statistics
 */
export function getSecurityEventStats(): {
  activeThreats: number;
  totalEvents: number;
  topEventTypes: Array<{ type: string; count: number }>;
  topIPs: Array<{ ip: string; count: number }>;
} {
  const now = Date.now();
  const recentEvents = Array.from(securityEventStore.entries())
    .filter(([, event]) => now - event.lastSeen < SECURITY_EVENT_WINDOW);
  
  const eventTypes = new Map<string, number>();
  const ips = new Map<string, number>();
  let activeThreats = 0;
  
  recentEvents.forEach(([key, event]) => {
    const [ip, eventType] = key.split(':');
    
    // Count event types
    eventTypes.set(eventType, (eventTypes.get(eventType) || 0) + event.count);
    
    // Count IPs
    ips.set(ip, (ips.get(ip) || 0) + event.count);
    
    // Count active threats
    if (event.count >= SECURITY_EVENT_THRESHOLD) {
      activeThreats++;
    }
  });
  
  return {
    activeThreats,
    totalEvents: recentEvents.length,
    topEventTypes: Array.from(eventTypes.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    topIPs: Array.from(ips.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };
}