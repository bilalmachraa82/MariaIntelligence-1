/**
 * Security Audit Service for Maria Faz Project
 * 
 * This service provides comprehensive security monitoring and audit capabilities:
 * - Real-time security event analysis
 * - Threat pattern detection
 * - Security metrics collection
 * - Automated alert generation
 * - Security report generation
 */

import { SecurityEventType } from '../middleware/security';
import pino from 'pino';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// Security audit logger
const auditLogger = pino({
  name: 'security-audit-service',
  level: 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
      ignore: 'pid,hostname',
    }
  } : undefined,
});

// Security event interface
interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  url: string;
  method: string;
  timestamp: Date;
  details?: any;
  userId?: string;
  blocked: boolean;
  resolved: boolean;
}

// Security metrics interface
interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<string, number>;
  topAttackingIPs: Array<{ ip: string; count: number }>;
  topTargetedEndpoints: Array<{ endpoint: string; count: number }>;
  timeWindow: string;
  lastUpdated: Date;
}

// Threat pattern interface
interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  pattern: RegExp | string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actions: string[];
  enabled: boolean;
  matchCount: number;
  lastMatch: Date | null;
}

export class SecurityAuditService {
  private static instance: SecurityAuditService;
  private events: SecurityEvent[] = [];
  private metrics: SecurityMetrics;
  private threatPatterns: ThreatPattern[] = [];
  private alertThresholds: Record<string, number> = {};
  private auditLogDir: string;

  private constructor() {
    this.auditLogDir = path.join(process.cwd(), 'logs', 'security');
    this.initializeMetrics();
    this.initializeThreatPatterns();
    this.initializeAlertThresholds();
    this.ensureLogDirectory();
    
    // Clean up old events every hour
    setInterval(() => this.cleanupOldEvents(), 60 * 60 * 1000);
    
    // Generate metrics every 15 minutes
    setInterval(() => this.updateMetrics(), 15 * 60 * 1000);
  }

  public static getInstance(): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService();
    }
    return SecurityAuditService.instance;
  }

  /**
   * Initialize security metrics
   */
  private initializeMetrics(): void {
    this.metrics = {
      totalEvents: 0,
      eventsByType: {} as Record<SecurityEventType, number>,
      eventsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      topAttackingIPs: [],
      topTargetedEndpoints: [],
      timeWindow: '24h',
      lastUpdated: new Date()
    };

    // Initialize event type counters
    Object.values(SecurityEventType).forEach(type => {
      this.metrics.eventsByType[type] = 0;
    });
  }

  /**
   * Initialize threat detection patterns
   */
  private initializeThreatPatterns(): void {
    this.threatPatterns = [
      {
        id: 'sql-injection-basic',
        name: 'Basic SQL Injection',
        description: 'Detects basic SQL injection attempts',
        pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b|UNION\s+SELECT|OR\s+1\s*=\s*1)/gi,
        severity: 'high',
        actions: ['log', 'block'],
        enabled: true,
        matchCount: 0,
        lastMatch: null
      },
      {
        id: 'xss-script-tags',
        name: 'XSS Script Tags',
        description: 'Detects XSS attempts using script tags',
        pattern: /<script[^>]*>.*?<\/script>/gi,
        severity: 'high',
        actions: ['log', 'block'],
        enabled: true,
        matchCount: 0,
        lastMatch: null
      },
      {
        id: 'path-traversal',
        name: 'Path Traversal',
        description: 'Detects directory traversal attempts',
        pattern: /(\.\.[\/\\]){2,}/g,
        severity: 'medium',
        actions: ['log', 'alert'],
        enabled: true,
        matchCount: 0,
        lastMatch: null
      },
      {
        id: 'command-injection',
        name: 'Command Injection',
        description: 'Detects command injection attempts',
        pattern: /[;&|`$(){}[\]<>]/g,
        severity: 'high',
        actions: ['log', 'block'],
        enabled: true,
        matchCount: 0,
        lastMatch: null
      },
      {
        id: 'suspicious-user-agents',
        name: 'Suspicious User Agents',
        description: 'Detects known attack tools and scanners',
        pattern: /(sqlmap|nikto|nessus|burpsuite|havij|w3af|nmap|masscan)/gi,
        severity: 'medium',
        actions: ['log', 'monitor'],
        enabled: true,
        matchCount: 0,
        lastMatch: null
      },
      {
        id: 'rate-limit-abuse',
        name: 'Rate Limit Abuse',
        description: 'Detects potential rate limit abuse patterns',
        pattern: 'RATE_LIMIT_EXCEEDED',
        severity: 'medium',
        actions: ['log', 'alert'],
        enabled: true,
        matchCount: 0,
        lastMatch: null
      }
    ];
  }

  /**
   * Initialize alert thresholds
   */
  private initializeAlertThresholds(): void {
    this.alertThresholds = {
      [SecurityEventType.RATE_LIMIT_EXCEEDED]: 5, // Alert after 5 rate limit violations
      [SecurityEventType.XSS_ATTEMPT]: 1, // Alert immediately on XSS attempts
      [SecurityEventType.SQL_INJECTION_ATTEMPT]: 1, // Alert immediately on SQL injection
      [SecurityEventType.SUSPICIOUS_REQUEST]: 3, // Alert after 3 suspicious requests
      [SecurityEventType.FILE_UPLOAD_REJECTED]: 10, // Alert after 10 rejected uploads
      [SecurityEventType.IP_BLOCKED]: 1, // Alert immediately when IP is blocked
      [SecurityEventType.CORS_VIOLATION]: 5, // Alert after 5 CORS violations
    };
  }

  /**
   * Ensure audit log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.auditLogDir, { recursive: true });
    } catch (error) {
      auditLogger.error('Failed to create audit log directory:', error);
    }
  }

  /**
   * Record a security event
   */
  public async recordEvent(event: Omit<SecurityEvent, 'id' | 'blocked' | 'resolved'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      blocked: false,
      resolved: false
    };

    // Add to events array
    this.events.push(securityEvent);

    // Log the event
    auditLogger.warn({
      eventId: securityEvent.id,
      type: securityEvent.type,
      severity: securityEvent.severity,
      ip: securityEvent.ip,
      url: securityEvent.url,
      details: securityEvent.details
    }, `Security Event: ${securityEvent.type}`);

    // Analyze for threat patterns
    await this.analyzeThreatPatterns(securityEvent);

    // Check alert thresholds
    await this.checkAlertThresholds(securityEvent);

    // Write to audit log file
    await this.writeToAuditLog(securityEvent);

    // Update metrics
    this.updateEventMetrics(securityEvent);
  }

  /**
   * Analyze event against threat patterns
   */
  private async analyzeThreatPatterns(event: SecurityEvent): Promise<void> {
    const eventContent = JSON.stringify({
      url: event.url,
      userAgent: event.userAgent,
      details: event.details
    });

    for (const pattern of this.threatPatterns) {
      if (!pattern.enabled) continue;

      let matches = false;
      
      if (pattern.pattern instanceof RegExp) {
        matches = pattern.pattern.test(eventContent);
      } else if (typeof pattern.pattern === 'string') {
        matches = eventContent.includes(pattern.pattern) || event.type === pattern.pattern;
      }

      if (matches) {
        pattern.matchCount++;
        pattern.lastMatch = new Date();

        auditLogger.warn({
          patternId: pattern.id,
          patternName: pattern.name,
          eventId: event.id,
          severity: pattern.severity
        }, `Threat pattern matched: ${pattern.name}`);

        // Execute pattern actions
        for (const action of pattern.actions) {
          await this.executePatternAction(action, event, pattern);
        }
      }
    }
  }

  /**
   * Execute action based on threat pattern match
   */
  private async executePatternAction(
    action: string, 
    event: SecurityEvent, 
    pattern: ThreatPattern
  ): Promise<void> {
    switch (action) {
      case 'block':
        event.blocked = true;
        auditLogger.error(`IP ${event.ip} blocked due to pattern: ${pattern.name}`);
        break;
      
      case 'alert':
        await this.generateAlert(event, pattern);
        break;
      
      case 'monitor':
        auditLogger.info(`Monitoring IP ${event.ip} due to pattern: ${pattern.name}`);
        break;
      
      case 'log':
        auditLogger.warn(`Pattern match logged: ${pattern.name} for IP ${event.ip}`);
        break;
    }
  }

  /**
   * Check if alert thresholds are exceeded
   */
  private async checkAlertThresholds(event: SecurityEvent): Promise<void> {
    const threshold = this.alertThresholds[event.type];
    if (!threshold) return;

    // Count recent events of the same type from the same IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => 
      e.type === event.type && 
      e.ip === event.ip && 
      e.timestamp > oneHourAgo
    );

    if (recentEvents.length >= threshold) {
      await this.generateThresholdAlert(event, recentEvents.length, threshold);
    }
  }

  /**
   * Generate security alert
   */
  private async generateAlert(event: SecurityEvent, pattern?: ThreatPattern): Promise<void> {
    const alert = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'SECURITY_ALERT',
      severity: pattern?.severity || event.severity,
      event: event,
      pattern: pattern?.name,
      message: pattern 
        ? `Threat pattern "${pattern.name}" detected for IP ${event.ip}`
        : `Security event "${event.type}" triggered alert for IP ${event.ip}`
    };

    auditLogger.error(alert, 'Security Alert Generated');

    // In production, send to external alerting system
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with alerting service (Slack, email, webhook, etc.)
      console.error('SECURITY ALERT:', alert);
    }
  }

  /**
   * Generate threshold-based alert
   */
  private async generateThresholdAlert(
    event: SecurityEvent, 
    eventCount: number, 
    threshold: number
  ): Promise<void> {
    const alert = {
      id: this.generateEventId(),
      timestamp: new Date(),
      type: 'THRESHOLD_ALERT',
      severity: 'high',
      event: event,
      eventCount,
      threshold,
      message: `Threshold exceeded: ${eventCount} events of type "${event.type}" from IP ${event.ip} (threshold: ${threshold})`
    };

    auditLogger.error(alert, 'Threshold Alert Generated');

    // In production, send to external alerting system
    if (process.env.NODE_ENV === 'production') {
      console.error('THRESHOLD ALERT:', alert);
    }
  }

  /**
   * Write event to audit log file
   */
  private async writeToAuditLog(event: SecurityEvent): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.auditLogDir, `security-audit-${date}.json`);
      
      const logEntry = {
        ...event,
        timestamp: event.timestamp.toISOString()
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(logFile, logLine);
    } catch (error) {
      auditLogger.error('Failed to write to audit log file:', error);
    }
  }

  /**
   * Update event metrics
   */
  private updateEventMetrics(event: SecurityEvent): void {
    this.metrics.totalEvents++;
    this.metrics.eventsByType[event.type]++;
    this.metrics.eventsBySeverity[event.severity]++;
    this.metrics.lastUpdated = new Date();
  }

  /**
   * Update comprehensive metrics
   */
  private updateMetrics(): void {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentEvents = this.events.filter(e => e.timestamp > oneDayAgo);

    // Top attacking IPs
    const ipCounts = new Map<string, number>();
    recentEvents.forEach(event => {
      const count = ipCounts.get(event.ip) || 0;
      ipCounts.set(event.ip, count + 1);
    });

    this.metrics.topAttackingIPs = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top targeted endpoints
    const endpointCounts = new Map<string, number>();
    recentEvents.forEach(event => {
      const endpoint = event.url.split('?')[0]; // Remove query params
      const count = endpointCounts.get(endpoint) || 0;
      endpointCounts.set(endpoint, count + 1);
    });

    this.metrics.topTargetedEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    auditLogger.info('Security metrics updated', this.metrics);
  }

  /**
   * Clean up old events (keep only last 7 days)
   */
  private cleanupOldEvents(): void {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const initialCount = this.events.length;
    
    this.events = this.events.filter(event => event.timestamp > sevenDaysAgo);
    
    const removedCount = initialCount - this.events.length;
    if (removedCount > 0) {
      auditLogger.info(`Cleaned up ${removedCount} old security events`);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return createHash('sha256')
      .update(`${Date.now()}-${Math.random()}-${process.pid}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Get security metrics
   */
  public getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent security events
   */
  public getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get events by type
   */
  public getEventsByType(type: SecurityEventType, limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get events by IP
   */
  public getEventsByIP(ip: string, limit: number = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.ip === ip)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get threat patterns
   */
  public getThreatPatterns(): ThreatPattern[] {
    return [...this.threatPatterns];
  }

  /**
   * Generate security report
   */
  public generateSecurityReport(timeWindow: '1h' | '24h' | '7d' = '24h'): any {
    const now = new Date();
    let windowStart: Date;

    switch (timeWindow) {
      case '1h':
        windowStart = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        windowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
    }

    const eventsInWindow = this.events.filter(e => e.timestamp > windowStart);

    return {
      timeWindow,
      periodStart: windowStart.toISOString(),
      periodEnd: now.toISOString(),
      totalEvents: eventsInWindow.length,
      eventsByType: this.groupEventsByType(eventsInWindow),
      eventsBySeverity: this.groupEventsBySeverity(eventsInWindow),
      topAttackingIPs: this.getTopIPs(eventsInWindow),
      topTargetedEndpoints: this.getTopEndpoints(eventsInWindow),
      threatPatternMatches: this.threatPatterns
        .filter(p => p.matchCount > 0)
        .map(p => ({
          name: p.name,
          severity: p.severity,
          matchCount: p.matchCount,
          lastMatch: p.lastMatch
        })),
      recommendations: this.generateRecommendations(eventsInWindow)
    };
  }

  /**
   * Helper methods for report generation
   */
  private groupEventsByType(events: SecurityEvent[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    events.forEach(event => {
      grouped[event.type] = (grouped[event.type] || 0) + 1;
    });
    return grouped;
  }

  private groupEventsBySeverity(events: SecurityEvent[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    events.forEach(event => {
      grouped[event.severity] = (grouped[event.severity] || 0) + 1;
    });
    return grouped;
  }

  private getTopIPs(events: SecurityEvent[]): Array<{ ip: string; count: number }> {
    const ipCounts = new Map<string, number>();
    events.forEach(event => {
      const count = ipCounts.get(event.ip) || 0;
      ipCounts.set(event.ip, count + 1);
    });

    return Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopEndpoints(events: SecurityEvent[]): Array<{ endpoint: string; count: number }> {
    const endpointCounts = new Map<string, number>();
    events.forEach(event => {
      const endpoint = event.url.split('?')[0];
      const count = endpointCounts.get(endpoint) || 0;
      endpointCounts.set(endpoint, count + 1);
    });

    return Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private generateRecommendations(events: SecurityEvent[]): string[] {
    const recommendations: string[] = [];

    // Analyze patterns and generate recommendations
    const severeCounts = events.filter(e => e.severity === 'critical' || e.severity === 'high').length;
    if (severeCounts > 10) {
      recommendations.push('Considere implementar WAF (Web Application Firewall) adicional');
    }

    const rateLimitEvents = events.filter(e => e.type === SecurityEventType.RATE_LIMIT_EXCEEDED).length;
    if (rateLimitEvents > 20) {
      recommendations.push('Considere reduzir os limites de taxa para prevenir abusos');
    }

    const xssEvents = events.filter(e => e.type === SecurityEventType.XSS_ATTEMPT).length;
    if (xssEvents > 0) {
      recommendations.push('Revise e reforce as políticas de Content Security Policy (CSP)');
    }

    const sqlEvents = events.filter(e => e.type === SecurityEventType.SQL_INJECTION_ATTEMPT).length;
    if (sqlEvents > 0) {
      recommendations.push('Verifique se todas as queries usam prepared statements');
    }

    return recommendations;
  }
}

// Export singleton instance
export const securityAuditService = SecurityAuditService.getInstance();