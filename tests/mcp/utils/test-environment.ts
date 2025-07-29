/**
 * Test Environment Management
 * Handles database, redis, and service setup for MCP tests
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

export class TestEnvironment {
  private pgPool?: Pool;
  private redis?: Redis;
  private testId: string;
  private databaseName: string;

  constructor() {
    this.testId = randomUUID().substring(0, 8);
    this.databaseName = `test_mariafaz_${this.testId}`;
  }

  /**
   * Initialize test environment
   */
  async initialize(): Promise<void> {
    await this.setupDatabase();
    await this.setupRedis();
  }

  /**
   * Setup test database
   */
  private async setupDatabase(): Promise<void> {
    // Create test database
    const masterPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: 'postgres'
    });

    try {
      await masterPool.query(`CREATE DATABASE ${this.databaseName}`);
    } catch (error) {
      // Database might already exist
      console.warn('Test database creation warning:', error);
    } finally {
      await masterPool.end();
    }

    // Connect to test database
    this.pgPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: this.databaseName
    });

    // Run migrations
    await this.runMigrations();
  }

  /**
   * Setup test Redis instance
   */
  private async setupRedis(): Promise<void> {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_TEST_DB || '1'), // Use different DB for tests
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100
    });

    // Clear test database
    await this.redis.flushdb();
  }

  /**
   * Run database migrations for tests
   */
  private async runMigrations(): Promise<void> {
    if (!this.pgPool) throw new Error('Database not initialized');

    // Create basic tables for testing
    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS test_properties (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS test_reservations (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES test_properties(id),
        guest_name VARCHAR(255) NOT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS test_owners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Get database URL for tests
   */
  getDatabaseUrl(): string {
    return `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'password'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${this.databaseName}`;
  }

  /**
   * Get Redis URL for tests
   */
  getRedisUrl(): string {
    return `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}/1`;
  }

  /**
   * Get database pool for direct queries
   */
  getDatabase(): Pool {
    if (!this.pgPool) throw new Error('Database not initialized');
    return this.pgPool;
  }

  /**
   * Get Redis instance for direct operations
   */
  getRedis(): Redis {
    if (!this.redis) throw new Error('Redis not initialized');
    return this.redis;
  }

  /**
   * Clear cache between tests
   */
  async clearCache(): Promise<void> {
    if (this.redis) {
      await this.redis.flushdb();
    }
  }

  /**
   * Clean up after each test
   */
  async cleanupTest(): Promise<void> {
    if (this.pgPool) {
      // Clean test data but keep schema
      await this.pgPool.query('TRUNCATE test_properties, test_reservations, test_owners CASCADE');
    }
  }

  /**
   * Full cleanup on test completion
   */
  async cleanup(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }

    if (this.pgPool) {
      await this.pgPool.end();
    }

    // Drop test database
    const masterPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: 'postgres'
    });

    try {
      await masterPool.query(`DROP DATABASE IF EXISTS ${this.databaseName}`);
    } catch (error) {
      console.warn('Test database cleanup warning:', error);
    } finally {
      await masterPool.end();
    }
  }

  /**
   * Seed test data
   */
  async seedTestData(): Promise<void> {
    if (!this.pgPool) throw new Error('Database not initialized');

    // Seed properties
    const propertyResult = await this.pgPool.query(`
      INSERT INTO test_properties (name, address) 
      VALUES 
        ('Test Aroeira I', 'Aroeira Resort, Portugal'),
        ('Test Sete Rios', 'Sete Rios, Lisbon'),
        ('Test 5 de Outubro', '5 de Outubro Ave, Lisbon')
      RETURNING id
    `);

    // Seed owners
    await this.pgPool.query(`
      INSERT INTO test_owners (name, email) 
      VALUES 
        ('Test Owner 1', 'owner1@test.com'),
        ('Test Owner 2', 'owner2@test.com')
    `);

    // Seed reservations
    await this.pgPool.query(`
      INSERT INTO test_reservations (property_id, guest_name, check_in, check_out) 
      VALUES 
        ($1, 'Test Guest 1', '2024-01-15', '2024-01-20'),
        ($2, 'Test Guest 2', '2024-02-01', '2024-02-05')
    `, [propertyResult.rows[0].id, propertyResult.rows[1].id]);
  }
}