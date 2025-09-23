/**
 * Database Monitoring Configuration for MariaIntelligence
 * Performance tracking, alerting, and health checks
 * 
 * @author Database-Agent
 * @version 1.0.0
 * @date 2025-08-27
 */

const { executeQuery } = require('./database.config');

// Monitoring configuration
const config = {
  // Health check intervals (milliseconds)
  healthCheck: {
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    retries: 3
  },
  
  // Performance thresholds
  thresholds: {
    slowQueryMs: 1000,        // 1 second
    connectionCount: 150,     // Max connections warning
    diskSpaceGB: 1,          // Minimum free space in GB
    cpuPercent: 80,          // CPU usage warning
    memoryPercent: 85,       // Memory usage warning
    longRunningMinutes: 5,   // Long-running query warning
    replicationLagSeconds: 30 // Replication lag warning
  },
  
  // Metrics collection
  metrics: {
    enabled: process.env.ENABLE_METRICS !== 'false',
    retentionDays: 30,
    aggregationInterval: 60000 // 1 minute
  },
  
  // Alerting configuration
  alerts: {
    email: {
      enabled: !!process.env.NOTIFICATION_EMAIL,
      to: process.env.NOTIFICATION_EMAIL,
      from: process.env.NOTIFICATION_FROM || 'noreply@mariaintelligence.com'
    },
    webhook: {
      enabled: !!process.env.WEBHOOK_URL,
      url: process.env.WEBHOOK_URL,
      timeout: 10000
    },
    slack: {
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      url: process.env.SLACK_WEBHOOK_URL
    }
  }
};

// Performance metrics collection
class DatabaseMonitor {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
    this.isRunning = false;
  }

  // Start monitoring
  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🔄 Starting database monitoring...');
    
    // Start health checks
    this.healthCheckInterval = setInterval(
      () => this.performHealthCheck(),
      config.healthCheck.interval
    );
    
    // Start metrics collection
    if (config.metrics.enabled) {
      this.metricsInterval = setInterval(
        () => this.collectMetrics(),
        config.metrics.aggregationInterval
      );
    }
    
    console.log('✅ Database monitoring started');
  }

  // Stop monitoring
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    console.log('⏹️  Database monitoring stopped');
  }

  // Perform comprehensive health check
  async performHealthCheck() {
    try {
      const healthData = await this.checkHealth();
      
      // Check for issues and send alerts
      await this.checkAlerts(healthData);
      
      return healthData;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      await this.sendAlert('CRITICAL', 'Health check failed', error.message);
    }
  }

  // Check database health
  async checkHealth() {
    const health = {
      timestamp: new Date(),
      status: 'healthy',
      issues: [],
      metrics: {}
    };

    try {
      // Basic connectivity check
      const connectResult = await executeQuery('SELECT NOW() as timestamp, version() as version');
      health.metrics.timestamp = connectResult.rows[0].timestamp;
      health.metrics.version = connectResult.rows[0].version;

      // Connection count check
      const connectionResult = await executeQuery(
        'SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = $1',
        ['active']
      );
      health.metrics.activeConnections = parseInt(connectionResult.rows[0].active_connections);

      if (health.metrics.activeConnections > config.thresholds.connectionCount) {
        health.issues.push({
          severity: 'WARNING',
          message: `High connection count: ${health.metrics.activeConnections}`
        });
      }

      // Long-running queries check
      const longQueriesResult = await executeQuery(`
        SELECT count(*) as long_running_count,
               array_agg(pid) as pids,
               array_agg(query_start) as start_times
        FROM pg_stat_activity 
        WHERE (now() - pg_stat_activity.query_start) > interval '${config.thresholds.longRunningMinutes} minutes'
        AND state = 'active'
      `);
      
      health.metrics.longRunningQueries = parseInt(longQueriesResult.rows[0].long_running_count) || 0;

      if (health.metrics.longRunningQueries > 0) {
        health.issues.push({
          severity: 'WARNING',
          message: `Found ${health.metrics.longRunningQueries} long-running queries`,
          details: {
            pids: longQueriesResult.rows[0].pids,
            startTimes: longQueriesResult.rows[0].start_times
          }
        });
      }

      // Database size check
      const sizeResult = await executeQuery(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size,
               pg_database_size(current_database()) as size_bytes
      `);
      health.metrics.databaseSize = sizeResult.rows[0].size;
      health.metrics.databaseSizeBytes = parseInt(sizeResult.rows[0].size_bytes);

      // Table statistics
      const tableStatsResult = await executeQuery(`
        SELECT 
          count(*) as table_count,
          sum(n_tup_ins) as total_inserts,
          sum(n_tup_upd) as total_updates,
          sum(n_tup_del) as total_deletes
        FROM pg_stat_user_tables
      `);
      
      if (tableStatsResult.rows.length > 0) {
        health.metrics.tableStats = {
          tableCount: parseInt(tableStatsResult.rows[0].table_count) || 0,
          totalInserts: parseInt(tableStatsResult.rows[0].total_inserts) || 0,
          totalUpdates: parseInt(tableStatsResult.rows[0].total_updates) || 0,
          totalDeletes: parseInt(tableStatsResult.rows[0].total_deletes) || 0
        };
      }

      // Index usage statistics
      const indexStatsResult = await executeQuery(`
        SELECT 
          count(*) as index_count,
          count(CASE WHEN idx_scan = 0 THEN 1 END) as unused_indexes
        FROM pg_stat_user_indexes
      `);
      
      if (indexStatsResult.rows.length > 0) {
        health.metrics.indexStats = {
          indexCount: parseInt(indexStatsResult.rows[0].index_count) || 0,
          unusedIndexes: parseInt(indexStatsResult.rows[0].unused_indexes) || 0
        };
      }

      // Cache hit ratio
      const cacheHitResult = await executeQuery(`
        SELECT 
          sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) * 100 as cache_hit_ratio
        FROM pg_statio_user_tables
        WHERE heap_blks_hit + heap_blks_read > 0
      `);
      
      if (cacheHitResult.rows.length > 0 && cacheHitResult.rows[0].cache_hit_ratio) {
        health.metrics.cacheHitRatio = parseFloat(cacheHitResult.rows[0].cache_hit_ratio).toFixed(2);
        
        if (health.metrics.cacheHitRatio < 95) {
          health.issues.push({
            severity: 'WARNING',
            message: `Low cache hit ratio: ${health.metrics.cacheHitRatio}%`
          });
        }
      }

      // Replication status (if applicable)
      try {
        const replicationResult = await executeQuery(`
          SELECT 
            client_addr,
            state,
            pg_wal_lsn_diff(pg_current_wal_lsn(), flush_lsn) as lag_bytes
          FROM pg_stat_replication
        `);
        
        health.metrics.replication = replicationResult.rows;
      } catch (error) {
        // Replication might not be configured, ignore error
      }

      // Slow queries from pg_stat_statements
      try {
        const slowQueriesResult = await executeQuery(`
          SELECT 
            count(*) as slow_query_count,
            avg(mean_exec_time) as avg_execution_time
          FROM pg_stat_statements 
          WHERE mean_exec_time > ${config.thresholds.slowQueryMs}
        `);
        
        if (slowQueriesResult.rows.length > 0) {
          health.metrics.slowQueries = {
            count: parseInt(slowQueriesResult.rows[0].slow_query_count) || 0,
            avgExecutionTime: parseFloat(slowQueriesResult.rows[0].avg_execution_time) || 0
          };
        }
      } catch (error) {
        // pg_stat_statements might not be enabled
      }

      // Set overall status based on issues
      if (health.issues.length > 0) {
        const hasCritical = health.issues.some(issue => issue.severity === 'CRITICAL');
        health.status = hasCritical ? 'unhealthy' : 'degraded';
      }

    } catch (error) {
      health.status = 'unhealthy';
      health.issues.push({
        severity: 'CRITICAL',
        message: 'Database connectivity check failed',
        error: error.message
      });
    }

    return health;
  }

  // Collect detailed metrics
  async collectMetrics() {
    try {
      const metrics = await this.gatherDetailedMetrics();
      
      // Store metrics (in production, you might want to use a time-series database)
      this.storeMetrics(metrics);
      
      return metrics;
    } catch (error) {
      console.error('❌ Metrics collection failed:', error);
    }
  }

  // Gather detailed performance metrics
  async gatherDetailedMetrics() {
    const metrics = {
      timestamp: new Date(),
      connections: await this.getConnectionMetrics(),
      performance: await this.getPerformanceMetrics(),
      storage: await this.getStorageMetrics(),
      queries: await this.getQueryMetrics()
    };

    return metrics;
  }

  // Get connection metrics
  async getConnectionMetrics() {
    const result = await executeQuery(`
      SELECT 
        count(*) as total,
        count(CASE WHEN state = 'active' THEN 1 END) as active,
        count(CASE WHEN state = 'idle' THEN 1 END) as idle,
        count(CASE WHEN state = 'idle in transaction' THEN 1 END) as idle_in_transaction,
        max(EXTRACT(EPOCH FROM (now() - query_start))) as longest_query_seconds
      FROM pg_stat_activity
      WHERE pid != pg_backend_pid()
    `);

    return result.rows[0];
  }

  // Get performance metrics
  async getPerformanceMetrics() {
    const result = await executeQuery(`
      SELECT 
        tup_returned,
        tup_fetched,
        tup_inserted,
        tup_updated,
        tup_deleted,
        conflicts,
        temp_files,
        temp_bytes,
        deadlocks,
        blk_read_time,
        blk_write_time
      FROM pg_stat_database 
      WHERE datname = current_database()
    `);

    return result.rows[0];
  }

  // Get storage metrics
  async getStorageMetrics() {
    const result = await executeQuery(`
      SELECT 
        pg_database_size(current_database()) as database_size,
        (SELECT sum(size) FROM pg_stat_file('base/' || oid || '/PG_VERSION') 
         WHERE oid IN (SELECT oid FROM pg_database WHERE datname = current_database())) as data_files_size
    `);

    return result.rows[0];
  }

  // Get query metrics
  async getQueryMetrics() {
    try {
      const result = await executeQuery(`
        SELECT 
          count(*) as total_queries,
          sum(calls) as total_calls,
          avg(mean_exec_time) as avg_execution_time,
          max(max_exec_time) as max_execution_time,
          sum(rows) as total_rows_returned
        FROM pg_stat_statements
      `);

      return result.rows[0] || {};
    } catch (error) {
      return {};
    }
  }

  // Store metrics (implement your preferred storage method)
  storeMetrics(metrics) {
    // In a production system, you would typically store these metrics in:
    // - Time-series database (InfluxDB, TimescaleDB)
    // - Monitoring system (Prometheus, Grafana)
    // - Log aggregation system (ELK stack)
    
    // For now, just keep the latest metrics in memory
    this.metrics.set(metrics.timestamp.getTime(), metrics);
    
    // Clean up old metrics (keep last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    for (const [timestamp] of this.metrics) {
      if (timestamp < oneDayAgo) {
        this.metrics.delete(timestamp);
      }
    }
  }

  // Check for alert conditions
  async checkAlerts(healthData) {
    for (const issue of healthData.issues) {
      if (issue.severity === 'CRITICAL') {
        await this.sendAlert('CRITICAL', issue.message, issue.details);
      } else if (issue.severity === 'WARNING') {
        await this.sendAlert('WARNING', issue.message, issue.details);
      }
    }
  }

  // Send alert notification
  async sendAlert(severity, message, details = null) {
    const alert = {
      timestamp: new Date(),
      severity,
      message,
      details,
      source: 'mariaintelligence-database'
    };

    console.log(`🚨 ${severity} Alert: ${message}`);
    
    // Store alert
    this.alerts.push(alert);
    
    // Send email notification
    if (config.alerts.email.enabled) {
      await this.sendEmailAlert(alert);
    }
    
    // Send webhook notification
    if (config.alerts.webhook.enabled) {
      await this.sendWebhookAlert(alert);
    }
    
    // Send Slack notification
    if (config.alerts.slack.enabled) {
      await this.sendSlackAlert(alert);
    }
  }

  // Send email alert
  async sendEmailAlert(alert) {
    try {
      // Implement email sending logic
      // This would typically use nodemailer or similar
      console.log('📧 Sending email alert:', alert.message);
    } catch (error) {
      console.error('❌ Failed to send email alert:', error);
    }
  }

  // Send webhook alert
  async sendWebhookAlert(alert) {
    try {
      const fetch = require('node-fetch');
      
      const response = await fetch(config.alerts.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alert),
        timeout: config.alerts.webhook.timeout
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }
      
      console.log('🔗 Webhook alert sent successfully');
    } catch (error) {
      console.error('❌ Failed to send webhook alert:', error);
    }
  }

  // Send Slack alert
  async sendSlackAlert(alert) {
    try {
      const fetch = require('node-fetch');
      
      const color = alert.severity === 'CRITICAL' ? 'danger' : 'warning';
      const slackPayload = {
        attachments: [{
          color,
          title: `Database Alert - ${alert.severity}`,
          text: alert.message,
          fields: [
            {
              title: 'Timestamp',
              value: alert.timestamp.toISOString(),
              short: true
            },
            {
              title: 'Source',
              value: alert.source,
              short: true
            }
          ]
        }]
      };

      if (alert.details) {
        slackPayload.attachments[0].fields.push({
          title: 'Details',
          value: JSON.stringify(alert.details, null, 2),
          short: false
        });
      }

      const response = await fetch(config.alerts.slack.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(slackPayload)
      });

      if (!response.ok) {
        throw new Error(`Slack request failed: ${response.status}`);
      }
      
      console.log('💬 Slack alert sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Slack alert:', error);
    }
  }

  // Get current metrics
  getMetrics() {
    return Array.from(this.metrics.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 100); // Return last 100 metrics
  }

  // Get recent alerts
  getAlerts(limit = 50) {
    return this.alerts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Get health summary
  async getHealthSummary() {
    return await this.performHealthCheck();
  }
}

// Create singleton instance
const monitor = new DatabaseMonitor();

// Graceful shutdown handling
process.on('SIGINT', () => monitor.stop());
process.on('SIGTERM', () => monitor.stop());

module.exports = {
  config,
  monitor,
  DatabaseMonitor
};