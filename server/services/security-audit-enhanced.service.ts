/**
 * Enhanced Security Audit Service for MariaIntelligence
 * Comprehensive security event logging, analysis, and alerting system
 */

import fs from 'fs/promises';
import path from 'path';
import pino from 'pino';
import { EventEmitter } from 'events';
import crypto from 'crypto';

// Enhanced security event interface
export interface SecurityAuditEvent {
  id: string;
  timestamp: Date;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  ip: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  url: string;
  method: string;
  statusCode?: number;
  responseTime?: number;
  payloadSize?: number;
  fingerprint?: string;
  geolocation?: {
    country?: string;
    region?: string;
    city?: string;
    asn?: string;
  };
  details: any;
  tags: string[];
  riskScore: number;
  actionsTaken: string[];
}

// Threat intelligence interface
export interface ThreatIntelligence {
  ip: string;
  threatType: string;
  confidence: number;
  source: string;
  firstSeen: Date;
  lastSeen: Date;
  attributes: {
    isBot?: boolean;
    isProxy?: boolean;
    isTor?: boolean;
    isVpn?: boolean;
    isMalware?: boolean;
    reputation?: number;
  };
}

// Security metrics interface
export interface SecurityMetrics {
  timeframe: string;
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  topAttackingIPs: Array<{ ip: string; count: number; lastSeen: Date }>;
  topTargetedEndpoints: Array<{ endpoint: string; count: number }>;
  averageRiskScore: number;
  blockedRequests: number;
  falsePositives: number;
  systemLoad: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

// Alert configuration
export interface AlertConfig {
  enabled: boolean;
  thresholds: {
    eventsPerMinute: number;
    criticalEventsPerHour: number;
    uniqueAttackersPerHour: number;
    averageRiskScore: number;
  };
  channels: {
    email?: { recipients: string[]; smtp: any };
    webhook?: { url: string; headers?: Record<string, string> };
    slack?: { webhookUrl: string; channel: string };
    sms?: { provider: string; numbers: string[] };
  };
  cooldownMinutes: number;
}

class SecurityAuditService extends EventEmitter {
  private static instance: SecurityAuditService;
  private logger: pino.Logger;
  private auditLogPath: string;
  private metricsCache: Map<string, any> = new Map();
  private threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private alertConfig: AlertConfig;
  private lastAlertTime: Map<string, Date> = new Map();
  private eventBuffer: SecurityAuditEvent[] = [];
  private flushInterval: NodeJS.Timeout;

  private constructor() {
    super();
    this.logger = pino({
      name: 'security-audit-service',
      level: process.env.SECURITY_LOG_LEVEL || 'info'
    });

    this.auditLogPath = path.join(process.cwd(), 'logs', 'security');
    this.initializeAlertConfig();
    this.initializeDirectories();
    this.loadThreatIntelligence();
    
    // Flush events to disk every 30 seconds
    this.flushInterval = setInterval(() => this.flushEventBuffer(), 30000);
  }

  public static getInstance(): SecurityAuditService {
    if (!SecurityAuditService.instance) {
      SecurityAuditService.instance = new SecurityAuditService();
    }
    return SecurityAuditService.instance;
  }

  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.auditLogPath, { recursive: true });
      await fs.mkdir(path.join(this.auditLogPath, 'archives'), { recursive: true });
      await fs.mkdir(path.join(this.auditLogPath, 'reports'), { recursive: true });
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize audit directories');
    }
  }

  private initializeAlertConfig(): void {
    this.alertConfig = {
      enabled: process.env.SECURITY_ALERTS_ENABLED === 'true',
      thresholds: {
        eventsPerMinute: parseInt(process.env.ALERT_EVENTS_PER_MINUTE || '50'),
        criticalEventsPerHour: parseInt(process.env.ALERT_CRITICAL_PER_HOUR || '10'),
        uniqueAttackersPerHour: parseInt(process.env.ALERT_UNIQUE_ATTACKERS || '5'),
        averageRiskScore: parseFloat(process.env.ALERT_RISK_SCORE || '7.5')
      },
      channels: {
        webhook: process.env.SECURITY_WEBHOOK_URL ? {
          url: process.env.SECURITY_WEBHOOK_URL,
          headers: { 'Content-Type': 'application/json' }
        } : undefined
      },
      cooldownMinutes: parseInt(process.env.ALERT_COOLDOWN_MINUTES || '15')
    };
  }

  private async loadThreatIntelligence(): Promise<void> {
    try {
      // Load from local threat intelligence file
      const tiPath = path.join(this.auditLogPath, 'threat-intelligence.json');
      
      try {
        const tiData = await fs.readFile(tiPath, 'utf8');
        const threatData: ThreatIntelligence[] = JSON.parse(tiData);
        
        for (const threat of threatData) {
          this.threatIntelligence.set(threat.ip, threat);
        }
        
        this.logger.info({ count: threatData.length }, 'Loaded threat intelligence data');
      } catch (error) {
        this.logger.info('No existing threat intelligence data found');
      }
    } catch (error) {
      this.logger.error({ error }, 'Failed to load threat intelligence');
    }
  }

  /**
   * Record a security event with enhanced analysis
   */
  public async recordEvent(event: Partial<SecurityAuditEvent>): Promise<void> {
    try {
      const enhancedEvent: SecurityAuditEvent = {
        id: this.generateEventId(),
        timestamp: new Date(),
        type: event.type || 'UNKNOWN',
        severity: event.severity || 'low',
        source: event.source || 'unknown',
        ip: event.ip || 'unknown',
        userAgent: event.userAgent || 'unknown',
        url: event.url || '',
        method: event.method || 'UNKNOWN',
        details: event.details || {},
        tags: event.tags || [],
        riskScore: 0,
        actionsTaken: [],
        ...event
      };

      // Enhance event with additional analysis
      await this.enhanceEvent(enhancedEvent);

      // Add to buffer for batch processing
      this.eventBuffer.push(enhancedEvent);

      // Emit event for real-time processing
      this.emit('securityEvent', enhancedEvent);

      // Check for immediate alerts
      if (enhancedEvent.severity === 'critical') {
        await this.checkImmediateAlert(enhancedEvent);
      }

      this.logger.info({
        eventId: enhancedEvent.id,
        type: enhancedEvent.type,
        severity: enhancedEvent.severity,
        ip: enhancedEvent.ip,
        riskScore: enhancedEvent.riskScore
      }, 'Security event recorded');

    } catch (error) {
      this.logger.error({ error, event }, 'Failed to record security event');
    }
  }

  /**
   * Enhance event with threat intelligence and risk scoring
   */
  private async enhanceEvent(event: SecurityAuditEvent): Promise<void> {
    // Risk scoring based on event type and severity
    event.riskScore = this.calculateRiskScore(event);

    // Add threat intelligence data
    const threatInfo = this.threatIntelligence.get(event.ip);
    if (threatInfo) {
      event.details.threatIntelligence = {
        threatType: threatInfo.threatType,
        confidence: threatInfo.confidence,
        source: threatInfo.source,
        attributes: threatInfo.attributes
      };
      event.riskScore += threatInfo.confidence * 2;
      event.tags.push('known-threat');
    }

    // Geolocation enhancement (simplified - integrate with GeoIP service)
    if (event.ip && event.ip !== 'unknown') {
      event.geolocation = await this.getGeolocation(event.ip);
    }

    // Fingerprint generation for pattern detection
    event.fingerprint = this.generateEventFingerprint(event);

    // Add behavioral tags
    event.tags.push(...this.generateBehavioralTags(event));
  }

  /**
   * Calculate risk score for an event
   */
  private calculateRiskScore(event: SecurityAuditEvent): number {
    let score = 0;

    // Base score by severity
    const severityScores = { low: 1, medium: 3, high: 6, critical: 9 };
    score += severityScores[event.severity];

    // Event type scoring
    const typeScores: Record<string, number> = {
      'XSS_ATTEMPT': 8,
      'SQL_INJECTION_ATTEMPT': 9,
      'COMMAND_INJECTION': 10,
      'DDoS_DETECTED': 7,
      'BRUTE_FORCE_DETECTED': 6,
      'DIRECTORY_TRAVERSAL': 5,
      'SUSPICIOUS_REQUEST': 3,
      'RATE_LIMIT_EXCEEDED': 2,
      'BOT_TRAFFIC_DETECTED': 1
    };
    score += typeScores[event.type] || 0;

    // Time-based factors (attacks outside business hours are more suspicious)
    const hour = event.timestamp.getHours();
    if (hour < 6 || hour > 22) {
      score += 1;
    }

    // Payload size factor
    if (event.payloadSize && event.payloadSize > 1024 * 1024) { // 1MB+
      score += 2;
    }

    // Response time factor (unusually slow responses might indicate attacks)
    if (event.responseTime && event.responseTime > 5000) { // 5s+
      score += 1;
    }

    return Math.min(score, 10); // Cap at 10
  }

  /**
   * Generate event fingerprint for pattern detection
   */
  private generateEventFingerprint(event: SecurityAuditEvent): string {
    const components = [
      event.type,
      event.method,
      event.url.replace(/[0-9]+/g, 'N'), // Normalize numbers
      event.userAgent.substring(0, 50),
      event.ip.split('.').slice(0, 2).join('.') // First two octets
    ];
    
    return crypto.createHash('md5')
      .update(components.join('|'))
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Generate behavioral tags based on event characteristics
   */
  private generateBehavioralTags(event: SecurityAuditEvent): string[] {
    const tags: string[] = [];

    // Time-based tags
    const hour = event.timestamp.getHours();
    if (hour >= 0 && hour < 6) tags.push('night-activity');
    if (hour >= 9 && hour < 17) tags.push('business-hours');

    // Size-based tags
    if (event.payloadSize) {
      if (event.payloadSize > 10 * 1024 * 1024) tags.push('large-payload');
      if (event.payloadSize < 10) tags.push('tiny-payload');
    }

    // Response-based tags
    if (event.statusCode) {
      if (event.statusCode >= 400 && event.statusCode < 500) tags.push('client-error');
      if (event.statusCode >= 500) tags.push('server-error');
    }

    // Performance tags
    if (event.responseTime) {
      if (event.responseTime > 10000) tags.push('very-slow');
      if (event.responseTime < 10) tags.push('very-fast');
    }

    return tags;
  }

  /**
   * Get geolocation for IP (mock implementation - integrate with real service)
   */
  private async getGeolocation(ip: string): Promise<any> {
    // Mock implementation - integrate with MaxMind GeoIP or similar
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      asn: 'Unknown'
    };
  }

  /**
   * Flush event buffer to disk
   */
  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const logFile = path.join(
        this.auditLogPath, 
        `security-audit-${new Date().toISOString().split('T')[0]}.json`
      );

      const events = [...this.eventBuffer];
      this.eventBuffer = [];

      const logData = events.map(event => JSON.stringify(event)).join('\n') + '\n';
      await fs.appendFile(logFile, logData);

      this.logger.debug({ count: events.length }, 'Flushed security events to disk');
    } catch (error) {
      this.logger.error({ error }, 'Failed to flush security events');
    }
  }

  /**
   * Check for immediate alerts on critical events
   */
  private async checkImmediateAlert(event: SecurityAuditEvent): Promise<void> {
    if (!this.alertConfig.enabled) return;

    const alertKey = `${event.type}_${event.ip}`;
    const lastAlert = this.lastAlertTime.get(alertKey);
    const now = new Date();

    // Check cooldown period
    if (lastAlert && 
        (now.getTime() - lastAlert.getTime()) < (this.alertConfig.cooldownMinutes * 60 * 1000)) {
      return;
    }

    await this.sendAlert({
      type: 'immediate',
      severity: event.severity,
      event,
      message: `Critical security event detected: ${event.type}`,
      timestamp: now
    });

    this.lastAlertTime.set(alertKey, now);
  }

  /**
   * Send security alert through configured channels
   */
  private async sendAlert(alert: any): Promise<void> {
    try {
      if (this.alertConfig.channels.webhook) {
        const payload = {
          service: 'mariaintelligence-security',
          alert: alert.type,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp,
          event: alert.event ? {
            id: alert.event.id,
            type: alert.event.type,
            ip: alert.event.ip,
            url: alert.event.url,
            riskScore: alert.event.riskScore
          } : undefined
        };

        const response = await fetch(this.alertConfig.channels.webhook.url, {
          method: 'POST',
          headers: this.alertConfig.channels.webhook.headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Webhook alert failed: ${response.status}`);
        }

        this.logger.info({ alertType: alert.type }, 'Security alert sent via webhook');
      }
    } catch (error) {
      this.logger.error({ error, alert }, 'Failed to send security alert');
    }
  }

  /**
   * Generate comprehensive security metrics
   */
  public async generateMetrics(timeframe: string = '24h'): Promise<SecurityMetrics> {
    const cacheKey = `metrics_${timeframe}`;
    const cached = this.metricsCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 min cache
      return cached.data;
    }

    try {
      const events = await this.getEventsInTimeframe(timeframe);
      
      const metrics: SecurityMetrics = {
        timeframe,
        totalEvents: events.length,
        eventsByType: this.groupEventsByType(events),
        eventsBySeverity: this.groupEventsBySeverity(events),
        topAttackingIPs: this.getTopAttackingIPs(events),
        topTargetedEndpoints: this.getTopTargetedEndpoints(events),
        averageRiskScore: this.calculateAverageRiskScore(events),
        blockedRequests: events.filter(e => e.actionsTaken.includes('blocked')).length,
        falsePositives: events.filter(e => e.tags.includes('false-positive')).length,
        systemLoad: await this.getSystemLoad()
      };

      this.metricsCache.set(cacheKey, { data: metrics, timestamp: Date.now() });
      return metrics;
    } catch (error) {
      this.logger.error({ error }, 'Failed to generate security metrics');
      throw error;
    }
  }

  /**
   * Generate security report
   */
  public async generateSecurityReport(timeframe: string = '24h'): Promise<any> {
    const metrics = await this.generateMetrics(timeframe);
    const events = await this.getEventsInTimeframe(timeframe);
    
    const report = {
      generatedAt: new Date(),
      timeframe,
      summary: metrics,
      topThreats: this.identifyTopThreats(events),
      recommendations: this.generateRecommendations(metrics),
      trendAnalysis: this.analyzeTrends(events)
    };

    // Save report to disk
    const reportFile = path.join(
      this.auditLogPath, 
      'reports', 
      `security-report-${new Date().toISOString().split('T')[0]}.json`
    );
    
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * Update threat intelligence with new IP
   */
  public async updateThreatIntelligence(ip: string, threat: Partial<ThreatIntelligence>): Promise<void> {
    const existing = this.threatIntelligence.get(ip);
    
    const updatedThreat: ThreatIntelligence = {
      ip,
      threatType: threat.threatType || 'unknown',
      confidence: threat.confidence || 5,
      source: threat.source || 'internal',
      firstSeen: existing?.firstSeen || new Date(),
      lastSeen: new Date(),
      attributes: { ...existing?.attributes, ...threat.attributes }
    };

    this.threatIntelligence.set(ip, updatedThreat);
    
    // Persist to disk
    const tiPath = path.join(this.auditLogPath, 'threat-intelligence.json');
    const allThreats = Array.from(this.threatIntelligence.values());
    await fs.writeFile(tiPath, JSON.stringify(allThreats, null, 2));
    
    this.logger.info({ ip, threatType: updatedThreat.threatType }, 'Updated threat intelligence');
  }

  // Helper methods for metrics generation
  private async getEventsInTimeframe(timeframe: string): Promise<SecurityAuditEvent[]> {
    // Implementation would read from log files and parse events
    // For now, return empty array
    return [];
  }

  private groupEventsByType(events: SecurityAuditEvent[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const event of events) {
      grouped[event.type] = (grouped[event.type] || 0) + 1;
    }
    return grouped;
  }

  private groupEventsBySeverity(events: SecurityAuditEvent[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    for (const event of events) {
      grouped[event.severity] = (grouped[event.severity] || 0) + 1;
    }
    return grouped;
  }

  private getTopAttackingIPs(events: SecurityAuditEvent[]): Array<{ ip: string; count: number; lastSeen: Date }> {
    const ipCounts: Record<string, { count: number; lastSeen: Date }> = {};
    
    for (const event of events) {
      if (!ipCounts[event.ip]) {
        ipCounts[event.ip] = { count: 0, lastSeen: event.timestamp };
      }
      ipCounts[event.ip].count++;
      if (event.timestamp > ipCounts[event.ip].lastSeen) {
        ipCounts[event.ip].lastSeen = event.timestamp;
      }
    }

    return Object.entries(ipCounts)
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getTopTargetedEndpoints(events: SecurityAuditEvent[]): Array<{ endpoint: string; count: number }> {
    const endpointCounts: Record<string, number> = {};
    
    for (const event of events) {
      const endpoint = event.url.split('?')[0]; // Remove query params
      endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
    }

    return Object.entries(endpointCounts)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateAverageRiskScore(events: SecurityAuditEvent[]): number {
    if (events.length === 0) return 0;
    const sum = events.reduce((acc, event) => acc + event.riskScore, 0);
    return parseFloat((sum / events.length).toFixed(2));
  }

  private async getSystemLoad(): Promise<{ cpu: number; memory: number; disk: number }> {
    // Mock implementation - integrate with system monitoring
    return { cpu: 45, memory: 62, disk: 78 };
  }

  private identifyTopThreats(events: SecurityAuditEvent[]): any[] {
    // Analyze patterns and identify emerging threats
    return [];
  }

  private generateRecommendations(metrics: SecurityMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.averageRiskScore > 7) {
      recommendations.push('High average risk score detected. Review security policies.');
    }
    
    if (metrics.eventsBySeverity.critical > 10) {
      recommendations.push('Multiple critical events detected. Investigate immediately.');
    }
    
    return recommendations;
  }

  private analyzeTrends(events: SecurityAuditEvent[]): any {
    // Analyze trends over time
    return { increasing: [], decreasing: [], stable: [] };
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Cleanup method to be called on shutdown
   */
  public async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    await this.flushEventBuffer();
    this.removeAllListeners();
    this.logger.info('Security audit service cleaned up');
  }
}

// Export singleton instance
export const securityAuditService = SecurityAuditService.getInstance();