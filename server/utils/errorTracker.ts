import { AppError } from './errors';
import { ErrorContext } from '../middleware/errorHandler';

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Map<string, number>;
  errorsByStatusCode: Map<number, number>;
  errorsByEndpoint: Map<string, number>;
  errorsByUser: Map<string, number>;
  errorTrends: ErrorTrend[];
  lastReset: Date;
}

export interface ErrorTrend {
  timestamp: Date;
  errorType: string;
  count: number;
  endpoint?: string;
  userId?: string;
}

export interface ErrorAlert {
  id: string;
  timestamp: Date;
  type: 'frequency' | 'critical' | 'pattern';
  message: string;
  details: any;
  acknowledged: boolean;
}

export class ErrorTracker {
  private metrics: ErrorMetrics;
  private alerts: ErrorAlert[] = [];
  private patterns: Map<string, PatternData> = new Map();
  private readonly ALERT_THRESHOLDS = {
    HIGH_FREQUENCY: 10, // errors per hour
    CRITICAL_FREQUENCY: 25, // errors per hour
    PATTERN_THRESHOLD: 5 // similar errors to trigger pattern alert
  };

  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupPeriodicReset();
    this.setupPatternDetection();
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsByStatusCode: new Map(),
      errorsByEndpoint: new Map(),
      errorsByUser: new Map(),
      errorTrends: [],
      lastReset: new Date()
    };
  }

  /**
   * Track error occurrence
   */
  public trackError(error: Error | AppError, context?: ErrorContext): void {
    this.updateMetrics(error, context);
    this.detectPatterns(error, context);
    this.checkAlertThresholds(error, context);
    this.recordTrend(error, context);
  }

  /**
   * Update error metrics
   */
  private updateMetrics(error: Error | AppError, context?: ErrorContext): void {
    this.metrics.totalErrors++;

    // Track by error type
    const errorType = error instanceof AppError ? error.code : error.name;
    this.metrics.errorsByType.set(
      errorType,
      (this.metrics.errorsByType.get(errorType) || 0) + 1
    );

    // Track by status code
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    this.metrics.errorsByStatusCode.set(
      statusCode,
      (this.metrics.errorsByStatusCode.get(statusCode) || 0) + 1
    );

    // Track by endpoint
    if (context?.url) {
      this.metrics.errorsByEndpoint.set(
        context.url,
        (this.metrics.errorsByEndpoint.get(context.url) || 0) + 1
      );
    }

    // Track by user
    if (context?.userId && context.userId !== 'anonymous') {
      this.metrics.errorsByUser.set(
        context.userId,
        (this.metrics.errorsByUser.get(context.userId) || 0) + 1
      );
    }
  }

  /**
   * Record error trend
   */
  private recordTrend(error: Error | AppError, context?: ErrorContext): void {
    const trend: ErrorTrend = {
      timestamp: new Date(),
      errorType: error instanceof AppError ? error.code : error.name,
      count: 1,
      endpoint: context?.url,
      userId: context?.userId
    };

    this.metrics.errorTrends.push(trend);

    // Keep only last 100 trends to prevent memory issues
    if (this.metrics.errorTrends.length > 100) {
      this.metrics.errorTrends = this.metrics.errorTrends.slice(-100);
    }
  }

  /**
   * Detect error patterns
   */
  private detectPatterns(error: Error | AppError, context?: ErrorContext): void {
    const patternKey = this.generatePatternKey(error, context);
    const existingPattern = this.patterns.get(patternKey);

    if (existingPattern) {
      existingPattern.count++;
      existingPattern.lastOccurrence = new Date();
      existingPattern.contexts.push(context);

      // Limit contexts to prevent memory issues
      if (existingPattern.contexts.length > 10) {
        existingPattern.contexts = existingPattern.contexts.slice(-10);
      }

      // Trigger pattern alert if threshold reached
      if (existingPattern.count === this.ALERT_THRESHOLDS.PATTERN_THRESHOLD) {
        this.createAlert('pattern', `Error pattern detected: ${patternKey}`, {
          pattern: existingPattern,
          patternKey
        });
      }
    } else {
      this.patterns.set(patternKey, {
        count: 1,
        firstOccurrence: new Date(),
        lastOccurrence: new Date(),
        errorType: error instanceof AppError ? error.code : error.name,
        contexts: [context]
      });
    }
  }

  /**
   * Generate pattern key for error
   */
  private generatePatternKey(error: Error | AppError, context?: ErrorContext): string {
    const errorType = error instanceof AppError ? error.code : error.name;
    const endpoint = context?.url || 'unknown';
    const method = context?.method || 'unknown';
    
    return `${errorType}:${method}:${endpoint}`;
  }

  /**
   * Check alert thresholds
   */
  private checkAlertThresholds(error: Error | AppError, context?: ErrorContext): void {
    const errorType = error instanceof AppError ? error.code : error.name;
    const currentCount = this.metrics.errorsByType.get(errorType) || 0;

    // High frequency alert
    if (currentCount === this.ALERT_THRESHOLDS.HIGH_FREQUENCY) {
      this.createAlert('frequency', `High frequency error detected: ${errorType}`, {
        errorType,
        count: currentCount,
        threshold: this.ALERT_THRESHOLDS.HIGH_FREQUENCY
      });
    }

    // Critical frequency alert
    if (currentCount === this.ALERT_THRESHOLDS.CRITICAL_FREQUENCY) {
      this.createAlert('critical', `Critical error frequency: ${errorType}`, {
        errorType,
        count: currentCount,
        threshold: this.ALERT_THRESHOLDS.CRITICAL_FREQUENCY
      });
    }

    // Critical error alert
    if (error instanceof AppError && error.statusCode >= 500) {
      this.createAlert('critical', `Critical error occurred: ${error.message}`, {
        error: error.serialize(),
        context
      });
    }
  }

  /**
   * Create alert
   */
  private createAlert(
    type: 'frequency' | 'critical' | 'pattern',
    message: string,
    details: any
  ): void {
    const alert: ErrorAlert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      type,
      message,
      details,
      acknowledged: false
    };

    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }

    // In production, this could trigger notifications
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 ALERT [${type.toUpperCase()}]: ${message}`);
    }
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): ErrorMetrics {
    return {
      ...this.metrics,
      errorsByType: new Map(this.metrics.errorsByType),
      errorsByStatusCode: new Map(this.metrics.errorsByStatusCode),
      errorsByEndpoint: new Map(this.metrics.errorsByEndpoint),
      errorsByUser: new Map(this.metrics.errorsByUser),
      errorTrends: [...this.metrics.errorTrends]
    };
  }

  /**
   * Get alerts
   */
  public getAlerts(unacknowledgedOnly: boolean = false): ErrorAlert[] {
    if (unacknowledgedOnly) {
      return this.alerts.filter(alert => !alert.acknowledged);
    }
    return [...this.alerts];
  }

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Get error patterns
   */
  public getPatterns(): Map<string, PatternData> {
    return new Map(this.patterns);
  }

  /**
   * Get error statistics summary
   */
  public getStatisticsSummary(): any {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);

    const recentErrors = this.metrics.errorTrends.filter(
      trend => trend.timestamp > oneHourAgo
    ).length;

    const topErrorTypes = Array.from(this.metrics.errorsByType.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const topEndpoints = Array.from(this.metrics.errorsByEndpoint.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      summary: {
        totalErrors: this.metrics.totalErrors,
        recentErrors,
        activeAlerts: this.getAlerts(true).length,
        detectedPatterns: this.patterns.size
      },
      topErrorTypes: Object.fromEntries(topErrorTypes),
      topEndpoints: Object.fromEntries(topEndpoints),
      alertBreakdown: {
        frequency: this.alerts.filter(a => a.type === 'frequency').length,
        critical: this.alerts.filter(a => a.type === 'critical').length,
        pattern: this.alerts.filter(a => a.type === 'pattern').length
      },
      timeRange: {
        from: this.metrics.lastReset,
        to: now
      }
    };
  }

  /**
   * Export metrics for external monitoring
   */
  public exportMetrics(): any {
    return {
      metrics: {
        totalErrors: this.metrics.totalErrors,
        errorsByType: Object.fromEntries(this.metrics.errorsByType),
        errorsByStatusCode: Object.fromEntries(this.metrics.errorsByStatusCode),
        errorsByEndpoint: Object.fromEntries(this.metrics.errorsByEndpoint),
        errorsByUser: Object.fromEntries(this.metrics.errorsByUser)
      },
      alerts: this.alerts,
      patterns: Object.fromEntries(this.patterns),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset metrics (called periodically)
   */
  public resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.patterns.clear();
    // Keep alerts but mark them as acknowledged
    this.alerts.forEach(alert => alert.acknowledged = true);
  }

  /**
   * Setup periodic metric reset (every 24 hours)
   */
  private setupPeriodicReset(): void {
    setInterval(() => {
      this.resetMetrics();
    }, 86400000); // 24 hours
  }

  /**
   * Setup pattern detection cleanup (every hour)
   */
  private setupPatternDetection(): void {
    setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 3600000);
      
      // Remove old patterns
      for (const [key, pattern] of this.patterns.entries()) {
        if (pattern.lastOccurrence < oneHourAgo && pattern.count < 3) {
          this.patterns.delete(key);
        }
      }
    }, 3600000); // 1 hour
  }

  /**
   * Health check for error tracking system
   */
  public healthCheck(): { status: string; details: any } {
    return {
      status: 'healthy',
      details: {
        totalErrors: this.metrics.totalErrors,
        activeAlerts: this.getAlerts(true).length,
        detectedPatterns: this.patterns.size,
        lastReset: this.metrics.lastReset,
        memoryUsage: {
          alerts: this.alerts.length,
          patterns: this.patterns.size,
          trends: this.metrics.errorTrends.length
        }
      }
    };
  }
}

interface PatternData {
  count: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  errorType: string;
  contexts: (ErrorContext | undefined)[];
}