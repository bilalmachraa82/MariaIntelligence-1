/**
 * PostgreSQL Database Configuration for MariaIntelligence
 * Optimized for Hostinger VPS Production Environment
 * 
 * @author Database-Agent
 * @version 1.0.0
 * @date 2025-08-27
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Environment configuration with secure defaults
const config = {
  // Database connection settings
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'mariaintelligence',
  user: process.env.DB_USER || 'mariaintelligence_user',
  password: process.env.DB_PASSWORD || '',
  
  // SSL Configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
    ca: process.env.DB_SSL_CA ? fs.readFileSync(process.env.DB_SSL_CA) : undefined,
    cert: process.env.DB_SSL_CERT ? fs.readFileSync(process.env.DB_SSL_CERT) : undefined,
    key: process.env.DB_SSL_KEY ? fs.readFileSync(process.env.DB_SSL_KEY) : undefined
  } : false,
  
  // Connection pool settings optimized for Hostinger VPS
  max: parseInt(process.env.DB_POOL_MAX) || 20,           // Maximum connections
  min: parseInt(process.env.DB_POOL_MIN) || 2,            // Minimum connections
  idle: parseInt(process.env.DB_POOL_IDLE) || 10000,      // 10 seconds idle timeout
  acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 60000, // 60 seconds acquire timeout
  evict: parseInt(process.env.DB_POOL_EVICT) || 1000,     // 1 second evict timeout
  
  // Query timeout settings
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
  
  // Application context for RLS policies
  application_name: 'mariaintelligence-api',
  
  // Additional PostgreSQL specific settings
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000,
  lock_timeout: parseInt(process.env.DB_LOCK_TIMEOUT) || 5000,
  idle_in_transaction_session_timeout: parseInt(process.env.DB_IDLE_TRANSACTION_TIMEOUT) || 60000
};

// Connection pools for different use cases
let mainPool = null;
let readOnlyPool = null;
let analyticsPool = null;

/**
 * Initialize the main database connection pool
 */
function initializeMainPool() {
  if (mainPool) {
    return mainPool;
  }
  
  mainPool = new Pool({
    ...config,
    // Main pool optimized for CRUD operations
    max: config.max,
    min: config.min,
    statement_timeout: config.statement_timeout,
    query_timeout: config.query_timeout
  });
  
  // Connection event handlers
  mainPool.on('connect', (client) => {
    console.log('✅ New database connection established');
    
    // Set application context for RLS
    client.query(`SET app.current_user_id = ''`);
    client.query(`SET application_name = '${config.application_name}'`);
  });
  
  mainPool.on('error', (err) => {
    console.error('❌ Unexpected database pool error:', err);
    process.exit(1);
  });
  
  mainPool.on('acquire', () => {
    console.log('🔄 Connection acquired from pool');
  });
  
  mainPool.on('release', () => {
    console.log('🔄 Connection released back to pool');
  });
  
  return mainPool;
}

/**
 * Initialize read-only connection pool for queries
 */
function initializeReadOnlyPool() {
  if (readOnlyPool) {
    return readOnlyPool;
  }
  
  // Use read replica if configured, otherwise use main database
  const readOnlyConfig = {
    ...config,
    host: process.env.DB_READ_HOST || config.host,
    port: parseInt(process.env.DB_READ_PORT) || config.port,
    database: process.env.DB_READ_NAME || config.database,
    user: process.env.DB_READ_USER || config.user,
    password: process.env.DB_READ_PASSWORD || config.password,
    max: Math.ceil(config.max * 0.6), // 60% of main pool size
    min: 1,
    statement_timeout: config.statement_timeout * 2, // Allow longer queries
    query_timeout: config.query_timeout * 2
  };
  
  readOnlyPool = new Pool(readOnlyConfig);
  
  readOnlyPool.on('connect', (client) => {
    console.log('✅ Read-only database connection established');
    client.query(`SET default_transaction_read_only = on`);
    client.query(`SET application_name = '${config.application_name}-readonly'`);
  });
  
  return readOnlyPool;
}

/**
 * Initialize analytics connection pool for heavy queries
 */
function initializeAnalyticsPool() {
  if (analyticsPool) {
    return analyticsPool;
  }
  
  const analyticsConfig = {
    ...config,
    host: process.env.DB_ANALYTICS_HOST || config.host,
    max: Math.ceil(config.max * 0.3), // 30% of main pool size
    min: 1,
    statement_timeout: 300000, // 5 minutes for long-running analytics
    query_timeout: 300000
  };
  
  analyticsPool = new Pool(analyticsConfig);
  
  analyticsPool.on('connect', (client) => {
    console.log('✅ Analytics database connection established');
    client.query(`SET work_mem = '64MB'`);
    client.query(`SET application_name = '${config.application_name}-analytics'`);
  });
  
  return analyticsPool;
}

/**
 * Execute a query with automatic retry logic
 */
async function executeQuery(query, params = [], options = {}) {
  const {
    pool = 'main',
    retries = 3,
    retryDelay = 1000,
    timeout = config.query_timeout
  } = options;
  
  let selectedPool;
  switch (pool) {
    case 'readonly':
      selectedPool = initializeReadOnlyPool();
      break;
    case 'analytics':
      selectedPool = initializeAnalyticsPool();
      break;
    default:
      selectedPool = initializeMainPool();
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await selectedPool.query(query, params);
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`⚠️  Slow query detected (${duration}ms):`, query.substring(0, 100));
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Query attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
}

/**
 * Execute a transaction with automatic rollback on error
 */
async function executeTransaction(queries, options = {}) {
  const client = await initializeMainPool().connect();
  
  try {
    await client.query('BEGIN');
    
    const results = [];
    for (const { query, params } of queries) {
      const result = await client.query(query, params);
      results.push(result);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction rolled back:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Set user context for Row Level Security
 */
async function setUserContext(userId, client = null) {
  const query = `SET app.current_user_id = $1`;
  
  if (client) {
    await client.query(query, [userId]);
  } else {
    await executeQuery(query, [userId]);
  }
}

/**
 * Health check function
 */
async function healthCheck() {
  try {
    const result = await executeQuery('SELECT NOW() as timestamp, version() as version');
    return {
      status: 'healthy',
      timestamp: result.rows[0].timestamp,
      version: result.rows[0].version,
      pools: {
        main: {
          total: mainPool ? mainPool.totalCount : 0,
          idle: mainPool ? mainPool.idleCount : 0,
          waiting: mainPool ? mainPool.waitingCount : 0
        }
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('🔄 Shutting down database connections...');
  
  const pools = [mainPool, readOnlyPool, analyticsPool].filter(Boolean);
  
  await Promise.all(
    pools.map(async (pool) => {
      try {
        await pool.end();
        console.log('✅ Database pool closed successfully');
      } catch (error) {
        console.error('❌ Error closing database pool:', error);
      }
    })
  );
  
  console.log('✅ All database connections closed');
}

/**
 * Connection monitoring and maintenance
 */
function startConnectionMonitoring() {
  const MONITORING_INTERVAL = 30000; // 30 seconds
  
  setInterval(async () => {
    try {
      const health = await healthCheck();
      
      if (health.status === 'unhealthy') {
        console.error('❌ Database health check failed:', health.error);
      }
      
      // Log connection pool stats
      if (mainPool) {
        console.log(`📊 Connection Pool Stats - Total: ${mainPool.totalCount}, Idle: ${mainPool.idleCount}, Waiting: ${mainPool.waitingCount}`);
      }
      
    } catch (error) {
      console.error('❌ Connection monitoring error:', error);
    }
  }, MONITORING_INTERVAL);
}

// Performance monitoring
function logQueryPerformance(query, duration, params) {
  if (process.env.NODE_ENV === 'development' && duration > 100) {
    console.log(`📊 Query Performance: ${duration}ms`);
    console.log(`Query: ${query.substring(0, 200)}${query.length > 200 ? '...' : ''}`);
  }
}

// Initialize pools on module load
if (process.env.NODE_ENV !== 'test') {
  initializeMainPool();
  startConnectionMonitoring();
}

// Graceful shutdown handling
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = {
  config,
  initializeMainPool,
  initializeReadOnlyPool,
  initializeAnalyticsPool,
  executeQuery,
  executeTransaction,
  setUserContext,
  healthCheck,
  shutdown,
  
  // Direct pool access for advanced use cases
  get mainPool() { return mainPool; },
  get readOnlyPool() { return readOnlyPool; },
  get analyticsPool() { return analyticsPool; }
};