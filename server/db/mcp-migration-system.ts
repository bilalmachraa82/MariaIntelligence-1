/**
 * MCP Migration System
 * Advanced database migration system with rollback capabilities
 * Designed for production-grade database schema management
 */

import { getNeonMCPManager, type NeonMCPManager, type Migration } from './neon-mcp-manager';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Migration status enum
export enum MigrationStatus {
  PENDING = 'pending',
  APPLIED = 'applied',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

// Enhanced migration interface
export interface EnhancedMigration extends Migration {
  version: string;
  description: string;
  author: string;
  createdAt: Date;
  appliedAt?: Date;
  rolledBackAt?: Date;
  status: MigrationStatus;
  dependencies?: string[];
  tags?: string[];
  estimatedDuration?: number; // in milliseconds
  backupRequired?: boolean;
}

// Migration result interface
export interface MigrationResult {
  migration: EnhancedMigration;
  success: boolean;
  duration: number;
  error?: string;
  rollbackAvailable: boolean;
}

// Migration plan interface
export interface MigrationPlan {
  migrationsToApply: EnhancedMigration[];
  totalEstimatedDuration: number;
  requiresBackup: boolean;
  dependencies: string[];
  warnings: string[];
}

export class MCPMigrationSystem {
  private manager: NeonMCPManager;
  private migrationsDir: string;
  private migrationTable = 'mcp_schema_migrations';

  constructor(migrationsDir?: string) {
    this.manager = getNeonMCPManager();
    this.migrationsDir = migrationsDir || join(process.cwd(), 'migrations');
  }

  // Initialize migration system
  public async initialize(): Promise<void> {
    try {
      // Create migrations directory if it doesn't exist
      await fs.mkdir(this.migrationsDir, { recursive: true });

      // Create migration tracking table
      await this.createMigrationTable();

      console.log('✅ MCP Migration System initialized');
    } catch (error) {
      console.error('❌ Failed to initialize migration system:', error);
      throw error;
    }
  }

  private async createMigrationTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${this.migrationTable} (
        id VARCHAR(255) PRIMARY KEY,
        version VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        author VARCHAR(255),
        checksum VARCHAR(255) NOT NULL,
        sql_content TEXT NOT NULL,
        rollback_sql TEXT,
        status VARCHAR(50) DEFAULT '${MigrationStatus.PENDING}',
        created_at TIMESTAMP DEFAULT NOW(),
        applied_at TIMESTAMP,
        rolled_back_at TIMESTAMP,
        duration INTEGER, -- in milliseconds
        dependencies TEXT[], -- JSON array of migration IDs
        tags TEXT[], -- JSON array of tags
        estimated_duration INTEGER,
        backup_required BOOLEAN DEFAULT FALSE,
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_${this.migrationTable}_version ON ${this.migrationTable}(version);
      CREATE INDEX IF NOT EXISTS idx_${this.migrationTable}_status ON ${this.migrationTable}(status);
      CREATE INDEX IF NOT EXISTS idx_${this.migrationTable}_applied_at ON ${this.migrationTable}(applied_at);
    `;

    await this.manager.executeQuery(createTableSQL);
  }

  // Create new migration file
  public async createMigration(
    name: string,
    options: {
      description?: string;
      author?: string;
      tags?: string[];
      estimatedDuration?: number;
      backupRequired?: boolean;
      template?: 'table' | 'index' | 'data' | 'custom';
    } = {}
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const version = `${timestamp}_${Date.now()}`;
    const fileName = `${version}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.sql`;
    const filePath = join(this.migrationsDir, fileName);

    // Generate migration template based on type
    const template = this.generateMigrationTemplate(options.template || 'custom', name);

    const migrationContent = `-- Migration: ${name}
-- Version: ${version}
-- Description: ${options.description || 'No description provided'}
-- Author: ${options.author || 'Unknown'}
-- Created: ${new Date().toISOString()}
-- Tags: ${options.tags?.join(', ') || 'none'}
-- Estimated Duration: ${options.estimatedDuration || 0}ms
-- Backup Required: ${options.backupRequired || false}

-- Migration SQL (UP)
${template.up}

-- Rollback SQL (DOWN) - Optional but recommended
${template.down}
`;

    await fs.writeFile(filePath, migrationContent, 'utf8');

    console.log(`✅ Migration created: ${fileName}`);
    return filePath;
  }

  private generateMigrationTemplate(type: string, name: string): { up: string; down: string } {
    switch (type) {
      case 'table':
        return {
          up: `CREATE TABLE ${name} (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`,
          down: `DROP TABLE IF EXISTS ${name};`,
        };

      case 'index':
        return {
          up: `CREATE INDEX IF NOT EXISTS idx_${name} ON table_name (column_name);`,
          down: `DROP INDEX IF EXISTS idx_${name};`,
        };

      case 'data':
        return {
          up: `INSERT INTO table_name (column1, column2) VALUES 
  ('value1', 'value2');`,
          down: `DELETE FROM table_name WHERE condition;`,
        };

      default:
        return {
          up: `-- Add your migration SQL here
-- Example: ALTER TABLE users ADD COLUMN email VARCHAR(255);`,
          down: `-- Add your rollback SQL here
-- Example: ALTER TABLE users DROP COLUMN email;`,
        };
    }
  }

  // Load migrations from files
  public async loadMigrationsFromFiles(): Promise<EnhancedMigration[]> {
    try {
      const files = await fs.readdir(this.migrationsDir);
      const migrationFiles = files
        .filter(file => file.endsWith('.sql'))
        .sort();

      const migrations: EnhancedMigration[] = [];

      for (const file of migrationFiles) {
        const filePath = join(this.migrationsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        const migration = this.parseMigrationFile(file, content);
        migrations.push(migration);
      }

      return migrations;
    } catch (error) {
      console.error('❌ Failed to load migrations from files:', error);
      throw error;
    }
  }

  private parseMigrationFile(fileName: string, content: string): EnhancedMigration {
    // Extract metadata from comments
    const lines = content.split('\n');
    const metadata: any = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-- ')) {
        const comment = trimmed.substring(3);
        const colonIndex = comment.indexOf(':');
        if (colonIndex > 0) {
          const key = comment.substring(0, colonIndex).trim().toLowerCase().replace(/\s+/g, '');
          const value = comment.substring(colonIndex + 1).trim();
          metadata[key] = value;
        }
      }
    }

    // Extract UP and DOWN SQL
    const upMatch = content.match(/-- Migration SQL \(UP\)([\s\S]*?)-- Rollback SQL \(DOWN\)/);
    const downMatch = content.match(/-- Rollback SQL \(DOWN\)[^\n]*\n([\s\S]*?)$/);

    const upSQL = upMatch ? upMatch[1].trim() : '';
    const downSQL = downMatch ? downMatch[1].trim() : '';

    // Generate migration ID from filename
    const id = fileName.replace('.sql', '');
    const version = metadata.version || id.split('_')[0];

    return {
      id,
      name: metadata.migration || fileName.replace('.sql', ''),
      version,
      description: metadata.description || '',
      author: metadata.author || 'Unknown',
      sql: upSQL,
      rollbackSql: downSQL,
      checksum: this.generateChecksum(upSQL),
      status: MigrationStatus.PENDING,
      createdAt: new Date(metadata.created || Date.now()),
      dependencies: metadata.dependencies ? JSON.parse(metadata.dependencies) : [],
      tags: metadata.tags ? metadata.tags.split(',').map((t: string) => t.trim()) : [],
      estimatedDuration: parseInt(metadata.estimatedduration) || 0,
      backupRequired: metadata.backuprequired === 'true',
    };
  }

  // Get migration status from database
  public async getMigrationStatus(): Promise<EnhancedMigration[]> {
    const result = await this.manager.executeQuery(`
      SELECT * FROM ${this.migrationTable} 
      ORDER BY version ASC, created_at ASC
    `);

    return result.map(row => ({
      id: row.id,
      name: row.name,
      version: row.version,
      description: row.description,
      author: row.author,
      sql: row.sql_content,
      rollbackSql: row.rollback_sql,
      checksum: row.checksum,
      status: row.status as MigrationStatus,
      createdAt: new Date(row.created_at),
      appliedAt: row.applied_at ? new Date(row.applied_at) : undefined,
      rolledBackAt: row.rolled_back_at ? new Date(row.rolled_back_at) : undefined,
      dependencies: row.dependencies || [],
      tags: row.tags || [],
      estimatedDuration: row.estimated_duration || 0,
      backupRequired: row.backup_required || false,
    }));
  }

  // Create migration plan
  public async createMigrationPlan(): Promise<MigrationPlan> {
    const fileMigrations = await this.loadMigrationsFromFiles();
    const dbMigrations = await this.getMigrationStatus();
    
    // Create lookup for applied migrations
    const appliedMigrations = new Set(
      dbMigrations
        .filter(m => m.status === MigrationStatus.APPLIED)
        .map(m => m.id)
    );

    // Find migrations that need to be applied
    const migrationsToApply = fileMigrations.filter(migration => {
      // Check if migration is already applied
      if (appliedMigrations.has(migration.id)) {
        return false;
      }

      // Check if all dependencies are satisfied
      if (migration.dependencies?.length) {
        return migration.dependencies.every(dep => appliedMigrations.has(dep));
      }

      return true;
    });

    // Sort by dependencies and version
    migrationsToApply.sort((a, b) => {
      // If a depends on b, b should come first
      if (a.dependencies?.includes(b.id)) return 1;
      if (b.dependencies?.includes(a.id)) return -1;
      
      // Otherwise sort by version
      return a.version.localeCompare(b.version);
    });

    const totalEstimatedDuration = migrationsToApply.reduce(
      (sum, m) => sum + (m.estimatedDuration || 0), 
      0
    );

    const requiresBackup = migrationsToApply.some(m => m.backupRequired);

    const warnings: string[] = [];
    
    // Add warnings for potentially dangerous operations
    migrationsToApply.forEach(migration => {
      const sql = migration.sql.toLowerCase();
      if (sql.includes('drop table') || sql.includes('drop column')) {
        warnings.push(`Migration ${migration.id} contains potentially destructive operations`);
      }
      if (!migration.rollbackSql) {
        warnings.push(`Migration ${migration.id} has no rollback SQL defined`);
      }
    });

    return {
      migrationsToApply,
      totalEstimatedDuration,
      requiresBackup,
      dependencies: [...new Set(migrationsToApply.flatMap(m => m.dependencies || []))],
      warnings,
    };
  }

  // Execute migration plan
  public async executeMigrationPlan(
    plan: MigrationPlan,
    options: { 
      dryRun?: boolean; 
      backupBeforeApply?: boolean;
      continueOnError?: boolean;
    } = {}
  ): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    if (options.dryRun) {
      console.log('🔍 DRY RUN: Would execute the following migrations:');
      plan.migrationsToApply.forEach(migration => {
        console.log(`  - ${migration.id}: ${migration.name}`);
      });
      return results;
    }

    // Create backup if required
    if (options.backupBeforeApply && plan.requiresBackup) {
      console.log('📦 Creating backup before applying migrations...');
      await this.manager.createBackup({
        includeData: true,
        compress: true,
      });
    }

    // Execute migrations in order
    for (const migration of plan.migrationsToApply) {
      console.log(`🔄 Applying migration: ${migration.id}`);
      
      const result = await this.applyMigration(migration);
      results.push(result);

      if (!result.success && !options.continueOnError) {
        console.error(`❌ Migration failed: ${migration.id}`);
        break;
      }
    }

    return results;
  }

  // Apply single migration
  public async applyMigration(migration: EnhancedMigration): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      // Record migration in database first
      await this.recordMigration(migration);

      // Execute migration SQL in transaction
      await this.manager.executeInTransaction(async (client) => {
        // Split SQL by semicolons and execute each statement
        const statements = migration.sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          await client.query(statement);
        }
      });

      // Update migration status
      const duration = Date.now() - startTime;
      await this.updateMigrationStatus(migration.id, MigrationStatus.APPLIED, duration);

      console.log(`✅ Migration applied successfully: ${migration.id} (${duration}ms)`);

      return {
        migration,
        success: true,
        duration,
        rollbackAvailable: !!migration.rollbackSql,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Update migration status to failed
      await this.updateMigrationStatus(migration.id, MigrationStatus.FAILED, duration, errorMessage);

      console.error(`❌ Migration failed: ${migration.id}`, error);

      return {
        migration,
        success: false,
        duration,
        error: errorMessage,
        rollbackAvailable: !!migration.rollbackSql,
      };
    }
  }

  // Rollback migration
  public async rollbackMigration(migrationId: string): Promise<MigrationResult> {
    const migration = await this.getMigrationById(migrationId);
    
    if (!migration) {
      throw new Error(`Migration not found: ${migrationId}`);
    }

    if (migration.status !== MigrationStatus.APPLIED) {
      throw new Error(`Migration ${migrationId} is not in applied state`);
    }

    if (!migration.rollbackSql) {
      throw new Error(`Migration ${migrationId} has no rollback SQL`);
    }

    const startTime = Date.now();

    try {
      // Execute rollback SQL in transaction
      await this.manager.executeInTransaction(async (client) => {
        const statements = migration.rollbackSql!
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        for (const statement of statements) {
          await client.query(statement);
        }
      });

      // Update migration status
      const duration = Date.now() - startTime;
      await this.manager.executeQuery(`
        UPDATE ${this.migrationTable} 
        SET status = $1, rolled_back_at = NOW(), duration = $2
        WHERE id = $3
      `, [MigrationStatus.ROLLED_BACK, duration, migrationId]);

      console.log(`✅ Migration rolled back successfully: ${migrationId} (${duration}ms)`);

      return {
        migration,
        success: true,
        duration,
        rollbackAvailable: false, // Can't rollback a rollback
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.error(`❌ Migration rollback failed: ${migrationId}`, error);

      return {
        migration,
        success: false,
        duration,
        error: errorMessage,
        rollbackAvailable: true,
      };
    }
  }

  // Helper methods
  private async recordMigration(migration: EnhancedMigration): Promise<void> {
    await this.manager.executeQuery(`
      INSERT INTO ${this.migrationTable} (
        id, version, name, description, author, checksum, sql_content, 
        rollback_sql, dependencies, tags, estimated_duration, backup_required
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO NOTHING
    `, [
      migration.id,
      migration.version,
      migration.name,
      migration.description,
      migration.author,
      migration.checksum,
      migration.sql,
      migration.rollbackSql,
      migration.dependencies,
      migration.tags,
      migration.estimatedDuration,
      migration.backupRequired,
    ]);
  }

  private async updateMigrationStatus(
    migrationId: string, 
    status: MigrationStatus, 
    duration: number,
    errorMessage?: string
  ): Promise<void> {
    await this.manager.executeQuery(`
      UPDATE ${this.migrationTable} 
      SET status = $1, applied_at = NOW(), duration = $2, error_message = $3
      WHERE id = $4
    `, [status, duration, errorMessage, migrationId]);
  }

  private async getMigrationById(migrationId: string): Promise<EnhancedMigration | null> {
    const result = await this.manager.executeQuery(`
      SELECT * FROM ${this.migrationTable} WHERE id = $1
    `, [migrationId]);

    if (result.length === 0) return null;

    const row = result[0];
    return {
      id: row.id,
      name: row.name,
      version: row.version,
      description: row.description,
      author: row.author,
      sql: row.sql_content,
      rollbackSql: row.rollback_sql,
      checksum: row.checksum,
      status: row.status as MigrationStatus,
      createdAt: new Date(row.created_at),
      appliedAt: row.applied_at ? new Date(row.applied_at) : undefined,
      rolledBackAt: row.rolled_back_at ? new Date(row.rolled_back_at) : undefined,
      dependencies: row.dependencies || [],
      tags: row.tags || [],
      estimatedDuration: row.estimated_duration || 0,
      backupRequired: row.backup_required || false,
    };
  }

  private generateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  // CLI-style methods for easy usage
  public async status(): Promise<void> {
    const plan = await this.createMigrationPlan();
    
    console.log('\n📊 Migration Status:');
    console.log(`  Pending migrations: ${plan.migrationsToApply.length}`);
    console.log(`  Estimated duration: ${plan.totalEstimatedDuration}ms`);
    console.log(`  Backup required: ${plan.requiresBackup ? 'Yes' : 'No'}`);
    
    if (plan.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      plan.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (plan.migrationsToApply.length > 0) {
      console.log('\n📋 Pending Migrations:');
      plan.migrationsToApply.forEach(migration => {
        console.log(`  - ${migration.id}: ${migration.name}`);
      });
    } else {
      console.log('\n✅ All migrations are up to date');
    }
  }

  public async up(): Promise<void> {
    const plan = await this.createMigrationPlan();
    
    if (plan.migrationsToApply.length === 0) {
      console.log('✅ All migrations are up to date');
      return;
    }

    const results = await this.executeMigrationPlan(plan, { backupBeforeApply: true });
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`  ✅ Successful: ${successful}`);
    console.log(`  ❌ Failed: ${failed}`);
  }

  public async down(migrationId?: string): Promise<void> {
    if (migrationId) {
      const result = await this.rollbackMigration(migrationId);
      if (result.success) {
        console.log(`✅ Successfully rolled back migration: ${migrationId}`);
      } else {
        console.error(`❌ Failed to rollback migration: ${migrationId}`);
      }
    } else {
      // Get last applied migration
      const applied = await this.getMigrationStatus();
      const lastApplied = applied
        .filter(m => m.status === MigrationStatus.APPLIED)
        .sort((a, b) => (b.appliedAt?.getTime() || 0) - (a.appliedAt?.getTime() || 0))[0];

      if (!lastApplied) {
        console.log('ℹ️ No migrations to rollback');
        return;
      }

      await this.down(lastApplied.id);
    }
  }
}

// Export singleton instance
let migrationSystemInstance: MCPMigrationSystem | null = null;

export function createMCPMigrationSystem(migrationsDir?: string): MCPMigrationSystem {
  if (!migrationSystemInstance) {
    migrationSystemInstance = new MCPMigrationSystem(migrationsDir);
  }
  return migrationSystemInstance;
}

export function getMCPMigrationSystem(): MCPMigrationSystem {
  if (!migrationSystemInstance) {
    throw new Error('MCP Migration System not initialized. Call createMCPMigrationSystem first.');
  }
  return migrationSystemInstance;
}