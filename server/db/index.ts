/**
 * MCP Database Integration Entry Point
 * Comprehensive Neon database integration with MCP support
 * This module provides a complete database solution with connection management,
 * migrations, utilities, and performance monitoring
 */

import { createNeonMCPManager, getNeonMCPManager, type NeonMCPConfig } from './neon-mcp-manager';
import { getMCPDatabaseUtils } from './mcp-database-utils';
import { createMCPMigrationSystem, getMCPMigrationSystem } from './mcp-migration-system';
import { join } from 'path';

// Configuration interface
export interface MCPDatabaseConfig extends NeonMCPConfig {
  migrationsDir?: string;
  autoMigrate?: boolean;
  enableMonitoring?: boolean;
  enableBackups?: boolean;
  backupSchedule?: string; // cron format
  performanceAlerts?: {
    slowQueryThreshold?: number;
    connectionPoolThreshold?: number;
    errorRateThreshold?: number;
  };
}

// Database status interface
export interface DatabaseStatus {
  connected: boolean;
  healthy: boolean;
  connectionPool: {
    active: number;
    idle: number;
    waiting: number;
    max: number;
  };
  migrations: {
    applied: number;
    pending: number;
    failed: number;
  };
  performance: {
    averageQueryTime: number;
    slowQueries: number;
    errorRate: number;
  };
  uptime: number;
  version: string;
  lastHealthCheck: Date;
}

export class MCPDatabaseService {
  private config: MCPDatabaseConfig;
  private initialized = false;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: MCPDatabaseConfig) {
    this.config = {
      migrationsDir: join(process.cwd(), 'migrations'),
      autoMigrate: false,
      enableMonitoring: true,
      enableBackups: false,
      performanceAlerts: {
        slowQueryThreshold: 1000,
        connectionPoolThreshold: 0.8,
        errorRateThreshold: 0.05,
      },
      ...config,
    };
  }

  // Initialize the complete database system
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⚠️ MCP Database Service already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing MCP Database Service...');

      // 1. Initialize Neon MCP Manager
      console.log('📡 Setting up Neon connection manager...');
      const manager = createNeonMCPManager(this.config);
      
      // Wait for connection to be established
      await new Promise<void>((resolve, reject) => {
        manager.once('connected', resolve);
        manager.once('error', reject);
        
        // Timeout after 30 seconds
        setTimeout(() => reject(new Error('Connection timeout')), 30000);
      });

      // 2. Initialize Migration System
      console.log('🔄 Setting up migration system...');
      const migrationSystem = createMCPMigrationSystem(this.config.migrationsDir);
      await migrationSystem.initialize();

      // 3. Run pending migrations if auto-migrate is enabled
      if (this.config.autoMigrate) {
        console.log('⚡ Running pending migrations...');
        const plan = await migrationSystem.createMigrationPlan();
        
        if (plan.migrationsToApply.length > 0) {
          console.log(`📋 Found ${plan.migrationsToApply.length} pending migrations`);
          
          if (plan.requiresBackup) {
            console.log('💾 Creating backup before migrations...');
          }
          
          const results = await migrationSystem.executeMigrationPlan(plan, {
            backupBeforeApply: plan.requiresBackup,
          });
          
          const successful = results.filter(r => r.success).length;
          const failed = results.filter(r => !r.success).length;
          
          console.log(`✅ Migrations completed: ${successful} successful, ${failed} failed`);
          
          if (failed > 0) {
            throw new Error(`${failed} migrations failed during initialization`);
          }
        } else {
          console.log('✅ All migrations are up to date');
        }
      }

      // 4. Setup performance monitoring
      if (this.config.enableMonitoring) {
        this.setupMonitoring();
      }

      // 5. Setup health checks
      this.setupHealthChecks();

      // 6. Create default indexes for performance
      await this.createOptimizationIndexes();

      this.initialized = true;
      console.log('✅ MCP Database Service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize MCP Database Service:', error);
      throw error;
    }
  }

  // Setup performance monitoring
  private setupMonitoring(): void {
    const manager = getNeonMCPManager();
    
    // Monitor slow queries
    manager.on('query-metric', (metric) => {
      const threshold = this.config.performanceAlerts?.slowQueryThreshold || 1000;
      
      if (metric.duration > threshold) {
        console.warn(`🐌 Slow query detected (${metric.duration}ms):`, metric.query);
      }
    });

    // Monitor connection pool
    setInterval(async () => {
      const stats = await manager.getPoolStats();
      const threshold = this.config.performanceAlerts?.connectionPoolThreshold || 0.8;
      const utilization = stats.activeConnections / stats.maxConnections;
      
      if (utilization > threshold) {
        console.warn(`⚠️ High connection pool utilization: ${Math.round(utilization * 100)}%`);
      }
    }, 30000); // Check every 30 seconds

    console.log('📊 Performance monitoring enabled');
  }

  // Setup health checks
  private setupHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      const manager = getNeonMCPManager();
      const isHealthy = await manager.healthCheck();
      
      if (!isHealthy) {
        console.error('❌ Database health check failed');
      }
    }, 60000); // Check every minute

    console.log('🏥 Health monitoring enabled');
  }

  // Create optimization indexes
  private async createOptimizationIndexes(): Promise<void> {
    const utils = getMCPDatabaseUtils();
    
    try {
      // Common indexes for better query performance
      const indexes = [
        { table: 'properties', columns: ['owner_id'] },
        { table: 'properties', columns: ['active'] },
        { table: 'reservations', columns: ['property_id'] },
        { table: 'reservations', columns: ['check_in_date'] },
        { table: 'reservations', columns: ['check_out_date'] },
        { table: 'reservations', columns: ['status'] },
        { table: 'reservations', columns: ['guest_name'] },
        { table: 'activities', columns: ['entity_type', 'entity_id'] },
        { table: 'activities', columns: ['created_at'] },
        { table: 'financial_documents', columns: ['related_entity_type', 'related_entity_id'] },
        { table: 'financial_documents', columns: ['status'] },
        { table: 'financial_documents', columns: ['issue_date'] },
        { table: 'maintenance_tasks', columns: ['property_id'] },
        { table: 'maintenance_tasks', columns: ['status'] },
        { table: 'maintenance_tasks', columns: ['due_date'] },
      ];

      for (const index of indexes) {
        try {
          await utils.createIndex(index.table, index.columns);
        } catch (error) {
          // Index might already exist, continue
          console.warn(`⚠️ Index creation skipped for ${index.table}:`, error);
        }
      }

      console.log('🔍 Optimization indexes created');
    } catch (error) {
      console.warn('⚠️ Some optimization indexes could not be created:', error);
    }
  }

  // Get comprehensive database status
  public async getStatus(): Promise<DatabaseStatus> {
    const manager = getNeonMCPManager();
    const migrationSystem = getMCPMigrationSystem();
    const utils = getMCPDatabaseUtils();

    // Get pool stats
    const poolStats = await manager.getPoolStats();
    
    // Get performance stats
    const perfStats = await manager.getPerformanceStats();
    
    // Get migration status
    const migrations = await migrationSystem.getMigrationStatus();
    const applied = migrations.filter(m => m.status === 'applied').length;
    const pending = migrations.filter(m => m.status === 'pending').length;
    const failed = migrations.filter(m => m.status === 'failed').length;

    // Get database version
    const versionResult = await manager.executeQuery('SELECT version() as version');
    const version = versionResult[0]?.version || 'Unknown';

    return {
      connected: manager.isHealthy,
      healthy: await manager.healthCheck(),
      connectionPool: {
        active: poolStats.activeConnections,
        idle: poolStats.idleConnections,
        waiting: poolStats.waitingCount,
        max: poolStats.maxConnections,
      },
      migrations: {
        applied,
        pending,
        failed,
      },
      performance: {
        averageQueryTime: perfStats.queries.averageDuration,
        slowQueries: perfStats.queries.slowQueries,
        errorRate: perfStats.queries.errorRate,
      },
      uptime: perfStats.uptime,
      version,
      lastHealthCheck: new Date(),
    };
  }

  // Health check endpoint
  public async healthCheck(): Promise<{ status: string; details: DatabaseStatus }> {
    try {
      const status = await this.getStatus();
      
      return {
        status: status.healthy ? 'healthy' : 'unhealthy',
        details: status,
      };
    } catch (error) {
      return {
        status: 'error',
        details: {
          connected: false,
          healthy: false,
          connectionPool: { active: 0, idle: 0, waiting: 0, max: 0 },
          migrations: { applied: 0, pending: 0, failed: 0 },
          performance: { averageQueryTime: 0, slowQueries: 0, errorRate: 0 },
          uptime: 0,
          version: 'Unknown',
          lastHealthCheck: new Date(),
        },
      };
    }
  }

  // Graceful shutdown
  public async shutdown(): Promise<void> {
    console.log('🔄 Shutting down MCP Database Service...');

    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Disconnect from database
    const manager = getNeonMCPManager();
    await manager.disconnect();

    this.initialized = false;
    console.log('✅ MCP Database Service shut down gracefully');
  }

  // Utility methods
  public getManager() {
    return getNeonMCPManager();
  }

  public getUtils() {
    return getMCPDatabaseUtils();
  }

  public getMigrationSystem() {
    return getMCPMigrationSystem();
  }

  public get isInitialized() {
    return this.initialized;
  }
}

// Singleton instance
let databaseServiceInstance: MCPDatabaseService | null = null;

// Factory function
export function createMCPDatabaseService(config: MCPDatabaseConfig): MCPDatabaseService {
  if (!databaseServiceInstance) {
    databaseServiceInstance = new MCPDatabaseService(config);
  }
  return databaseServiceInstance;
}

// Getter function
export function getMCPDatabaseService(): MCPDatabaseService {
  if (!databaseServiceInstance) {
    throw new Error('MCP Database Service not initialized. Call createMCPDatabaseService first.');
  }
  return databaseServiceInstance;
}

// Initialize with environment variables
export async function initializeMCPDatabaseFromEnv(): Promise<MCPDatabaseService> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const config: MCPDatabaseConfig = {
    connectionString: process.env.DATABASE_URL,
    autoMigrate: process.env.AUTO_MIGRATE === 'true',
    enableMonitoring: process.env.ENABLE_DB_MONITORING !== 'false',
    enableBackups: process.env.ENABLE_DB_BACKUPS === 'true',
    migrationsDir: process.env.MIGRATIONS_DIR || join(process.cwd(), 'migrations'),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
    enableQueryLogging: process.env.ENABLE_QUERY_LOGGING === 'true',
    queryLogThreshold: parseInt(process.env.QUERY_LOG_THRESHOLD || '1000'),
    performanceAlerts: {
      slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000'),
      connectionPoolThreshold: parseFloat(process.env.CONNECTION_POOL_THRESHOLD || '0.8'),
      errorRateThreshold: parseFloat(process.env.ERROR_RATE_THRESHOLD || '0.05'),
    },
  };

  const service = createMCPDatabaseService(config);
  await service.initialize();
  
  return service;
}

// Export all types and classes
export * from './neon-mcp-manager';
export * from './mcp-database-utils';
export * from './mcp-migration-system';

// Default export
export default {
  createMCPDatabaseService,
  getMCPDatabaseService,
  initializeMCPDatabaseFromEnv,
};