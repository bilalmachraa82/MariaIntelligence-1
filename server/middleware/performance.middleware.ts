/**
 * Performance Monitoring Middleware - MariaIntelligence 2025
 * Request timing, metrics collection, and performance optimization
 */

import type { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import type { PerformanceMetrics } from '../types/api.types.js';

// In-memory metrics store (use Redis in production)
const metricsStore: PerformanceMetrics[] = [];
const MAX_METRICS_STORE = 1000;

/**
 * Performance monitoring middleware
 */
export function performanceMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = performance.now();
    const requestId = generateRequestId();
    
    // Add request ID to request object
    (req as any).requestId = requestId;
    
    // Add request ID to response headers
    res.set('X-Request-ID', requestId);
    
    // Monitor response finish
    res.on('finish', () => {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      // Create metrics object
      const metrics: PerformanceMetrics = {
        requestId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        responseTime,
        timestamp: new Date().toISOString(),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: (req as any).user?.id,
      };
      
      // Store metrics
      storeMetrics(metrics);
      
      // Log slow requests
      if (responseTime > 1000) {
        console.warn(`🐌 Slow request detected:`, {
          method: req.method,
          url: req.originalUrl,
          responseTime: `${responseTime}ms`,
          statusCode: res.statusCode,
        });
      }
      
      // Log errors
      if (res.statusCode >= 400) {
        console.error(`❌ Error response:`, {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseTime: `${responseTime}ms`,
          ip: req.ip,
        });
      }
      
      // Add performance headers
      res.set('X-Response-Time', `${responseTime}ms`);
    });
    
    next();
  };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `req_${timestamp}_${random}`;
}

/**
 * Store performance metrics
 */
function storeMetrics(metrics: PerformanceMetrics): void {
  metricsStore.push(metrics);
  
  // Keep only recent metrics
  if (metricsStore.length > MAX_METRICS_STORE) {
    metricsStore.shift();
  }
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(options: {
  limit?: number;
  startDate?: Date;
  endDate?: Date;
  minResponseTime?: number;
  maxResponseTime?: number;
} = {}): PerformanceMetrics[] {
  let filtered = [...metricsStore];
  
  if (options.startDate) {
    filtered = filtered.filter(m => new Date(m.timestamp) >= options.startDate!);
  }
  
  if (options.endDate) {
    filtered = filtered.filter(m => new Date(m.timestamp) <= options.endDate!);
  }
  
  if (options.minResponseTime) {
    filtered = filtered.filter(m => m.responseTime >= options.minResponseTime!);
  }
  
  if (options.maxResponseTime) {
    filtered = filtered.filter(m => m.responseTime <= options.maxResponseTime!);
  }
  
  // Sort by timestamp (newest first)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }
  
  return filtered;
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(): {
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  slowRequestsCount: number;
} {
  if (metricsStore.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      slowRequestsCount: 0,
    };
  }
  
  const responseTimes = metricsStore.map(m => m.responseTime).sort((a, b) => a - b);
  const errorCount = metricsStore.filter(m => m.statusCode >= 400).length;
  const slowRequestsCount = metricsStore.filter(m => m.responseTime > 1000).length;
  
  return {
    totalRequests: metricsStore.length,
    averageResponseTime: Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length),
    p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
    p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
    errorRate: Math.round((errorCount / metricsStore.length) * 100 * 100) / 100,
    slowRequestsCount,
  };
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics(): void {
  metricsStore.length = 0;
}

/**
 * Health check for performance monitoring
 */
export function getPerformanceHealth(): {
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    averageResponseTime: number;
    errorRate: number;
    slowRequestsCount: number;
  };
  recommendations: string[];
} {
  const stats = getPerformanceStats();
  const recommendations: string[] = [];
  
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  
  // Check average response time
  if (stats.averageResponseTime > 2000) {
    status = 'critical';
    recommendations.push('Average response time is too high (>2s)');
  } else if (stats.averageResponseTime > 1000) {
    status = 'warning';
    recommendations.push('Average response time is elevated (>1s)');
  }
  
  // Check error rate
  if (stats.errorRate > 10) {
    status = 'critical';
    recommendations.push('Error rate is too high (>10%)');
  } else if (stats.errorRate > 5) {
    if (status !== 'critical') status = 'warning';
    recommendations.push('Error rate is elevated (>5%)');
  }
  
  // Check slow requests
  if (stats.slowRequestsCount > stats.totalRequests * 0.1) {
    if (status !== 'critical') status = 'warning';
    recommendations.push('Too many slow requests (>10% of total)');
  }
  
  return {
    status,
    metrics: {
      averageResponseTime: stats.averageResponseTime,
      errorRate: stats.errorRate,
      slowRequestsCount: stats.slowRequestsCount,
    },
    recommendations,
  };
}