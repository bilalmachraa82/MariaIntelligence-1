/**
 * Run initial schema migration
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

dotenv.config();

async function runInitialMigration() {
  try {
    const sql = neon(process.env.DATABASE_URL);

    console.log('🔧 Running initial schema migration...');

    // Read the initial migration file
    const migrationSQL = fs.readFileSync('./server/db/migrations/0001_initial_schema.sql', 'utf-8');

    // Split into statements and execute them
    const statements = migrationSQL
      .split(';')
      .filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'))
      .map(stmt => stmt.trim());

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        if (statement.trim()) {
          await sql([statement]);
          successCount++;
          console.log(`✅ Executed: ${statement.substring(0, 50)}...`);
        }
      } catch (error) {
        console.log(`⚠️ Warning: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Results:`);
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ⚠️ Warnings: ${errorCount}`);

    // Now check if the new schema is working
    console.log('\n🔍 Checking new schema...');

    try {
      // Check if the new columns exist in properties table
      const result = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'properties'
        AND column_name IN ('owner_id', 'cleaning_cost', 'check_in_fee')
        ORDER BY column_name
      `;

      console.log('New properties columns found:', result.map(r => r.column_name));

      // Check if the new columns exist in reservations table
      const reservationCols = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'reservations'
        AND column_name IN ('property_id', 'check_in_date', 'check_out_date', 'guest_name')
        ORDER BY column_name
      `;

      console.log('New reservation columns found:', reservationCols.map(r => r.column_name));

    } catch (err) {
      console.log('Schema check failed:', err.message);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

runInitialMigration().catch(console.error);