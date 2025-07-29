#!/usr/bin/env node

/**
 * Railway Monitoring and Alerting System
 * Comprehensive monitoring using Railway MCP tools
 */

import dotenv from 'dotenv';

dotenv.config();

class RailwayMonitoring {
  constructor() {
    this.projectId = process.env.RAILWAY_PROJECT_ID;
    this.serviceId = process.env.RAILWAY_SERVICE_ID;
    this.environmentId = process.env.RAILWAY_ENVIRONMENT_ID;
    this.alertThresholds = {
      cpu: 80, // percentage
      memory: 85, // percentage
      responseTime: 2000, // milliseconds
      errorRate: 5 // percentage
    };
    this.monitoringInterval = 60000; // 1 minute
  }

  async startMonitoring() {
    console.log('🔍 Starting Railway monitoring...');
    
    if (!this.projectId || !this.serviceId) {
      console.error('❌ Missing Railway configuration. Please deploy first.');
      return;
    }

    // Initial health check
    await this.performHealthCheck();
    
    // Start continuous monitoring
    setInterval(async () => {
      await this.performMonitoringCycle();
    }, this.monitoringInterval);
    
    console.log('✅ Monitoring started');
  }

  async performMonitoringCycle() {
    try {
      const timestamp = new Date().toISOString();
      console.log(`🔍 [${timestamp}] Running monitoring cycle...`);
      
      // Get service information
      const serviceInfo = await this.getServiceInfo();
      
      // Check deployment status
      await this.checkDeploymentStatus();
      
      // Monitor resource usage
      await this.monitorResources();
      
      // Check application health
      await this.performHealthCheck();
      
      // Check for recent errors
      await this.checkErrorLogs();
      
    } catch (error) {
      console.error('❌ Monitoring cycle failed:', error.message);
      await this.sendAlert('monitoring-error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async getServiceInfo() {
    try {
      console.log('📊 Getting service information...');
      
      // This would use actual Railway MCP call
      const serviceInfo = await this.executeRailwayMCP('service_info', {
        projectId: this.projectId,
        serviceId: this.serviceId,
        environmentId: this.environmentId
      });
      
      if (serviceInfo?.service) {
        console.log(`✅ Service Status: ${serviceInfo.service.status}`);
        
        if (serviceInfo.service.domains?.length > 0) {
          console.log(`🌐 Domain: https://${serviceInfo.service.domains[0]}`);
        }
        
        return serviceInfo.service;
      }
      
    } catch (error) {
      console.error('❌ Failed to get service info:', error.message);
      throw error;
    }
  }

  async checkDeploymentStatus() {
    try {
      console.log('🚀 Checking recent deployments...');
      
      const deployments = await this.executeRailwayMCP('deployment_list', {
        projectId: this.projectId,
        serviceId: this.serviceId,
        environmentId: this.environmentId,
        limit: 5
      });
      
      if (deployments?.deployments?.length > 0) {
        const latest = deployments.deployments[0];
        console.log(`📋 Latest deployment: ${latest.status} (${latest.id})`);
        
        if (latest.status === 'FAILED') {
          await this.sendAlert('deployment-failed', {
            deploymentId: latest.id,
            timestamp: latest.createdAt
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to check deployments:', error.message);
    }
  }

  async monitorResources() {
    console.log('📈 Monitoring resource usage...');
    
    // This would integrate with Railway's metrics API when available
    // For now, we'll simulate resource monitoring
    const resources = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100
    };
    
    console.log(`💻 CPU: ${resources.cpu.toFixed(1)}%`);
    console.log(`🧠 Memory: ${resources.memory.toFixed(1)}%`);
    console.log(`💾 Disk: ${resources.disk.toFixed(1)}%`);
    
    // Check thresholds
    if (resources.cpu > this.alertThresholds.cpu) {
      await this.sendAlert('high-cpu', {
        current: resources.cpu,
        threshold: this.alertThresholds.cpu
      });
    }
    
    if (resources.memory > this.alertThresholds.memory) {
      await this.sendAlert('high-memory', {
        current: resources.memory,
        threshold: this.alertThresholds.memory
      });
    }
  }

  async performHealthCheck() {
    console.log('🏥 Performing health check...');
    
    try {
      const serviceInfo = await this.getServiceInfo();
      
      if (serviceInfo?.domains?.length > 0) {
        const healthUrl = `https://${serviceInfo.domains[0]}/health`;
        const startTime = Date.now();
        
        const response = await fetch(healthUrl, { timeout: 10000 });
        const responseTime = Date.now() - startTime;
        
        console.log(`🏥 Health check: ${response.status} (${responseTime}ms)`);
        
        if (!response.ok) {
          await this.sendAlert('health-check-failed', {
            status: response.status,
            responseTime,
            url: healthUrl
          });
        } else if (responseTime > this.alertThresholds.responseTime) {
          await this.sendAlert('slow-response', {
            responseTime,
            threshold: this.alertThresholds.responseTime,
            url: healthUrl
          });
        } else {
          console.log('✅ Health check passed');
        }
        
        // Parse health check response for detailed monitoring
        try {
          const healthData = await response.json();
          if (healthData.overall !== 'healthy') {
            await this.sendAlert('service-unhealthy', {
              healthData,
              url: healthUrl
            });
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse health check response');
        }
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      await this.sendAlert('health-check-error', {
        error: error.message
      });
    }
  }

  async checkErrorLogs() {
    console.log('📋 Checking for recent errors...');
    
    try {
      // Get recent deployments to check logs
      const deployments = await this.executeRailwayMCP('deployment_list', {
        projectId: this.projectId,
        serviceId: this.serviceId,
        environmentId: this.environmentId,
        limit: 1
      });
      
      if (deployments?.deployments?.length > 0) {
        const latest = deployments.deployments[0];
        
        const logs = await this.executeRailwayMCP('deployment_logs', {
          deploymentId: latest.id,
          limit: 100
        });
        
        if (logs?.logs) {
          const errorLogs = logs.logs.filter(log => 
            log.message.toLowerCase().includes('error') ||
            log.message.toLowerCase().includes('failed') ||
            log.message.toLowerCase().includes('exception')
          );
          
          if (errorLogs.length > 0) {
            console.log(`⚠️ Found ${errorLogs.length} error logs`);
            
            // Check error rate
            const errorRate = (errorLogs.length / logs.logs.length) * 100;
            if (errorRate > this.alertThresholds.errorRate) {
              await this.sendAlert('high-error-rate', {
                errorRate,
                threshold: this.alertThresholds.errorRate,
                errorCount: errorLogs.length,
                totalLogs: logs.logs.length,
                recentErrors: errorLogs.slice(0, 5)
              });
            }
          } else {
            console.log('✅ No recent errors found');
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to check error logs:', error.message);
    }
  }

  async sendAlert(type, data) {
    const timestamp = new Date().toISOString();
    const alert = {
      type,
      timestamp,
      service: {
        projectId: this.projectId,
        serviceId: this.serviceId,
        environmentId: this.environmentId
      },
      data
    };
    
    console.log(`🚨 ALERT [${type}]:`, JSON.stringify(data, null, 2));
    
    // Store alert in monitoring system
    await this.storeAlert(alert);
    
    // Send to external alerting systems
    await this.sendExternalAlert(alert);
  }

  async storeAlert(alert) {
    try {
      // This would store alerts in a database or monitoring system
      console.log('💾 Storing alert for future reference...');
    } catch (error) {
      console.error('❌ Failed to store alert:', error.message);
    }
  }

  async sendExternalAlert(alert) {
    try {
      // This would send alerts to external systems like:
      // - Slack webhooks
      // - Email notifications
      // - PagerDuty
      // - Discord webhooks
      
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackAlert(alert);
      }
      
      if (process.env.DISCORD_WEBHOOK_URL) {
        await this.sendDiscordAlert(alert);
      }
      
    } catch (error) {
      console.error('❌ Failed to send external alert:', error.message);
    }
  }

  async sendSlackAlert(alert) {
    const slackMessage = {
      text: `🚨 Railway Alert: ${alert.type}`,
      attachments: [{
        color: this.getAlertColor(alert.type),
        fields: [
          {
            title: 'Service',
            value: alert.service.serviceId,
            short: true
          },
          {
            title: 'Time',
            value: alert.timestamp,
            short: true
          },
          {
            title: 'Details',
            value: JSON.stringify(alert.data, null, 2),
            short: false
          }
        ]
      }]
    };
    
    // Send to Slack webhook
    console.log('📱 Sending Slack alert...');
  }

  async sendDiscordAlert(alert) {
    const discordMessage = {
      embeds: [{
        title: `🚨 Railway Alert: ${alert.type}`,
        color: this.getAlertColorHex(alert.type),
        timestamp: alert.timestamp,
        fields: [
          {
            name: 'Service ID',
            value: alert.service.serviceId,
            inline: true
          },
          {
            name: 'Project ID',
            value: alert.service.projectId,
            inline: true
          },
          {
            name: 'Details',
            value: `\`\`\`json\n${JSON.stringify(alert.data, null, 2)}\`\`\``,
            inline: false
          }
        ]
      }]
    };
    
    console.log('📱 Sending Discord alert...');
  }

  getAlertColor(type) {
    const colors = {
      'deployment-failed': 'danger',
      'health-check-failed': 'danger',
      'service-unhealthy': 'warning',
      'high-cpu': 'warning',
      'high-memory': 'warning',
      'high-error-rate': 'danger',
      'slow-response': 'warning',
      'monitoring-error': 'danger'
    };
    
    return colors[type] || 'good';
  }

  getAlertColorHex(type) {
    const colors = {
      'deployment-failed': 0xFF0000,
      'health-check-failed': 0xFF0000,
      'service-unhealthy': 0xFFA500,
      'high-cpu': 0xFFA500,
      'high-memory': 0xFFA500,
      'high-error-rate': 0xFF0000,
      'slow-response': 0xFFA500,
      'monitoring-error': 0xFF0000
    };
    
    return colors[type] || 0x00FF00;
  }

  async executeRailwayMCP(command, params) {
    // This would be replaced with actual MCP tool calls
    console.log(`🔧 Railway MCP: ${command}`, params);
    
    // Mock responses for different commands
    const mockResponses = {
      service_info: {
        service: {
          id: this.serviceId,
          status: 'ACTIVE',
          domains: ['mock-domain.railway.app']
        }
      },
      deployment_list: {
        deployments: [{
          id: 'mock-deployment-id',
          status: 'SUCCESS',
          createdAt: new Date().toISOString()
        }]
      },
      deployment_logs: {
        logs: [
          { timestamp: new Date().toISOString(), message: 'Application started' },
          { timestamp: new Date().toISOString(), message: 'Health check passed' }
        ]
      }
    };
    
    return mockResponses[command] || { success: true };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitoring = new RailwayMonitoring();
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'start':
        await monitoring.startMonitoring();
        break;
      case 'health':
        await monitoring.performHealthCheck();
        break;
      case 'resources':
        await monitoring.monitorResources();
        break;
      case 'logs':
        await monitoring.checkErrorLogs();
        break;
      default:
        console.log('Usage: node railway-monitoring.js [start|health|resources|logs]');
        console.log('');
        console.log('Commands:');
        console.log('  start     - Start continuous monitoring');
        console.log('  health    - Perform one-time health check');
        console.log('  resources - Check resource usage');
        console.log('  logs      - Check for recent errors');
    }
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
    process.exit(1);
  }
}

export default RailwayMonitoring;