import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { AppError } from './errors';
import { ErrorContext } from '../middleware/errorHandler';
import { errorNotificationSystem } from './errorNotificationSystem';

export interface LoggedError {
  level: string;
  message: string;
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    statusCode?: number;
  };
  context?: ErrorContext;
  timestamp: string;
  environment: string;
  version?: string;
}

export class ErrorLogger {
  private logger: winston.Logger;
  private errorCounts: Map<string, number> = new Map();
  private lastErrorReset: Date = new Date();

  constructor() {
    this.logger = this.createLogger();
    this.setupErrorCountReset();
  }

  /**
   * Create Winston logger instance
   */
  private createLogger(): winston.Logger {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf((info) => {
        return JSON.stringify({
          timestamp: info.timestamp,
          level: info.level,
          message: info.message,
          ...info
        });
      })
    );

    const transports: winston.transport[] = [
      // Console transport for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
          winston.format.printf((info) => {
            const { timestamp, level, message, ...meta } = info;
            return `${timestamp} [${level}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
            }`;
          })
        ),
        level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
      })
    ];

    // File transports for production
    if (process.env.NODE_ENV === 'production') {
      // Error logs
      transports.push(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          format: logFormat,
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true
        })
      );

      // Combined logs
      transports.push(
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          format: logFormat,
          maxSize: '20m',
          maxFiles: '7d',
          zippedArchive: true
        })
      );

      // Critical errors (immediate notification)
      transports.push(
        new DailyRotateFile({
          filename: 'logs/critical-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          format: logFormat,
          maxSize: '10m',
          maxFiles: '30d'
        })
      );
    }

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports,
      exitOnError: false
    });
  }

  /**
   * Log error with context
   */
  public logError(error: Error | AppError, context?: ErrorContext): void {
    const logData: LoggedError = {
      level: this.getLogLevel(error),
      message: error.message,
      error: {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        code: error instanceof AppError ? error.code : undefined,
        statusCode: error instanceof AppError ? error.statusCode : undefined
      },
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0'
    };

    // Track error frequency
    this.trackErrorFrequency(error);

    // Log based on severity
    if (this.isCriticalError(error)) {
      this.logger.error('CRITICAL ERROR', logData);
      this.notifyCriticalError(error, context);
      
      // Trigger notification system for critical errors
      if (error instanceof AppError) {
        errorNotificationSystem.processError(error, context).catch(notificationError => {
          this.logger.error('Failed to process error notification', { 
            originalError: error.message, 
            notificationError: notificationError.message 
          });
        });
      }
    } else if (error instanceof AppError && !error.isOperational) {
      this.logger.error('PROGRAMMING ERROR', logData);
      
      // Also notify for programming errors as they indicate bugs
      errorNotificationSystem.processError(error, context).catch(notificationError => {
        this.logger.error('Failed to process error notification', { 
          originalError: error.message, 
          notificationError: notificationError.message 
        });
      });
    } else {
      this.logger.error('OPERATIONAL ERROR', logData);
      
      // Process operational errors through notification system
      if (error instanceof AppError) {
        errorNotificationSystem.processError(error, context).catch(notificationError => {
          this.logger.error('Failed to process error notification', { 
            originalError: error.message, 
            notificationError: notificationError.message 
          });
        });
      }
    }

    // Log additional context for debugging
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('Error Context Details', {
        context,
        errorDetails: this.getErrorDetails(error)
      });
    }
  }

  /**
   * Log warning
   */
  public logWarning(message: string, context?: any): void {
    this.logger.warn(message, {
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }

  /**
   * Log info
   */
  public logInfo(message: string, context?: any): void {
    this.logger.info(message, {
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }

  /**
   * Log debug
   */
  public logDebug(message: string, context?: any): void {
    this.logger.debug(message, {
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  }

  /**
   * Get appropriate log level for error
   */
  private getLogLevel(error: Error | AppError): string {
    if (this.isCriticalError(error)) {
      return 'error';
    }
    
    if (error instanceof AppError) {
      if (error.statusCode >= 500) return 'error';
      if (error.statusCode >= 400) return 'warn';
      return 'info';
    }
    
    return 'error';
  }

  /**
   * Check if error is critical
   */
  private isCriticalError(error: Error | AppError): boolean {
    const criticalCodes = [
      'DATABASE_CONNECTION_FAILED',
      'INTERNAL_SERVER_ERROR',
      'SERVICE_UNAVAILABLE',
      'CONFIGURATION_ERROR'
    ];

    if (error instanceof AppError) {
      return criticalCodes.includes(error.code) || error.statusCode >= 500;
    }

    // Programming errors are critical
    return !(error instanceof AppError) || !error.isOperational;
  }

  /**
   * Track error frequency for pattern detection
   */
  private trackErrorFrequency(error: Error | AppError): void {
    const errorKey = error instanceof AppError ? error.code : error.name;
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // Alert on high frequency errors
    if (currentCount > 10) {
      this.logger.warn('HIGH FREQUENCY ERROR DETECTED', {
        errorType: errorKey,
        count: currentCount,
        timeWindow: '1 hour'
      });
    }
  }

  /**
   * Setup error count reset (every hour)
   */
  private setupErrorCountReset(): void {
    setInterval(() => {
      this.errorCounts.clear();
      this.lastErrorReset = new Date();
    }, 3600000); // 1 hour
  }

  /**
   * Get detailed error information
   */
  private getErrorDetails(error: Error | AppError): any {
    if (error instanceof AppError) {
      return {
        code: error.code,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        timestamp: error.timestamp,
        context: error.context,
        serialized: error.serialize()
      };
    }

    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  /**
   * Notify about critical errors
   */
  private notifyCriticalError(error: Error | AppError, context?: ErrorContext): void {
    // In production, this could send notifications via:
    // - Email
    // - Slack
    // - PagerDuty
    // - SMS
    
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 CRITICAL ERROR DETECTED 🚨');
      console.error('Error:', error.message);
      console.error('Context:', context);
      console.error('Stack:', error.stack);
    }

    // TODO: Implement actual notification system
    // Example integrations:
    // - await this.sendSlackNotification(error, context);
    // - await this.sendEmailAlert(error, context);
    // - await this.triggerPagerDuty(error, context);
  }

  /**
   * Get error statistics
   */
  public getErrorStatistics(): any {
    return {
      errorCounts: Object.fromEntries(this.errorCounts),
      lastReset: this.lastErrorReset,
      totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0)
    };
  }

  /**
   * Export logs for analysis
   */
  public async exportLogs(startDate: Date, endDate: Date): Promise<any[]> {
    // This would typically query log files or log aggregation service
    // For now, return a placeholder
    return [
      {
        message: 'Log export not implemented',
        note: 'In production, this would export logs from specified date range'
      }
    ];
  }

  /**
   * Health check for logging system
   */
  public healthCheck(): { status: string; details: any } {
    try {
      // Test logging
      this.logger.info('Health check test log');
      
      return {
        status: 'healthy',
        details: {
          transports: this.logger.transports.length,
          level: this.logger.level,
          errorCounts: this.errorCounts.size,
          lastReset: this.lastErrorReset
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message
        }
      };
    }
  }
}