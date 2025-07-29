/**
 * MCP Testing Setup
 * Configures test environment for all MCP integrations
 */

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { TestEnvironment } from './utils/test-environment';
import { MockServices } from './mocks/mock-services';

// Global test environment
let testEnv: TestEnvironment;
let mockServices: MockServices;

/**
 * Global setup for all MCP tests
 */
beforeAll(async () => {
  // Initialize test environment
  testEnv = new TestEnvironment();
  await testEnv.initialize();

  // Initialize mock services
  mockServices = new MockServices();
  await mockServices.start();

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = testEnv.getDatabaseUrl();
  process.env.REDIS_URL = testEnv.getRedisUrl();
  
  // MCP specific test configurations
  process.env.NEON_API_KEY = 'test-neon-key';
  process.env.RAILWAY_API_TOKEN = 'test-railway-token';
  process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
  process.env.MISTRAL_API_KEY = 'test-mistral-key';
  
  console.log('🧪 MCP Test Environment Initialized');
});

/**
 * Global teardown for all MCP tests
 */
afterAll(async () => {
  await mockServices?.stop();
  await testEnv?.cleanup();
  console.log('🧹 MCP Test Environment Cleaned Up');
});

/**
 * Setup before each test
 */
beforeEach(async () => {
  // Reset mock services state
  await mockServices?.reset();
  
  // Clear any cached data
  await testEnv?.clearCache();
});

/**
 * Cleanup after each test
 */
afterEach(async () => {
  // Clean up any test artifacts
  await testEnv?.cleanupTest();
});

// Export for use in tests
export { testEnv, mockServices };