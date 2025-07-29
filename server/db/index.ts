import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from '../../shared/schema';

// Singleton client to ensure we don't create multiple connections
let drizzleInstance: ReturnType<typeof createDrizzleClient> | undefined;

function createDrizzleClient() {
  const sql = neon(process.env.DATABASE_URL!);
  return drizzle(sql, { schema });
}

export function getDrizzle() {
  if (!drizzleInstance) {
    drizzleInstance = createDrizzleClient();
  }
  return drizzleInstance;
}

export async function runMigrations() {
  const db = getDrizzle();
  try {
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// For testing the database connection
export async function testConnection() {
  try {
    const db = getDrizzle();
    // Try a simple query to test the connection
    await db.select().from(schema.properties).limit(1);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}