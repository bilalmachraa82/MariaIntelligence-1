/**
 * Maria Faz Database Migration Utilities
 * Companion file for add_indexes_and_audit.sql
 * Provides TypeScript utilities for audit functionality
 */

import { sql } from 'drizzle-orm';
import type { PgDatabase } from 'drizzle-orm/pg-core';

// =====================================================
// AUDIT COLUMN TYPES
// =====================================================

export interface AuditColumns {
  created_at?: Date;
  updated_at?: Date;
  created_by?: number | null;
  updated_by?: number | null;
  deleted_at?: Date | null;
  deleted_by?: number | null;
}

export interface SoftDeleteColumns {
  deleted_at?: Date | null;
  deleted_by?: number | null;
}

// =====================================================
// MIGRATION EXECUTION UTILITIES
// =====================================================

/**
 * Execute the main migration SQL file
 */
export async function executeMigration(db: PgDatabase<any>) {
  try {
    console.log('🚀 Starting database migration: add_indexes_and_audit.sql');
    
    // Read and execute the SQL migration file
    const fs = await import('fs');
    const path = await import('path');
    
    const migrationPath = path.join(__dirname, 'add_indexes_and_audit.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    // Execute the migration
    await db.execute(sql.raw(migrationSQL));
    
    console.log('✅ Migration completed successfully');
    
    // Verify migration
    await verifyMigration(db);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Verify that the migration was applied correctly
 */
export async function verifyMigration(db: PgDatabase<any>) {
  console.log('🔍 Verifying migration...');
  
  try {
    // Check audit columns
    const auditColumns = await db.execute(sql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND column_name IN ('created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at', 'deleted_by')
      ORDER BY table_name, column_name
    `);
    
    console.log(`✅ Found ${auditColumns.length} audit columns`);
    
    // Check indexes
    const indexes = await db.execute(sql`
      SELECT schemaname, tablename, indexname
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
    
    console.log(`✅ Found ${indexes.length} performance indexes`);
    
    // Check triggers
    const triggers = await db.execute(sql`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND trigger_name LIKE '%updated_at%'
    `);
    
    console.log(`✅ Found ${triggers.length} automatic triggers`);
    
    // Check views
    const views = await db.execute(sql`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name IN ('active_properties', 'active_reservations', 'pending_maintenance', 'financial_summary')
    `);
    
    console.log(`✅ Found ${views.length} utility views`);
    
    // Check functions
    const functions = await db.execute(sql`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name IN ('get_property_occupancy_rate', 'get_property_revenue', 'update_updated_at_column')
    `);
    
    console.log(`✅ Found ${functions.length} utility functions`);
    
    console.log('✅ Migration verification completed successfully');
    
  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    throw error;
  }
}

// =====================================================
// SOFT DELETE UTILITIES
// =====================================================

/**
 * Soft delete a record by setting deleted_at and deleted_by
 */
export function createSoftDeleteQuery(tableName: string, id: number, deletedBy: number) {
  return sql.raw(`
    UPDATE ${tableName} 
    SET deleted_at = NOW(), deleted_by = ${deletedBy}
    WHERE id = ${id} AND deleted_at IS NULL
  `);
}

/**
 * Restore a soft-deleted record
 */
export function createRestoreQuery(tableName: string, id: number) {
  return sql.raw(`
    UPDATE ${tableName} 
    SET deleted_at = NULL, deleted_by = NULL
    WHERE id = ${id} AND deleted_at IS NOT NULL
  `);
}

/**
 * Get all non-deleted records from a table
 */
export function createActiveRecordsQuery(tableName: string) {
  return sql.raw(`
    SELECT * FROM ${tableName} 
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `);
}

// =====================================================
// AUDIT TRAIL UTILITIES
// =====================================================

/**
 * Create audit trail for record changes
 */
export async function createAuditTrail(
  db: PgDatabase<any>,
  tableName: string,
  recordId: number,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  userId: number,
  changes?: Record<string, any>
) {
  const auditData = {
    table_name: tableName,
    record_id: recordId,
    action,
    user_id: userId,
    changes: changes ? JSON.stringify(changes) : null,
    timestamp: new Date()
  };
  
  // Insert into activities table as audit trail
  await db.execute(sql`
    INSERT INTO activities (type, entity_id, entity_type, description, created_by)
    VALUES (
      ${action.toLowerCase()}, 
      ${recordId}, 
      ${tableName}, 
      ${`${action} operation on ${tableName} record ${recordId}`},
      ${userId}
    )
  `);
}

// =====================================================
// PERFORMANCE MONITORING UTILITIES
// =====================================================

/**
 * Get database performance statistics
 */
export async function getDatabaseStats(db: PgDatabase<any>) {
  const stats = await db.execute(sql`
    SELECT 
      schemaname,
      tablename,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_tuples,
      n_dead_tup as dead_tuples,
      last_vacuum,
      last_autovacuum,
      last_analyze,
      last_autoanalyze
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY n_live_tup DESC
  `);
  
  return stats;
}

/**
 * Get index usage statistics
 */
export async function getIndexStats(db: PgDatabase<any>) {
  const stats = await db.execute(sql`
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_tup_read,
      idx_tup_fetch,
      idx_scan
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan DESC
  `);
  
  return stats;
}

/**
 * Get slow queries and performance issues
 */
export async function getSlowQueries(db: PgDatabase<any>) {
  // This requires pg_stat_statements extension
  try {
    const queries = await db.execute(sql`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
      ORDER BY mean_time DESC
      LIMIT 10
    `);
    
    return queries;
  } catch (error) {
    console.warn('pg_stat_statements extension not available for slow query analysis');
    return [];
  }
}

// =====================================================
// PROPERTY-SPECIFIC UTILITIES
// =====================================================

/**
 * Get property occupancy rate using the database function
 */
export async function getPropertyOccupancyRate(
  db: PgDatabase<any>,
  propertyId: number,
  startDate?: Date,
  endDate?: Date
) {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const end = endDate || new Date();
  
  const result = await db.execute(sql`
    SELECT get_property_occupancy_rate(${propertyId}, ${start.toISOString().split('T')[0]}, ${end.toISOString().split('T')[0]}) as occupancy_rate
  `);
  
  return result[0]?.occupancy_rate || 0;
}

/**
 * Get property revenue using the database function
 */
export async function getPropertyRevenue(
  db: PgDatabase<any>,
  propertyId: number,
  startDate?: Date,
  endDate?: Date
) {
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const end = endDate || new Date();
  
  const result = await db.execute(sql`
    SELECT get_property_revenue(${propertyId}, ${start.toISOString().split('T')[0]}, ${end.toISOString().split('T')[0]}) as revenue
  `);
  
  return result[0]?.revenue || 0;
}

// =====================================================
// MAINTENANCE UTILITIES
// =====================================================

/**
 * Run database maintenance tasks
 */
export async function runDatabaseMaintenance(db: PgDatabase<any>) {
  console.log('🔧 Running database maintenance...');
  
  try {
    // Update table statistics
    await db.execute(sql`ANALYZE`);
    console.log('✅ Table statistics updated');
    
    // Vacuum dead tuples (non-blocking)
    const tables = [
      'properties', 'owners', 'reservations', 'cleaning_teams',
      'maintenance_tasks', 'financial_documents', 'financial_document_items',
      'payment_records', 'quotations', 'activities'
    ];
    
    for (const table of tables) {
      await db.execute(sql.raw(`VACUUM (ANALYZE) ${table}`));
    }
    console.log('✅ Tables vacuumed and analyzed');
    
    // Get maintenance recommendations
    const recommendations = await getMaintenanceRecommendations(db);
    if (recommendations.length > 0) {
      console.log('💡 Maintenance recommendations:');
      recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
  } catch (error) {
    console.error('❌ Database maintenance failed:', error);
    throw error;
  }
}

/**
 * Get database maintenance recommendations
 */
export async function getMaintenanceRecommendations(db: PgDatabase<any>): Promise<string[]> {
  const recommendations: string[] = [];
  
  try {
    // Check for unused indexes
    const unusedIndexes = await db.execute(sql`
      SELECT schemaname, tablename, indexname
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0 AND schemaname = 'public'
      ORDER BY pg_relation_size(indexrelid) DESC
    `);
    
    if (unusedIndexes.length > 0) {
      recommendations.push(`Consider dropping ${unusedIndexes.length} unused indexes to save space`);
    }
    
    // Check for tables that need VACUUM
    const bloatedTables = await db.execute(sql`
      SELECT tablename, n_dead_tup
      FROM pg_stat_user_tables
      WHERE n_dead_tup > 1000 AND schemaname = 'public'
      ORDER BY n_dead_tup DESC
    `);
    
    if (bloatedTables.length > 0) {
      recommendations.push(`${bloatedTables.length} tables have significant dead tuples and may benefit from VACUUM`);
    }
    
    // Check for missing indexes on foreign keys
    const missingFKIndexes = await db.execute(sql`
      SELECT DISTINCT c.conrelid::regclass AS table_name, a.attname AS column_name
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
      WHERE c.contype = 'f'
        AND NOT EXISTS (
          SELECT 1 FROM pg_index i
          WHERE i.indrelid = c.conrelid
            AND a.attnum = ANY(i.indkey)
        )
    `);
    
    if (missingFKIndexes.length > 0) {
      recommendations.push(`${missingFKIndexes.length} foreign keys are missing indexes`);
    }
    
  } catch (error) {
    console.warn('Could not generate maintenance recommendations:', error);
  }
  
  return recommendations;
}

// =====================================================
// EXPORT ALL UTILITIES
// =====================================================

export const AuditUtils = {
  executeMigration,
  verifyMigration,
  createSoftDeleteQuery,
  createRestoreQuery,
  createActiveRecordsQuery,
  createAuditTrail,
  getDatabaseStats,
  getIndexStats,
  getSlowQueries,
  getPropertyOccupancyRate,
  getPropertyRevenue,
  runDatabaseMaintenance,
  getMaintenanceRecommendations
};

export default AuditUtils;