/**
 * Security Monitoring API Endpoints
 * 
 * Provides endpoints for security monitoring and audit capabilities:
 * - Security metrics and statistics
 * - Recent security events
 * - Security reports
 * - Threat pattern information
 * - IP and user activity monitoring
 */

import { Request, Response } from 'express';
import { securityAuditService } from '../services/security-audit.service';
import { SecurityEventType, getClientIP } from '../middleware/security';

/**
 * Get security dashboard metrics
 */
export const getSecurityMetrics = async (req: Request, res: Response) => {
  try {
    const metrics = securityAuditService.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'METRICS_ERROR'
    });
  }
};

/**
 * Get recent security events
 */
export const getRecentSecurityEvents = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as SecurityEventType;
    const ip = req.query.ip as string;
    
    let events;
    
    if (type) {
      events = securityAuditService.getEventsByType(type, limit);
    } else if (ip) {
      events = securityAuditService.getEventsByIP(ip, limit);
    } else {
      events = securityAuditService.getRecentEvents(limit);
    }
    
    res.json({
      success: true,
      data: {
        events,
        total: events.length,
        filters: {
          type: type || null,
          ip: ip || null,
          limit
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'EVENTS_ERROR'
    });
  }
};

/**
 * Generate security report
 */
export const generateSecurityReport = async (req: Request, res: Response) => {
  try {
    const timeWindow = (req.query.timeWindow as '1h' | '24h' | '7d') || '24h';
    const format = req.query.format as string || 'json';
    
    const report = securityAuditService.generateSecurityReport(timeWindow);
    
    if (format === 'json') {
      res.json({
        success: true,
        data: report,
        timestamp: new Date().toISOString()
      });
    } else if (format === 'csv') {
      // Convert report to CSV format
      const csvData = convertReportToCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="security-report-${timeWindow}.csv"`);
      res.send(csvData);
    } else {
      res.status(400).json({
        success: false,
        error: 'Formato não suportado. Use "json" ou "csv"',
        code: 'INVALID_FORMAT'
      });
    }
  } catch (error) {
    console.error('Error generating security report:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'REPORT_ERROR'
    });
  }
};

/**
 * Get threat patterns information
 */
export const getThreatPatterns = async (req: Request, res: Response) => {
  try {
    const patterns = securityAuditService.getThreatPatterns();
    
    res.json({
      success: true,
      data: {
        patterns,
        total: patterns.length,
        enabled: patterns.filter(p => p.enabled).length,
        totalMatches: patterns.reduce((sum, p) => sum + p.matchCount, 0)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching threat patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'PATTERNS_ERROR'
    });
  }
};

/**
 * Get security status summary
 */
export const getSecurityStatus = async (req: Request, res: Response) => {
  try {
    const metrics = securityAuditService.getMetrics();
    const recentEvents = securityAuditService.getRecentEvents(10);
    const patterns = securityAuditService.getThreatPatterns();
    
    // Calculate security score (0-100)
    const securityScore = calculateSecurityScore(metrics, recentEvents, patterns);
    
    // Determine threat level
    const threatLevel = determineThreatLevel(recentEvents);
    
    res.json({
      success: true,
      data: {
        securityScore,
        threatLevel,
        summary: {
          totalEvents24h: metrics.totalEvents,
          criticalEvents: metrics.eventsBySeverity.critical || 0,
          blockedIPs: recentEvents.filter(e => e.blocked).length,
          activeThreats: patterns.filter(p => p.matchCount > 0 && p.lastMatch && 
            new Date(p.lastMatch).getTime() > Date.now() - 24 * 60 * 60 * 1000).length
        },
        lastUpdated: metrics.lastUpdated
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching security status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'STATUS_ERROR'
    });
  }
};

/**
 * Get IP activity analysis
 */
export const getIPAnalysis = async (req: Request, res: Response) => {
  try {
    const targetIP = req.query.ip as string;
    
    if (!targetIP) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro IP é obrigatório',
        code: 'MISSING_IP'
      });
    }
    
    const events = securityAuditService.getEventsByIP(targetIP, 100);
    const report = securityAuditService.generateSecurityReport('7d');
    
    // Analyze IP behavior
    const analysis = {
      ip: targetIP,
      totalEvents: events.length,
      firstSeen: events.length > 0 ? events[events.length - 1].timestamp : null,
      lastSeen: events.length > 0 ? events[0].timestamp : null,
      eventsByType: groupBy(events, 'type'),
      eventsBySeverity: groupBy(events, 'severity'),
      targetedEndpoints: getTopEndpoints(events),
      userAgents: getTopUserAgents(events),
      riskScore: calculateIPRiskScore(events),
      isBlocked: events.some(e => e.blocked),
      recommendations: generateIPRecommendations(events)
    };
    
    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing IP:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'IP_ANALYSIS_ERROR'
    });
  }
};

/**
 * Test security event recording (for development/testing only)
 */
export const testSecurityEvent = async (req: Request, res: Response) => {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Endpoint disponível apenas em desenvolvimento',
      code: 'PRODUCTION_DISABLED'
    });
  }
  
  try {
    const { type, severity, details } = req.body;
    
    if (!type || !severity) {
      return res.status(400).json({
        success: false,
        error: 'Tipo e severidade são obrigatórios',
        code: 'MISSING_PARAMETERS'
      });
    }
    
    await securityAuditService.recordEvent({
      type: type as SecurityEventType,
      severity,
      ip: getClientIP(req),
      userAgent: req.get('User-Agent') || 'test-agent',
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date(),
      details: details || { test: true },
      userId: 'test-user'
    });
    
    res.json({
      success: true,
      message: 'Evento de segurança de teste registrado com sucesso'
    });
  } catch (error) {
    console.error('Error recording test security event:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'TEST_EVENT_ERROR'
    });
  }
};

/**
 * Helper functions
 */

function convertReportToCSV(report: any): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Timestamp,Type,Severity,IP,URL,Details');
  
  // Add event data (simplified for CSV)
  Object.entries(report.eventsByType).forEach(([type, count]) => {
    lines.push(`${report.periodEnd},${type},info,system,report,"Count: ${count}"`);
  });
  
  return lines.join('\n');
}

function calculateSecurityScore(metrics: any, recentEvents: any[], patterns: any[]): number {
  let score = 100;
  
  // Deduct points for critical events
  score -= (metrics.eventsBySeverity.critical || 0) * 10;
  score -= (metrics.eventsBySeverity.high || 0) * 5;
  score -= (metrics.eventsBySeverity.medium || 0) * 2;
  
  // Deduct points for active threat patterns
  const activePatterns = patterns.filter(p => p.matchCount > 0 && p.lastMatch && 
    new Date(p.lastMatch).getTime() > Date.now() - 24 * 60 * 60 * 1000);
  score -= activePatterns.length * 5;
  
  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, score));
}

function determineThreatLevel(recentEvents: any[]): 'low' | 'medium' | 'high' | 'critical' {
  const criticalCount = recentEvents.filter(e => e.severity === 'critical').length;
  const highCount = recentEvents.filter(e => e.severity === 'high').length;
  
  if (criticalCount > 0) return 'critical';
  if (highCount > 2) return 'high';
  if (recentEvents.length > 10) return 'medium';
  return 'low';
}

function groupBy(events: any[], key: string): Record<string, number> {
  const grouped: Record<string, number> = {};
  events.forEach(event => {
    const value = event[key];
    grouped[value] = (grouped[value] || 0) + 1;
  });
  return grouped;
}

function getTopEndpoints(events: any[]): Array<{ endpoint: string; count: number }> {
  const endpointCounts = new Map<string, number>();
  events.forEach(event => {
    const endpoint = event.url.split('?')[0];
    const count = endpointCounts.get(endpoint) || 0;
    endpointCounts.set(endpoint, count + 1);
  });

  return Array.from(endpointCounts.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getTopUserAgents(events: any[]): Array<{ userAgent: string; count: number }> {
  const uaCounts = new Map<string, number>();
  events.forEach(event => {
    const ua = event.userAgent || 'unknown';
    const count = uaCounts.get(ua) || 0;
    uaCounts.set(ua, count + 1);
  });

  return Array.from(uaCounts.entries())
    .map(([userAgent, count]) => ({ userAgent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function calculateIPRiskScore(events: any[]): number {
  let riskScore = 0;
  
  events.forEach(event => {
    switch (event.severity) {
      case 'critical':
        riskScore += 10;
        break;
      case 'high':
        riskScore += 5;
        break;
      case 'medium':
        riskScore += 2;
        break;
      case 'low':
        riskScore += 1;
        break;
    }
  });
  
  // Normalize to 0-100 scale
  return Math.min(100, riskScore);
}

function generateIPRecommendations(events: any[]): string[] {
  const recommendations: string[] = [];
  
  const criticalCount = events.filter(e => e.severity === 'critical').length;
  if (criticalCount > 0) {
    recommendations.push('Considere bloquear este IP imediatamente');
  }
  
  const rateLimitCount = events.filter(e => e.type === SecurityEventType.RATE_LIMIT_EXCEEDED).length;
  if (rateLimitCount > 5) {
    recommendations.push('IP está excedendo limites de taxa frequentemente');
  }
  
  const xssCount = events.filter(e => e.type === SecurityEventType.XSS_ATTEMPT).length;
  if (xssCount > 0) {
    recommendations.push('IP tentou ataques XSS - monitorar de perto');
  }
  
  const sqlCount = events.filter(e => e.type === SecurityEventType.SQL_INJECTION_ATTEMPT).length;
  if (sqlCount > 0) {
    recommendations.push('IP tentou SQL injection - considere bloqueio');
  }
  
  return recommendations;
}