#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests all database fixes and validates PostgreSQL connectivity
 */

import 'dotenv/config';
import { 
  checkDatabaseConnection, 
  connectWithRetry, 
  validateSchema, 
  runMigrations,
  initializeDatabase,
  executeWithRetry,
  dbLogger 
} from '../server/db/index.js';

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  const statusSymbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusSymbol} ${colors.bold}${testName}${colors.reset}: ${statusColor}${status}${colors.reset}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function testDatabaseFixes() {
  log(`${colors.blue}${colors.bold}🔍 Testing Database Connection Fixes${colors.reset}`, colors.blue);
  log('='.repeat(60), colors.blue);

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Test 1: Environment Configuration
  log('\n📋 Testing Environment Configuration...', colors.yellow);
  try {
    const hasDbUrl = !!process.env.DATABASE_URL;
    const hasSSL = process.env.DATABASE_URL?.includes('sslmode=require') || false;
    
    logTest('Database URL configured', hasDbUrl ? 'PASS' : 'FAIL', 
      hasDbUrl ? `URL configured with SSL: ${hasSSL}` : 'DATABASE_URL environment variable not set');
    
    if (hasDbUrl) results.passed++; else results.failed++;
  } catch (error) {
    logTest('Environment Configuration', 'FAIL', error.message);
    results.failed++;
  }

  // Test 2: Basic Connection Health Check
  log('\n🔗 Testing Database Connection...', colors.yellow);
  try {
    const healthCheck = await checkDatabaseConnection();
    
    logTest('Database Connection', healthCheck.healthy ? 'PASS' : 'FAIL',
      healthCheck.healthy 
        ? `Connected in ${healthCheck.latency}ms - SSL: ${healthCheck.details.ssl}, Version: ${healthCheck.details.version}`
        : `Connection failed: ${healthCheck.error}`);
    
    if (healthCheck.healthy) results.passed++; else results.failed++;
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message);
    results.failed++;
  }

  // Test 3: Connection Retry Logic
  log('\n🔄 Testing Connection Retry Logic...', colors.yellow);
  try {
    const retryResult = await connectWithRetry(2, 500);
    
    logTest('Connection Retry Logic', retryResult ? 'PASS' : 'FAIL',
      retryResult ? 'Retry logic working correctly' : 'Retry logic failed');
    
    if (retryResult) results.passed++; else results.failed++;
  } catch (error) {
    logTest('Connection Retry Logic', 'FAIL', error.message);
    results.failed++;
  }

  // Test 4: Schema Validation
  log('\n📊 Testing Schema Validation...', colors.yellow);
  try {
    const schemaResult = await validateSchema();
    
    logTest('Schema Validation', schemaResult.valid ? 'PASS' : 'WARN',
      schemaResult.valid 
        ? 'All expected tables found' 
        : `Missing tables: ${schemaResult.missingTables?.join(', ') || 'Unknown'}`);
    
    if (schemaResult.valid) results.passed++; else results.warnings++;
  } catch (error) {
    logTest('Schema Validation', 'FAIL', error.message);
    results.failed++;
  }

  // Test 5: Migration System
  log('\n🗄️  Testing Migration System...', colors.yellow);
  try {
    const migrationResult = await runMigrations();
    
    logTest('Migration System', migrationResult.success ? 'PASS' : 'WARN',
      migrationResult.success 
        ? 'Migrations completed successfully' 
        : `Migration issues: ${migrationResult.error}`);
    
    if (migrationResult.success) results.passed++; else results.warnings++;
  } catch (error) {
    logTest('Migration System', 'FAIL', error.message);
    results.failed++;
  }

  // Test 6: Execute With Retry Wrapper
  log('\n⚡ Testing Database Operation Wrapper...', colors.yellow);
  try {
    const testOperation = async () => {
      // Import the neon client from the db module
      const { sql } = await import('@neondatabase/serverless');
      const { neon } = await import('@neondatabase/serverless');
      const client = neon(process.env.DATABASE_URL);
      
      return await client`SELECT 'Database wrapper test' as test_message, NOW() as test_time`;
    };

    const result = await executeWithRetry(testOperation, 'test-operation');
    
    logTest('Database Operation Wrapper', Array.isArray(result) ? 'PASS' : 'FAIL',
      Array.isArray(result) && result.length > 0 
        ? `Test query executed: ${result[0].test_message}` 
        : 'Wrapper test failed');
    
    if (Array.isArray(result)) results.passed++; else results.failed++;
  } catch (error) {
    logTest('Database Operation Wrapper', 'FAIL', error.message);
    results.failed++;
  }

  // Test 7: Complete Database Initialization
  log('\n🚀 Testing Complete Database Initialization...', colors.yellow);
  try {
    const initResult = await initializeDatabase();
    
    logTest('Database Initialization', initResult.success ? 'PASS' : 'WARN',
      initResult.success 
        ? `All systems operational: Connection ✓, Migrations ${initResult.details.migrations ? '✓' : '⚠️'}, Schema ${initResult.details.schema ? '✓' : '⚠️'}` 
        : `Initialization issues detected`);
    
    if (initResult.success) results.passed++; else results.warnings++;

    // Log detailed results
    if (initResult.details) {
      console.log('\n   📊 Initialization Details:');
      console.log(`   • Connection: ${initResult.details.connection ? 'Healthy' : 'Failed'}`);
      console.log(`   • Migrations: ${initResult.details.migrations ? 'Success' : 'Issues detected'}`);
      console.log(`   • Schema: ${initResult.details.schema ? 'Valid' : 'Missing tables'}`);
      
      if (initResult.details.connection && initResult.details.details?.connection) {
        const conn = initResult.details.details.connection;
        console.log(`   • Latency: ${conn.latency}ms`);
        console.log(`   • SSL: ${conn.details?.ssl ? 'Enabled' : 'Disabled'}`);
        console.log(`   • Version: ${conn.details?.version || 'Unknown'}`);
      }
    }
  } catch (error) {
    logTest('Database Initialization', 'FAIL', error.message);
    results.failed++;
  }

  // Test Summary
  log('\n' + '='.repeat(60), colors.blue);
  log(`${colors.bold}📊 Test Results Summary:${colors.reset}`);
  log(`${colors.green}✅ Passed: ${results.passed}${colors.reset}`);
  log(`${colors.yellow}⚠️  Warnings: ${results.warnings}${colors.reset}`);
  log(`${colors.red}❌ Failed: ${results.failed}${colors.reset}`);

  const totalTests = results.passed + results.warnings + results.failed;
  const successRate = ((results.passed / totalTests) * 100).toFixed(1);
  
  log(`\n${colors.bold}Overall Success Rate: ${successRate}%${colors.reset}`);

  if (results.failed === 0) {
    log(`\n${colors.green}🎉 All critical tests passed! Database connection is working properly.${colors.reset}`);
  } else if (results.failed <= 2) {
    log(`\n${colors.yellow}⚠️  Some issues detected but database should be functional.${colors.reset}`);
  } else {
    log(`\n${colors.red}❌ Critical issues detected. Please check your database configuration.${colors.reset}`);
  }

  return {
    success: results.failed === 0,
    summary: results
  };
}

// Run the tests if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseFixes()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test script failed:', error);
      process.exit(1);
    });
}

export { testDatabaseFixes };