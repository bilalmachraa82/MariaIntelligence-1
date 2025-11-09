#!/usr/bin/env node

/**
 * Maria Faz Performance Indexes Migration Runner
 * Executes the add-performance-indexes.sql migration
 *
 * Usage:
 *   npm run db:migrate:performance
 *   or
 *   npx tsx server/db/migrations/run-performance-indexes.ts
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

// =====================================================
// HELP FUNCTION - DEFINED FIRST
// =====================================================

function showHelp() {
  console.log(`
Maria Faz Performance Indexes Migration Runner

Usage:
  npm run db:migrate:performance              Run the performance indexes migration
  npx tsx run-performance-indexes.ts          Run directly with tsx
  npx tsx run-performance-indexes.ts --force  Force re-run migration
  npx tsx run-performance-indexes.ts --help   Show this help

Options:
  --force, -f    Force re-run migration even if already executed
  --help, -h     Show this help message

Environment Variables:
  DATABASE_URL   PostgreSQL connection string (required)

Examples:
  DATABASE_URL="postgresql://user:pass@host:port/db" npm run db:migrate:performance
  npm run db:migrate:performance --force

Indexes Added:
  • Financial Documents: issue_date, due_date, document_number, entity_lookup
  • Reservations: source, guest_phone, availability composite
  • Payment Records: payment_method, payment_date, reference, document_date
  • Quotations: valid_until, client_email, client_name, property_type
  • Maintenance Tasks: due_date, assigned_to, reported_at, priority_schedule
  • Activities: entity_history, type_date
  • Knowledge Embeddings: content_type, updated_at
  • Query Embeddings: frequency, last_used
  • Conversation History: user_id, role, timestamp
  • Properties: aliases (GIN), cleaning_team
  • Financial Document Items: description
`);
}

// Load environment variables
dotenv.config();

// Handle help command first (before checking DATABASE_URL)
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// =====================================================
// CONFIGURATION
// =====================================================

const DATABASE_URL = process.env.DATABASE_URL;
const MIGRATION_FILE = 'add-performance-indexes.sql';
const MIGRATION_NAME = 'add-performance-indexes.sql';

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

// =====================================================
// MIGRATION RUNNER
// =====================================================

async function runPerformanceIndexesMigration() {
  console.log('🚀 Maria Faz Performance Indexes Migration');
  console.log('==========================================');

  try {
    // Initialize database connection
    console.log('🔌 Connecting to database...');
    const sqlClient = neon(DATABASE_URL);
    const db = drizzle(sqlClient);

    console.log('✅ Database connection established');

    // Check if migration has already been run
    const existingMigration = await checkMigrationStatus(db);
    if (existingMigration) {
      console.log('⚠️  Migration already executed on:', existingMigration.executed_at);
      const shouldRerun = process.argv.includes('--force') || process.argv.includes('-f');

      if (!shouldRerun) {
        console.log('💡 Use --force or -f flag to re-run the migration');
        console.log('🏁 Migration runner completed (no changes made)');
        return;
      }

      console.log('🔄 Re-running migration with --force flag');
    }

    // Read migration file
    console.log('📖 Reading migration file...');
    const migrationPath = path.join(__dirname, MIGRATION_FILE);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`✅ Migration file loaded (${migrationSQL.length} characters)`);

    // Execute migration
    console.log('⚡ Executing migration...');
    const startTime = Date.now();

    try {
      // Execute the entire migration as a single transaction
      await sqlClient(migrationSQL);

      const executionTime = Date.now() - startTime;
      console.log(`✅ Migration executed successfully in ${executionTime}ms`);

    } catch (error: any) {
      console.error('❌ Migration execution failed:', error.message);
      throw error;
    }

    // Run post-migration verification
    console.log('📊 Running post-migration verification...');
    await runPostMigrationVerification(db);

    console.log('🎉 Performance indexes migration completed successfully!');
    console.log('==========================================');

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
      console.log('⚠️  Migration log table not found - base migration may not have been run');
      return false;
    }

    const migrationExists = await db.execute(sql`
      SELECT * FROM migration_log
      WHERE migration_name = ${MIGRATION_NAME}
      ORDER BY executed_at DESC
      LIMIT 1
    `);

    return migrationExists.length > 0 ? migrationExists[0] : null;

  } catch (error) {
    return false;
  }
}

async function runPostMigrationVerification(db: any) {
  try {
    console.log('📈 Verification Results:');

    // Check specific new indexes
    const newIndexes = [
      'idx_financial_documents_issue_date',
      'idx_financial_documents_due_date',
      'idx_reservations_source',
      'idx_payment_records_payment_method',
      'idx_quotations_valid_until',
      'idx_maintenance_tasks_due_date',
      'idx_knowledge_embeddings_content_type',
      'idx_conversation_history_user_id',
      'idx_properties_aliases_gin'
    ];

    console.log('  🔍 Verifying key indexes:');
    for (const indexName of newIndexes) {
      try {
        const result = await db.execute(sql`
          SELECT
            schemaname,
            tablename,
            indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
          AND indexname = ${indexName}
        `);

        if (result.length > 0) {
          console.log(`    ✅ ${indexName} on ${result[0].tablename}`);
        } else {
          console.log(`    ⚠️  ${indexName} not found`);
        }
      } catch (error) {
        console.log(`    ❌ Error checking ${indexName}`);
      }
    }

    // Count total indexes per table
    console.log('\n  📊 Index summary by table:');
    try {
      const indexSummary = await db.execute(sql`
        SELECT
          tablename,
          COUNT(*) as index_count
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname LIKE 'idx_%'
        GROUP BY tablename
        ORDER BY index_count DESC
        LIMIT 10
      `);

      for (const row of indexSummary) {
        console.log(`    📋 ${row.tablename}: ${row.index_count} indexes`);
      }
    } catch (error) {
      console.log('    ⚠️  Could not retrieve index summary');
    }

    // Show index storage impact
    console.log('\n  💾 Top 5 largest indexes:');
    try {
      const indexSizes = await db.execute(sql`
        SELECT
          schemaname,
          tablename,
          indexrelname as indexname,
          pg_size_pretty(pg_relation_size(indexrelid)) as size
        FROM pg_catalog.pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND indexrelname LIKE 'idx_%'
        ORDER BY pg_relation_size(indexrelid) DESC
        LIMIT 5
      `);

      for (const row of indexSizes) {
        console.log(`    💽 ${row.indexname}: ${row.size}`);
      }
    } catch (error) {
      console.log('    ⚠️  Could not retrieve index sizes');
    }

  } catch (error: any) {
    console.warn('⚠️  Post-migration verification failed:', error.message);
  }
}

// =====================================================
// RUN MIGRATION
// =====================================================
runPerformanceIndexesMigration().catch((error) => {
  console.error('❌ Migration runner failed:', error);
  process.exit(1);
});

export { runPerformanceIndexesMigration };
