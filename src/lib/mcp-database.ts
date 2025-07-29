/**
 * MCP Database Integration
 * Specialized Neon database operations with MCP protocol
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { z } from 'zod';
import { mcpClient, MCPResponse } from './mcp-client';
import { mcpSecurity } from './mcp-security';

// Database Configuration Schema
const DatabaseConfigSchema = z.object({
  projectId: z.string(),
  databaseUrl: z.string(),
  branchId: z.string().optional(),
  maxConnections: z.number().default(10),
  idleTimeout: z.number().default(30000),
  connectionTimeout: z.number().default(10000),
  ssl: z.boolean().default(true)
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

// Database Operation Schema
const DatabaseOperationSchema = z.object({
  type: z.enum(['query', 'transaction', 'migration', 'backup']),
  sql: z.string().optional(),
  statements: z.array(z.string()).optional(),
  parameters: z.array(z.any()).optional(),
  options: z.record(z.any()).optional()
});

export type DatabaseOperation = z.infer<typeof DatabaseOperationSchema>;

// Connection Pool Manager
class ConnectionPoolManager {
  private pools: Map<string, any> = new Map();
  private connectionCounts: Map<string, number> = new Map();

  getPool(projectId: string, config: DatabaseConfig): any {
    if (!this.pools.has(projectId)) {
      const sql = neon(config.databaseUrl);
      const db = drizzle(sql);
      
      this.pools.set(projectId, { sql, db });
      this.connectionCounts.set(projectId, 0);
    }

    return this.pools.get(projectId);
  }

  incrementConnection(projectId: string): void {
    const current = this.connectionCounts.get(projectId) || 0;
    this.connectionCounts.set(projectId, current + 1);
  }

  decrementConnection(projectId: string): void {
    const current = this.connectionCounts.get(projectId) || 0;
    this.connectionCounts.set(projectId, Math.max(0, current - 1));
  }

  getConnectionCount(projectId: string): number {
    return this.connectionCounts.get(projectId) || 0;
  }

  closePool(projectId: string): void {
    this.pools.delete(projectId);
    this.connectionCounts.delete(projectId);
  }

  closeAllPools(): void {
    this.pools.clear();
    this.connectionCounts.clear();
  }
}

// Query Builder
class QueryBuilder {
  static buildSelectQuery(table: string, options: {
    columns?: string[];
    where?: Record<string, any>;
    orderBy?: string;
    limit?: number;
    offset?: number;
  }): { sql: string; parameters: any[] } {
    const columns = options.columns?.join(', ') || '*';
    let sql = `SELECT ${columns} FROM ${table}`;
    const parameters: any[] = [];
    let paramIndex = 1;

    if (options.where) {
      const whereConditions = Object.entries(options.where).map(([key, value]) => {
        parameters.push(value);
        return `${key} = $${paramIndex++}`;
      });
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    return { sql, parameters };
  }

  static buildInsertQuery(table: string, data: Record<string, any>): { sql: string; parameters: any[] } {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    
    return { sql, parameters: values };
  }

  static buildUpdateQuery(table: string, data: Record<string, any>, where: Record<string, any>): { sql: string; parameters: any[] } {
    const updateColumns = Object.keys(data);
    const updateValues = Object.values(data);
    const whereColumns = Object.keys(where);
    const whereValues = Object.values(where);

    let paramIndex = 1;
    const updateSet = updateColumns.map(col => `${col} = $${paramIndex++}`);
    const whereConditions = whereColumns.map(col => `${col} = $${paramIndex++}`);

    const sql = `UPDATE ${table} SET ${updateSet.join(', ')} WHERE ${whereConditions.join(' AND ')} RETURNING *`;
    const parameters = [...updateValues, ...whereValues];

    return { sql, parameters };
  }

  static buildDeleteQuery(table: string, where: Record<string, any>): { sql: string; parameters: any[] } {
    const whereColumns = Object.keys(where);
    const whereValues = Object.values(where);
    const whereConditions = whereColumns.map((col, index) => `${col} = $${index + 1}`);

    const sql = `DELETE FROM ${table} WHERE ${whereConditions.join(' AND ')} RETURNING *`;
    
    return { sql, parameters: whereValues };
  }
}

// Migration Manager
class MigrationManager {
  private migrations: Array<{ id: string; sql: string; description: string }> = [];

  addMigration(id: string, sql: string, description: string): void {
    this.migrations.push({ id, sql, description });
  }

  async runMigrations(projectId: string, config: DatabaseConfig): Promise<{ applied: string[]; errors: string[] }> {
    const applied: string[] = [];
    const errors: string[] = [];

    // Ensure migrations table exists
    await this.ensureMigrationsTable(projectId, config);

    // Get applied migrations
    const appliedMigrations = await this.getAppliedMigrations(projectId, config);
    const appliedIds = new Set(appliedMigrations.map(m => m.id));

    // Run pending migrations
    for (const migration of this.migrations) {
      if (!appliedIds.has(migration.id)) {
        try {
          await this.runSingleMigration(projectId, config, migration);
          applied.push(migration.id);
        } catch (error) {
          errors.push(`Migration ${migration.id}: ${error}`);
          break; // Stop on first error
        }
      }
    }

    return { applied, errors };
  }

  private async ensureMigrationsTable(projectId: string, config: DatabaseConfig): Promise<void> {
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS _migrations (
        id VARCHAR(255) PRIMARY KEY,
        description TEXT,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    await mcpClient.callTool({
      server: 'neon',
      tool: 'run_sql',
      arguments: {
        projectId,
        sql: createTableSql
      }
    });
  }

  private async getAppliedMigrations(projectId: string, config: DatabaseConfig): Promise<Array<{ id: string; description: string; applied_at: string }>> {
    const response = await mcpClient.callTool({
      server: 'neon',
      tool: 'run_sql',
      arguments: {
        projectId,
        sql: 'SELECT * FROM _migrations ORDER BY applied_at ASC'
      }
    });

    return response.success ? response.data.rows || [] : [];
  }

  private async runSingleMigration(projectId: string, config: DatabaseConfig, migration: { id: string; sql: string; description: string }): Promise<void> {
    // Run migration in transaction
    const statements = [
      migration.sql,
      `INSERT INTO _migrations (id, description) VALUES ('${migration.id}', '${migration.description}')`
    ];

    await mcpClient.callTool({
      server: 'neon',
      tool: 'run_sql_transaction',
      arguments: {
        projectId,
        sqlStatements: statements
      }
    });
  }
}

// Backup Manager
class BackupManager {
  async createBackup(projectId: string, config: DatabaseConfig, options?: {
    tables?: string[];
    includeData?: boolean;
    compression?: boolean;
  }): Promise<{ backupId: string; url: string; size: number }> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    // For now, simulate backup creation
    // In a real implementation, this would use Neon's backup API
    const response = await mcpClient.callTool({
      server: 'neon',
      tool: 'create_branch',
      arguments: {
        projectId,
        branchName: `backup-${backupId}`
      }
    });

    if (!response.success) {
      throw new Error(`Backup creation failed: ${response.error}`);
    }

    return {
      backupId,
      url: `neon://backup/${backupId}`,
      size: 0 // Would be calculated in real implementation
    };
  }

  async restoreBackup(projectId: string, backupId: string, config: DatabaseConfig): Promise<boolean> {
    // Simulate backup restoration
    const response = await mcpClient.callTool({
      server: 'neon',
      tool: 'create_branch',
      arguments: {
        projectId,
        branchName: `restore-from-${backupId}`
      }
    });

    return response.success;
  }

  async listBackups(projectId: string): Promise<Array<{ backupId: string; createdAt: string; size: number }>> {
    // Simulate backup listing
    return [
      {
        backupId: 'backup_example',
        createdAt: new Date().toISOString(),
        size: 1024 * 1024 // 1MB
      }
    ];
  }
}

// Main Database Manager
export class MCPDatabaseManager {
  private connectionPool = new ConnectionPoolManager();
  private migrationManager = new MigrationManager();
  private backupManager = new BackupManager();
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = DatabaseConfigSchema.parse(config);
    this.initializeDefaultMigrations();
  }

  private initializeDefaultMigrations(): void {
    // Add default migrations for MariaFaz schema
    this.migrationManager.addMigration(
      '001_create_properties',
      `
        CREATE TABLE IF NOT EXISTS properties (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          address TEXT,
          owner_id INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
      `,
      'Create properties table'
    );

    this.migrationManager.addMigration(
      '002_create_reservations',
      `
        CREATE TABLE IF NOT EXISTS reservations (
          id SERIAL PRIMARY KEY,
          property_id INTEGER REFERENCES properties(id),
          guest_name VARCHAR(255) NOT NULL,
          check_in DATE NOT NULL,
          check_out DATE NOT NULL,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_reservations_property_id ON reservations(property_id);
        CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
      `,
      'Create reservations table'
    );
  }

  async executeQuery(operation: DatabaseOperation): Promise<MCPResponse> {
    // Validate and sanitize input
    const sanitizedOperation = mcpSecurity.validateInput(operation);
    const validatedOperation = DatabaseOperationSchema.parse(sanitizedOperation);

    // Log the operation
    mcpSecurity.logAudit({
      action: 'database_query',
      server: 'neon',
      tool: 'run_sql',
      arguments: validatedOperation,
      success: false // Will be updated based on result
    });

    try {
      let response: MCPResponse;

      switch (validatedOperation.type) {
        case 'query':
          response = await this.executeSingleQuery(validatedOperation);
          break;
        case 'transaction':
          response = await this.executeTransaction(validatedOperation);
          break;
        case 'migration':
          response = await this.runMigrations();
          break;
        case 'backup':
          response = await this.createBackup(validatedOperation.options);
          break;
        default:
          throw new Error(`Unsupported operation type: ${validatedOperation.type}`);
      }

      // Update audit log with success
      mcpSecurity.logAudit({
        action: 'database_query',
        server: 'neon',
        tool: 'run_sql',
        arguments: validatedOperation,
        success: true
      });

      return response;
    } catch (error) {
      // Update audit log with error
      mcpSecurity.logAudit({
        action: 'database_query',
        server: 'neon',
        tool: 'run_sql',
        arguments: validatedOperation,
        success: false,
        error: (error as Error).message
      });

      throw error;
    }
  }

  private async executeSingleQuery(operation: DatabaseOperation): Promise<MCPResponse> {
    if (!operation.sql) {
      throw new Error('SQL query is required');
    }

    return mcpClient.callTool({
      server: 'neon',
      tool: 'run_sql',
      arguments: {
        projectId: this.config.projectId,
        sql: operation.sql,
        branchId: this.config.branchId
      }
    });
  }

  private async executeTransaction(operation: DatabaseOperation): Promise<MCPResponse> {
    if (!operation.statements || operation.statements.length === 0) {
      throw new Error('Transaction statements are required');
    }

    return mcpClient.callTool({
      server: 'neon',
      tool: 'run_sql_transaction',
      arguments: {
        projectId: this.config.projectId,
        sqlStatements: operation.statements,
        branchId: this.config.branchId
      }
    });
  }

  private async runMigrations(): Promise<MCPResponse> {
    try {
      const result = await this.migrationManager.runMigrations(this.config.projectId, this.config);
      
      return {
        success: result.errors.length === 0,
        data: result,
        metadata: {
          server: 'neon',
          tool: 'migration',
          duration: 0,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: (error as Error).message,
        metadata: {
          server: 'neon',
          tool: 'migration',
          duration: 0,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  private async createBackup(options?: any): Promise<MCPResponse> {
    try {
      const result = await this.backupManager.createBackup(this.config.projectId, this.config, options);
      
      return {
        success: true,
        data: result,
        metadata: {
          server: 'neon',
          tool: 'backup',
          duration: 0,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: (error as Error).message,
        metadata: {
          server: 'neon',
          tool: 'backup',
          duration: 0,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Convenience methods for common operations
  async select(table: string, options?: Parameters<typeof QueryBuilder.buildSelectQuery>[1]): Promise<any[]> {
    const { sql, parameters } = QueryBuilder.buildSelectQuery(table, options || {});
    const response = await this.executeQuery({
      type: 'query',
      sql,
      parameters
    });

    return response.success ? response.data.rows || [] : [];
  }

  async insert(table: string, data: Record<string, any>): Promise<any> {
    const { sql, parameters } = QueryBuilder.buildInsertQuery(table, data);
    const response = await this.executeQuery({
      type: 'query',
      sql,
      parameters
    });

    return response.success ? response.data.rows?.[0] : null;
  }

  async update(table: string, data: Record<string, any>, where: Record<string, any>): Promise<any> {
    const { sql, parameters } = QueryBuilder.buildUpdateQuery(table, data, where);
    const response = await this.executeQuery({
      type: 'query',
      sql,
      parameters
    });

    return response.success ? response.data.rows?.[0] : null;
  }

  async delete(table: string, where: Record<string, any>): Promise<any> {
    const { sql, parameters } = QueryBuilder.buildDeleteQuery(table, where);
    const response = await this.executeQuery({
      type: 'query',
      sql,
      parameters
    });

    return response.success ? response.data.rows?.[0] : null;
  }

  async getConnectionString(): Promise<string> {
    const response = await mcpClient.callTool({
      server: 'neon',
      tool: 'get_connection_string',
      arguments: {
        projectId: this.config.projectId,
        branchId: this.config.branchId
      }
    });

    if (!response.success) {
      throw new Error(`Failed to get connection string: ${response.error}`);
    }

    return response.data.connection_string;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.executeQuery({
        type: 'query',
        sql: 'SELECT 1 as health_check'
      });
      return response.success;
    } catch (error) {
      return false;
    }
  }

  getConfig(): Omit<DatabaseConfig, 'databaseUrl'> {
    // Return config without sensitive data
    return {
      ...this.config,
      databaseUrl: '***'
    };
  }
}

// Initialize with environment variables
const defaultDatabaseConfig: DatabaseConfig = {
  projectId: process.env.NEON_PROJECT_ID || 'plain-recipe-77049551',
  databaseUrl: process.env.DATABASE_URL || '',
  branchId: process.env.NEON_BRANCH_ID,
  maxConnections: 10,
  idleTimeout: 30000,
  connectionTimeout: 10000,
  ssl: true
};

export const mcpDatabase = new MCPDatabaseManager(defaultDatabaseConfig);