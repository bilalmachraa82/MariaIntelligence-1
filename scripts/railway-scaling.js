#!/usr/bin/env node

/**
 * Railway Auto-scaling and Cost Optimization
 * Intelligent resource management for Railway deployments
 */

import dotenv from 'dotenv';

dotenv.config();

class RailwayScaling {
  constructor() {
    this.projectId = process.env.RAILWAY_PROJECT_ID;
    this.serviceId = process.env.RAILWAY_SERVICE_ID;
    this.environmentId = process.env.RAILWAY_ENVIRONMENT_ID;
    
    // Scaling configuration
    this.scalingConfig = {
      minReplicas: 1,
      maxReplicas: 5,
      targetCpuUtilization: 70,
      targetMemoryUtilization: 75,
      scaleUpThreshold: 80,
      scaleDownThreshold: 30,
      scaleUpCooldown: 300000,   // 5 minutes
      scaleDownCooldown: 600000, // 10 minutes
      checkInterval: 60000       // 1 minute
    };
    
    // Cost optimization settings
    this.costConfig = {
      enableSleepMode: true,
      sleepAfterMinutes: 30,
      wakeOnRequest: true,
      offPeakHours: [0, 1, 2, 3, 4, 5, 6], // Hours when traffic is low
      enableResourceOptimization: true
    };
    
    this.lastScaleAction = 0;
    this.currentReplicas = 1;
  }

  async startAutoScaling() {
    console.log('⚡ Starting Railway auto-scaling system...');
    
    if (!this.projectId || !this.serviceId) {
      console.error('❌ Missing Railway configuration. Please deploy first.');
      return;
    }

    // Initialize scaling configuration
    await this.initializeScaling();
    
    // Start monitoring loop
    setInterval(async () => {
      await this.performScalingCheck();
    }, this.scalingConfig.checkInterval);
    
    // Start cost optimization
    if (this.costConfig.enableSleepMode) {
      await this.initializeSleepMode();
    }
    
    console.log('✅ Auto-scaling system started');
  }

  async initializeScaling() {
    console.log('🚀 Initializing scaling configuration...');
    
    try {
      // Get current service configuration
      const serviceInfo = await this.executeRailwayMCP('service_info', {
        projectId: this.projectId,
        serviceId: this.serviceId,
        environmentId: this.environmentId
      });
      
      if (serviceInfo?.service) {
        this.currentReplicas = serviceInfo.service.replicas || 1;
        console.log(`📊 Current replicas: ${this.currentReplicas}`);
        
        // Update service with scaling configuration
        await this.executeRailwayMCP('service_update', {
          projectId: this.projectId,
          serviceId: this.serviceId,
          environmentId: this.environmentId,
          numReplicas: this.currentReplicas
        });
        
        console.log('✅ Scaling configuration initialized');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize scaling:', error.message);
      throw error;
    }
  }

  async performScalingCheck() {
    try {
      const timestamp = new Date().toISOString();
      console.log(`⚡ [${timestamp}] Performing scaling check...`);
      
      // Get current metrics
      const metrics = await this.getServiceMetrics();
      
      if (!metrics) {
        console.log('⚠️ No metrics available, skipping scaling check');
        return;
      }
      
      // Determine if scaling is needed
      const scalingDecision = this.calculateScalingDecision(metrics);
      
      if (scalingDecision.action !== 'none') {
        await this.executeScalingAction(scalingDecision);
      } else {
        console.log('✅ No scaling action needed');
      }
      
      // Check cost optimization opportunities
      await this.checkCostOptimization(metrics);
      
    } catch (error) {
      console.error('❌ Scaling check failed:', error.message);
    }
  }

  async getServiceMetrics() {
    try {
      console.log('📊 Getting service metrics...');
      
      // This would integrate with Railway's metrics API when available
      // For now, simulate metrics based on health checks and load
      const healthCheckResponse = await this.performHealthCheck();
      
      // Simulate resource usage metrics
      const metrics = {
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        responseTime: Math.random() * 2000 + 100,
        requestRate: Math.random() * 100,
        errorRate: Math.random() * 5,
        activeConnections: Math.floor(Math.random() * 200),
        healthy: healthCheckResponse.healthy,
        timestamp: new Date().toISOString()
      };
      
      console.log(`💻 Metrics - CPU: ${metrics.cpu.toFixed(1)}%, Memory: ${metrics.memory.toFixed(1)}%, Response: ${metrics.responseTime.toFixed(0)}ms`);
      
      return metrics;
      
    } catch (error) {
      console.error('❌ Failed to get metrics:', error.message);
      return null;
    }
  }

  calculateScalingDecision(metrics) {
    const now = Date.now();
    const timeSinceLastAction = now - this.lastScaleAction;
    
    // Check if we're in cooldown period
    const inScaleUpCooldown = timeSinceLastAction < this.scalingConfig.scaleUpCooldown;
    const inScaleDownCooldown = timeSinceLastAction < this.scalingConfig.scaleDownCooldown;
    
    // Determine scaling need based on metrics
    const cpuHigh = metrics.cpu > this.scalingConfig.scaleUpThreshold;
    const memoryHigh = metrics.memory > this.scalingConfig.scaleUpThreshold;
    const responseTimeSlow = metrics.responseTime > 1500;
    
    const cpuLow = metrics.cpu < this.scalingConfig.scaleDownThreshold;
    const memoryLow = metrics.memory < this.scalingConfig.scaleDownThreshold;
    const lowLoad = metrics.requestRate < 10;
    
    let decision = {
      action: 'none',
      reason: 'Metrics within normal range',
      targetReplicas: this.currentReplicas,
      confidence: 0
    };
    
    // Scale up conditions
    if ((cpuHigh || memoryHigh || responseTimeSlow) && 
        !inScaleUpCooldown && 
        this.currentReplicas < this.scalingConfig.maxReplicas) {
      
      const urgency = Math.max(
        (metrics.cpu - this.scalingConfig.scaleUpThreshold) / 20,
        (metrics.memory - this.scalingConfig.scaleUpThreshold) / 20,
        (metrics.responseTime - 1500) / 1000
      );
      
      decision = {
        action: 'scale-up',
        reason: `High resource usage - CPU: ${metrics.cpu.toFixed(1)}%, Memory: ${metrics.memory.toFixed(1)}%, Response: ${metrics.responseTime.toFixed(0)}ms`,
        targetReplicas: Math.min(this.currentReplicas + 1, this.scalingConfig.maxReplicas),
        confidence: Math.min(urgency, 1.0),
        metrics
      };
    }
    
    // Scale down conditions
    else if (cpuLow && memoryLow && lowLoad &&
             !inScaleDownCooldown &&
             this.currentReplicas > this.scalingConfig.minReplicas) {
      
      decision = {
        action: 'scale-down',
        reason: `Low resource usage - CPU: ${metrics.cpu.toFixed(1)}%, Memory: ${metrics.memory.toFixed(1)}%, Requests: ${metrics.requestRate.toFixed(1)}/min`,
        targetReplicas: Math.max(this.currentReplicas - 1, this.scalingConfig.minReplicas),
        confidence: 0.8,
        metrics
      };
    }
    
    console.log(`🎯 Scaling decision: ${decision.action} (confidence: ${(decision.confidence * 100).toFixed(0)}%)`);
    console.log(`   Reason: ${decision.reason}`);
    
    return decision;
  }

  async executeScalingAction(decision) {
    try {
      console.log(`⚡ Executing scaling action: ${decision.action}`);
      console.log(`   From ${this.currentReplicas} to ${decision.targetReplicas} replicas`);
      
      // Update service with new replica count
      await this.executeRailwayMCP('service_update', {
        projectId: this.projectId,
        serviceId: this.serviceId,
        environmentId: this.environmentId,
        numReplicas: decision.targetReplicas
      });
      
      // Update internal state
      this.currentReplicas = decision.targetReplicas;
      this.lastScaleAction = Date.now();
      
      // Log scaling event
      await this.logScalingEvent(decision);
      
      console.log(`✅ Scaling completed: ${decision.targetReplicas} replicas`);
      
      // Send notification
      await this.sendScalingNotification(decision);
      
    } catch (error) {
      console.error('❌ Scaling action failed:', error.message);
      throw error;
    }
  }

  async checkCostOptimization(metrics) {
    try {
      const currentHour = new Date().getHours();
      const isOffPeak = this.costConfig.offPeakHours.includes(currentHour);
      
      console.log('💰 Checking cost optimization opportunities...');
      
      // Check for sleep mode eligibility
      if (this.costConfig.enableSleepMode && this.shouldEnableSleepMode(metrics, isOffPeak)) {
        await this.enableSleepMode();
      }
      
      // Resource optimization recommendations
      const recommendations = await this.getResourceOptimizationRecommendations(metrics);
      
      if (recommendations.length > 0) {
        console.log('💡 Cost optimization recommendations:');
        recommendations.forEach(rec => {
          console.log(`   - ${rec.description} (Estimated savings: $${rec.monthlySavings}/month)`);
        });
      }
      
    } catch (error) {
      console.error('❌ Cost optimization check failed:', error.message);
    }
  }

  shouldEnableSleepMode(metrics, isOffPeak) {
    const lowTraffic = metrics.requestRate < 5;
    const lowResourceUsage = metrics.cpu < 20 && metrics.memory < 30;
    const noRecentActivity = metrics.activeConnections < 5;
    
    return isOffPeak && lowTraffic && lowResourceUsage && noRecentActivity;
  }

  async enableSleepMode() {
    console.log('😴 Enabling sleep mode for cost optimization...');
    
    try {
      await this.executeRailwayMCP('service_update', {
        projectId: this.projectId,
        serviceId: this.serviceId,
        environmentId: this.environmentId,
        sleepApplication: true
      });
      
      console.log('✅ Sleep mode enabled');
      
      // Send notification
      await this.sendCostOptimizationNotification('sleep-mode-enabled', {
        reason: 'Low traffic detected during off-peak hours',
        estimatedSavings: '$15-30/month'
      });
      
    } catch (error) {
      console.error('❌ Failed to enable sleep mode:', error.message);
    }
  }

  async getResourceOptimizationRecommendations(metrics) {
    const recommendations = [];
    
    // Analyze resource usage patterns
    if (metrics.cpu < 30 && metrics.memory < 40) {
      recommendations.push({
        type: 'downsize',
        description: 'Consider downsizing to a smaller instance',
        monthlySavings: 25,
        confidence: 'high'
      });
    }
    
    if (metrics.responseTime < 200 && this.currentReplicas > 1) {
      recommendations.push({
        type: 'reduce-replicas',
        description: 'Reduce replica count during low traffic periods',
        monthlySavings: 15,
        confidence: 'medium'
      });
    }
    
    return recommendations;
  }

  async initializeSleepMode() {
    console.log('😴 Initializing sleep mode configuration...');
    
    // Set up sleep mode with wake on request
    await this.executeRailwayMCP('service_update', {
      projectId: this.projectId,
      serviceId: this.serviceId,
      environmentId: this.environmentId,
      sleepApplication: false // Start awake, will sleep based on activity
    });
    
    console.log('✅ Sleep mode configuration initialized');
  }

  async performHealthCheck() {
    try {
      const serviceInfo = await this.executeRailwayMCP('service_info', {
        projectId: this.projectId,
        serviceId: this.serviceId,
        environmentId: this.environmentId
      });
      
      if (serviceInfo?.service?.domains?.length > 0) {
        const healthUrl = `https://${serviceInfo.service.domains[0]}/health`;
        const response = await fetch(healthUrl, { timeout: 5000 });
        
        return {
          healthy: response.ok,
          status: response.status,
          responseTime: Date.now() - Date.now() // This would be actual response time
        };
      }
      
      return { healthy: false, reason: 'No domain available' };
      
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }

  async logScalingEvent(decision) {
    const event = {
      timestamp: new Date().toISOString(),
      action: decision.action,
      fromReplicas: this.currentReplicas,
      toReplicas: decision.targetReplicas,
      reason: decision.reason,
      confidence: decision.confidence,
      metrics: decision.metrics
    };
    
    console.log('📝 Logging scaling event:', JSON.stringify(event, null, 2));
    
    // This would store the event in a database or monitoring system
  }

  async sendScalingNotification(decision) {
    const notification = {
      type: 'scaling-event',
      timestamp: new Date().toISOString(),
      service: {
        projectId: this.projectId,
        serviceId: this.serviceId
      },
      scaling: {
        action: decision.action,
        fromReplicas: this.currentReplicas,
        toReplicas: decision.targetReplicas,
        reason: decision.reason
      }
    };
    
    console.log('📱 Sending scaling notification...');
    
    // This would send notifications to configured channels
  }

  async sendCostOptimizationNotification(type, data) {
    const notification = {
      type: 'cost-optimization',
      subtype: type,
      timestamp: new Date().toISOString(),
      service: {
        projectId: this.projectId,
        serviceId: this.serviceId
      },
      data
    };
    
    console.log('💰 Sending cost optimization notification...');
  }

  async executeRailwayMCP(command, params) {
    // This would be replaced with actual MCP tool calls
    console.log(`🔧 Railway MCP: ${command}`, params);
    
    // Mock responses
    const mockResponses = {
      service_info: {
        service: {
          id: this.serviceId,
          status: 'ACTIVE',
          replicas: this.currentReplicas,
          domains: ['mock-domain.railway.app']
        }
      },
      service_update: {
        success: true,
        service: { id: this.serviceId }
      }
    };
    
    return mockResponses[command] || { success: true };
  }

  // CLI methods
  async getScalingStatus() {
    console.log('📊 Railway Scaling Status');
    console.log('=======================');
    console.log(`Current Replicas: ${this.currentReplicas}`);
    console.log(`Min Replicas: ${this.scalingConfig.minReplicas}`);
    console.log(`Max Replicas: ${this.scalingConfig.maxReplicas}`);
    console.log(`Scale Up Threshold: ${this.scalingConfig.scaleUpThreshold}%`);
    console.log(`Scale Down Threshold: ${this.scalingConfig.scaleDownThreshold}%`);
    console.log(`Sleep Mode: ${this.costConfig.enableSleepMode ? 'Enabled' : 'Disabled'}`);
    
    // Get current metrics
    const metrics = await this.getServiceMetrics();
    if (metrics) {
      console.log('\\nCurrent Metrics:');
      console.log(`CPU Usage: ${metrics.cpu.toFixed(1)}%`);
      console.log(`Memory Usage: ${metrics.memory.toFixed(1)}%`);
      console.log(`Response Time: ${metrics.responseTime.toFixed(0)}ms`);
      console.log(`Request Rate: ${metrics.requestRate.toFixed(1)}/min`);
    }
  }

  async manualScale(replicas) {
    const targetReplicas = Math.max(
      this.scalingConfig.minReplicas,
      Math.min(replicas, this.scalingConfig.maxReplicas)
    );
    
    console.log(`⚡ Manually scaling to ${targetReplicas} replicas...`);
    
    await this.executeRailwayMCP('service_update', {
      projectId: this.projectId,
      serviceId: this.serviceId,
      environmentId: this.environmentId,
      numReplicas: targetReplicas
    });
    
    this.currentReplicas = targetReplicas;
    console.log('✅ Manual scaling completed');
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const scaling = new RailwayScaling();
  const command = process.argv[2];
  const arg = process.argv[3];
  
  try {
    switch (command) {
      case 'start':
        await scaling.startAutoScaling();
        break;
      case 'status':
        await scaling.getScalingStatus();
        break;
      case 'scale':
        if (!arg || isNaN(arg)) {
          console.error('Usage: node railway-scaling.js scale <replicas>');
          process.exit(1);
        }
        await scaling.manualScale(parseInt(arg));
        break;
      case 'check':
        await scaling.performScalingCheck();
        break;
      default:
        console.log('Usage: node railway-scaling.js [start|status|scale <n>|check]');
        console.log('');
        console.log('Commands:');
        console.log('  start         - Start auto-scaling system');
        console.log('  status        - Show current scaling status');
        console.log('  scale <n>     - Manually scale to n replicas');
        console.log('  check         - Perform one-time scaling check');
    }
  } catch (error) {
    console.error('❌ Scaling command failed:', error.message);
    process.exit(1);
  }
}

export default RailwayScaling;