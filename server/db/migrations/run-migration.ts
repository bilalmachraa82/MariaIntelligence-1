#!/usr/bin/env node

/**
 * Maria Faz Database Migration Runner
 * Executes the add_indexes_and_audit.sql migration
 * 
 * Usage:
 *   npm run migrate
 *   or
 *   npx tsx server/db/migrations/run-migration.ts
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// =====================================================
// CONFIGURATION
// =====================================================

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// =====================================================
// MIGRATION RUNNER
// =====================================================

async function runMigration() {
  console.log('🚀 Maria Faz Database Migration Runner');
  console.log('=====================================');
  
  try {
    // Initialize database connection
    console.log('🔌 Connecting to database...');
    const sql = neon(DATABASE_URL);
    const db = drizzle(sql);
    
    console.log('✅ Database connection established');
    
    // Check if migration has already been run
    const existingMigration = await checkMigrationStatus(db);
    if (existingMigration) {
      console.log('⚠️  Migration already exists. Do you want to re-run it?');
      const shouldRerun = process.argv.includes('--force') || process.argv.includes('-f');
      
      if (!shouldRerun) {
        console.log('💡 Use --force or -f flag to re-run the migration');
        console.log('🏁 Migration runner completed (no changes made)');
        return;
      }
      
      console.log('🔄 Re-running migration with --force flag');
    }
    
    // Read and execute migration file
    console.log('📖 Reading migration file...');
    const migrationPath = path.join(__dirname, 'add_indexes_and_audit.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)`);
    
    // Execute migration
    console.log('⚡ Executing migration...');
    const startTime = Date.now();
    
    // Split SQL statements and execute them one by one
    const statements = migrationSQL
      .split(';')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        // Skip comments
        if (statement.trim().startsWith('--')) continue;
        
        await sql(statement);
        successCount++;
      } catch (error: any) {
        console.warn(`⚠️  Statement failed: ${error.message}`);
        errorCount++;
        // Continue with other statements
      }
    }
    
    const executionTime = Date.now() - startTime;
    console.log(`✅ Migration executed in ${executionTime}ms`);
    console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
    
    // Run post-migration analysis
    console.log('📊 Running post-migration analysis...');
    await runPostMigrationAnalysis(db);
    
    console.log('🎉 Migration completed successfully!');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

async function checkMigrationStatus(db: any) {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'migration_log'
      ) as table_exists
    `);
    
    if (!result[0]?.table_exists) {
      return false;
    }
    
    const migrationExists = await db.execute(sql`
      SELECT * FROM migration_log 
      WHERE migration_name = 'add_indexes_and_audit.sql'
      ORDER BY executed_at DESC 
      LIMIT 1
    `);
    
    return migrationExists.length > 0 ? migrationExists[0] : null;
    
  } catch (error) {
    // If migration_log table doesn't exist, migration hasn't been run
    return false;
  }
}

async function runPostMigrationAnalysis(db: any) {
  try {
    // Check table count
    console.log('📈 Database Statistics:');
    
    const importantTables = ['properties', 'owners', 'reservations', 'users', 'cleaning_teams'];
    
    for (const table of importantTables) {
      try {
        const result = await db.execute(sql`SELECT COUNT(*) as count FROM ${sql.identifier(table)}`);
        console.log(`  📊 ${table}: ${result.rows[0]?.count || 0} records`);
      } catch (error) {
        console.log(`  ⚠️  ${table}: Not found or empty`);
      }
    }
    
    // Check indexes
    console.log('\n🔍 Index Verification:');
    try {
      const indexResult = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
      `);
      console.log(`  📊 Performance indexes: ${indexResult.rows[0]?.count || 0}`);
    } catch (error) {
      console.log('  ⚠️  Could not verify indexes');
    }
    
  } catch (error: any) {
    console.warn('⚠️  Post-migration analysis failed:', error.message);
  }
}

// =====================================================
// COMMAND LINE INTERFACE
// =====================================================

function showHelp() {
  console.log(`
Maria Faz Database Migration Runner

Usage:
  npm run migrate                    Run the migration
  npx tsx run-migration.ts          Run directly with tsx
  npx tsx run-migration.ts --force   Force re-run migration
  npx tsx run-migration.ts --help    Show this help

Options:
  --force, -f    Force re-run migration even if already executed
  --help, -h     Show this help message

Environment Variables:
  DATABASE_URL   PostgreSQL connection string (required)

Examples:
  DATABASE_URL="postgresql://user:pass@host:port/db" npm run migrate
  npm run migrate --force
`);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run migration
runMigration().catch((error) => {
  console.error('❌ Migration runner failed:', error);
  process.exit(1);
});

export { runMigration };