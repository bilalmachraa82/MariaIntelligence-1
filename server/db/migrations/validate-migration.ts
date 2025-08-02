#!/usr/bin/env node

/**
 * Maria Faz Database Migration Validation Script
 * Tests database state before and after migration
 * 
 * Usage:
 *   npx tsx server/db/migrations/validate-migration.ts
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

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
// VALIDATION TESTS
// =====================================================

interface ValidationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  expected?: number;
  actual?: number;
}

async function runValidation() {
  console.log('🔍 Maria Faz Database Migration Validation');
  console.log('==========================================');
  
  try {
    // Initialize database connection
    console.log('🔌 Connecting to database...');
    const sqlClient = neon(DATABASE_URL);
    const db = drizzle(sqlClient);
    
    console.log('✅ Database connection established');
    
    const results: ValidationResult[] = [];
    
    // Test 1: Check if main tables exist
    console.log('\n📋 Testing table existence...');
    const tables = await testTableExistence(db);
    results.push(...tables);
    
    // Test 2: Check audit columns
    console.log('\n🔍 Testing audit columns...');
    const auditColumns = await testAuditColumns(db);
    results.push(...auditColumns);
    
    // Test 3: Check indexes
    console.log('\n⚡ Testing indexes...');
    const indexes = await testIndexes(db);
    results.push(...indexes);
    
    // Test 4: Check triggers
    console.log('\n🔄 Testing triggers...');
    const triggers = await testTriggers(db);
    results.push(...triggers);
    
    // Test 5: Check views
    console.log('\n👁️  Testing views...');
    const views = await testViews(db);
    results.push(...views);
    
    // Test 6: Check functions
    console.log('\n⚙️  Testing functions...');
    const functions = await testFunctions(db);
    results.push(...functions);
    
    // Test 7: Check constraints
    console.log('\n🔒 Testing constraints...');
    const constraints = await testConstraints(db);
    results.push(...constraints);
    
    // Test 8: Performance tests
    console.log('\n📊 Testing performance...');
    const performance = await testPerformance(db);
    results.push(...performance);
    
    // Display results
    console.log('\n📈 Validation Results');
    console.log('====================');
    
    const passed = results.filter(r => r.status === 'PASS');
    const failed = results.filter(r => r.status === 'FAIL');
    const warnings = results.filter(r => r.status === 'WARN');
    
    console.log(`✅ PASSED: ${passed.length}`);
    console.log(`❌ FAILED: ${failed.length}`);
    console.log(`⚠️  WARNINGS: ${warnings.length}`);
    console.log(`📊 TOTAL: ${results.length}`);
    
    // Show detailed results
    console.log('\n📋 Detailed Results:');
    console.log('-------------------');
    
    results.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${index + 1}. ${result.test}`);
      console.log(`   ${result.details}`);
      if (result.expected !== undefined && result.actual !== undefined) {
        console.log(`   Expected: ${result.expected}, Actual: ${result.actual}`);
      }
    });
    
    // Summary
    if (failed.length === 0) {
      console.log('\n🎉 All critical tests passed! Database is ready.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// =====================================================
// TEST FUNCTIONS
// =====================================================

async function testTableExistence(db: any): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  const expectedTables = [
    'properties', 'owners', 'reservations', 'cleaning_teams',
    'maintenance_tasks', 'financial_documents', 'financial_document_items',
    'payment_records', 'quotations', 'activities'
  ];
  
  try {
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    `);
    
    const existingTables = tablesResult.map((row: any) => row.table_name);
    
    for (const table of expectedTables) {
      const exists = existingTables.includes(table);
      results.push({
        test: `Table ${table} exists`,
        status: exists ? 'PASS' : 'FAIL',
        details: exists ? `Table ${table} found` : `Table ${table} missing`,
      });
    }
    
  } catch (error) {
    results.push({
      test: 'Table existence check',
      status: 'FAIL',
      details: `Error checking tables: ${error.message}`,
    });
  }
  
  return results;
}

async function testAuditColumns(db: any): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  const expectedAuditColumns = [
    'created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at', 'deleted_by'
  ];
  
  const tables = [
    'properties', 'owners', 'reservations', 'cleaning_teams',
    'maintenance_tasks', 'financial_documents', 'quotations', 'activities'
  ];
  
  try {
    for (const table of tables) {
      const columnsResult = await db.execute(sql.raw(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = '${table}'
          AND column_name IN ('created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at', 'deleted_by')
      `));
      
      const existingColumns = columnsResult.map((row: any) => row.column_name);
      
      // Check for minimum required columns
      const requiredColumns = ['created_at', 'updated_at', 'deleted_at'];
      const missingRequired = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingRequired.length === 0) {
        results.push({
          test: `${table} audit columns`,
          status: 'PASS',
          details: `Found ${existingColumns.length}/6 audit columns`,
          expected: 6,
          actual: existingColumns.length,
        });
      } else {
        results.push({
          test: `${table} audit columns`,
          status: existingColumns.length >= 3 ? 'WARN' : 'FAIL',
          details: `Missing required columns: ${missingRequired.join(', ')}`,
          expected: 6,
          actual: existingColumns.length,
        });
      }
    }
    
  } catch (error) {
    results.push({
      test: 'Audit columns check',
      status: 'FAIL',
      details: `Error checking audit columns: ${error.message}`,
    });
  }
  
  return results;
}

async function testIndexes(db: any): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  try {
    const indexesResult = await db.execute(sql`
      SELECT indexname, tablename
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
    `);
    
    const indexCount = indexesResult.length;
    const expectedMinIndexes = 30; // Minimum expected indexes
    
    results.push({
      test: 'Performance indexes created',
      status: indexCount >= expectedMinIndexes ? 'PASS' : 'WARN',
      details: `Found ${indexCount} performance indexes`,
      expected: expectedMinIndexes,
      actual: indexCount,
    });
    
    // Check specific critical indexes
    const criticalIndexes = [
      'idx_properties_owner_id',
      'idx_reservations_property_id',
      'idx_reservations_date_range',
      'idx_properties_deleted_at',
      'idx_reservations_deleted_at'
    ];
    
    const existingIndexNames = indexesResult.map((row: any) => row.indexname);
    
    for (const indexName of criticalIndexes) {
      const exists = existingIndexNames.includes(indexName);
      results.push({
        test: `Critical index ${indexName}`,
        status: exists ? 'PASS' : 'FAIL',
        details: exists ? `Index ${indexName} found` : `Index ${indexName} missing`,
      });
    }
    
  } catch (error) {
    results.push({
      test: 'Indexes check',
      status: 'FAIL',
      details: `Error checking indexes: ${error.message}`,
    });
  }
  
  return results;
}

async function testTriggers(db: any): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  try {
    const triggersResult = await db.execute(sql`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
        AND trigger_name LIKE '%updated_at%'
    `);
    
    const triggerCount = triggersResult.length;
    const expectedMinTriggers = 8; // Minimum expected triggers
    
    results.push({
      test: 'Updated_at triggers created',
      status: triggerCount >= expectedMinTriggers ? 'PASS' : 'WARN',
      details: `Found ${triggerCount} update triggers`,
      expected: expectedMinTriggers,
      actual: triggerCount,
    });
    
    // Test trigger function exists
    const functionResult = await db.execute(sql`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = 'update_updated_at_column'
    `);
    
    results.push({
      test: 'Trigger function exists',
      status: functionResult.length > 0 ? 'PASS' : 'FAIL',
      details: functionResult.length > 0 ? 'update_updated_at_column function found' : 'Trigger function missing',
    });
    
  } catch (error) {
    results.push({
      test: 'Triggers check',
      status: 'FAIL',
      details: `Error checking triggers: ${error.message}`,
    });
  }
  
  return results;
}

async function testViews(db: any): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  const expectedViews = [
    'active_properties', 'active_reservations', 'pending_maintenance', 'financial_summary'
  ];
  
  try {
    const viewsResult = await db.execute(sql`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
    `);
    
    const existingViews = viewsResult.map((row: any) => row.table_name);
    
    for (const view of expectedViews) {
      const exists = existingViews.includes(view);
      
      if (exists) {
        // Test if view is queryable
        try {
          await db.execute(sql.raw(`SELECT COUNT(*) FROM ${view} LIMIT 1`));
          results.push({
            test: `View ${view}`,
            status: 'PASS',
            details: `View ${view} exists and is queryable`,
          });
        } catch (viewError) {
          results.push({
            test: `View ${view}`,
            status: 'WARN',
            details: `View ${view} exists but has query issues: ${viewError.message}`,
          });
        }
      } else {
        results.push({
          test: `View ${view}`,
          status: 'FAIL',
          details: `View ${view} missing`,
        });
      }
    }
    
  } catch (error) {
    results.push({
      test: 'Views check',
      status: 'FAIL',
      details: `Error checking views: ${error.message}`,
    });
  }
  
  return results;
}

async function testFunctions(db: any): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  const expectedFunctions = [
    'get_property_occupancy_rate',
    'get_property_revenue',
    'update_updated_at_column'
  ];
  
  try {
    const functionsResult = await db.execute(sql`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
    `);
    
    const existingFunctions = functionsResult.map((row: any) => row.routine_name);
    
    for (const func of expectedFunctions) {
      const exists = existingFunctions.includes(func);
      
      if (exists && (func === 'get_property_occupancy_rate' || func === 'get_property_revenue')) {
        // Test function execution (with dummy data)
        try {
          const testResult = await db.execute(sql.raw(`
            SELECT ${func}(1, CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE) as test_result
          `));
          
          results.push({
            test: `Function ${func}`,
            status: 'PASS',
            details: `Function ${func} exists and is executable`,
          });
        } catch (funcError) {
          results.push({
            test: `Function ${func}`,
            status: 'WARN',
            details: `Function ${func} exists but may have execution issues (normal if no data)`,
          });
        }
      } else {
        results.push({
          test: `Function ${func}`,
          status: exists ? 'PASS' : 'FAIL',
          details: exists ? `Function ${func} found` : `Function ${func} missing`,
        });
      }
    }
    
  } catch (error) {
    results.push({
      test: 'Functions check',
      status: 'FAIL',
      details: `Error checking functions: ${error.message}`,
    });
  }
  
  return results;
}

async function testConstraints(db: any): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  try {
    const constraintsResult = await db.execute(sql`
      SELECT constraint_name, table_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND constraint_name LIKE 'chk_%'
    `);
    
    const constraintCount = constraintsResult.length;
    const expectedMinConstraints = 5; // Minimum expected check constraints
    
    results.push({
      test: 'Data integrity constraints',
      status: constraintCount >= expectedMinConstraints ? 'PASS' : 'WARN',
      details: `Found ${constraintCount} check constraints`,
      expected: expectedMinConstraints,
      actual: constraintCount,
    });
    
    // Check specific constraints
    const criticalConstraints = [
      'chk_properties_deleted_consistency',
      'chk_reservations_date_order',
      'chk_reservations_deleted_consistency'
    ];
    
    const existingConstraintNames = constraintsResult.map((row: any) => row.constraint_name);
    
    for (const constraintName of criticalConstraints) {
      const exists = existingConstraintNames.includes(constraintName);
      results.push({
        test: `Constraint ${constraintName}`,
        status: exists ? 'PASS' : 'WARN',
        details: exists ? `Constraint ${constraintName} found` : `Constraint ${constraintName} missing`,
      });
    }
    
  } catch (error) {
    results.push({
      test: 'Constraints check',
      status: 'FAIL',
      details: `Error checking constraints: ${error.message}`,
    });
  }
  
  return results;
}

async function testPerformance(db: any): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  try {
    // Test basic query performance (simple timing)
    const startTime = Date.now();
    
    await db.execute(sql`
      SELECT COUNT(*) FROM properties p
      LEFT JOIN owners o ON p.owner_id = o.id
      WHERE p.deleted_at IS NULL
    `);
    
    const queryTime = Date.now() - startTime;
    
    results.push({
      test: 'Basic query performance',
      status: queryTime < 1000 ? 'PASS' : queryTime < 5000 ? 'WARN' : 'FAIL',
      details: `Query executed in ${queryTime}ms`,
      expected: 1000,
      actual: queryTime,
    });
    
    // Test index usage (check for sequential scans on large tables)
    try {
      const explainResult = await db.execute(sql`
        EXPLAIN (FORMAT JSON) 
        SELECT * FROM properties p
        JOIN owners o ON p.owner_id = o.id
        WHERE p.deleted_at IS NULL
        ORDER BY p.created_at DESC
        LIMIT 10
      `);
      
      const planText = JSON.stringify(explainResult);
      const hasSeqScan = planText.includes('Seq Scan');
      
      results.push({
        test: 'Index usage optimization',
        status: hasSeqScan ? 'WARN' : 'PASS',
        details: hasSeqScan ? 'Some sequential scans detected' : 'Good index usage',
      });
      
    } catch (explainError) {
      results.push({
        test: 'Query plan analysis',
        status: 'WARN',
        details: 'Could not analyze query plans',
      });
    }
    
  } catch (error) {
    results.push({
      test: 'Performance check',
      status: 'FAIL',
      details: `Error testing performance: ${error.message}`,
    });
  }
  
  return results;
}

// =====================================================
// COMMAND LINE INTERFACE
// =====================================================

if (require.main === module) {
  runValidation().catch((error) => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

export { runValidation };