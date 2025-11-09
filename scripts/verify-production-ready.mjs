#!/usr/bin/env node

/**
 * Production Readiness Verification Script
 * Validates MariaIntelligence is ready for deployment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n${colors.cyan}${msg}${colors.reset}\n${colors.cyan}${'='.repeat(60)}${colors.reset}\n`),
};

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = 0;

async function check(name, fn) {
  totalChecks++;
  process.stdout.write(`Checking ${name}... `);

  try {
    const result = await fn();
    if (result === 'warning') {
      warnings++;
      log.warning(`WARNING`);
      return 'warning';
    } else if (result === false) {
      failedChecks++;
      log.error(`FAILED`);
      return false;
    } else {
      passedChecks++;
      log.success(`PASSED`);
      return true;
    }
  } catch (error) {
    failedChecks++;
    log.error(`FAILED - ${error.message}`);
    return false;
  }
}

async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkEnvExample() {
  const exists = await checkFileExists('.env.example');
  if (!exists) throw new Error('.env.example not found');

  const content = await fs.readFile('.env.example', 'utf-8');
  const required = ['DATABASE_URL', 'GOOGLE_GEMINI_API_KEY', 'SESSION_SECRET', 'NODE_ENV'];
  const missing = required.filter(key => !content.includes(key));

  if (missing.length > 0) {
    throw new Error(`Missing required vars: ${missing.join(', ')}`);
  }
  return true;
}

async function checkEnvProduction() {
  const exists = await checkFileExists('.env.production');
  if (exists) {
    throw new Error('.env.production should NOT exist (security issue)');
  }
  return true;
}

async function checkGitignore() {
  const content = await fs.readFile('.gitignore', 'utf-8');
  const required = ['.env.production', '.env.local', 'node_modules', 'dist'];
  const missing = required.filter(item => !content.includes(item));

  if (missing.length > 0) {
    throw new Error(`Missing in .gitignore: ${missing.join(', ')}`);
  }
  return true;
}

async function checkDeploymentDocs() {
  const files = ['DEPLOYMENT.md', 'HEALTH-CHECKS.md', 'DEPLOYMENT-CHECKLIST.md'];
  const missing = [];

  for (const file of files) {
    const exists = await checkFileExists(file);
    if (!exists) missing.push(file);
  }

  if (missing.length > 0) {
    throw new Error(`Missing docs: ${missing.join(', ')}`);
  }
  return true;
}

async function checkDockerfile() {
  const exists = await checkFileExists('Dockerfile');
  if (!exists) throw new Error('Dockerfile not found');

  const content = await fs.readFile('Dockerfile', 'utf-8');
  if (!content.includes('HEALTHCHECK')) {
    return 'warning'; // Warning, not critical
  }
  return true;
}

async function checkPackageJson() {
  const content = JSON.parse(await fs.readFile('package.json', 'utf-8'));

  // Check required scripts
  const required = ['build', 'start', 'build:client', 'build:server'];
  const missing = required.filter(script => !content.scripts[script]);

  if (missing.length > 0) {
    throw new Error(`Missing scripts: ${missing.join(', ')}`);
  }

  // Check dependencies
  const deps = { ...content.dependencies, ...content.devDependencies };
  if (!deps['@google/generative-ai']) {
    throw new Error('Missing @google/generative-ai package');
  }

  return true;
}

async function checkBuild() {
  // Check if dist directories exist
  const clientExists = await checkFileExists('dist/client');
  const serverExists = await checkFileExists('api/index.js');

  if (!clientExists || !serverExists) {
    return 'warning'; // Not built yet, but not critical
  }
  return true;
}

async function checkDatabaseConfig() {
  const exists = await checkFileExists('server/db/index.ts');
  if (!exists) throw new Error('Database config not found');

  const content = await fs.readFile('server/db/index.ts', 'utf-8');

  // Check for connection pooling
  if (!content.includes('max:') || !content.includes('pool')) {
    return 'warning';
  }

  return true;
}

async function checkSecurityMiddleware() {
  const exists = await checkFileExists('server/middleware/security.ts');
  if (!exists) throw new Error('Security middleware not found');

  const content = await fs.readFile('server/middleware/security.ts', 'utf-8');

  // Check for key security features
  const contentLower = content.toLowerCase();
  const features = {
    helmet: contentLower.includes('helmet'),
    rateLimit: contentLower.includes('ratelimit') || contentLower.includes('rate-limit'),
    cors: contentLower.includes('cors')
  };

  const missing = Object.entries(features)
    .filter(([_, present]) => !present)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing security features: ${missing.join(', ')}`);
  }

  return true;
}

async function checkApiRoutes() {
  const exists = await checkFileExists('server/routes/v1/index.ts');
  if (!exists) throw new Error('API routes not found');

  const content = await fs.readFile('server/routes/v1/index.ts', 'utf-8');

  // Check for key routes
  const routes = ['/properties', '/reservations', '/owners', '/financial', '/ocr'];
  const missing = routes.filter(route => !content.includes(route));

  if (missing.length > 0) {
    throw new Error(`Missing routes: ${missing.join(', ')}`);
  }

  return true;
}

async function checkHealthEndpoint() {
  // Check if health endpoint exists in server/index.ts
  const exists = await checkFileExists('server/index.ts');
  if (!exists) throw new Error('server/index.ts not found');

  const content = await fs.readFile('server/index.ts', 'utf-8');
  if (!content.includes('/health') && !content.includes('/api/health')) {
    return 'warning'; // Should have health endpoint
  }

  return true;
}

async function main() {
  console.log(`
${colors.cyan}╔════════════════════════════════════════════════════════════════╗
║         MariaIntelligence Production Readiness Check          ║
║                      Running Diagnostics...                    ║
╚════════════════════════════════════════════════════════════════╝${colors.reset}
  `);

  log.header('1. Environment & Configuration');
  await check('.env.example exists', checkEnvExample);
  await check('.env.production deleted', checkEnvProduction);
  await check('.gitignore configured', checkGitignore);
  await check('package.json valid', checkPackageJson);

  log.header('2. Documentation');
  await check('Deployment docs present', checkDeploymentDocs);
  await check('Dockerfile present', checkDockerfile);

  log.header('3. Application Code');
  await check('Database config valid', checkDatabaseConfig);
  await check('Security middleware configured', checkSecurityMiddleware);
  await check('API routes registered', checkApiRoutes);
  await check('Health endpoint configured', checkHealthEndpoint);

  log.header('4. Build Status');
  await check('Build artifacts present', checkBuild);

  // Summary
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}Summary${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  console.log(`Total Checks: ${totalChecks}`);
  console.log(`${colors.green}Passed: ${passedChecks}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedChecks}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${warnings}${colors.reset}\n`);

  const percentage = Math.round((passedChecks / totalChecks) * 100);

  if (failedChecks === 0) {
    console.log(`${colors.green}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║  ✓ PRODUCTION READY (${percentage}%)                                     ║${colors.reset}`);
    console.log(`${colors.green}║                                                                ║${colors.reset}`);
    console.log(`${colors.green}║  All critical checks passed!                                   ║${colors.reset}`);
    if (warnings > 0) {
      console.log(`${colors.green}║  ${warnings} warning(s) - review but not blocking                       ║${colors.reset}`);
    }
    console.log(`${colors.green}║                                                                ║${colors.reset}`);
    console.log(`${colors.green}║  Next steps:                                                   ║${colors.reset}`);
    console.log(`${colors.green}║  1. Rotate database password in Neon                           ║${colors.reset}`);
    console.log(`${colors.green}║  2. Set environment variables in platform                      ║${colors.reset}`);
    console.log(`${colors.green}║  3. Run: npm run build                                         ║${colors.reset}`);
    console.log(`${colors.green}║  4. Deploy to your chosen platform                             ║${colors.reset}`);
    console.log(`${colors.green}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.red}║  ✗ NOT READY FOR PRODUCTION (${percentage}%)                             ║${colors.reset}`);
    console.log(`${colors.red}║                                                                ║${colors.reset}`);
    console.log(`${colors.red}║  ${failedChecks} critical check(s) failed                                   ║${colors.reset}`);
    console.log(`${colors.red}║  Review errors above and fix before deploying                 ║${colors.reset}`);
    console.log(`${colors.red}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
