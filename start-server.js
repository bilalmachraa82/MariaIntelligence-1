#!/usr/bin/env node

/**
 * ==========================================
 * MariaIntelligence Production Server Launcher
 * ==========================================
 * Robust startup script with comprehensive diagnostics
 * Handles multiple deployment scenarios (Render, Docker, etc.)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for better visibility
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ──────────────────────────────────────────
// Environment Check
// ──────────────────────────────────────────
log('==========================================', 'cyan');
log('🚀 MariaIntelligence Server Startup', 'bright');
log('==========================================', 'cyan');
log('');

log('📊 Environment Information:', 'blue');
log(`   • Node Version: ${process.version}`);
log(`   • NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
log(`   • Platform: ${process.platform}`);
log(`   • CWD: ${process.cwd()}`);
log(`   • __dirname: ${__dirname}`);
log(`   • Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used`);
log('');

// ──────────────────────────────────────────
// Required Environment Variables Check
// ──────────────────────────────────────────
log('🔐 Checking Required Environment Variables:', 'blue');

const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET'
];

const optionalEnvVars = [
  'GOOGLE_GEMINI_API_KEY',
  'EMAIL_HOST',
  'EMAIL_USER',
  'PORT'
];

let missingRequired = [];
let missingOptional = [];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    log(`   ✅ ${varName}: configured`, 'green');
  } else {
    log(`   ❌ ${varName}: MISSING`, 'red');
    missingRequired.push(varName);
  }
});

optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    log(`   ✅ ${varName}: configured`, 'green');
  } else {
    log(`   ⚠️  ${varName}: not set (optional)`, 'yellow');
    missingOptional.push(varName);
  }
});

log('');

if (missingRequired.length > 0) {
  log('❌ FATAL: Missing required environment variables:', 'red');
  missingRequired.forEach(v => log(`   • ${v}`, 'red'));
  log('');
  log('Please set these variables before starting the server.', 'yellow');
  process.exit(1);
}

// ──────────────────────────────────────────
// Server File Location Detection
// ──────────────────────────────────────────
log('🔍 Locating Server Entry Point:', 'blue');

const possibleServerPaths = [
  'dist/server/index.js',
  './dist/server/index.js',
  'dist/index.js',
  './dist/index.js',
  path.join(__dirname, 'dist/server/index.js'),
  path.join(__dirname, 'dist/index.js'),
  path.join(process.cwd(), 'dist/server/index.js'),
  path.join(process.cwd(), 'dist/index.js')
];

log('   Checking possible locations:');
let serverPath = null;

for (const checkPath of possibleServerPaths) {
  const absolutePath = path.resolve(checkPath);
  const exists = fs.existsSync(absolutePath);

  if (exists) {
    log(`   ✅ ${checkPath} → FOUND`, 'green');
    if (!serverPath) serverPath = absolutePath;
  } else {
    log(`   ❌ ${checkPath} → not found`);
  }
}

log('');

if (!serverPath) {
  log('💥 FATAL ERROR: No server file found!', 'red');
  log('');
  log('📁 Checked locations:', 'yellow');
  possibleServerPaths.forEach(p => log(`   • ${p}`));
  log('');
  log('💡 Troubleshooting:', 'blue');
  log('   1. Ensure build completed: npm run build:render');
  log('   2. Check that dist/server/index.js exists');
  log('   3. Verify build output directory structure');

  // Show current directory structure
  try {
    if (fs.existsSync('dist')) {
      log('');
      log('📂 Current dist/ structure:', 'cyan');
      showDirectoryTree('dist', '   ');
    }
  } catch (err) {
    // Ignore errors in showing directory structure
  }

  process.exit(1);
}

log(`✅ Server file located: ${serverPath}`, 'green');
log('');

// ──────────────────────────────────────────
// Verify Server File is Valid JavaScript
// ──────────────────────────────────────────
log('🔬 Verifying Server File:', 'blue');

try {
  const stats = fs.statSync(serverPath);
  log(`   • File size: ${(stats.size / 1024).toFixed(2)} KB`);
  log(`   • Last modified: ${stats.mtime.toISOString()}`);

  // Check if file is readable
  fs.accessSync(serverPath, fs.constants.R_OK);
  log('   ✅ File is readable', 'green');
} catch (err) {
  log(`   ❌ File verification failed: ${err.message}`, 'red');
  process.exit(1);
}

log('');

// ──────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────
log('🚀 Starting Server...', 'bright');
log('');

// Set production environment if not set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
  log('   • Set NODE_ENV=production', 'yellow');
}

// Set default port if not set
if (!process.env.PORT) {
  process.env.PORT = '5000';
  log('   • Set PORT=5000 (default)', 'yellow');
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('');
  log('📡 Received SIGTERM signal', 'yellow');
  log('🛑 Shutting down gracefully...', 'yellow');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('');
  log('📡 Received SIGINT signal (Ctrl+C)', 'yellow');
  log('🛑 Shutting down gracefully...', 'yellow');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  log('');
  log('💥 UNCAUGHT EXCEPTION:', 'red');
  log(`   ${err.message}`, 'red');
  log('');
  log('Stack trace:', 'yellow');
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('');
  log('💥 UNHANDLED PROMISE REJECTION:', 'red');
  log(`   ${reason}`, 'red');
  console.error('Promise:', promise);
  process.exit(1);
});

// Import and start the server
async function startServer() {
  try {
    log('📦 Importing server module...', 'cyan');

    const startTime = Date.now();
    await import(serverPath);
    const duration = Date.now() - startTime;

    log('');
    log('==========================================', 'green');
    log(`✅ Server started successfully in ${duration}ms!`, 'green');
    log('==========================================', 'green');
    log('');
    log(`🌐 Server is running on port ${process.env.PORT}`, 'bright');
    log(`🔗 Health check: http://localhost:${process.env.PORT}/api/health`, 'cyan');
    log('');

  } catch (err) {
    log('');
    log('💥 FATAL: Failed to start server', 'red');
    log('==========================================', 'red');
    log('');
    log(`Error: ${err.message}`, 'red');
    log('');

    if (err.stack) {
      log('Stack Trace:', 'yellow');
      console.error(err.stack);
    }

    log('');
    log('💡 Troubleshooting:', 'blue');
    log('   1. Check database connection (DATABASE_URL)');
    log('   2. Verify all required environment variables are set');
    log('   3. Check server logs for specific error details');
    log('   4. Ensure PostgreSQL database is accessible');
    log('');

    process.exit(1);
  }
}

// Helper function to show directory tree
function showDirectoryTree(dir, indent = '') {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach(item => {
      const icon = item.isDirectory() ? '📁' : '📄';
      log(`${indent}${icon} ${item.name}`);

      if (item.isDirectory() && item.name !== 'node_modules') {
        try {
          showDirectoryTree(path.join(dir, item.name), indent + '   ');
        } catch (err) {
          // Skip directories we can't read
        }
      }
    });
  } catch (err) {
    log(`${indent}❌ Error reading directory: ${err.message}`, 'red');
  }
}

// Start the server
startServer();
