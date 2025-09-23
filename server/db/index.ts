import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import * as schema from '../../shared/schema';

// Performance optimized singleton client with connection pooling
let drizzleInstance: ReturnType<typeof createDrizzleClient> | undefined;
let connectionPool: ReturnType<typeof neon> | undefined;

function createDrizzleClient() {
  // Create optimized connection pool if not exists
  if (!connectionPool) {
    connectionPool = neon(process.env.DATABASE_URL!, {
      // Enhanced connection pool optimizations for parallel processing
      connectionTimeoutMillis: 3000, // Reduced for faster failover
      idleTimeoutMillis: 60000, // Increased for better connection reuse
      // Enable query caching for better performance
      queryTimeout: 45000, // Increased for complex queries
      // Enhanced connection pool settings for concurrent operations
      maxConnections: process.env.NODE_ENV === 'production' ? 25 : 8, // Increased for parallel processing
      // Additional optimizations
      keepAlive: true,
      // Enable connection pooling optimizations
      arrayMode: false,
      fullResults: false,
    });
  }

  return drizzle(connectionPool, {
    schema,
    // Enhanced query logging for parallel operations
    logger: process.env.NODE_ENV === 'development' ? {
      logQuery: (query: string, params: any[]) => {
        const timestamp = new Date().toISOString();
        const connectionInfo = `[${timestamp}][DB Query]`;
        if (query.length > 200) {
          console.log(connectionInfo, query.substring(0, 200) + '...', `(${params?.length || 0} params)`);
        } else {
          console.log(connectionInfo, query, params?.length ? `(${params.length} params)` : '');
        }
      }
    } : false
  });
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

// Export db as the main database instance
export const db = getDrizzle();