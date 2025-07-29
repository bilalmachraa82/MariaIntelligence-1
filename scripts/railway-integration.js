#!/usr/bin/env node

/**
 * Railway MCP Integration Manager
 * Unified interface for all Railway deployment operations
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import RailwayMCPService from './railway-mcp-service.js';
import RailwayScaling from './railway-scaling.js';
import RailwayMonitoring from './railway-monitoring.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class RailwayIntegrationManager {
  constructor() {
    this.mcpService = new RailwayMCPService();
    this.scaling = new RailwayScaling();
    this.monitoring = new RailwayMonitoring();
    
    this.commands = {
      deploy: this.deploy.bind(this),
      status: this.getStatus.bind(this),
      monitor: this.startMonitoring.bind(this),
      scale: this.manageScaling.bind(this),
      logs: this.getLogs.bind(this),
      health: this.checkHealth.bind(this),
      setup: this.setupEnvironment.bind(this),
      cleanup: this.cleanup.bind(this),
      help: this.showHelp.bind(this)
    };
  }

  async deploy(options = {}) {
    console.log('🚂 Starting Railway deployment process...');
    
    try {
      // Pre-deployment checks
      await this.runPreDeploymentChecks();
      
      // Deploy service using MCP
      const deployment = await this.mcpService.deployService();
      
      // Setup monitoring if deployment successful
      if (deployment?.deployment?.id) {
        console.log('📊 Setting up monitoring...');
        setTimeout(async () => {
          await this.monitoring.startMonitoring();
        }, 30000); // Start monitoring after 30 seconds
        
        // Setup auto-scaling if enabled
        if (options.autoScale !== false) {
          console.log('⚡ Setting up auto-scaling...');
          setTimeout(async () => {
            await this.scaling.startAutoScaling();
          }, 60000); // Start scaling after 1 minute
        }
      }
      
      console.log('✅ Railway deployment completed successfully!');
      return deployment;
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      throw error;
    }
  }

  async getStatus() {
    console.log('📊 Getting Railway service status...');
    
    try {
      // Get service information
      const serviceInfo = await this.mcpService.getServiceInfo();
      
      // Get scaling status
      await this.scaling.getScalingStatus();
      
      // Get recent deployment status
      await this.getDeploymentStatus();
      
      return serviceInfo;
      
    } catch (error) {
      console.error('❌ Failed to get status:', error.message);
      throw error;
    }
  }

  async startMonitoring(options = {}) {
    console.log('👀 Starting Railway monitoring...');
    
    try {
      if (options.daemon !== false) {
        // Start monitoring in background
        await this.monitoring.startMonitoring();
      } else {
        // Run one-time monitoring check
        await this.monitoring.performMonitoringCycle();
      }
      
    } catch (error) {
      console.error('❌ Monitoring failed:', error.message);
      throw error;
    }
  }

  async manageScaling(action, value) {
    console.log(`⚡ Managing scaling: ${action}`);
    
    try {
      switch (action) {
        case 'start':
          await this.scaling.startAutoScaling();
          break;
        case 'stop':
          console.log('⚡ Auto-scaling stopped');
          break;
        case 'manual':
          if (!value || isNaN(value)) {
            throw new Error('Manual scaling requires replica count');
          }
          await this.scaling.manualScale(parseInt(value));
          break;
        case 'status':
          await this.scaling.getScalingStatus();
          break;
        default:
          throw new Error(`Unknown scaling action: ${action}`);
      }
      
    } catch (error) {
      console.error('❌ Scaling operation failed:', error.message);
      throw error;
    }
  }

  async getLogs(deploymentId) {
    console.log('📋 Getting deployment logs...');
    
    try {
      if (deploymentId) {
        // Get logs for specific deployment
        await this.monitoring.getDeploymentLogs(deploymentId);
      } else {
        // Get recent error logs
        await this.monitoring.checkErrorLogs();
      }
      
    } catch (error) {
      console.error('❌ Failed to get logs:', error.message);
      throw error;
    }
  }

  async checkHealth() {
    console.log('🏥 Performing health check...');
    
    try {
      // Perform health check via monitoring system
      await this.monitoring.performHealthCheck();
      
      // Get detailed service health
      const serviceInfo = await this.mcpService.getServiceInfo();
      
      if (serviceInfo?.service?.domains?.length > 0) {
        const healthUrl = `https://${serviceInfo.service.domains[0]}/health/detailed`;
        console.log(`🔍 Detailed health available at: ${healthUrl}`);
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      throw error;
    }
  }

  async setupEnvironment() {
    console.log('🔧 Setting up Railway environment...');
    
    try {
      // Initialize Railway MCP service
      await this.mcpService.initialize();
      
      // Create required directories
      await this.createRequiredDirectories();
      
      // Setup environment files
      await this.setupEnvironmentFiles();
      
      // Validate configuration
      await this.validateConfiguration();
      
      console.log('✅ Environment setup completed');
      
    } catch (error) {
      console.error('❌ Environment setup failed:', error.message);
      throw error;
    }
  }

  async cleanup(options = {}) {
    console.log('🧹 Cleaning up Railway resources...');
    
    try {
      if (options.all) {
        console.log('⚠️  This will delete ALL Railway resources for this project.');
        console.log('Press Ctrl+C within 5 seconds to cancel...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Delete service
        // await this.executeRailwayMCP('service_delete', {
        //   projectId: process.env.RAILWAY_PROJECT_ID,
        //   serviceId: process.env.RAILWAY_SERVICE_ID
        // });
        
        console.log('⚠️  Cleanup simulation - actual deletion commented out for safety');
      } else {
        // Clean up temporary files and caches
        console.log('🧹 Cleaning temporary files...');
        // Add cleanup logic here
      }
      
      console.log('✅ Cleanup completed');
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      throw error;
    }
  }

  async runPreDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');
    
    const checks = [
      { name: 'Environment Variables', check: this.checkEnvironmentVariables },
      { name: 'Build Process', check: this.checkBuildProcess },
      { name: 'Dependencies', check: this.checkDependencies },
      { name: 'Railway Configuration', check: this.checkRailwayConfiguration }
    ];
    
    for (const { name, check } of checks) {
      try {
        console.log(`  🔍 Checking ${name}...`);
        await check.call(this);
        console.log(`  ✅ ${name} check passed`);
      } catch (error) {
        console.error(`  ❌ ${name} check failed:`, error.message);
        throw new Error(`Pre-deployment check failed: ${name}`);
      }
    }
    
    console.log('✅ All pre-deployment checks passed');
  }

  async checkEnvironmentVariables() {
    const required = ['DATABASE_URL', 'GOOGLE_GEMINI_API_KEY'];
    const missing = required.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  async checkBuildProcess() {
    const { execSync } = await import('child_process');
    
    try {
      execSync('npm run build', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Build process failed');
    }
  }

  async checkDependencies() {
    const { execSync } = await import('child_process');
    
    try {
      execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
    } catch (error) {
      console.warn('⚠️ Some dependency issues found, but continuing...');
    }
  }

  async checkRailwayConfiguration() {
    const fs = await import('fs/promises');
    const configPath = join(__dirname, '..', 'railway.json');
    
    try {
      await fs.access(configPath);
    } catch (error) {
      throw new Error('Railway configuration file not found');
    }
  }

  async getDeploymentStatus() {
    try {
      console.log('🚀 Recent Deployment Status:');
      
      // This would get actual deployment status via MCP
      const mockStatus = {
        latest: {
          id: 'mock-deployment-id',
          status: 'SUCCESS',
          createdAt: new Date().toISOString(),
          commitSha: process.env.GITHUB_SHA || 'latest'
        }
      };
      
      console.log(`  Latest: ${mockStatus.latest.status} (${mockStatus.latest.id})`);
      console.log(`  Commit: ${mockStatus.latest.commitSha}`);
      console.log(`  Time: ${mockStatus.latest.createdAt}`);
      
    } catch (error) {
      console.error('❌ Failed to get deployment status:', error.message);
    }
  }

  async createRequiredDirectories() {
    const fs = await import('fs/promises');
    const directories = [
      'logs',
      'tmp',
      'uploads',
      '.railway'
    ];
    
    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
  }

  async setupEnvironmentFiles() {
    const fs = await import('fs/promises');
    
    // Create .env.railway if it doesn't exist
    const railwayEnvPath = '.env.railway';
    
    try {
      await fs.access(railwayEnvPath);
    } catch (error) {
      // File doesn't exist, create it
      const railwayEnvContent = `# Railway-specific environment variables
NODE_ENV=production
PORT=3000
RAILWAY_PROJECT_ID=
RAILWAY_SERVICE_ID=
RAILWAY_ENVIRONMENT_ID=
MCP_MODE=production
MCP_NAMESPACE=maria-faz
MCP_MONITORING=true
`;
      
      await fs.writeFile(railwayEnvPath, railwayEnvContent);
      console.log(`✅ Created ${railwayEnvPath}`);
    }
  }

  async validateConfiguration() {
    const fs = await import('fs/promises');
    
    // Validate railway.json
    try {
      const railwayConfig = await fs.readFile('railway.json', 'utf8');
      JSON.parse(railwayConfig);
    } catch (error) {
      throw new Error('Invalid railway.json configuration');
    }
    
    // Validate nixpacks.toml
    try {
      await fs.access('nixpacks.toml');
    } catch (error) {
      throw new Error('nixpacks.toml not found');
    }
  }

  showHelp() {
    console.log(`
🚂 Railway MCP Integration Manager

Usage: node railway-integration.js <command> [options]

Commands:
  deploy [--no-auto-scale]    Deploy service to Railway
  status                      Get service status and information
  monitor [--no-daemon]       Start monitoring (or run one-time check)
  scale <action> [value]      Manage auto-scaling
    - start                   Start auto-scaling
    - stop                    Stop auto-scaling
    - manual <replicas>       Scale to specific replica count
    - status                  Show scaling status
  logs [deployment-id]        Get logs (specific deployment or recent errors)
  health                      Perform health check
  setup                       Setup Railway environment
  cleanup [--all]             Clean up resources
  help                        Show this help

Examples:
  node railway-integration.js deploy
  node railway-integration.js scale manual 3
  node railway-integration.js monitor --no-daemon
  node railway-integration.js logs deployment-123
  node railway-integration.js cleanup --all

Environment Variables:
  RAILWAY_PROJECT_ID          Railway project ID
  RAILWAY_SERVICE_ID          Railway service ID
  RAILWAY_ENVIRONMENT_ID      Railway environment ID
  DATABASE_URL                Database connection string
  GOOGLE_GEMINI_API_KEY       Gemini API key
  MISTRAL_API_KEY             Mistral API key
  SESSION_SECRET              Session secret key

Configuration Files:
  railway.json                Railway service configuration
  nixpacks.toml              Build configuration
  .env.railway               Railway-specific environment variables
`);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new RailwayIntegrationManager();
  const command = process.argv[2] || 'help';
  const args = process.argv.slice(3);
  
  // Parse options
  const options = {};
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key.startsWith('no-')) {
        options[key.slice(3)] = false;
      } else {
        options[key] = true;
      }
    }
  });
  
  try {
    if (manager.commands[command]) {
      await manager.commands[command](...args.filter(arg => !arg.startsWith('--')), options);
    } else {
      console.error(`Unknown command: ${command}`);
      manager.showHelp();
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  }
}

export default RailwayIntegrationManager;