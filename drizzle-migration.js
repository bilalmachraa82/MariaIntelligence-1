/**
 * Direct Drizzle migration using push
 */

import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
// import * as schema from './shared/schema.js';

dotenv.config();

async function runDrizzleMigration() {
  try {
    console.log('🔧 Running Drizzle schema push...');

    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    console.log('✅ Database connection established');

    // Since we can't use drizzle-kit push directly, let's manually create the missing columns
    console.log('🔄 Adding missing columns to existing tables...');

    // First, let's add missing columns to properties table
    try {
      await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaning_cost TEXT`;
      await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_in_fee TEXT`;
      await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS commission TEXT`;
      await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS team_payment TEXT`;
      await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaning_team TEXT`;
      await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaning_team_id INTEGER`;
      await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS monthly_fixed_cost TEXT`;
      await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true`;
      await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS aliases TEXT[]`;
      console.log('✅ Properties table updated');
    } catch (err) {
      console.log('⚠️ Properties table update failed:', err.message);
    }

    // Update reservations table
    try {
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS check_in_date TEXT`;
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS check_out_date TEXT`;
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS total_amount TEXT`;
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS check_in_fee TEXT`;
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS team_payment TEXT`;
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS platform_fee TEXT`;
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS cleaning_fee TEXT`;
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS commission_fee TEXT`;
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS net_amount TEXT`;
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS num_guests INTEGER DEFAULT 1`;
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'`;

      // Copy data from old columns to new columns
      await sql`UPDATE reservations SET check_in_date = check_in::TEXT WHERE check_in_date IS NULL`;
      await sql`UPDATE reservations SET check_out_date = check_out::TEXT WHERE check_out_date IS NULL`;
      await sql`UPDATE reservations SET total_amount = total_price::TEXT WHERE total_amount IS NULL`;
      await sql`UPDATE reservations SET num_guests = total_guests WHERE num_guests IS NULL`;

      console.log('✅ Reservations table updated');
    } catch (err) {
      console.log('⚠️ Reservations table update failed:', err.message);
    }

    // Create missing tables
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          type TEXT NOT NULL,
          entity_id INTEGER,
          entity_type TEXT,
          description TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
      console.log('✅ Activities table created');
    } catch (err) {
      console.log('⚠️ Activities table creation failed:', err.message);
    }

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS cleaning_teams (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          rate TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `;
      console.log('✅ Cleaning teams table created');
    } catch (err) {
      console.log('⚠️ Cleaning teams table creation failed:', err.message);
    }

    // Test the schema by querying data
    console.log('\n🔍 Testing schema with data queries...');

    const properties = await sql`SELECT id, name, owner_id, cleaning_cost, active FROM properties LIMIT 3`;
    console.log('Properties sample:', properties);

    const reservations = await sql`SELECT id, guest_name, property_id, check_in_date, check_out_date, total_amount FROM reservations LIMIT 3`;
    console.log('Reservations sample:', reservations);

    console.log('✅ Schema migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

runDrizzleMigration().catch(console.error);