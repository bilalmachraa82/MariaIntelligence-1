#!/usr/bin/env node

/**
 * OCR Test Runner
 * Executes comprehensive OCR tests and generates detailed reports
 * Usage: node scripts/run-ocr-tests.mjs [--provider=<provider>] [--pdf=<filename>] [--report]
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');

// Test configuration
const TEST_CONFIG = {
  timeout: 60000, // 60 seconds
  maxConcurrency: 3,
  publicDir: path.join(PROJECT_ROOT, 'public'),
  reportsDir: path.join(PROJECT_ROOT, 'test-reports'),
  logLevel: 'info'
};

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  provider: args.find(arg => arg.startsWith('--provider='))?.split('=')[1] || 'auto',
  pdfFile: args.find(arg => arg.startsWith('--pdf='))?.split('=')[1],
  generateReport: args.includes('--report'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  help: args.includes('--help') || args.includes('-h')
};

// Help text
if (options.help) {
  console.log(`
OCR Test Runner

Usage: node scripts/run-ocr-tests.mjs [options]

Options:
  --provider=<provider>    Test specific OCR provider (mistral-ocr|openrouter|rolm|native|auto)
  --pdf=<filename>         Test specific PDF file from public directory
  --report                 Generate detailed HTML report
  --verbose, -v            Verbose output
  --help, -h              Show this help

Examples:
  node scripts/run-ocr-tests.mjs                           # Run all tests
  node scripts/run-ocr-tests.mjs --provider=mistral-ocr    # Test Mistral OCR only
  node scripts/run-ocr-tests.mjs --pdf="Controlo_Aroeira II.pdf" # Test specific PDF
  node scripts/run-ocr-tests.mjs --report                  # Generate HTML report
`);
  process.exit(0);
}

// Ensure reports directory exists
if (!fs.existsSync(TEST_CONFIG.reportsDir)) {
  fs.mkdirSync(TEST_CONFIG.reportsDir, { recursive: true });
}

// Utility functions
function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const levels = ['error', 'warn', 'info', 'debug'];
  
  if (levels.indexOf(level) <= levels.indexOf(TEST_CONFIG.logLevel)) {
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args);
  }
}

function logInfo(message, ...args) { log('info', message, ...args); }
function logWarn(message, ...args) { log('warn', message, ...args); }
function logError(message, ...args) { log('error', message, ...args); }

// Environment validation
function validateEnvironment() {
  logInfo('🔍 Validating environment configuration...');
  
  const envChecks = [
    { key: 'MISTRAL_API_KEY', name: 'Mistral OCR', required: false },
    { key: 'OPENROUTER_API_KEY', name: 'OpenRouter', required: false },
    { key: 'HF_TOKEN', name: 'Hugging Face (RolmOCR)', required: false },
    { key: 'GOOGLE_GEMINI_API_KEY', name: 'Google Gemini', required: false },
    { key: 'GOOGLE_API_KEY', name: 'Google API', required: false }
  ];

  const availableProviders = [];
  let hasAnyProvider = false;

  envChecks.forEach(check => {
    const isConfigured = !!process.env[check.key];
    if (isConfigured) {
      availableProviders.push(check.name);
      hasAnyProvider = true;
      logInfo(`  ✅ ${check.name} configured`);
    } else {
      logInfo(`  ⚠️  ${check.name} not configured`);
    }
  });

  if (!hasAnyProvider) {
    logWarn('No OCR providers configured. Some tests will be skipped.');
  } else {
    logInfo(`📡 Available providers: ${availableProviders.join(', ')}`);
  }

  return { hasAnyProvider, availableProviders };
}

// PDF file discovery
function discoverPDFs() {
  logInfo('📄 Discovering PDF files...');
  
  try {
    const files = fs.readdirSync(TEST_CONFIG.publicDir);
    const pdfFiles = files.filter(f => f.endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      logWarn('No PDF files found in public directory');
      return [];
    }

    logInfo(`Found ${pdfFiles.length} PDF files:`);
    pdfFiles.forEach((file, index) => {
      const filePath = path.join(TEST_CONFIG.publicDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      logInfo(`  ${index + 1}. ${file} (${sizeKB} KB)`);
    });

    return pdfFiles;
  } catch (error) {
    logError('Error reading public directory:', error.message);
    return [];
  }
}

// Test suite execution
async function runTestSuite(testFile, options = {}) {
  return new Promise((resolve, reject) => {
    const testPath = path.join(PROJECT_ROOT, 'tests', testFile);
    
    if (!fs.existsSync(testPath)) {
      logError(`Test file not found: ${testPath}`);
      reject(new Error(`Test file not found: ${testFile}`));
      return;
    }

    logInfo(`🧪 Running test suite: ${testFile}`);
    
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      TEST_TIMEOUT: TEST_CONFIG.timeout.toString()
    };

    // Add provider-specific environment if specified
    if (options.provider) {
      env.TEST_PROVIDER = options.provider;
    }

    if (options.pdfFile) {
      env.TEST_PDF_FILE = options.pdfFile;
    }

    const args = ['--run', testPath];
    if (options.verbose) {
      args.push('--reporter=verbose');
    }

    const child = spawn('npx', ['vitest', ...args], {
      cwd: PROJECT_ROOT,
      env,
      stdio: 'pipe'
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      if (options.verbose) {
        process.stdout.write(output);
      }
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      if (options.verbose) {
        process.stderr.write(output);
      }
    });

    child.on('close', (code) => {
      const result = {
        testFile,
        exitCode: code,
        success: code === 0,
        stdout,
        stderr,
        duration: Date.now() - startTime
      };

      if (code === 0) {
        logInfo(`  ✅ ${testFile} completed successfully`);
      } else {
        logError(`  ❌ ${testFile} failed with exit code ${code}`);
      }

      resolve(result);
    });

    child.on('error', (error) => {
      logError(`Error running ${testFile}:`, error.message);
      reject(error);
    });

    const startTime = Date.now();
  });
}

// Main test execution
async function runOCRTests() {
  logInfo('🚀 Starting OCR Integration Tests');
  logInfo('=' .repeat(60));

  // Validate environment
  const envStatus = validateEnvironment();
  
  // Discover PDFs
  const availablePDFs = discoverPDFs();
  
  if (availablePDFs.length === 0) {
    logWarn('No PDF files available for testing. Creating sample test data...');
    // Could create sample PDFs here if needed
  }

  // Define test suites to run
  const testSuites = [
    {
      name: 'OCR Integration Tests',
      file: 'ocr-integration.spec.ts',
      description: 'Core OCR functionality with real PDFs'
    },
    {
      name: 'OCR Provider Tests',
      file: 'ocr-providers.spec.ts',
      description: 'Provider-specific testing and comparison'
    },
    {
      name: 'OCR API Endpoints',
      file: 'ocr-api-endpoints.spec.ts',
      description: 'HTTP endpoint testing and validation'
    },
    {
      name: 'OCR Data Validation',
      file: 'ocr-validation.spec.ts',
      description: 'Data extraction and validation testing'
    }
  ];

  const results = [];
  const startTime = Date.now();

  // Run test suites
  for (const suite of testSuites) {
    try {
      logInfo(`\n📋 Running: ${suite.name}`);
      logInfo(`   ${suite.description}`);
      
      const result = await runTestSuite(suite.file, {
        provider: options.provider,
        pdfFile: options.pdfFile,
        verbose: options.verbose
      });
      
      results.push(result);
      
    } catch (error) {
      logError(`Failed to run ${suite.name}:`, error.message);
      results.push({
        testFile: suite.file,
        exitCode: 1,
        success: false,
        error: error.message,
        duration: 0
      });
    }
  }

  const totalTime = Date.now() - startTime;
  
  // Generate summary
  const summary = generateTestSummary(results, totalTime, {
    envStatus,
    availablePDFs,
    options
  });

  console.log('\n' + '=' .repeat(60));
  console.log('📊 OCR TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(summary);

  // Generate detailed report if requested
  if (options.generateReport) {
    await generateHTMLReport(results, summary, {
      envStatus,
      availablePDFs,
      options
    });
  }

  // Exit with appropriate code
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

// Test summary generation
function generateTestSummary(results, totalTime, context) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const avgTime = results.length > 0 ? totalTime / results.length : 0;
  
  let summary = `
Total test suites: ${results.length}
✅ Successful: ${successful.length}
❌ Failed: ${failed.length}
⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s
📊 Average time per suite: ${(avgTime / 1000).toFixed(2)}s

Environment Status:
`;

  if (context.envStatus.hasAnyProvider) {
    summary += `🟢 OCR providers available: ${context.envStatus.availableProviders.join(', ')}\n`;
  } else {
    summary += `🔴 No OCR providers configured\n`;
  }

  summary += `📄 PDF files available: ${context.availablePDFs.length}\n`;

  if (context.options.provider !== 'auto') {
    summary += `🎯 Testing provider: ${context.options.provider}\n`;
  }

  if (context.options.pdfFile) {
    summary += `📋 Testing PDF: ${context.options.pdfFile}\n`;
  }

  if (failed.length > 0) {
    summary += `\nFailed test suites:\n`;
    failed.forEach(result => {
      summary += `  ❌ ${result.testFile}: ${result.error || 'Unknown error'}\n`;
    });
  }

  summary += `\nTest Suite Details:\n`;
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const duration = (result.duration / 1000).toFixed(2);
    summary += `  ${status} ${result.testFile} (${duration}s)\n`;
  });

  return summary;
}

// HTML report generation
async function generateHTMLReport(results, summary, context) {
  logInfo('📄 Generating detailed HTML report...');
  
  const reportPath = path.join(TEST_CONFIG.reportsDir, `ocr-test-report-${Date.now()}.html`);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OCR Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
        .test-suite { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
        .test-suite-header { background: #6c757d; color: white; padding: 10px 15px; font-weight: bold; }
        .test-suite-header.success { background: #28a745; }
        .test-suite-header.failed { background: #dc3545; }
        .test-suite-content { padding: 15px; }
        .metric { display: inline-block; margin: 5px 15px 5px 0; }
        .metric-label { font-weight: bold; }
        .pdf-list { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .provider-status { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; }
        .provider-badge { padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
        .provider-available { background: #d4edda; color: #155724; }
        .provider-unavailable { background: #f8d7da; color: #721c24; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; }
        .timestamp { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 OCR Integration Test Report</h1>
            <div class="timestamp">Generated: ${new Date().toISOString()}</div>
        </div>
        
        <div class="summary">
            <h2>📊 Test Summary</h2>
            <pre>${summary}</pre>
        </div>
        
        <div class="pdf-list">
            <h3>📄 Available PDF Files (${context.availablePDFs.length})</h3>
            ${context.availablePDFs.map(pdf => `<div>• ${pdf}</div>`).join('')}
        </div>
        
        <div class="provider-status">
            <h3>🔧 OCR Provider Status</h3>
            <div class="provider-badge provider-${process.env.MISTRAL_API_KEY ? 'available' : 'unavailable'}">
                Mistral OCR: ${process.env.MISTRAL_API_KEY ? 'Available' : 'Not Configured'}
            </div>
            <div class="provider-badge provider-${process.env.OPENROUTER_API_KEY ? 'available' : 'unavailable'}">
                OpenRouter: ${process.env.OPENROUTER_API_KEY ? 'Available' : 'Not Configured'}
            </div>
            <div class="provider-badge provider-${process.env.HF_TOKEN ? 'available' : 'unavailable'}">
                RolmOCR: ${process.env.HF_TOKEN ? 'Available' : 'Not Configured'}
            </div>
            <div class="provider-badge provider-${(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? 'available' : 'unavailable'}">
                Gemini: ${(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? 'Available' : 'Not Configured'}
            </div>
        </div>
        
        <h2>🧪 Test Suite Results</h2>
        ${results.map(result => `
            <div class="test-suite">
                <div class="test-suite-header ${result.success ? 'success' : 'failed'}">
                    ${result.success ? '✅' : '❌'} ${result.testFile}
                </div>
                <div class="test-suite-content">
                    <div class="metric">
                        <span class="metric-label">Duration:</span> ${(result.duration / 1000).toFixed(2)}s
                    </div>
                    <div class="metric">
                        <span class="metric-label">Exit Code:</span> ${result.exitCode}
                    </div>
                    ${result.error ? `<div style="color: red; margin-top: 10px;"><strong>Error:</strong> ${result.error}</div>` : ''}
                    ${result.stdout ? `
                        <h4>📤 Output</h4>
                        <pre>${result.stdout.substring(0, 2000)}${result.stdout.length > 2000 ? '...' : ''}</pre>
                    ` : ''}
                    ${result.stderr ? `
                        <h4>⚠️ Errors</h4>
                        <pre>${result.stderr.substring(0, 1000)}${result.stderr.length > 1000 ? '...' : ''}</pre>
                    ` : ''}
                </div>
            </div>
        `).join('')}
        
        <div style="margin-top: 30px; text-align: center; color: #666;">
            <p>Report generated by OCR Test Runner</p>
            <p>Project: MariaFaz OCR Integration</p>
        </div>
    </div>
</body>
</html>
  `;

  fs.writeFileSync(reportPath, html);
  logInfo(`📄 HTML report generated: ${reportPath}`);
  
  // Try to open the report in the default browser
  if (process.platform === 'darwin') {
    spawn('open', [reportPath]);
  } else if (process.platform === 'win32') {
    spawn('start', [reportPath], { shell: true });
  } else {
    spawn('xdg-open', [reportPath]);
  }
}

// Run the tests
runOCRTests().catch(error => {
  logError('Fatal error running OCR tests:', error);
  process.exit(1);
});