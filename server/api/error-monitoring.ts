import { Router, Request, Response } from 'express';
import { ErrorLogger } from '../utils/errorLogger';
import { ErrorTracker } from '../utils/errorTracker';
import { errorNotificationSystem } from '../utils/errorNotificationSystem';
import { enhancedErrorHandler, asyncHandler } from '../middleware/errorHandler.enhanced';
import { AppError, ValidationError } from '../utils/errors';

const router = Router();
const errorLogger = new ErrorLogger();
const errorTracker = new ErrorTracker();

/**
 * @route GET /api/monitoring/errors/stats
 * @desc Get comprehensive error statistics
 * @access Admin
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = {
      tracker: errorTracker.getStatisticsSummary(),
      logger: errorLogger.getErrorStatistics(),
      notifications: errorNotificationSystem.getStatistics(),
      timestamp: new Date().toISOString(),
      period: {
        description: 'Statistics for the current monitoring period',
        resetCycle: '24 hours',
        lastReset: errorTracker.getMetrics().lastReset
      }
    };

    res.json({
      success: true,
      data: stats,
      meta: {
        generated: new Date().toISOString(),
        version: '1.0.0'
      }
    });
  } catch (error) {
    throw new AppError(
      'Failed to retrieve error statistics',
      500,
      'STATS_RETRIEVAL_FAILED',
      'Falha ao recuperar estatísticas de erro'
    );
  }
}));

/**
 * @route GET /api/monitoring/errors/health
 * @desc Get health status of error handling components
 * @access Admin
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        errorLogger: errorLogger.healthCheck(),
        errorTracker: errorTracker.healthCheck(),
        notificationSystem: errorNotificationSystem.healthCheck(),
        errorHandler: {
          status: 'healthy',
          features: [
            'Enhanced error handling',
            'Recovery mechanisms',
            'Circuit breaker',
            'Performance monitoring',
            'Portuguese localization'
          ]
        }
      },
      system: {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV || 'development'
      },
      summary: {
        allComponentsHealthy: true,
        criticalIssues: 0,
        warnings: 0
      }
    };

    // Check if any component is unhealthy
    const componentStatuses = Object.values(health.components).map(c => c.status);
    health.summary.allComponentsHealthy = componentStatuses.every(status => status === 'healthy');

    const statusCode = health.summary.allComponentsHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.summary.allComponentsHealthy,
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Health check failed',
        messagePortuguese: 'Verificação de saúde falhou',
        code: 'HEALTH_CHECK_FAILED',
        timestamp: new Date().toISOString()
      }
    });
  }
}));

/**
 * @route GET /api/monitoring/errors/alerts
 * @desc Get active error alerts
 * @access Admin
 */
router.get('/alerts', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { unacknowledged } = req.query;
    const showUnacknowledgedOnly = unacknowledged === 'true';

    const alerts = errorTracker.getAlerts(showUnacknowledgedOnly);
    const patterns = errorTracker.getPatterns();

    res.json({
      success: true,
      data: {
        alerts: alerts.map(alert => ({
          ...alert,
          ageInMinutes: Math.floor((Date.now() - alert.timestamp.getTime()) / 60000),
          severity: this.getAlertSeverity(alert.type)
        })),
        patterns: Array.from(patterns.entries()).map(([key, pattern]) => ({
          key,
          ...pattern,
          ageInMinutes: Math.floor((Date.now() - pattern.lastOccurrence.getTime()) / 60000)
        })),
        summary: {
          totalAlerts: alerts.length,
          unacknowledgedAlerts: alerts.filter(a => !a.acknowledged).length,
          criticalAlerts: alerts.filter(a => a.type === 'critical').length,
          activePatterns: patterns.size
        }
      },
      meta: {
        generated: new Date().toISOString(),
        filters: {
          unacknowledgedOnly: showUnacknowledgedOnly
        }
      }
    });
  } catch (error) {
    throw new AppError(
      'Failed to retrieve error alerts',
      500,
      'ALERTS_RETRIEVAL_FAILED',
      'Falha ao recuperar alertas de erro'
    );
  }
}));

/**
 * @route POST /api/monitoring/errors/alerts/:alertId/acknowledge
 * @desc Acknowledge an error alert
 * @access Admin
 */
router.post('/alerts/:alertId/acknowledge', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { acknowledgedBy, notes } = req.body;

    if (!alertId) {
      throw new ValidationError('Alert ID is required', [
        { field: 'alertId', message: 'Alert ID is required', messagePortuguese: 'ID do alerta é obrigatório' }
      ]);
    }

    const acknowledged = errorTracker.acknowledgeAlert(alertId);

    if (!acknowledged) {
      throw new AppError(
        'Alert not found',
        404,
        'ALERT_NOT_FOUND',
        'Alerta não encontrado'
      );
    }

    // Log the acknowledgment
    errorLogger.logInfo('Alert acknowledged', {
      alertId,
      acknowledgedBy: acknowledgedBy || 'unknown',
      notes: notes || '',
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      messagePortuguese: 'Alerta confirmado com sucesso',
      data: {
        alertId,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: acknowledgedBy || 'unknown'
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      'Failed to acknowledge alert',
      500,
      'ALERT_ACKNOWLEDGMENT_FAILED',
      'Falha ao confirmar alerta'
    );
  }
}));

/**
 * @route GET /api/monitoring/errors/metrics
 * @desc Get detailed error metrics with filtering
 * @access Admin
 */
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      timeframe = '24h',
      errorType,
      statusCode,
      endpoint,
      user,
      format = 'json'
    } = req.query;

    const metrics = errorTracker.getMetrics();
    const exportData = errorTracker.exportMetrics();

    // Apply filters
    let filteredData = exportData;

    if (errorType) {
      filteredData.metrics.errorsByType = Object.fromEntries(
        Object.entries(filteredData.metrics.errorsByType).filter(([key]) => 
          key.toLowerCase().includes((errorType as string).toLowerCase())
        )
      );
    }

    if (statusCode) {
      const code = parseInt(statusCode as string);
      filteredData.metrics.errorsByStatusCode = Object.fromEntries(
        Object.entries(filteredData.metrics.errorsByStatusCode).filter(([key]) => 
          parseInt(key) === code
        )
      );
    }

    if (endpoint) {
      filteredData.metrics.errorsByEndpoint = Object.fromEntries(
        Object.entries(filteredData.metrics.errorsByEndpoint).filter(([key]) => 
          key.toLowerCase().includes((endpoint as string).toLowerCase())
        )
      );
    }

    if (user) {
      filteredData.metrics.errorsByUser = Object.fromEntries(
        Object.entries(filteredData.metrics.errorsByUser).filter(([key]) => 
          key.toLowerCase().includes((user as string).toLowerCase())
        )
      );
    }

    const response = {
      success: true,
      data: {
        ...filteredData,
        summary: {
          totalErrors: metrics.totalErrors,
          timeframe: {
            description: this.getTimeframeDescription(timeframe as string),
            from: metrics.lastReset,
            to: new Date()
          },
          topErrors: this.getTopErrors(filteredData.metrics.errorsByType, 5),
          topEndpoints: this.getTopErrors(filteredData.metrics.errorsByEndpoint, 5),
          statusCodeBreakdown: this.getStatusCodeBreakdown(filteredData.metrics.errorsByStatusCode)
        }
      },
      meta: {
        generated: new Date().toISOString(),
        filters: {
          timeframe,
          errorType: errorType || null,
          statusCode: statusCode || null,
          endpoint: endpoint || null,
          user: user || null
        },
        format
      }
    };

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=error-metrics.csv');
      res.send(this.convertToCSV(response.data));
    } else {
      res.json(response);
    }
  } catch (error) {
    throw new AppError(
      'Failed to retrieve error metrics',
      500,
      'METRICS_RETRIEVAL_FAILED',
      'Falha ao recuperar métricas de erro'
    );
  }
}));

/**
 * @route GET /api/monitoring/errors/trends
 * @desc Get error trends over time
 * @access Admin
 */
router.get('/trends', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      period = '24h',
      granularity = 'hour',
      errorTypes
    } = req.query;

    const metrics = errorTracker.getMetrics();
    const trends = this.analyzeTrends(metrics.errorTrends, {
      period: period as string,
      granularity: granularity as string,
      errorTypes: errorTypes ? (errorTypes as string).split(',') : undefined
    });

    res.json({
      success: true,
      data: {
        trends,
        analysis: {
          overallTrend: this.calculateOverallTrend(trends),
          peakHours: this.identifyPeakHours(trends),
          recommendations: this.generateTrendRecommendations(trends)
        },
        summary: {
          totalDataPoints: trends.length,
          period: period,
          granularity: granularity,
          highestErrorCount: Math.max(...trends.map(t => t.count), 0),
          averageErrorsPerPeriod: trends.length > 0 
            ? Math.round(trends.reduce((sum, t) => sum + t.count, 0) / trends.length)
            : 0
        }
      },
      meta: {
        generated: new Date().toISOString(),
        parameters: {
          period,
          granularity,
          errorTypes: errorTypes || 'all'
        }
      }
    });
  } catch (error) {
    throw new AppError(
      'Failed to retrieve error trends',
      500,
      'TRENDS_RETRIEVAL_FAILED',
      'Falha ao recuperar tendências de erro'
    );
  }
}));

/**
 * @route POST /api/monitoring/errors/test
 * @desc Test error handling and notification system
 * @access Admin
 */
router.post('/test', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      errorType = 'validation',
      severity = 'info',
      testNotifications = false,
      channels
    } = req.body;

    let testError: AppError;

    // Create test error based on type
    switch (errorType) {
      case 'validation':
        testError = new ValidationError('Test validation error', [
          { field: 'testField', message: 'Test validation message', messagePortuguese: 'Mensagem de teste de validação' }
        ]);
        break;
      case 'database':
        testError = new AppError('Test database error', 500, 'DATABASE_ERROR', 'Erro de teste da base de dados');
        break;
      case 'notfound':
        testError = new AppError('Test not found error', 404, 'RESOURCE_NOT_FOUND', 'Erro de teste - não encontrado');
        break;
      case 'external':
        testError = new AppError('Test external service error', 503, 'EXTERNAL_SERVICE_UNAVAILABLE', 'Erro de teste - serviço externo');
        break;
      default:
        testError = new AppError('Test generic error', 400, 'TEST_ERROR', 'Erro de teste genérico');
    }

    const testContext = {
      userId: 'test-user',
      requestId: `test-${Date.now()}`,
      url: '/api/monitoring/test',
      method: 'POST',
      timestamp: new Date()
    };

    // Log and track the test error
    errorLogger.logError(testError, testContext);
    errorTracker.trackError(testError, testContext);

    // Test notifications if requested
    let notificationResult = null;
    if (testNotifications) {
      if (channels && Array.isArray(channels)) {
        notificationResult = await Promise.all(
          channels.map((channel: string) => errorNotificationSystem.testNotification(channel))
        );
      } else {
        notificationResult = await errorNotificationSystem.testNotification();
      }
    }

    res.json({
      success: true,
      message: 'Error handling test completed successfully',
      messagePortuguese: 'Teste de tratamento de erros concluído com sucesso',
      data: {
        testError: {
          type: errorType,
          code: testError.code,
          message: testError.message,
          messagePortuguese: testError.messagePortuguese,
          statusCode: testError.statusCode,
          timestamp: testError.timestamp
        },
        testContext,
        notificationResult,
        components: {
          logger: 'tested',
          tracker: 'tested',
          notifications: testNotifications ? 'tested' : 'skipped'
        }
      },
      meta: {
        testId: `test-${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    throw new AppError(
      'Error handling test failed',
      500,
      'ERROR_TEST_FAILED',
      'Teste de tratamento de erros falhou'
    );
  }
}));

/**
 * @route GET /api/monitoring/errors/export
 * @desc Export error data for external analysis
 * @access Admin
 */
router.get('/export', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      format = 'json',
      startDate,
      endDate,
      includeStack = false,
      includeSensitive = false
    } = req.query;

    const exportData = {
      exportInfo: {
        generatedAt: new Date().toISOString(),
        format,
        dateRange: {
          start: startDate || 'beginning',
          end: endDate || 'now'
        },
        includedData: {
          statistics: true,
          metrics: true,
          alerts: true,
          patterns: true,
          notifications: true,
          stackTraces: includeStack === 'true',
          sensitiveData: includeSensitive === 'true'
        }
      },
      statistics: errorTracker.getStatisticsSummary(),
      metrics: errorTracker.exportMetrics(),
      alerts: errorTracker.getAlerts(),
      patterns: Object.fromEntries(errorTracker.getPatterns()),
      notificationStats: errorNotificationSystem.getStatistics(),
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    };

    const filename = `maria-faz-error-export-${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'csv':
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
        res.send(this.convertToCSV(exportData));
        break;
      
      case 'xml':
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.xml`);
        res.send(this.convertToXML(exportData));
        break;
      
      default:
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
        res.json({
          success: true,
          data: exportData
        });
    }
  } catch (error) {
    throw new AppError(
      'Failed to export error data',
      500,
      'EXPORT_FAILED',
      'Falha ao exportar dados de erro'
    );
  }
}));

/**
 * @route POST /api/monitoring/errors/reset
 * @desc Reset error statistics and metrics
 * @access Admin
 */
router.post('/reset', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { 
      resetMetrics = false,
      resetAlerts = false,
      resetNotifications = false,
      confirmReset = false
    } = req.body;

    if (!confirmReset) {
      throw new ValidationError('Reset confirmation required', [
        { 
          field: 'confirmReset', 
          message: 'Must confirm reset operation', 
          messagePortuguese: 'Deve confirmar a operação de reset' 
        }
      ]);
    }

    const resetResults = {
      metrics: false,
      alerts: false,
      notifications: false,
      timestamp: new Date().toISOString()
    };

    if (resetMetrics) {
      errorTracker.resetMetrics();
      resetResults.metrics = true;
    }

    if (resetAlerts) {
      // Reset alerts by acknowledging all
      const alerts = errorTracker.getAlerts();
      alerts.forEach(alert => errorTracker.acknowledgeAlert(alert.id));
      resetResults.alerts = true;
    }

    // Log the reset operation
    errorLogger.logInfo('Error monitoring data reset', {
      resetBy: 'admin',
      resetTypes: Object.keys(resetResults).filter(key => key !== 'timestamp' && resetResults[key as keyof typeof resetResults]),
      timestamp: resetResults.timestamp
    });

    res.json({
      success: true,
      message: 'Error monitoring data reset successfully',
      messagePortuguese: 'Dados de monitorização de erros resetados com sucesso',
      data: resetResults
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      'Failed to reset error monitoring data',
      500,
      'RESET_FAILED',
      'Falha ao resetar dados de monitorização de erros'
    );
  }
}));

// Helper methods for the router
const routerHelpers = {
  getAlertSeverity(type: string): string {
    const severityMap: { [key: string]: string } = {
      'critical': 'critical',
      'frequency': 'warning',
      'pattern': 'info'
    };
    return severityMap[type] || 'info';
  },

  getTimeframeDescription(timeframe: string): string {
    const descriptions: { [key: string]: string } = {
      '1h': 'Last hour',
      '24h': 'Last 24 hours',
      '7d': 'Last 7 days',
      '30d': 'Last 30 days'
    };
    return descriptions[timeframe] || 'Custom timeframe';
  },

  getTopErrors(errorData: { [key: string]: number }, limit: number): Array<{ type: string; count: number }> {
    return Object.entries(errorData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([type, count]) => ({ type, count }));
  },

  getStatusCodeBreakdown(statusCodes: { [key: string]: number }): { [key: string]: { count: number; percentage: number } } {
    const total = Object.values(statusCodes).reduce((sum, count) => sum + count, 0);
    const result: { [key: string]: { count: number; percentage: number } } = {};
    
    for (const [code, count] of Object.entries(statusCodes)) {
      result[code] = {
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      };
    }
    
    return result;
  },

  analyzeTrends(trends: any[], options: any): any[] {
    // Simplified trend analysis - in production, this would be more sophisticated
    return trends.slice(-24).map((trend, index) => ({
      ...trend,
      index,
      movingAverage: trends.slice(Math.max(0, index - 2), index + 1)
        .reduce((sum, t) => sum + t.count, 0) / Math.min(3, index + 1)
    }));
  },

  calculateOverallTrend(trends: any[]): string {
    if (trends.length < 2) return 'insufficient_data';
    
    const recent = trends.slice(-6);
    const earlier = trends.slice(-12, -6);
    
    const recentAvg = recent.reduce((sum, t) => sum + t.count, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, t) => sum + t.count, 0) / earlier.length;
    
    if (recentAvg > earlierAvg * 1.2) return 'increasing';
    if (recentAvg < earlierAvg * 0.8) return 'decreasing';
    return 'stable';
  },

  identifyPeakHours(trends: any[]): string[] {
    const hourCounts: { [key: number]: number } = {};
    
    trends.forEach(trend => {
      const hour = new Date(trend.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + trend.count;
    });
    
    const sortedHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
    
    return sortedHours;
  },

  generateTrendRecommendations(trends: any[]): string[] {
    const recommendations = [];
    
    if (trends.length === 0) {
      recommendations.push('No error trends data available');
      return recommendations;
    }
    
    const totalErrors = trends.reduce((sum, t) => sum + t.count, 0);
    const avgErrors = totalErrors / trends.length;
    
    if (avgErrors > 10) {
      recommendations.push('Consider implementing additional error prevention measures');
    }
    
    if (avgErrors > 5) {
      recommendations.push('Review error patterns and optimize frequently failing operations');
    }
    
    if (avgErrors < 1) {
      recommendations.push('Error rates are within acceptable limits');
    }
    
    return recommendations;
  },

  convertToCSV(data: any): string {
    // Simplified CSV conversion - in production, use a proper library
    const headers = Object.keys(data);
    const rows = [headers.join(',')];
    
    // Add data rows (simplified for basic data structures)
    if (data.statistics) {
      rows.push(`Statistics,${JSON.stringify(data.statistics).replace(/,/g, ';')}`);
    }
    
    return rows.join('\n');
  },

  convertToXML(data: any): string {
    // Simplified XML conversion - in production, use a proper library
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const xmlBody = `<errorExport generated="${new Date().toISOString()}">
      <data>${JSON.stringify(data)}</data>
    </errorExport>`;
    
    return xmlHeader + '\n' + xmlBody;
  }
};

// Attach helper methods to router for access within route handlers
Object.assign(router, routerHelpers);

export default router;