/**
 * Performance Monitoring Middleware for MariaIntelligence
 * Tracks and analyzes application performance metrics
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import os from 'os';
// Import will be handled dynamically to avoid ES module issues
import process from 'process';

interface PerformanceMetrics {
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  activeConnections: number;
}

interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    usage: number;
    free: number;
    total: number;
    heapUsed: number;
    heapTotal: number;
  };
  disk: {
    usage?: number;
  };
  network: {
    connections: number;
  };
}

class PerformanceMonitor {
  private redis?: Redis;
  private metricsBuffer: PerformanceMetrics[] = [];
  private systemMetricsBuffer: SystemMetrics[] = [];
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private bufferSize = 1000;
  private flushInterval = 30000; // 30 seconds
  private monitoringInterval?: NodeJS.Timeout;
  private initialCpuUsage = process.cpuUsage();

  constructor(redisConfig?: any) {
    if (redisConfig) {
      try {
        this.redis = new Redis(redisConfig);
        console.log('📊 Performance monitor connected to Redis');
      } catch (error) {
        console.warn('⚠️  Redis not available for performance monitoring:', error);
      }
    }

    // Start system monitoring
    this.startSystemMonitoring();
    
    // Flush metrics periodically
    this.startMetricsFlush();

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * Express middleware for performance monitoring
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const startCpuUsage = process.cpuUsage();
      const startMemoryUsage = process.memoryUsage();

      // Override res.end to capture metrics
      const originalEnd = res.end;
      res.end = function(this: Response, ...args: any[]) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const endCpuUsage = process.cpuUsage(startCpuUsage);
        const endMemoryUsage = process.memoryUsage();

        // Record metrics
        const metrics: PerformanceMetrics = {
          timestamp: endTime,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          responseTime,
          memoryUsage: endMemoryUsage,
          cpuUsage: endCpuUsage,
          activeConnections: res.socket?.server?.connections || 0
        };

        // Add to monitoring
        (req as any).performanceMonitor?.recordMetrics(metrics);

        return originalEnd.apply(this, args);
      };

      // Store reference for recording
      (req as any).performanceMonitor = this;
      next();
    };
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics: PerformanceMetrics) {
    this.requestCount++;
    
    if (metrics.statusCode >= 400) {
      this.errorCount++;
    }

    // Add to buffer
    this.metricsBuffer.push(metrics);

    // Flush buffer if full
    if (this.metricsBuffer.length >= this.bufferSize) {
      this.flushMetrics();
    }

    // Log slow requests
    if (metrics.responseTime > 1000) {
      console.warn(`🐌 Slow request detected: ${metrics.method} ${metrics.path} - ${metrics.responseTime}ms`);
    }

    // Log high memory usage
    if (metrics.memoryUsage.heapUsed > 400 * 1024 * 1024) { // 400MB
      console.warn(`🧠 High memory usage detected: ${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`);
    }
  }

  /**
   * Start system monitoring
   */
  private startSystemMonitoring() {
    this.monitoringInterval = setInterval(() => {
      const cpuUsage = process.cpuUsage(this.initialCpuUsage);
      const memoryUsage = process.memoryUsage();
      const loadAverage = os.loadavg();
      const freeMemory = os.freemem();
      const totalMemory = os.totalmem();

      const systemMetrics: SystemMetrics = {
        timestamp: Date.now(),
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
          loadAverage
        },
        memory: {
          usage: ((totalMemory - freeMemory) / totalMemory) * 100,
          free: freeMemory,
          total: totalMemory,
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal
        },
        disk: {},
        network: {
          connections: this.requestCount
        }
      };

      this.systemMetricsBuffer.push(systemMetrics);

      // Check thresholds
      this.checkThresholds(systemMetrics);

    }, 30000); // Every 30 seconds
  }

  /**
   * Check performance thresholds and alert
   */
  private checkThresholds(metrics: SystemMetrics) {
    // CPU usage alert (> 80%)
    if (metrics.cpu.loadAverage[0] > 0.8 * os.cpus().length) {
      console.warn(`⚡ High CPU load detected: ${metrics.cpu.loadAverage[0].toFixed(2)}`);
    }

    // Memory usage alert (> 85%)
    if (metrics.memory.usage > 85) {
      console.warn(`🧠 High memory usage detected: ${metrics.memory.usage.toFixed(1)}%`);
    }

    // Error rate alert (> 5%)
    const errorRate = (this.errorCount / this.requestCount) * 100;
    if (errorRate > 5 && this.requestCount > 10) {
      console.warn(`🚨 High error rate detected: ${errorRate.toFixed(1)}%`);
    }
  }

  /**
   * Start periodic metrics flushing
   */
  private startMetricsFlush() {
    setInterval(() => {
      this.flushMetrics();
      this.flushSystemMetrics();
    }, this.flushInterval);
  }

  /**
   * Flush metrics to storage
   */
  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      // Store in Redis if available
      if (this.redis) {
        const key = `performance:metrics:${Date.now()}`;
        await this.redis.setex(key, 3600, JSON.stringify(metrics)); // 1 hour TTL
      }

      // Also store in local file for persistence
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, `performance-${new Date().toISOString().split('T')[0]}.json`);
      const logData = {
        timestamp: Date.now(),
        metrics,
        summary: this.generateSummary(metrics)
      };

      fs.appendFileSync(logFile, JSON.stringify(logData) + '\n');

    } catch (error) {
      console.error('Failed to flush performance metrics:', error);
    }
  }

  /**
   * Flush system metrics to storage
   */
  private async flushSystemMetrics() {
    if (this.systemMetricsBuffer.length === 0) return;

    const metrics = [...this.systemMetricsBuffer];
    this.systemMetricsBuffer = [];

    try {
      // Store in Redis if available
      if (this.redis) {
        const key = `performance:system:${Date.now()}`;
        await this.redis.setex(key, 3600, JSON.stringify(metrics)); // 1 hour TTL
      }

      // Store summary in file
      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, `system-metrics-${new Date().toISOString().split('T')[0]}.json`);
      
      const summary = {
        timestamp: Date.now(),
        averageCpu: metrics.reduce((sum, m) => sum + m.cpu.loadAverage[0], 0) / metrics.length,
        averageMemory: metrics.reduce((sum, m) => sum + m.memory.usage, 0) / metrics.length,
        peakMemory: Math.max(...metrics.map(m => m.memory.usage)),
        samples: metrics.length
      };

      fs.appendFileSync(logFile, JSON.stringify(summary) + '\n');

    } catch (error) {
      console.error('Failed to flush system metrics:', error);
    }
  }

  /**
   * Generate performance summary
   */
  private generateSummary(metrics: PerformanceMetrics[]) {
    const responseTimes = metrics.map(m => m.responseTime);
    const statusCodes = metrics.map(m => m.statusCode);

    return {
      totalRequests: metrics.length,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: this.percentile(responseTimes, 0.95),
      p99ResponseTime: this.percentile(responseTimes, 0.99),
      errorRate: (statusCodes.filter(code => code >= 400).length / statusCodes.length) * 100,
      throughput: metrics.length / 30 // requests per second (30 second window)
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }

  /**
   * Get current performance stats
   */
  async getStats() {
    const uptime = Date.now() - this.startTime;
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage(this.initialCpuUsage);
    
    return {
      uptime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: (this.errorCount / this.requestCount) * 100,
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      cpuUsage: {
        user: cpuUsage.user / 1000000, // seconds
        system: cpuUsage.system / 1000000 // seconds
      },
      systemLoad: os.loadavg(),
      freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
      totalMemory: Math.round(os.totalmem() / 1024 / 1024) // MB
    };
  }

  /**
   * Get performance dashboard data
   */
  async getDashboardData() {
    try {
      const stats = await this.getStats();
      const recentMetrics = this.metricsBuffer.slice(-100); // Last 100 requests
      
      return {
        stats,
        recentMetrics: recentMetrics.map(m => ({
          timestamp: m.timestamp,
          method: m.method,
          path: m.path,
          responseTime: m.responseTime,
          statusCode: m.statusCode
        })),
        summary: recentMetrics.length > 0 ? this.generateSummary(recentMetrics) : null
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error);
      return null;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('📊 Shutting down performance monitor...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Flush remaining metrics
    await this.flushMetrics();
    await this.flushSystemMetrics();

    if (this.redis) {
      this.redis.disconnect();
    }

    console.log('📊 Performance monitor shutdown complete');
  }
}

// Export singleton instance
const performanceMonitor = new PerformanceMonitor({});

export default performanceMonitor;
export { PerformanceMonitor, PerformanceMetrics, SystemMetrics };