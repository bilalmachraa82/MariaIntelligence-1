# Railway MCP Integration Documentation

## Overview

This comprehensive Railway MCP integration provides automated deployment, monitoring, scaling, and cost optimization for the Maria Faz application on Railway. The integration uses Model Context Protocol (MCP) tools to manage all aspects of the Railway deployment lifecycle.

## Features

### 🚀 Deployment Automation
- **One-click deployment** using Railway MCP tools
- **Environment-specific configurations** (staging, production)
- **Automated health checks** and rollback capabilities
- **CI/CD integration** with GitHub Actions
- **Pre-deployment validation** and safety checks

### 📊 Monitoring & Alerting
- **Real-time application monitoring**
- **Resource usage tracking** (CPU, memory, disk)
- **Custom health check endpoints**
- **Alert integration** (Slack, Discord, email)
- **Error log analysis** and reporting

### ⚡ Auto-scaling
- **Intelligent resource scaling** based on metrics
- **Cost-optimized scaling policies**
- **Peak/off-peak hour management**
- **Sleep mode** for cost savings
- **Manual scaling override** capabilities

### 💰 Cost Optimization
- **Automated sleep mode** during low activity
- **Resource usage analysis** and recommendations
- **Cost monitoring** and alerting
- **Optimal replica management**

## Installation & Setup

### Prerequisites

1. **Claude CLI** installed and configured
2. **Railway account** with API access
3. **Node.js 20+** environment
4. **Git repository** connected to Railway

### Step 1: Install Railway MCP Tools

```bash
# Install Claude CLI if not already installed
curl -fsSL https://claude.ai/install.sh | sh

# Add Railway MCP server
claude mcp add railway npx @jason-tan-swe/railway-mcp@latest
```

### Step 2: Environment Setup

```bash
# Setup Railway environment
npm run railway:setup

# Configure environment variables
cp .env.example .env.railway
# Edit .env.railway with your Railway configuration
```

### Step 3: Initial Configuration

```bash
# Initialize Railway project (if needed)
npm run railway:deploy

# Verify deployment
npm run railway:status
npm run railway:health
```

## Configuration Files

### railway.json
Main Railway service configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  },
  "environments": {
    "production": {
      "variables": {
        "NODE_ENV": "production",
        "PORT": "${{RAILWAY_PORT}}",
        "DATABASE_URL": "${{DATABASE_URL}}"
      }
    }
  }
}
```

### nixpacks.toml
Build configuration for Railway:

```toml
[variables]
NIXPACKS_METADATA = "railway"

[phases.setup]  
nixPkgs = ["nodejs_20", "npm-9_x", "python3", "pkg-config", "cairo"]

[phases.install]
dependsOn = ["setup"]
cmds = ["npm ci --omit=dev --ignore-scripts"]

[start]
cmd = "npm start"
```

## Available Commands

### Deployment Commands

```bash
# Full deployment with health checks
npm run railway:deploy

# Alternative deployment script
npm run deploy

# Setup environment
npm run railway:setup
```

### Monitoring Commands

```bash
# Get service status
npm run railway:status

# Start continuous monitoring
npm run railway:monitor
npm run start-monitoring

# Perform health check
npm run railway:health
npm run health-check
```

### Scaling Commands

```bash
# Start auto-scaling
npm run railway:scale start
npm run start-scaling

# Manual scaling
npm run railway:scale manual 3

# Check scaling status
npm run railway:scale status
```

### Utility Commands

```bash
# View logs
npm run railway:logs

# Cleanup resources
npm run railway:cleanup

# Help and documentation
npm run railway:help
```

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://...

# AI Services
GOOGLE_GEMINI_API_KEY=your_gemini_key
MISTRAL_API_KEY=your_mistral_key

# Security
SESSION_SECRET=your_session_secret
```

### Railway-Specific Variables

```bash
# Railway Configuration
RAILWAY_PROJECT_ID=your_project_id
RAILWAY_SERVICE_ID=your_service_id
RAILWAY_ENVIRONMENT_ID=your_environment_id

# MCP Configuration
MCP_MODE=production
MCP_NAMESPACE=maria-faz
MCP_MONITORING=true
```

### Optional Variables

```bash
# Feature Flags
ENABLE_DEMO_DATA=false
ENABLE_STREAMLINED_OCR=true
ENABLE_ADVANCED_NAME_MATCHING=true

# Upload Configuration
UPLOAD_MAX_SIZE=10485760
UPLOAD_DIR=/tmp/uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## Health Check Endpoints

The integration provides comprehensive health check endpoints:

### Basic Health Check
```
GET /health
```
Returns basic service health status.

### Detailed Health Check
```
GET /health/detailed
```
Returns comprehensive system information including:
- Service status
- Database connectivity
- External API status
- Memory usage
- File system status
- Environment configuration

### Individual Service Checks
```
GET /health/database
GET /health/external-apis
GET /health/filesystem
GET /health/memory
GET /health/environment
GET /health/application
```

### Railway Probes
```
GET /ready   # Readiness probe
GET /live    # Liveness probe
```

## Monitoring & Alerting

### Available Metrics

- **CPU Usage**: Real-time CPU utilization
- **Memory Usage**: Heap and system memory
- **Response Time**: API endpoint performance
- **Request Rate**: Incoming request frequency
- **Error Rate**: Application error percentage
- **Active Connections**: Concurrent user connections

### Alert Types

- **deployment-failed**: Deployment failures
- **health-check-failed**: Health endpoint failures
- **service-unhealthy**: Application health issues
- **high-cpu**: CPU usage above threshold
- **high-memory**: Memory usage above threshold
- **high-error-rate**: Error rate above threshold
- **slow-response**: Response time above threshold

### Configuration

```javascript
// Monitoring thresholds
const alertThresholds = {
  cpu: 80,           // percentage
  memory: 85,        // percentage
  responseTime: 2000, // milliseconds
  errorRate: 5       // percentage
};
```

## Auto-scaling Configuration

### Scaling Policies

```javascript
const scalingConfig = {
  minReplicas: 1,
  maxReplicas: 5,
  targetCpuUtilization: 70,
  targetMemoryUtilization: 75,
  scaleUpThreshold: 80,
  scaleDownThreshold: 30,
  scaleUpCooldown: 300000,   // 5 minutes
  scaleDownCooldown: 600000, // 10 minutes
};
```

### Cost Optimization

```javascript
const costConfig = {
  enableSleepMode: true,
  sleepAfterMinutes: 30,
  wakeOnRequest: true,
  offPeakHours: [0, 1, 2, 3, 4, 5, 6],
  enableResourceOptimization: true
};
```

## CI/CD Integration

### GitHub Actions Workflow

The integration includes a comprehensive GitHub Actions workflow (`scripts/railway-ci-cd.yml`) that provides:

- **Automated testing** before deployment
- **Multi-environment support** (staging, production)
- **Health checks** after deployment
- **Rollback capabilities** on failure
- **Notification integration**

### Workflow Triggers

- **Push to main**: Production deployment
- **Push to develop**: Staging deployment
- **Pull requests**: Testing only

### Required Secrets

```bash
# Railway Configuration
RAILWAY_API_TOKEN
RAILWAY_PROJECT_ID
RAILWAY_SERVICE_ID
RAILWAY_ENVIRONMENT_ID

# Staging Environment
RAILWAY_STAGING_PROJECT_ID
RAILWAY_STAGING_SERVICE_ID
RAILWAY_STAGING_ENV_ID
STAGING_DATABASE_URL
STAGING_SESSION_SECRET

# Application Secrets
DATABASE_URL
GOOGLE_GEMINI_API_KEY
MISTRAL_API_KEY
SESSION_SECRET

# Optional
CUSTOM_DOMAIN
SLACK_WEBHOOK_URL
DISCORD_WEBHOOK_URL
```

## API Reference

### Railway MCP Service

```javascript
import RailwayMCPService from './scripts/railway-mcp-service.js';

const service = new RailwayMCPService();

// Deploy service
await service.deployService();

// Get service information
const info = await service.getServiceInfo();

// Initialize environment
await service.initialize();
```

### Monitoring System

```javascript
import RailwayMonitoring from './scripts/railway-monitoring.js';

const monitoring = new RailwayMonitoring();

// Start monitoring
await monitoring.startMonitoring();

// Perform health check
await monitoring.performHealthCheck();

// Check resource usage
await monitoring.monitorResources();
```

### Auto-scaling

```javascript
import RailwayScaling from './scripts/railway-scaling.js';

const scaling = new RailwayScaling();

// Start auto-scaling
await scaling.startAutoScaling();

// Manual scaling
await scaling.manualScale(3);

// Get scaling status
await scaling.getScalingStatus();
```

## Troubleshooting

### Common Issues

#### Deployment Failures

```bash
# Check deployment logs
npm run railway:logs <deployment-id>

# Verify configuration
npm run railway:status

# Run health check
npm run railway:health
```

#### Health Check Failures

```bash
# Check application logs
npm run railway:logs

# Verify environment variables
npm run railway:status

# Test endpoints manually
curl https://your-domain.railway.app/health
```

#### Scaling Issues

```bash
# Check scaling status
npm run railway:scale status

# View resource metrics
npm run railway:monitor --no-daemon

# Manual scaling override
npm run railway:scale manual 2
```

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=railway:*
LOG_LEVEL=debug
```

### Support

For issues with the Railway MCP integration:

1. Check the [Railway documentation](https://docs.railway.app/)
2. Review the [MCP documentation](https://modelcontextprotocol.io/docs)
3. Examine application logs via `npm run railway:logs`
4. Test health endpoints manually
5. Verify environment variables and configuration

## Best Practices

### Security

- **Never commit** API keys or secrets to version control
- **Use environment variables** for all sensitive configuration
- **Enable rate limiting** to prevent abuse
- **Monitor access logs** regularly
- **Use HTTPS** for all external communications

### Performance

- **Enable auto-scaling** for variable workloads
- **Use sleep mode** during low-activity periods
- **Monitor resource usage** regularly
- **Optimize build processes** for faster deployments
- **Cache static assets** appropriately

### Cost Optimization

- **Review scaling policies** monthly
- **Monitor resource usage** trends
- **Use sleep mode** effectively
- **Right-size instances** based on actual usage
- **Clean up unused resources** regularly

### Monitoring

- **Set appropriate alert thresholds**
- **Monitor key business metrics**
- **Review error logs** regularly
- **Test health endpoints** frequently
- **Maintain monitoring dashboards**

## Updates and Maintenance

### Updating the Integration

```bash
# Update Railway MCP tools
claude mcp update railway

# Update integration scripts
git pull origin main
npm install

# Redeploy with updates
npm run railway:deploy
```

### Regular Maintenance

- **Review scaling policies** monthly
- **Update alert thresholds** based on trends
- **Clean up old deployments** and logs
- **Update dependencies** regularly
- **Review cost reports** monthly

## Contributing

When contributing to the Railway MCP integration:

1. **Follow the existing code style**
2. **Add tests** for new functionality
3. **Update documentation** for changes
4. **Test thoroughly** in staging environment
5. **Follow Railway best practices**

---

This Railway MCP integration provides a comprehensive, production-ready deployment solution for the Maria Faz application with advanced monitoring, scaling, and cost optimization features.