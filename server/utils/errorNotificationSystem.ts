import { AppError } from './errors';
import { ErrorContext } from '../middleware/errorHandler';
import { ErrorLogger } from './errorLogger';

export interface NotificationChannel {
  name: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  send: (notification: ErrorNotification) => Promise<boolean>;
}

export interface ErrorNotification {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  messagePortuguese: string;
  error?: AppError;
  context?: ErrorContext;
  metadata: {
    environment: string;
    service: string;
    version: string;
    correlationId?: string;
    errorId?: string;
  };
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  labelPortuguese: string;
  url: string;
  type: 'link' | 'button' | 'api';
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  conditions: {
    errorCodes?: string[];
    statusCodes?: number[];
    frequency?: { count: number; timeWindow: number }; // count in timeWindow (ms)
    patterns?: string[];
    severity?: string[];
  };
  channels: string[];
  throttling?: {
    maxPerHour: number;
    maxPerDay: number;
  };
  template?: {
    title: string;
    message: string;
    titlePortuguese?: string;
    messagePortuguese?: string;
  };
}

export class ErrorNotificationSystem {
  private channels: Map<string, NotificationChannel> = new Map();
  private rules: NotificationRule[] = [];
  private sentNotifications: Map<string, Date[]> = new Map();
  private logger: ErrorLogger;

  constructor() {
    this.logger = new ErrorLogger();
    this.initializeChannels();
    this.initializeRules();
    this.setupCleanup();
  }

  /**
   * Initialize notification channels
   */
  private initializeChannels(): void {
    // Console channel for development
    this.channels.set('console', {
      name: 'Console',
      enabled: process.env.NODE_ENV === 'development',
      priority: 'low',
      send: async (notification: ErrorNotification) => {
        console.error(`🚨 [${notification.severity.toUpperCase()}] ${notification.title}`);
        console.error(`   Message: ${notification.messagePortuguese || notification.message}`);
        console.error(`   Time: ${notification.timestamp.toISOString()}`);
        console.error(`   ID: ${notification.id}`);
        if (notification.error) {
          console.error(`   Error Code: ${notification.error.code}`);
        }
        return true;
      }
    });

    // Email channel (mock implementation)
    this.channels.set('email', {
      name: 'Email',
      enabled: process.env.SMTP_HOST ? true : false,
      priority: 'medium',
      send: async (notification: ErrorNotification) => {
        try {
          // Mock email sending - replace with actual email service
          if (process.env.NODE_ENV === 'development') {
            console.log(`📧 Email notification would be sent to: ${process.env.ADMIN_EMAIL || 'admin@mariafaz.com'}`);
            console.log(`   Subject: [Maria Faz Alert] ${notification.title}`);
            console.log(`   Body: ${notification.messagePortuguese || notification.message}`);
          }
          
          // In production, implement actual email sending:
          // const emailService = new EmailService();
          // await emailService.send({
          //   to: process.env.ADMIN_EMAIL,
          //   subject: `[Maria Faz Alert] ${notification.title}`,
          //   html: this.generateEmailTemplate(notification)
          // });
          
          return true;
        } catch (error) {
          this.logger.logError(error as Error, {
            message: 'Failed to send email notification',
            notificationId: notification.id
          });
          return false;
        }
      }
    });

    // Slack channel (mock implementation)
    this.channels.set('slack', {
      name: 'Slack',
      enabled: process.env.SLACK_WEBHOOK_URL ? true : false,
      priority: 'high',
      send: async (notification: ErrorNotification) => {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log(`💬 Slack notification would be sent:`);
            console.log(`   Channel: #alerts`);
            console.log(`   Message: ${notification.title} - ${notification.messagePortuguese || notification.message}`);
          }
          
          // In production, implement actual Slack webhook:
          // const response = await fetch(process.env.SLACK_WEBHOOK_URL!, {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({
          //     text: `🚨 *${notification.title}*`,
          //     attachments: [{
          //       color: this.getSeverityColor(notification.severity),
          //       fields: [
          //         { title: 'Mensagem', value: notification.messagePortuguese || notification.message, short: false },
          //         { title: 'Ambiente', value: notification.metadata.environment, short: true },
          //         { title: 'Hora', value: notification.timestamp.toISOString(), short: true }
          //       ]
          //     }]
          //   })
          // });
          // return response.ok;
          
          return true;
        } catch (error) {
          this.logger.logError(error as Error, {
            message: 'Failed to send Slack notification',
            notificationId: notification.id
          });
          return false;
        }
      }
    });

    // SMS channel (mock implementation)
    this.channels.set('sms', {
      name: 'SMS',
      enabled: process.env.SMS_API_KEY ? true : false,
      priority: 'critical',
      send: async (notification: ErrorNotification) => {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log(`📱 SMS notification would be sent to: ${process.env.ADMIN_PHONE || '+351XXXXXXXXX'}`);
            console.log(`   Message: [Maria Faz] ${notification.title.substring(0, 100)}`);
          }
          
          // In production, implement actual SMS service:
          // const smsService = new SMSService();
          // await smsService.send({
          //   to: process.env.ADMIN_PHONE,
          //   message: `[Maria Faz] ${notification.title}: ${notification.messagePortuguese || notification.message}`.substring(0, 160)
          // });
          
          return true;
        } catch (error) {
          this.logger.logError(error as Error, {
            message: 'Failed to send SMS notification',
            notificationId: notification.id
          });
          return false;
        }
      }
    });

    // WebHook channel for external monitoring systems
    this.channels.set('webhook', {
      name: 'WebHook',
      enabled: process.env.MONITORING_WEBHOOK_URL ? true : false,
      priority: 'medium',
      send: async (notification: ErrorNotification) => {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔗 Webhook notification would be sent to monitoring system`);
            console.log(`   Payload: ${JSON.stringify({
              id: notification.id,
              severity: notification.severity,
              title: notification.title,
              timestamp: notification.timestamp
            }, null, 2)}`);
          }
          
          // In production, implement actual webhook:
          // const response = await fetch(process.env.MONITORING_WEBHOOK_URL!, {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({
          //     alert: notification.title,
          //     severity: notification.severity,
          //     timestamp: notification.timestamp.toISOString(),
          //     service: 'maria-faz',
          //     environment: notification.metadata.environment,
          //     details: notification.message,
          //     correlation_id: notification.metadata.correlationId
          //   })
          // });
          // return response.ok;
          
          return true;
        } catch (error) {
          this.logger.logError(error as Error, {
            message: 'Failed to send webhook notification',
            notificationId: notification.id
          });
          return false;
        }
      }
    });
  }

  /**
   * Initialize notification rules
   */
  private initializeRules(): void {
    // Critical database errors
    this.rules.push({
      id: 'database-critical',
      name: 'Critical Database Errors',
      enabled: true,
      conditions: {
        errorCodes: ['DATABASE_CONNECTION_FAILED', 'TRANSACTION_FAILED'],
        severity: ['critical', 'error']
      },
      channels: ['console', 'email', 'slack', 'webhook'],
      throttling: {
        maxPerHour: 5,
        maxPerDay: 20
      },
      template: {
        title: 'Critical Database Error Detected',
        titlePortuguese: 'Erro Crítico na Base de Dados Detetado',
        message: 'A critical database error has occurred that requires immediate attention',
        messagePortuguese: 'Ocorreu um erro crítico na base de dados que requer atenção imediata'
      }
    });

    // High frequency errors
    this.rules.push({
      id: 'high-frequency',
      name: 'High Frequency Errors',
      enabled: true,
      conditions: {
        frequency: { count: 10, timeWindow: 300000 } // 10 errors in 5 minutes
      },
      channels: ['console', 'email', 'slack'],
      throttling: {
        maxPerHour: 2,
        maxPerDay: 10
      },
      template: {
        title: 'High Error Frequency Detected',
        titlePortuguese: 'Alta Frequência de Erros Detetada',
        message: 'Multiple errors detected in a short time period',
        messagePortuguese: 'Múltiplos erros detetados num curto período de tempo'
      }
    });

    // Authentication failures
    this.rules.push({
      id: 'auth-failures',
      name: 'Authentication Failures',
      enabled: true,
      conditions: {
        errorCodes: ['UNAUTHORIZED', 'INVALID_TOKEN', 'TOKEN_EXPIRED'],
        frequency: { count: 5, timeWindow: 600000 } // 5 failures in 10 minutes
      },
      channels: ['console', 'email'],
      throttling: {
        maxPerHour: 3,
        maxPerDay: 15
      },
      template: {
        title: 'Multiple Authentication Failures',
        titlePortuguese: 'Múltiplas Falhas de Autenticação',
        message: 'Multiple authentication failures detected - possible security threat',
        messagePortuguese: 'Múltiplas falhas de autenticação detetadas - possível ameaça de segurança'
      }
    });

    // External service failures
    this.rules.push({
      id: 'external-service-down',
      name: 'External Service Down',
      enabled: true,
      conditions: {
        errorCodes: ['EXTERNAL_SERVICE_UNAVAILABLE', 'GEMINI_API_ERROR'],
        frequency: { count: 3, timeWindow: 180000 } // 3 failures in 3 minutes
      },
      channels: ['console', 'slack'],
      throttling: {
        maxPerHour: 1,
        maxPerDay: 5
      },
      template: {
        title: 'External Service Unavailable',
        titlePortuguese: 'Serviço Externo Indisponível',
        message: 'External service is experiencing issues',
        messagePortuguese: 'Serviço externo está com problemas'
      }
    });

    // Critical system errors (for SMS)
    this.rules.push({
      id: 'critical-system',
      name: 'Critical System Errors',
      enabled: true,
      conditions: {
        errorCodes: ['INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE'],
        statusCodes: [500, 503],
        frequency: { count: 1, timeWindow: 60000 } // Immediate notification
      },
      channels: ['console', 'email', 'slack', 'sms', 'webhook'],
      throttling: {
        maxPerHour: 3,
        maxPerDay: 10
      },
      template: {
        title: 'CRITICAL: System Down',
        titlePortuguese: 'CRÍTICO: Sistema Indisponível',
        message: 'Critical system error - immediate attention required',
        messagePortuguese: 'Erro crítico do sistema - atenção imediata necessária'
      }
    });
  }

  /**
   * Process error and send notifications if rules match
   */
  public async processError(error: AppError, context?: ErrorContext): Promise<void> {
    try {
      const matchingRules = this.findMatchingRules(error, context);
      
      for (const rule of matchingRules) {
        if (this.shouldSendNotification(rule, error)) {
          const notification = this.createNotification(error, context, rule);
          await this.sendNotification(notification, rule.channels);
          this.recordSentNotification(rule.id, notification.id);
        }
      }
    } catch (notificationError) {
      this.logger.logError(notificationError as Error, {
        message: 'Failed to process error notification',
        originalError: error.message
      });
    }
  }

  /**
   * Find rules that match the current error
   */
  private findMatchingRules(error: AppError, context?: ErrorContext): NotificationRule[] {
    return this.rules.filter(rule => {
      if (!rule.enabled) return false;

      const conditions = rule.conditions;

      // Check error codes
      if (conditions.errorCodes && !conditions.errorCodes.includes(error.code)) {
        return false;
      }

      // Check status codes
      if (conditions.statusCodes && !conditions.statusCodes.includes(error.statusCode)) {
        return false;
      }

      // Check severity
      if (conditions.severity) {
        const severity = this.getSeverityFromError(error);
        if (!conditions.severity.includes(severity)) {
          return false;
        }
      }

      // Check frequency (if specified)
      if (conditions.frequency) {
        const recent = this.getRecentNotifications(rule.id, conditions.frequency.timeWindow);
        if (recent.length < conditions.frequency.count - 1) {
          return false;
        }
      }

      // Check patterns (if specified)
      if (conditions.patterns) {
        const errorString = `${error.code} ${error.message} ${context?.url || ''}`.toLowerCase();
        if (!conditions.patterns.some(pattern => errorString.includes(pattern.toLowerCase()))) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Check if notification should be sent based on throttling rules
   */
  private shouldSendNotification(rule: NotificationRule, error: AppError): boolean {
    if (!rule.throttling) return true;

    const now = Date.now();
    const hourAgo = now - 3600000; // 1 hour
    const dayAgo = now - 86400000; // 24 hours

    const recentNotifications = this.sentNotifications.get(rule.id) || [];
    
    const lastHour = recentNotifications.filter(date => date.getTime() > hourAgo).length;
    const lastDay = recentNotifications.filter(date => date.getTime() > dayAgo).length;

    if (rule.throttling.maxPerHour && lastHour >= rule.throttling.maxPerHour) {
      return false;
    }

    if (rule.throttling.maxPerDay && lastDay >= rule.throttling.maxPerDay) {
      return false;
    }

    return true;
  }

  /**
   * Create notification object
   */
  private createNotification(
    error: AppError, 
    context: ErrorContext | undefined, 
    rule: NotificationRule
  ): ErrorNotification {
    const severity = this.getSeverityFromError(error);
    
    return {
      id: this.generateNotificationId(),
      timestamp: new Date(),
      severity,
      title: rule.template?.titlePortuguese || rule.template?.title || `Error: ${error.code}`,
      message: rule.template?.message || error.message,
      messagePortuguese: rule.template?.messagePortuguese || error.messagePortuguese || error.message,
      error,
      context,
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        service: 'maria-faz',
        version: process.env.APP_VERSION || '1.0.0',
        correlationId: context?.correlationId,
        errorId: this.generateErrorId()
      },
      actions: this.generateActions(error, context)
    };
  }

  /**
   * Send notification through specified channels
   */
  private async sendNotification(notification: ErrorNotification, channelNames: string[]): Promise<void> {
    const sendPromises = channelNames.map(async (channelName) => {
      const channel = this.channels.get(channelName);
      if (!channel || !channel.enabled) {
        return { channel: channelName, success: false, reason: 'Channel not available' };
      }

      try {
        const success = await channel.send(notification);
        return { channel: channelName, success, reason: success ? 'Sent' : 'Failed to send' };
      } catch (error) {
        return { channel: channelName, success: false, reason: (error as Error).message };
      }
    });

    const results = await Promise.all(sendPromises);
    
    // Log notification results
    this.logger.logInfo('Notification sent', {
      notificationId: notification.id,
      title: notification.title,
      channels: results,
      timestamp: notification.timestamp
    });

    // Log failures
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      this.logger.logWarning('Some notification channels failed', {
        notificationId: notification.id,
        failures
      });
    }
  }

  /**
   * Record sent notification for throttling
   */
  private recordSentNotification(ruleId: string, notificationId: string): void {
    if (!this.sentNotifications.has(ruleId)) {
      this.sentNotifications.set(ruleId, []);
    }
    
    const notifications = this.sentNotifications.get(ruleId)!;
    notifications.push(new Date());
    
    // Keep only last 100 notifications per rule
    if (notifications.length > 100) {
      this.sentNotifications.set(ruleId, notifications.slice(-100));
    }
  }

  /**
   * Get recent notifications for a rule
   */
  private getRecentNotifications(ruleId: string, timeWindow: number): Date[] {
    const notifications = this.sentNotifications.get(ruleId) || [];
    const cutoff = new Date(Date.now() - timeWindow);
    return notifications.filter(date => date > cutoff);
  }

  /**
   * Get severity level from error
   */
  private getSeverityFromError(error: AppError): 'info' | 'warning' | 'error' | 'critical' {
    if (error.statusCode >= 500) return 'critical';
    if (error.statusCode >= 400) return 'error';
    if (error.code.includes('WARNING')) return 'warning';
    return 'info';
  }

  /**
   * Generate actions for notification
   */
  private generateActions(error: AppError, context?: ErrorContext): NotificationAction[] {
    const actions: NotificationAction[] = [
      {
        label: 'View Logs',
        labelPortuguese: 'Ver Logs',
        url: `/admin/logs?error=${error.code}&correlation=${context?.correlationId}`,
        type: 'link'
      },
      {
        label: 'Error Details',
        labelPortuguese: 'Detalhes do Erro',
        url: `/admin/errors/${error.code}`,
        type: 'link'
      }
    ];

    if (error.code === 'DATABASE_CONNECTION_FAILED') {
      actions.push({
        label: 'Database Status',
        labelPortuguese: 'Estado da Base de Dados',
        url: '/admin/database/status',
        type: 'link'
      });
    }

    if (error instanceof ExternalServiceError) {
      actions.push({
        label: 'Service Status',
        labelPortuguese: 'Estado do Serviço',
        url: `/admin/services/${error.serviceName}/status`,
        type: 'link'
      });
    }

    return actions;
  }

  /**
   * Get severity color for Slack
   */
  private getSeverityColor(severity: string): string {
    const colors = {
      info: '#36a64f',      // Green
      warning: '#ff9900',   // Orange
      error: '#ff0000',     // Red
      critical: '#8B0000'   // Dark Red
    };
    return colors[severity as keyof typeof colors] || colors.info;
  }

  /**
   * Generate email template
   */
  private generateEmailTemplate(notification: ErrorNotification): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Maria Faz - Alert Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .severity-critical { border-left: 5px solid #e74c3c; }
          .severity-error { border-left: 5px solid #e67e22; }
          .severity-warning { border-left: 5px solid #f39c12; }
          .severity-info { border-left: 5px solid #3498db; }
          .details { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #7f8c8d; }
          .actions { margin: 20px 0; }
          .button { display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Maria Faz Alert</h1>
            <p>${notification.title}</p>
          </div>
          <div class="content severity-${notification.severity}">
            <div class="details">
              <h3>Detalhes do Erro:</h3>
              <p><strong>Mensagem:</strong> ${notification.messagePortuguese || notification.message}</p>
              <p><strong>Severidade:</strong> ${notification.severity.toUpperCase()}</p>
              <p><strong>Hora:</strong> ${notification.timestamp.toLocaleString('pt-PT')}</p>
              <p><strong>Ambiente:</strong> ${notification.metadata.environment}</p>
              <p><strong>ID de Correlação:</strong> ${notification.metadata.correlationId || 'N/A'}</p>
              ${notification.error ? `<p><strong>Código do Erro:</strong> ${notification.error.code}</p>` : ''}
              ${notification.context?.url ? `<p><strong>URL:</strong> ${notification.context.url}</p>` : ''}
              ${notification.context?.method ? `<p><strong>Método:</strong> ${notification.context.method}</p>` : ''}
            </div>
            ${notification.actions && notification.actions.length > 0 ? `
              <div class="actions">
                <h3>Ações Disponíveis:</h3>
                ${notification.actions.map(action => 
                  `<a href="${action.url}" class="button">${action.labelPortuguese || action.label}</a>`
                ).join('')}
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>Esta é uma notificação automática do sistema Maria Faz.</p>
            <p>Por favor, não responda a este email.</p>
            <p>Para suporte, contacte: suporte@mariafaz.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Setup cleanup for old notifications
   */
  private setupCleanup(): void {
    setInterval(() => {
      const dayAgo = new Date(Date.now() - 86400000); // 24 hours
      
      for (const [ruleId, notifications] of this.sentNotifications.entries()) {
        const recent = notifications.filter(date => date > dayAgo);
        if (recent.length !== notifications.length) {
          this.sentNotifications.set(ruleId, recent);
        }
      }
    }, 3600000); // Clean up every hour
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add custom notification rule
   */
  public addRule(rule: NotificationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove notification rule
   */
  public removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update notification rule
   */
  public updateRule(ruleId: string, updates: Partial<NotificationRule>): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      return true;
    }
    return false;
  }

  /**
   * Get all notification rules
   */
  public getRules(): NotificationRule[] {
    return [...this.rules];
  }

  /**
   * Get notification statistics
   */
  public getStatistics(): any {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000);
    const dayAgo = new Date(now.getTime() - 86400000);

    const stats = {
      channels: {
        total: this.channels.size,
        enabled: Array.from(this.channels.values()).filter(c => c.enabled).length,
        list: Array.from(this.channels.values()).map(c => ({
          name: c.name,
          enabled: c.enabled,
          priority: c.priority
        }))
      },
      rules: {
        total: this.rules.length,
        enabled: this.rules.filter(r => r.enabled).length,
        list: this.rules.map(r => ({
          id: r.id,
          name: r.name,
          enabled: r.enabled,
          channels: r.channels.length
        }))
      },
      notifications: {
        totalSent: Array.from(this.sentNotifications.values()).reduce((sum, dates) => sum + dates.length, 0),
        lastHour: Array.from(this.sentNotifications.values()).reduce((sum, dates) => 
          sum + dates.filter(date => date > hourAgo).length, 0),
        lastDay: Array.from(this.sentNotifications.values()).reduce((sum, dates) => 
          sum + dates.filter(date => date > dayAgo).length, 0)
      }
    };

    return stats;
  }

  /**
   * Test notification system
   */
  public async testNotification(channelName?: string): Promise<any> {
    const testNotification: ErrorNotification = {
      id: this.generateNotificationId(),
      timestamp: new Date(),
      severity: 'info',
      title: 'Test Notification',
      message: 'This is a test notification from Maria Faz error handling system',
      messagePortuguese: 'Esta é uma notificação de teste do sistema de tratamento de erros Maria Faz',
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        service: 'maria-faz-test',
        version: process.env.APP_VERSION || '1.0.0',
        correlationId: this.generateNotificationId()
      },
      actions: [
        {
          label: 'View Dashboard',
          labelPortuguese: 'Ver Dashboard',
          url: '/admin/dashboard',
          type: 'link'
        }
      ]
    };

    const channelsToTest = channelName 
      ? [channelName] 
      : Array.from(this.channels.keys()).filter(name => this.channels.get(name)?.enabled);

    const results = [];
    
    for (const channel of channelsToTest) {
      const channelObj = this.channels.get(channel);
      if (channelObj && channelObj.enabled) {
        try {
          const success = await channelObj.send(testNotification);
          results.push({ channel, success, error: null });
        } catch (error) {
          results.push({ channel, success: false, error: (error as Error).message });
        }
      } else {
        results.push({ channel, success: false, error: 'Channel not enabled or not found' });
      }
    }

    return {
      testId: testNotification.id,
      timestamp: testNotification.timestamp,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    };
  }

  /**
   * Health check for notification system
   */
  public healthCheck(): any {
    return {
      status: 'healthy',
      channels: {
        total: this.channels.size,
        enabled: Array.from(this.channels.values()).filter(c => c.enabled).length,
        healthy: Array.from(this.channels.values()).filter(c => c.enabled).length
      },
      rules: {
        total: this.rules.length,
        enabled: this.rules.filter(r => r.enabled).length
      },
      notifications: {
        tracked: this.sentNotifications.size
      }
    };
  }
}

// Export singleton instance
export const errorNotificationSystem = new ErrorNotificationSystem();