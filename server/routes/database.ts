import { Router } from 'express';
import { 
  checkDatabaseConnection, 
  connectWithRetry, 
  validateSchema, 
  runMigrations,
  initializeDatabase,
  dbLogger 
} from '../db/index';

const router = Router();

// Database health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthCheck = await checkDatabaseConnection();
    
    const status = healthCheck.healthy ? 'healthy' : 'unhealthy';
    const statusCode = healthCheck.healthy ? 200 : 503;
    
    res.status(statusCode).json({
      status,
      database: {
        healthy: healthCheck.healthy,
        latency: healthCheck.latency,
        ssl: healthCheck.details.ssl,
        version: healthCheck.details.version,
        connected: healthCheck.details.connected,
        error: healthCheck.error
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    dbLogger.error({ error: errorMessage }, 'Database health check failed');
    
    res.status(503).json({
      status: 'unhealthy',
      database: {
        healthy: false,
        connected: false,
        error: errorMessage
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Connection test endpoint
router.post('/test-connection', async (req, res) => {
  try {
    const { retries = 3, delay = 1000 } = req.body;
    
    dbLogger.info({ retries, delay }, 'Testing database connection with custom parameters');
    
    const connected = await connectWithRetry(retries, delay);
    
    if (connected) {
      const healthCheck = await checkDatabaseConnection();
      res.json({
        success: true,
        connected: true,
        details: healthCheck,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        connected: false,
        error: 'Failed to establish connection after retries',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    dbLogger.error({ error: errorMessage }, 'Connection test failed');
    
    res.status(503).json({
      success: false,
      connected: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Schema validation endpoint
router.get('/schema/validate', async (req, res) => {
  try {
    const schemaResult = await validateSchema();
    
    const statusCode = schemaResult.valid ? 200 : 422;
    
    res.status(statusCode).json({
      valid: schemaResult.valid,
      missingTables: schemaResult.missingTables || [],
      error: schemaResult.error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    dbLogger.error({ error: errorMessage }, 'Schema validation failed');
    
    res.status(500).json({
      valid: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Migration status and runner endpoint
router.get('/migrations/status', async (req, res) => {
  try {
    // Get migration status by attempting to run them
    const migrationResult = await runMigrations();
    
    const statusCode = migrationResult.success ? 200 : 500;
    
    res.status(statusCode).json({
      success: migrationResult.success,
      error: migrationResult.error,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    dbLogger.error({ error: errorMessage }, 'Migration status check failed');
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Force run migrations endpoint (POST)
router.post('/migrations/run', async (req, res) => {
  try {
    dbLogger.info('Manually triggered migration run');
    const migrationResult = await runMigrations();
    
    const statusCode = migrationResult.success ? 200 : 500;
    
    res.status(statusCode).json({
      success: migrationResult.success,
      error: migrationResult.error,
      message: migrationResult.success ? 'Migrations completed successfully' : 'Migration failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    dbLogger.error({ error: errorMessage }, 'Manual migration run failed');
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Complete database initialization endpoint
router.post('/initialize', async (req, res) => {
  try {
    dbLogger.info('Manually triggered database initialization');
    const initResult = await initializeDatabase();
    
    const statusCode = initResult.success ? 200 : 500;
    
    res.status(statusCode).json({
      success: initResult.success,
      details: initResult.details,
      message: initResult.success ? 'Database initialized successfully' : 'Database initialization failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    dbLogger.error({ error: errorMessage }, 'Database initialization failed');
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Database status overview endpoint
router.get('/status', async (req, res) => {
  try {
    const [healthCheck, schemaResult] = await Promise.all([
      checkDatabaseConnection(),
      validateSchema()
    ]);
    
    const overallHealthy = healthCheck.healthy && schemaResult.valid;
    const statusCode = overallHealthy ? 200 : 503;
    
    res.status(statusCode).json({
      overall: {
        healthy: overallHealthy,
        status: overallHealthy ? 'operational' : 'degraded'
      },
      connection: {
        healthy: healthCheck.healthy,
        latency: healthCheck.latency,
        ssl: healthCheck.details.ssl,
        version: healthCheck.details.version,
        error: healthCheck.error,
        errorType: healthCheck.errorType,
        suggestion: healthCheck.suggestion
      },
      schema: {
        valid: schemaResult.valid,
        missingTables: schemaResult.missingTables || [],
        error: schemaResult.error
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    dbLogger.error({ error: errorMessage }, 'Database status check failed');
    
    res.status(503).json({
      overall: {
        healthy: false,
        status: 'unavailable'
      },
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

// Database troubleshooting endpoint
router.get('/troubleshoot', async (req, res) => {
  try {
    const diagnostics = {
      environment: {
        hasConnectionString: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV || 'development',
        connectionStringFormat: 'unknown'
      },
      connectionTest: null as any,
      suggestions: [] as string[]
    };

    // Check connection string format
    if (process.env.DATABASE_URL) {
      try {
        const dbUrl = new URL(process.env.DATABASE_URL);
        diagnostics.environment.connectionStringFormat = 'valid';
        diagnostics.environment = {
          ...diagnostics.environment,
          protocol: dbUrl.protocol,
          hostname: dbUrl.hostname,
          database: dbUrl.pathname.slice(1) || 'not specified',
          hasCredentials: !!(dbUrl.username && dbUrl.password),
          sslMode: dbUrl.searchParams.get('sslmode') || 'not specified'
        };
      } catch (urlError) {
        diagnostics.environment.connectionStringFormat = 'invalid';
        diagnostics.suggestions.push('Fix DATABASE_URL format: postgresql://username:password@host:port/database?sslmode=require');
      }
    } else {
      diagnostics.suggestions.push('Set DATABASE_URL environment variable with your PostgreSQL connection string');
    }

    // Test connection
    if (process.env.DATABASE_URL) {
      diagnostics.connectionTest = await checkDatabaseConnection();
      
      if (!diagnostics.connectionTest.healthy) {
        if (diagnostics.connectionTest.errorType === 'AUTH_ERROR') {
          diagnostics.suggestions.push('Verify your database username and password');
          diagnostics.suggestions.push('Check if your Neon database credentials have expired');
        } else if (diagnostics.connectionTest.errorType === 'TIMEOUT_ERROR') {
          diagnostics.suggestions.push('Check your internet connection');
          diagnostics.suggestions.push('Verify that your Neon database is not suspended');
        } else if (diagnostics.connectionTest.errorType === 'SSL_ERROR') {
          diagnostics.suggestions.push('Ensure your connection string includes sslmode=require');
        }
        
        if (diagnostics.connectionTest.suggestion) {
          diagnostics.suggestions.push(diagnostics.connectionTest.suggestion);
        }
      }
    }

    // Additional suggestions based on environment
    if (process.env.NODE_ENV === 'development') {
      diagnostics.suggestions.push('For development: Ensure your .env file is properly configured');
    }

    const statusCode = diagnostics.connectionTest?.healthy ? 200 : 503;
    
    res.status(statusCode).json({
      status: diagnostics.connectionTest?.healthy ? 'healthy' : 'needs_attention',
      diagnostics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    dbLogger.error({ error: errorMessage }, 'Database troubleshooting failed');
    
    res.status(500).json({
      status: 'error',
      error: errorMessage,
      suggestions: ['Check server logs for detailed error information'],
      timestamp: new Date().toISOString()
    });
  }
});

export default router;