#!/usr/bin/env node

/**
 * Health Check System for Railway Deployment
 * Comprehensive health monitoring and alerting
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class HealthCheckSystem {
  constructor() {
    this.checks = new Map();
    this.app = express();
    this.setupRoutes();
  }

  setupRoutes() {
    // Main health endpoint
    this.app.get('/health', async (req, res) => {
      const health = await this.performAllChecks();
      const status = health.overall === 'healthy' ? 200 : 503;
      res.status(status).json(health);
    });

    // Detailed health endpoint
    this.app.get('/health/detailed', async (req, res) => {
      const health = await this.performDetailedChecks();
      const status = health.overall === 'healthy' ? 200 : 503;
      res.status(status).json(health);
    });

    // Individual service checks
    this.app.get('/health/:service', async (req, res) => {
      const service = req.params.service;
      const check = this.checks.get(service);
      
      if (!check) {
        return res.status(404).json({ error: 'Health check not found' });
      }

      try {
        const result = await check();
        res.json({
          service,
          status: result.healthy ? 'healthy' : 'unhealthy',
          ...result
        });
      } catch (error) {
        res.status(503).json({
          service,
          status: 'error',
          error: error.message
        });
      }
    });

    // Ready probe (for Railway)
    this.app.get('/ready', (req, res) => {
      res.json({ status: 'ready', timestamp: new Date().toISOString() });
    });

    // Live probe (for Railway)
    this.app.get('/live', (req, res) => {
      res.json({ status: 'alive', timestamp: new Date().toISOString() });
    });
  }

  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  async performAllChecks() {
    const timestamp = new Date().toISOString();
    const results = {};
    let overallHealthy = true;

    for (const [name, check] of this.checks) {
      try {
        const result = await check();
        results[name] = {
          status: result.healthy ? 'healthy' : 'unhealthy',
          responseTime: result.responseTime,
          details: result.details
        };
        
        if (!result.healthy) {
          overallHealthy = false;
        }
      } catch (error) {
        results[name] = {
          status: 'error',
          error: error.message
        };
        overallHealthy = false;
      }
    }

    return {
      overall: overallHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      checks: results,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  async performDetailedChecks() {
    const basic = await this.performAllChecks();
    
    // Add system metrics
    const systemMetrics = {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptime: process.uptime()
      },
      memory: {
        ...process.memoryUsage(),
        free: require('os').freemem(),
        total: require('os').totalmem()
      },
      cpu: {
        loadAverage: require('os').loadavg(),
        cpus: require('os').cpus().length
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        railwayService: process.env.RAILWAY_SERVICE_ID ? 'connected' : 'local'
      }
    };

    return {
      ...basic,
      system: systemMetrics
    };
  }
}

// Default health checks for Maria Faz application
const healthSystem = new HealthCheckSystem();

// Database connectivity check
healthSystem.registerCheck('database', async () => {
  const start = Date.now();
  
  try {
    // This would be replaced with actual database connection test
    if (!process.env.DATABASE_URL) {
      throw new Error('Database URL not configured');
    }
    
    // Mock database check - replace with actual DB query
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      healthy: true,
      responseTime: Date.now() - start,
      details: {
        url: process.env.DATABASE_URL?.includes('neon.tech') ? 'Neon (connected)' : 'Database configured',
        connection: 'active'
      }
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - start,
      details: { error: error.message }
    };
  }
});

// External API services check
healthSystem.registerCheck('external-apis', async () => {
  const start = Date.now();
  const apis = [];
  
  // Check Google Gemini API
  if (process.env.GOOGLE_GEMINI_API_KEY) {
    apis.push({
      name: 'Gemini API',
      status: process.env.GOOGLE_GEMINI_API_KEY.length > 10 ? 'configured' : 'invalid'
    });
  }
  
  // Check Mistral API
  if (process.env.MISTRAL_API_KEY) {
    apis.push({
      name: 'Mistral API',
      status: process.env.MISTRAL_API_KEY.length > 10 ? 'configured' : 'invalid'
    });
  }
  
  const allConfigured = apis.every(api => api.status === 'configured');
  
  return {
    healthy: allConfigured && apis.length > 0,
    responseTime: Date.now() - start,
    details: {
      apis,
      totalConfigured: apis.length
    }
  };
});

// File system check
healthSystem.registerCheck('filesystem', async () => {
  const start = Date.now();
  
  try {
    const fs = await import('fs/promises');
    const uploadDir = process.env.UPLOAD_DIR || '/tmp/uploads';
    
    // Check if upload directory exists and is writable
    try {
      await fs.access(uploadDir, fs.constants.W_OK);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    
    // Test write operation
    const testFile = `${uploadDir}/.health-check-${Date.now()}`;
    await fs.writeFile(testFile, 'health-check');
    await fs.unlink(testFile);
    
    return {
      healthy: true,
      responseTime: Date.now() - start,
      details: {
        uploadDir,
        writable: true
      }
    };
  } catch (error) {
    return {
      healthy: false,
      responseTime: Date.now() - start,
      details: { error: error.message }
    };
  }
});

// Memory usage check
healthSystem.registerCheck('memory', async () => {
  const start = Date.now();
  const memory = process.memoryUsage();
  const os = await import('os');
  
  const memoryUsagePercent = (memory.heapUsed / memory.heapTotal) * 100;
  const systemMemoryPercent = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
  
  // Consider unhealthy if memory usage is over 90%
  const healthy = memoryUsagePercent < 90 && systemMemoryPercent < 90;
  
  return {
    healthy,
    responseTime: Date.now() - start,
    details: {
      heap: {
        used: Math.round(memory.heapUsed / 1024 / 1024),
        total: Math.round(memory.heapTotal / 1024 / 1024),
        percentage: Math.round(memoryUsagePercent)
      },
      system: {
        free: Math.round(os.freemem() / 1024 / 1024),
        total: Math.round(os.totalmem() / 1024 / 1024),
        percentage: Math.round(systemMemoryPercent)
      }
    }
  };
});

// Environment configuration check
healthSystem.registerCheck('environment', async () => {
  const start = Date.now();
  
  const requiredVars = [
    'NODE_ENV',
    'DATABASE_URL',
    'GOOGLE_GEMINI_API_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  const healthy = missingVars.length === 0;
  
  return {
    healthy,
    responseTime: Date.now() - start,
    details: {
      required: requiredVars.length,
      configured: requiredVars.length - missingVars.length,
      missing: missingVars,
      environment: process.env.NODE_ENV || 'development'
    }
  };
});

// Application-specific checks
healthSystem.registerCheck('application', async () => {
  const start = Date.now();
  
  const features = {
    ocrService: process.env.ENABLE_STREAMLINED_OCR === 'true',
    nameMatching: process.env.ENABLE_ADVANCED_NAME_MATCHING === 'true',
    demoData: process.env.ENABLE_DEMO_DATA === 'true',
    mcpMode: process.env.MCP_MODE || 'development'
  };
  
  return {
    healthy: true, // Application is healthy if it's responding
    responseTime: Date.now() - start,
    details: {
      features,
      version: process.env.npm_package_version || '1.0.0',
      startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
    }
  };
});

// Export for use in main application
export default healthSystem;

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.HEALTH_PORT || 3001;
  
  healthSystem.app.listen(port, () => {
    console.log(`🏥 Health check server running on port ${port}`);
    console.log('Available endpoints:');
    console.log(`  GET /health - Basic health check`);
    console.log(`  GET /health/detailed - Detailed system information`);
    console.log(`  GET /health/:service - Individual service check`);
    console.log(`  GET /ready - Readiness probe`);
    console.log(`  GET /live - Liveness probe`);
  });
}