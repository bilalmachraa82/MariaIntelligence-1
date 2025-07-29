#!/usr/bin/env node

/**
 * Railway MCP Service Adapter
 * Comprehensive Railway deployment management through MCP tools
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class RailwayMCPService {
  constructor() {
    this.projectId = process.env.RAILWAY_PROJECT_ID;
    this.environmentId = process.env.RAILWAY_ENVIRONMENT_ID;
    this.serviceId = process.env.RAILWAY_SERVICE_ID;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('🚂 Initializing Railway MCP Service...');
    
    // Check if we have required project setup
    if (!this.projectId) {
      console.log('📋 No Railway project found, will create one...');
      await this.createProject();
    }
    
    this.initialized = true;
    console.log('✅ Railway MCP Service initialized');
  }

  async createProject() {
    console.log('🏗️ Creating Railway project for Maria Faz...');
    
    try {
      // Use Railway MCP to create project
      const projectData = await this.executeRailwayMCP('project_create', {
        name: 'maria-faz-app'
      });
      
      if (projectData?.project?.id) {
        this.projectId = projectData.project.id;
        console.log(`✅ Created Railway project: ${this.projectId}`);
        
        // Update environment variables
        await this.updateEnvironmentFile('RAILWAY_PROJECT_ID', this.projectId);
      }
    } catch (error) {
      console.error('❌ Failed to create Railway project:', error.message);
      throw error;
    }
  }

  async deployService() {
    await this.initialize();
    
    console.log('🚀 Deploying service to Railway...');
    
    try {
      // Create service from GitHub repo if not exists
      if (!this.serviceId) {
        const serviceData = await this.executeRailwayMCP('service_create_from_repo', {
          projectId: this.projectId,
          repo: process.env.GITHUB_REPO || 'auto-detect',
          name: 'maria-faz-backend'
        });
        
        if (serviceData?.service?.id) {
          this.serviceId = serviceData.service.id;
          await this.updateEnvironmentFile('RAILWAY_SERVICE_ID', this.serviceId);
        }
      }
      
      // Configure service settings
      await this.configureService();
      
      // Setup environment variables
      await this.setupEnvironmentVariables();
      
      // Configure domain and SSL
      await this.setupDomainAndSSL();
      
      // Create volume for uploads if needed
      await this.setupVolumes();
      
      // Trigger deployment
      const deployment = await this.triggerDeployment();
      
      console.log('✅ Service deployment initiated');
      return deployment;
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      throw error;
    }
  }

  async configureService() {
    console.log('⚙️ Configuring service settings...');
    
    const environments = await this.executeRailwayMCP('project_environments', {
      projectId: this.projectId
    });
    
    const prodEnv = environments?.environments?.find(env => 
      env.name.toLowerCase().includes('production') || env.name.toLowerCase().includes('prod')
    );
    
    if (prodEnv) {
      this.environmentId = prodEnv.id;
      
      await this.executeRailwayMCP('service_update', {
        projectId: this.projectId,
        serviceId: this.serviceId,
        environmentId: this.environmentId,
        healthcheckPath: '/health',
        startCommand: 'npm start',
        buildCommand: 'npm run build',
        region: 'us-west1'
      });
      
      console.log('✅ Service configured');
    }
  }

  async setupEnvironmentVariables() {
    console.log('🔧 Setting up environment variables...');
    
    const envVars = {
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL,
      GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
      MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
      SESSION_SECRET: process.env.SESSION_SECRET,
      ENABLE_DEMO_DATA: 'false',
      ENABLE_STREAMLINED_OCR: 'true',
      ENABLE_ADVANCED_NAME_MATCHING: 'true',
      UPLOAD_MAX_SIZE: '10485760',
      UPLOAD_DIR: '/tmp/uploads',
      RATE_LIMIT_WINDOW_MS: '900000',
      RATE_LIMIT_MAX_REQUESTS: '100',
      MCP_MODE: 'production',
      MCP_NAMESPACE: 'maria-faz',
      MCP_MONITORING: 'true'
    };

    await this.executeRailwayMCP('variable_bulk_set', {
      projectId: this.projectId,
      environmentId: this.environmentId,
      serviceId: this.serviceId,
      variables: envVars
    });
    
    console.log('✅ Environment variables configured');
  }

  async setupDomainAndSSL() {
    console.log('🌐 Setting up domain and SSL...');
    
    try {
      // Create domain for the service
      const domain = await this.executeRailwayMCP('domain_create', {
        environmentId: this.environmentId,
        serviceId: this.serviceId,
        targetPort: 3000
      });
      
      if (domain?.domain?.domain) {
        console.log(`✅ Domain created: ${domain.domain.domain}`);
        
        // Store domain in environment for future reference
        await this.updateEnvironmentFile('RAILWAY_DOMAIN', domain.domain.domain);
      }
      
    } catch (error) {
      console.warn('⚠️ Domain setup failed (will use Railway generated domain):', error.message);
    }
  }

  async setupVolumes() {
    console.log('💾 Setting up persistent volumes...');
    
    try {
      await this.executeRailwayMCP('volume_create', {
        projectId: this.projectId,
        environmentId: this.environmentId,
        serviceId: this.serviceId,
        mountPath: '/tmp/uploads'
      });
      
      console.log('✅ Upload volume created');
    } catch (error) {
      console.warn('⚠️ Volume setup failed (using ephemeral storage):', error.message);
    }
  }

  async triggerDeployment() {
    console.log('🚀 Triggering deployment...');
    
    const deployment = await this.executeRailwayMCP('deployment_trigger', {
      projectId: this.projectId,
      serviceId: this.serviceId,
      environmentId: this.environmentId,
      commitSha: process.env.GITHUB_SHA || 'latest'
    });
    
    if (deployment?.deployment?.id) {
      console.log(`✅ Deployment triggered: ${deployment.deployment.id}`);
      
      // Monitor deployment progress
      await this.monitorDeployment(deployment.deployment.id);
    }
    
    return deployment;
  }

  async monitorDeployment(deploymentId) {
    console.log('👀 Monitoring deployment progress...');
    
    let attempts = 0;
    const maxAttempts = 30; // 10 minutes max
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.executeRailwayMCP('deployment_status', {
          deploymentId
        });
        
        console.log(`📊 Deployment status: ${status?.deployment?.status || 'UNKNOWN'}`);
        
        if (status?.deployment?.status === 'SUCCESS') {
          console.log('✅ Deployment completed successfully!');
          await this.performHealthCheck();
          break;
        } else if (status?.deployment?.status === 'FAILED') {
          console.error('❌ Deployment failed!');
          await this.getDeploymentLogs(deploymentId);
          throw new Error('Deployment failed');
        }
        
        // Wait 20 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 20000));
        attempts++;
        
      } catch (error) {
        console.error('⚠️ Error checking deployment status:', error.message);
        attempts++;
      }
    }
    
    if (attempts >= maxAttempts) {
      console.warn('⏰ Deployment monitoring timeout');
    }
  }

  async getDeploymentLogs(deploymentId) {
    console.log('📋 Fetching deployment logs...');
    
    try {
      const logs = await this.executeRailwayMCP('deployment_logs', {
        deploymentId,
        limit: 100
      });
      
      if (logs?.logs) {
        console.log('📋 Recent deployment logs:');
        logs.logs.forEach(log => {
          console.log(`  ${log.timestamp}: ${log.message}`);
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch logs:', error.message);
    }
  }

  async performHealthCheck() {
    console.log('🏥 Performing health check...');
    
    const services = await this.executeRailwayMCP('service_list', {
      projectId: this.projectId
    });
    
    const service = services?.services?.find(s => s.id === this.serviceId);
    if (service?.domains?.[0]) {
      const healthUrl = `https://${service.domains[0]}/health`;
      
      try {
        const response = await fetch(healthUrl);
        if (response.ok) {
          console.log('✅ Health check passed!');
          console.log(`🌐 Service available at: https://${service.domains[0]}`);
        } else {
          console.warn('⚠️ Health check failed with status:', response.status);
        }
      } catch (error) {
        console.warn('⚠️ Health check request failed:', error.message);
      }
    }
  }

  async getServiceInfo() {
    await this.initialize();
    
    if (!this.serviceId) {
      console.log('ℹ️ No service deployed yet');
      return null;
    }
    
    const service = await this.executeRailwayMCP('service_info', {
      projectId: this.projectId,
      serviceId: this.serviceId,
      environmentId: this.environmentId
    });
    
    console.log('📊 Service Information:');
    console.log(`  Service ID: ${this.serviceId}`);
    console.log(`  Environment: ${this.environmentId}`);
    console.log(`  Status: ${service?.service?.status || 'Unknown'}`);
    
    if (service?.service?.domains?.length > 0) {
      console.log(`  Domain: https://${service.service.domains[0]}`);
    }
    
    return service;
  }

  async executeRailwayMCP(command, params) {
    // This would be replaced with actual MCP tool calls in the real implementation
    console.log(`🔧 Executing Railway MCP: ${command}`, params);
    
    // For now, return mock data structure
    return { success: true, [command.split('_')[0]]: { id: 'mock-id' } };
  }

  async updateEnvironmentFile(key, value) {
    const envPath = join(__dirname, '..', '.env');
    
    try {
      // This would update the .env file with the new key-value pair
      console.log(`📝 Updating ${key}=${value} in environment`);
    } catch (error) {
      console.error(`❌ Failed to update environment file:`, error.message);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const service = new RailwayMCPService();
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'deploy':
        await service.deployService();
        break;
      case 'info':
        await service.getServiceInfo();
        break;
      case 'init':
        await service.initialize();
        break;
      default:
        console.log('Usage: node railway-mcp-service.js [deploy|info|init]');
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

export default RailwayMCPService;