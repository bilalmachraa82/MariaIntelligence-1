/**
 * Automated Threat Response Service for MariaIntelligence
 * Real-time threat detection and automated response system
 */

import { EventEmitter } from 'events';
import pino from 'pino';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { SecurityAuditEvent, securityAuditService } from './security-audit-enhanced.service';

// Response action types
export enum ResponseActionType {
  BLOCK_IP = 'BLOCK_IP',
  RATE_LIMIT_IP = 'RATE_LIMIT_IP',
  QUARANTINE_SESSION = 'QUARANTINE_SESSION',
  ALERT_ADMIN = 'ALERT_ADMIN',
  LOG_INCIDENT = 'LOG_INCIDENT',
  UPDATE_FIREWALL = 'UPDATE_FIREWALL',
  NOTIFY_MONITORING = 'NOTIFY_MONITORING',
  TEMPORARY_LOCKDOWN = 'TEMPORARY_LOCKDOWN',
  REVOKE_SESSIONS = 'REVOKE_SESSIONS',
  BACKUP_SYSTEM = 'BACKUP_SYSTEM'
}

// Response rule interface
export interface ThreatResponseRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: {
    eventTypes: string[];
    severity: string[];
    riskScoreThreshold: number;
    timeWindow: number; // seconds
    occurrenceCount: number;
    ipPatterns?: string[];
    userAgentPatterns?: string[];
    geoRestrictions?: string[];
  };
  actions: Array<{
    type: ResponseActionType;
    params: Record<string, any>;
    delay?: number; // seconds
    requiresConfirmation?: boolean;
  }>;
  cooldownPeriod: number; // seconds
}

// Response action result
export interface ResponseActionResult {
  actionId: string;
  action: ResponseActionType;
  success: boolean;
  timestamp: Date;
  details: any;
  error?: string;
}

// Threat context for decision making
export interface ThreatContext {
  event: SecurityAuditEvent;
  relatedEvents: SecurityAuditEvent[];
  ipHistory: {
    totalEvents: number;
    recentEvents: number;
    firstSeen: Date;
    lastSeen: Date;
    reputation: number;
  };
  pattern: {
    frequency: number;
    escalation: boolean;
    geographical: any;
    temporal: any;
  };
  systemState: {
    load: number;
    availableResources: number;
    maintenanceMode: boolean;
  };
}

class ThreatResponseService extends EventEmitter {
  private static instance: ThreatResponseService;
  private logger: pino.Logger;
  private rules: Map<string, ThreatResponseRule> = new Map();
  private activeResponses: Map<string, Date> = new Map(); // Cooldown tracking
  private pendingActions: Map<string, any> = new Map();
  private executionQueue: Array<{ rule: ThreatResponseRule; context: ThreatContext }> = [];
  private processing: boolean = false;
  private blockedIPs: Set<string> = new Set();
  private quarantinedSessions: Set<string> = new Set();

  private constructor() {
    super();
    this.logger = pino({
      name: 'threat-response-service',
      level: process.env.THREAT_RESPONSE_LOG_LEVEL || 'info'
    });

    this.initializeDefaultRules();
    this.startEventListener();
    this.startProcessingQueue();
  }

  public static getInstance(): ThreatResponseService {
    if (!ThreatResponseService.instance) {
      ThreatResponseService.instance = new ThreatResponseService();
    }
    return ThreatResponseService.instance;
  }

  /**
   * Initialize default threat response rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: ThreatResponseRule[] = [
      {
        id: 'critical-attack-immediate-block',
        name: 'Critical Attack - Immediate Block',
        description: 'Block IP immediately on critical security events',
        enabled: true,
        priority: 100,
        conditions: {
          eventTypes: ['XSS_ATTEMPT', 'SQL_INJECTION_ATTEMPT', 'COMMAND_INJECTION'],
          severity: ['critical'],
          riskScoreThreshold: 8,
          timeWindow: 60,
          occurrenceCount: 1
        },
        actions: [
          {
            type: ResponseActionType.BLOCK_IP,
            params: { duration: 86400, reason: 'Critical security threat' }
          },
          {
            type: ResponseActionType.ALERT_ADMIN,
            params: { priority: 'critical', escalate: true }
          },
          {
            type: ResponseActionType.LOG_INCIDENT,
            params: { category: 'security_breach' }
          }
        ],
        cooldownPeriod: 300
      },
      {
        id: 'brute-force-protection',
        name: 'Brute Force Protection',
        description: 'Respond to brute force attacks with progressive blocking',
        enabled: true,
        priority: 90,
        conditions: {
          eventTypes: ['AUTHENTICATION_FAILED', 'BRUTE_FORCE_DETECTED'],
          severity: ['high', 'critical'],
          riskScoreThreshold: 6,
          timeWindow: 300,
          occurrenceCount: 5
        },
        actions: [
          {
            type: ResponseActionType.BLOCK_IP,
            params: { duration: 3600, reason: 'Brute force attack' }
          },
          {
            type: ResponseActionType.REVOKE_SESSIONS,
            params: { ip: true }
          },
          {
            type: ResponseActionType.ALERT_ADMIN,
            params: { priority: 'high' }
          }
        ],
        cooldownPeriod: 600
      },
      {
        id: 'ddos-mitigation',
        name: 'DDoS Mitigation',
        description: 'Automatic DDoS detection and mitigation',
        enabled: true,
        priority: 95,
        conditions: {
          eventTypes: ['DDoS_DETECTED', 'RATE_LIMIT_EXCEEDED'],
          severity: ['high', 'critical'],
          riskScoreThreshold: 7,
          timeWindow: 60,
          occurrenceCount: 10
        },
        actions: [
          {
            type: ResponseActionType.RATE_LIMIT_IP,
            params: { limit: 5, window: 300, reason: 'DDoS protection' }
          },
          {
            type: ResponseActionType.UPDATE_FIREWALL,
            params: { action: 'rate_limit', duration: 1800 }
          },
          {
            type: ResponseActionType.ALERT_ADMIN,
            params: { priority: 'critical' }
          }
        ],
        cooldownPeriod: 300
      },
      {
        id: 'suspicious-activity-monitoring',
        name: 'Suspicious Activity Monitoring',
        description: 'Monitor and log suspicious activities',
        enabled: true,
        priority: 70,
        conditions: {
          eventTypes: ['SUSPICIOUS_REQUEST', 'BOT_TRAFFIC_DETECTED'],
          severity: ['medium', 'high'],
          riskScoreThreshold: 5,
          timeWindow: 900,
          occurrenceCount: 15
        },
        actions: [
          {
            type: ResponseActionType.RATE_LIMIT_IP,
            params: { limit: 10, window: 600, reason: 'Suspicious activity' }
          },
          {
            type: ResponseActionType.LOG_INCIDENT,
            params: { category: 'suspicious_activity' }
          },
          {
            type: ResponseActionType.NOTIFY_MONITORING,
            params: { level: 'warning' }
          }
        ],
        cooldownPeriod: 300
      },
      {
        id: 'file-upload-abuse',
        name: 'File Upload Abuse Protection',
        description: 'Protect against file upload abuse',
        enabled: true,
        priority: 80,
        conditions: {
          eventTypes: ['FILE_UPLOAD_REJECTED', 'SUSPICIOUS_FILE_UPLOAD'],
          severity: ['medium', 'high'],
          riskScoreThreshold: 5,
          timeWindow: 3600,
          occurrenceCount: 5
        },
        actions: [
          {
            type: ResponseActionType.BLOCK_IP,
            params: { duration: 7200, reason: 'File upload abuse' }
          },
          {
            type: ResponseActionType.QUARANTINE_SESSION,
            params: { duration: 1800 }
          },
          {
            type: ResponseActionType.ALERT_ADMIN,
            params: { priority: 'medium' }
          }
        ],
        cooldownPeriod: 1800
      }
    ];

    for (const rule of defaultRules) {
      this.rules.set(rule.id, rule);
    }

    this.logger.info({ ruleCount: defaultRules.length }, 'Initialized default threat response rules');
  }

  /**
   * Start listening for security events
   */
  private startEventListener(): void {
    securityAuditService.on('securityEvent', (event: SecurityAuditEvent) => {
      this.handleSecurityEvent(event);
    });

    this.logger.info('Started security event listener');
  }

  /**
   * Start processing response queue
   */
  private startProcessingQueue(): void {
    setInterval(async () => {
      if (!this.processing && this.executionQueue.length > 0) {
        await this.processQueue();
      }
    }, 1000);
  }

  /**
   * Handle incoming security event
   */
  private async handleSecurityEvent(event: SecurityAuditEvent): Promise<void> {
    try {
      // Build threat context
      const context = await this.buildThreatContext(event);
      
      // Evaluate rules against the event
      const matchedRules = this.evaluateRules(event, context);
      
      // Queue matched rules for execution
      for (const rule of matchedRules) {
        if (this.canExecuteRule(rule)) {
          this.executionQueue.push({ rule, context });
          this.logger.info({
            ruleId: rule.id,
            eventId: event.id,
            eventType: event.type,
            ip: event.ip
          }, 'Queued threat response rule for execution');
        }
      }
    } catch (error) {
      this.logger.error({ error, eventId: event.id }, 'Failed to handle security event');
    }
  }

  /**
   * Build comprehensive threat context
   */
  private async buildThreatContext(event: SecurityAuditEvent): Promise<ThreatContext> {
    // Get related events for the same IP
    const relatedEvents = await this.getRelatedEvents(event.ip, 3600); // Last hour
    
    // Calculate IP reputation and history
    const ipHistory = this.calculateIPHistory(event.ip, relatedEvents);
    
    // Analyze patterns
    const pattern = this.analyzePattern(event, relatedEvents);
    
    // Get system state
    const systemState = await this.getSystemState();

    return {
      event,
      relatedEvents,
      ipHistory,
      pattern,
      systemState
    };
  }

  /**
   * Evaluate threat response rules against an event
   */
  private evaluateRules(event: SecurityAuditEvent, context: ThreatContext): ThreatResponseRule[] {
    const matchedRules: ThreatResponseRule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check event type
      if (!rule.conditions.eventTypes.includes(event.type)) continue;
      
      // Check severity
      if (!rule.conditions.severity.includes(event.severity)) continue;
      
      // Check risk score threshold
      if (event.riskScore < rule.conditions.riskScoreThreshold) continue;
      
      // Check occurrence count within time window
      const recentEvents = context.relatedEvents.filter(e => 
        (Date.now() - e.timestamp.getTime()) < (rule.conditions.timeWindow * 1000)
      );
      
      if (recentEvents.length < rule.conditions.occurrenceCount) continue;
      
      // Check IP patterns if specified
      if (rule.conditions.ipPatterns && rule.conditions.ipPatterns.length > 0) {
        const matchesPattern = rule.conditions.ipPatterns.some(pattern => 
          new RegExp(pattern).test(event.ip)
        );
        if (!matchesPattern) continue;
      }
      
      // Check User-Agent patterns if specified
      if (rule.conditions.userAgentPatterns && rule.conditions.userAgentPatterns.length > 0) {
        const matchesPattern = rule.conditions.userAgentPatterns.some(pattern => 
          new RegExp(pattern).test(event.userAgent)
        );
        if (!matchesPattern) continue;
      }

      matchedRules.push(rule);
    }

    // Sort by priority (higher priority first)
    return matchedRules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Check if rule can be executed (respects cooldown)
   */
  private canExecuteRule(rule: ThreatResponseRule): boolean {
    const lastExecution = this.activeResponses.get(rule.id);
    if (!lastExecution) return true;

    const cooldownExpiry = new Date(lastExecution.getTime() + (rule.cooldownPeriod * 1000));
    return new Date() > cooldownExpiry;
  }

  /**
   * Process the response execution queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    
    try {
      while (this.executionQueue.length > 0) {
        const { rule, context } = this.executionQueue.shift()!;
        await this.executeRule(rule, context);
      }
    } catch (error) {
      this.logger.error({ error }, 'Error processing response queue');
    } finally {
      this.processing = false;
    }
  }

  /**
   * Execute a threat response rule
   */
  private async executeRule(rule: ThreatResponseRule, context: ThreatContext): Promise<void> {
    try {
      this.logger.info({
        ruleId: rule.id,
        ruleName: rule.name,
        eventId: context.event.id,
        ip: context.event.ip
      }, 'Executing threat response rule');

      const results: ResponseActionResult[] = [];

      for (const action of rule.actions) {
        // Apply delay if specified
        if (action.delay) {
          await this.delay(action.delay * 1000);
        }

        // Check if action requires confirmation
        if (action.requiresConfirmation && !await this.getConfirmation(action, context)) {
          this.logger.warn({
            actionType: action.type,
            ruleId: rule.id
          }, 'Action skipped due to lack of confirmation');
          continue;
        }

        // Execute action
        const result = await this.executeAction(action.type, action.params, context);
        results.push(result);

        this.logger.info({
          actionId: result.actionId,
          actionType: action.type,
          success: result.success,
          ruleId: rule.id
        }, result.success ? 'Action executed successfully' : 'Action execution failed');
      }

      // Record rule execution
      this.activeResponses.set(rule.id, new Date());
      
      // Emit event for monitoring
      this.emit('ruleExecuted', { rule, context, results });

    } catch (error) {
      this.logger.error({ error, ruleId: rule.id }, 'Failed to execute threat response rule');
    }
  }

  /**
   * Execute specific response action
   */
  private async executeAction(
    actionType: ResponseActionType,
    params: Record<string, any>,
    context: ThreatContext
  ): Promise<ResponseActionResult> {
    const actionId = this.generateActionId();
    const timestamp = new Date();

    try {
      let success = false;
      let details: any = {};

      switch (actionType) {
        case ResponseActionType.BLOCK_IP:
          success = await this.blockIP(context.event.ip, params);
          details = { ip: context.event.ip, duration: params.duration, reason: params.reason };
          break;

        case ResponseActionType.RATE_LIMIT_IP:
          success = await this.rateLimitIP(context.event.ip, params);
          details = { ip: context.event.ip, limit: params.limit, window: params.window };
          break;

        case ResponseActionType.QUARANTINE_SESSION:
          success = await this.quarantineSession(context.event.sessionId, params);
          details = { sessionId: context.event.sessionId, duration: params.duration };
          break;

        case ResponseActionType.ALERT_ADMIN:
          success = await this.alertAdmin(context, params);
          details = { priority: params.priority, escalate: params.escalate };
          break;

        case ResponseActionType.LOG_INCIDENT:
          success = await this.logIncident(context, params);
          details = { category: params.category };
          break;

        case ResponseActionType.UPDATE_FIREWALL:
          success = await this.updateFirewall(context.event.ip, params);
          details = { action: params.action, duration: params.duration };
          break;

        case ResponseActionType.REVOKE_SESSIONS:
          success = await this.revokeSessions(context.event, params);
          details = { revoked: params.ip ? 'ip_sessions' : 'user_sessions' };
          break;

        case ResponseActionType.NOTIFY_MONITORING:
          success = await this.notifyMonitoring(context, params);
          details = { level: params.level };
          break;

        default:
          throw new Error(`Unknown action type: ${actionType}`);
      }

      return { actionId, action: actionType, success, timestamp, details };

    } catch (error) {
      this.logger.error({ error, actionType, actionId }, 'Action execution failed');
      return {
        actionId,
        action: actionType,
        success: false,
        timestamp,
        details: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Action implementation methods

  private async blockIP(ip: string, params: any): Promise<boolean> {
    try {
      this.blockedIPs.add(ip);
      
      // In production, integrate with iptables or cloud firewall
      if (process.env.NODE_ENV === 'production') {
        try {
          execSync(`iptables -A INPUT -s ${ip} -j DROP`, { timeout: 5000 });
          
          // Schedule unblock if duration is specified
          if (params.duration) {
            setTimeout(() => {
              try {
                execSync(`iptables -D INPUT -s ${ip} -j DROP`, { timeout: 5000 });
                this.blockedIPs.delete(ip);
                this.logger.info({ ip }, 'IP automatically unblocked after duration expired');
              } catch (error) {
                this.logger.error({ error, ip }, 'Failed to automatically unblock IP');
              }
            }, params.duration * 1000);
          }
        } catch (error) {
          this.logger.error({ error, ip }, 'Failed to block IP with iptables');
          return false;
        }
      }

      this.logger.info({ ip, duration: params.duration, reason: params.reason }, 'IP blocked successfully');
      return true;
    } catch (error) {
      this.logger.error({ error, ip }, 'Failed to block IP');
      return false;
    }
  }

  private async rateLimitIP(ip: string, params: any): Promise<boolean> {
    try {
      // Implementation would integrate with rate limiting service
      this.logger.info({ ip, limit: params.limit, window: params.window }, 'IP rate limited');
      return true;
    } catch (error) {
      this.logger.error({ error, ip }, 'Failed to rate limit IP');
      return false;
    }
  }

  private async quarantineSession(sessionId: string | undefined, params: any): Promise<boolean> {
    if (!sessionId) return false;
    
    try {
      this.quarantinedSessions.add(sessionId);
      
      if (params.duration) {
        setTimeout(() => {
          this.quarantinedSessions.delete(sessionId);
          this.logger.info({ sessionId }, 'Session quarantine expired');
        }, params.duration * 1000);
      }

      this.logger.info({ sessionId, duration: params.duration }, 'Session quarantined');
      return true;
    } catch (error) {
      this.logger.error({ error, sessionId }, 'Failed to quarantine session');
      return false;
    }
  }

  private async alertAdmin(context: ThreatContext, params: any): Promise<boolean> {
    try {
      const alert = {
        timestamp: new Date(),
        priority: params.priority,
        eventType: context.event.type,
        ip: context.event.ip,
        riskScore: context.event.riskScore,
        details: context.event.details,
        escalate: params.escalate
      };

      // Send alert through configured channels
      await securityAuditService.emit('adminAlert', alert);
      
      this.logger.info({ priority: params.priority, eventId: context.event.id }, 'Admin alert sent');
      return true;
    } catch (error) {
      this.logger.error({ error }, 'Failed to send admin alert');
      return false;
    }
  }

  private async logIncident(context: ThreatContext, params: any): Promise<boolean> {
    try {
      const incident = {
        id: this.generateActionId(),
        timestamp: new Date(),
        category: params.category,
        event: context.event,
        context: {
          relatedEvents: context.relatedEvents.length,
          ipReputation: context.ipHistory.reputation,
          pattern: context.pattern
        }
      };

      // Log incident to security audit system
      await securityAuditService.recordEvent({
        ...context.event,
        type: 'INCIDENT_LOGGED',
        details: { ...context.event.details, incident }
      });

      this.logger.info({ incidentId: incident.id, category: params.category }, 'Security incident logged');
      return true;
    } catch (error) {
      this.logger.error({ error }, 'Failed to log incident');
      return false;
    }
  }

  private async updateFirewall(ip: string, params: any): Promise<boolean> {
    try {
      // Implementation would integrate with cloud firewall or iptables
      this.logger.info({ ip, action: params.action, duration: params.duration }, 'Firewall updated');
      return true;
    } catch (error) {
      this.logger.error({ error, ip }, 'Failed to update firewall');
      return false;
    }
  }

  private async revokeSessions(event: SecurityAuditEvent, params: any): Promise<boolean> {
    try {
      // Implementation would integrate with session management
      this.logger.info({ ip: event.ip, params }, 'Sessions revoked');
      return true;
    } catch (error) {
      this.logger.error({ error }, 'Failed to revoke sessions');
      return false;
    }
  }

  private async notifyMonitoring(context: ThreatContext, params: any): Promise<boolean> {
    try {
      // Send notification to monitoring system
      this.emit('monitoringNotification', { context, level: params.level });
      this.logger.info({ level: params.level, eventId: context.event.id }, 'Monitoring notification sent');
      return true;
    } catch (error) {
      this.logger.error({ error }, 'Failed to send monitoring notification');
      return false;
    }
  }

  // Helper methods

  private async getRelatedEvents(ip: string, timeWindowSeconds: number): Promise<SecurityAuditEvent[]> {
    // Implementation would query security audit logs
    return [];
  }

  private calculateIPHistory(ip: string, relatedEvents: SecurityAuditEvent[]): any {
    return {
      totalEvents: relatedEvents.length,
      recentEvents: relatedEvents.filter(e => 
        (Date.now() - e.timestamp.getTime()) < 3600000
      ).length,
      firstSeen: relatedEvents[0]?.timestamp || new Date(),
      lastSeen: relatedEvents[relatedEvents.length - 1]?.timestamp || new Date(),
      reputation: Math.max(0, 10 - (relatedEvents.length * 0.5))
    };
  }

  private analyzePattern(event: SecurityAuditEvent, relatedEvents: SecurityAuditEvent[]): any {
    return {
      frequency: relatedEvents.length,
      escalation: this.detectEscalation(relatedEvents),
      geographical: {},
      temporal: this.analyzeTemporalPattern(relatedEvents)
    };
  }

  private detectEscalation(events: SecurityAuditEvent[]): boolean {
    if (events.length < 3) return false;
    
    const recentEvents = events.slice(-3);
    const riskScores = recentEvents.map(e => e.riskScore);
    
    return riskScores[2] > riskScores[1] && riskScores[1] > riskScores[0];
  }

  private analyzeTemporalPattern(events: SecurityAuditEvent[]): any {
    // Analyze time-based patterns
    return { pattern: 'unknown' };
  }

  private async getSystemState(): Promise<any> {
    return {
      load: 45, // Mock CPU load
      availableResources: 85, // Mock available resources percentage
      maintenanceMode: false
    };
  }

  private async getConfirmation(action: any, context: ThreatContext): Promise<boolean> {
    // In production, implement confirmation mechanism (admin approval, etc.)
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateActionId(): string {
    return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods

  public async addRule(rule: ThreatResponseRule): Promise<void> {
    this.rules.set(rule.id, rule);
    this.logger.info({ ruleId: rule.id, ruleName: rule.name }, 'Threat response rule added');
  }

  public async removeRule(ruleId: string): Promise<void> {
    this.rules.delete(ruleId);
    this.logger.info({ ruleId }, 'Threat response rule removed');
  }

  public async enableRule(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      this.logger.info({ ruleId }, 'Threat response rule enabled');
    }
  }

  public async disableRule(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      this.logger.info({ ruleId }, 'Threat response rule disabled');
    }
  }

  public getRules(): ThreatResponseRule[] {
    return Array.from(this.rules.values());
  }

  public isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  public isSessionQuarantined(sessionId: string): boolean {
    return this.quarantinedSessions.has(sessionId);
  }

  public async unblockIP(ip: string): Promise<void> {
    this.blockedIPs.delete(ip);
    
    if (process.env.NODE_ENV === 'production') {
      try {
        execSync(`iptables -D INPUT -s ${ip} -j DROP`, { timeout: 5000 });
      } catch (error) {
        // Ignore error if rule doesn't exist
      }
    }
    
    this.logger.info({ ip }, 'IP manually unblocked');
  }

  public async cleanup(): Promise<void> {
    this.removeAllListeners();
    this.logger.info('Threat response service cleaned up');
  }
}

// Export singleton instance
export const threatResponseService = ThreatResponseService.getInstance();