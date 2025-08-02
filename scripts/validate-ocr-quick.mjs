#!/usr/bin/env node

/**
 * Quick OCR Validation Script
 * Fast validation of OCR functionality with existing PDFs
 * Usage: node scripts/validate-ocr-quick.mjs [pdf-filename]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

// Configuration
const CONFIG = {
  maxFilesToTest: 3,
  timeout: 30000
};

// Utility functions
function log(level, message, ...args) {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  console.log(`${emoji[level] || 'ℹ️'} [${timestamp}] ${message}`, ...args);
}

function formatBytes(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Environment validation
function validateEnvironment() {
  log('info', 'Validating OCR environment...');
  
  const providers = [
    { name: 'Mistral OCR', env: 'MISTRAL_API_KEY' },
    { name: 'OpenRouter', env: 'OPENROUTER_API_KEY' },
    { name: 'RolmOCR', env: 'HF_TOKEN' },
    { name: 'Gemini', env: 'GOOGLE_GEMINI_API_KEY' },
    { name: 'Google API', env: 'GOOGLE_API_KEY' }
  ];

  const available = providers.filter(p => !!process.env[p.env]);
  
  if (available.length === 0) {
    log('warning', 'No OCR providers configured. Only native PDF parsing will work.');
    return { hasProviders: false, providers: [] };
  }

  log('success', `Found ${available.length} configured OCR providers:`);
  available.forEach(p => log('info', `  • ${p.name}`));
  
  return { hasProviders: true, providers: available };
}

// PDF discovery
function discoverPDFs(specificFile = null) {
  log('info', 'Discovering PDF files...');
  
  if (!fs.existsSync(PUBLIC_DIR)) {
    log('error', `Public directory not found: ${PUBLIC_DIR}`);
    return [];
  }

  const files = fs.readdirSync(PUBLIC_DIR);
  let pdfFiles = files.filter(f => f.endsWith('.pdf'));

  if (specificFile) {
    pdfFiles = pdfFiles.filter(f => f === specificFile);
    if (pdfFiles.length === 0) {
      log('error', `Specified PDF file not found: ${specificFile}`);
      return [];
    }
  }

  if (pdfFiles.length === 0) {
    log('warning', 'No PDF files found in public directory');
    return [];
  }

  log('success', `Found ${pdfFiles.length} PDF files:`);
  
  // Limit the number of files to test
  const filesToTest = pdfFiles.slice(0, CONFIG.maxFilesToTest);
  
  filesToTest.forEach((file, index) => {
    const filePath = path.join(PUBLIC_DIR, file);
    const stats = fs.statSync(filePath);
    log('info', `  ${index + 1}. ${file} (${formatBytes(stats.size)})`);
  });

  if (pdfFiles.length > CONFIG.maxFilesToTest) {
    log('info', `Testing first ${CONFIG.maxFilesToTest} files. Use specific filename to test others.`);
  }

  return filesToTest;
}

// OCR validation with dynamic import
async function validateOCRWithPDF(filename) {
  log('info', `Testing OCR with: ${filename}`);
  
  const filePath = path.join(PUBLIC_DIR, filename);
  const startTime = Date.now();
  
  try {
    // Read PDF file
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    log('info', `  File loaded: ${formatBytes(pdfBuffer.length)}`);

    // Dynamic import of OCR services (to handle ES modules)
    const { AIAdapter } = await import(path.join(PROJECT_ROOT, 'server/services/ai-adapter.service.js'));
    
    const aiAdapter = AIAdapter.getInstance();
    
    log('info', '  Extracting text...');
    const extractedText = await aiAdapter.extractTextFromPDF(pdfBase64);
    
    const processingTime = Date.now() - startTime;
    
    // Validate result
    if (!extractedText || extractedText.length === 0) {
      log('warning', '  No text extracted from PDF');
      return {
        success: false,
        filename,
        error: 'No text extracted',
        processingTime
      };
    }

    // Basic content analysis
    const wordCount = extractedText.split(/\s+/).length;
    const lineCount = extractedText.split('\n').length;
    
    log('success', '  Text extraction successful!');
    log('info', `    Characters: ${extractedText.length}`);
    log('info', `    Words: ${wordCount}`);
    log('info', `    Lines: ${lineCount}`);
    log('info', `    Processing time: ${processingTime}ms`);
    
    // Show sample text
    const sample = extractedText.substring(0, 150).replace(/\s+/g, ' ').trim();
    log('info', `    Sample: "${sample}${extractedText.length > 150 ? '...' : ''}"`);

    // Try to extract structured data
    try {
      const { parseReservationData } = await import(path.join(PROJECT_ROOT, 'server/parsers/parseReservations.js'));
      
      log('info', '  Parsing reservation data...');
      const parsed = await parseReservationData(extractedText);
      
      if (parsed && parsed.reservations && parsed.reservations.length > 0) {
        log('success', `  Found ${parsed.reservations.length} reservation(s):`);
        parsed.reservations.forEach((reservation, index) => {
          log('info', `    ${index + 1}. Guest: ${reservation.guestName || 'N/A'}`);
          log('info', `       Property: ${reservation.propertyName || 'N/A'}`);
          log('info', `       Check-in: ${reservation.checkIn || 'N/A'}`);
          log('info', `       Check-out: ${reservation.checkOut || 'N/A'}`);
        });
      } else {
        log('info', '  No structured reservation data found');
      }

      if (parsed && parsed.missing && parsed.missing.length > 0) {
        log('warning', `  Missing fields: ${parsed.missing.join(', ')}`);
      }
      
    } catch (parseError) {
      log('warning', '  Could not parse reservation data:', parseError.message);
    }

    return {
      success: true,
      filename,
      textLength: extractedText.length,
      wordCount,
      lineCount,
      processingTime,
      sample
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    log('error', `  OCR failed: ${error.message}`);
    
    return {
      success: false,
      filename,
      error: error.message,
      processingTime
    };
  }
}

// Main validation function
async function runQuickValidation() {
  console.log('🔍 OCR Quick Validation');
  console.log('=' .repeat(50));
  
  // Parse command line arguments
  const specificFile = process.argv[2];
  
  // Validate environment
  const env = validateEnvironment();
  
  // Discover PDFs
  const pdfFiles = discoverPDFs(specificFile);
  
  if (pdfFiles.length === 0) {
    log('error', 'No PDF files available for testing');
    process.exit(1);
  }

  // Run OCR validation on each PDF
  const results = [];
  
  for (const filename of pdfFiles) {
    console.log('\n' + '-'.repeat(40));
    const result = await validateOCRWithPDF(filename);
    results.push(result);
    
    // Add delay between files to avoid rate limiting
    if (pdfFiles.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Generate summary
  console.log('\n' + '=' .repeat(50));
  log('info', 'VALIDATION SUMMARY');
  console.log('=' .repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  log('info', `Total files tested: ${results.length}`);
  log(successful.length > 0 ? 'success' : 'warning', `Successful: ${successful.length}`);
  
  if (failed.length > 0) {
    log('error', `Failed: ${failed.length}`);
    failed.forEach(result => {
      log('error', `  • ${result.filename}: ${result.error}`);
    });
  }

  if (successful.length > 0) {
    const avgTime = successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length;
    const avgChars = successful.reduce((sum, r) => sum + r.textLength, 0) / successful.length;
    
    log('info', `Average processing time: ${avgTime.toFixed(2)}ms`);
    log('info', `Average text length: ${avgChars.toFixed(0)} characters`);
    
    // Performance assessment
    if (avgTime < 10000) {
      log('success', 'Performance: Excellent (< 10s)');
    } else if (avgTime < 30000) {
      log('info', 'Performance: Good (< 30s)');
    } else {
      log('warning', 'Performance: Slow (> 30s)');
    }
  }

  console.log('\n' + '=' .repeat(50));
  
  if (failed.length === 0) {
    log('success', '🎉 All OCR validations passed!');
    
    if (!env.hasProviders) {
      log('info', '💡 Consider configuring OCR providers for better text extraction');
    }
    
    process.exit(0);
  } else {
    log('error', '❌ Some OCR validations failed');
    process.exit(1);
  }
}

// Handle unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled promise rejection:', reason);
  process.exit(1);
});

// Run validation
runQuickValidation().catch(error => {
  log('error', 'Fatal error:', error.message);
  process.exit(1);
});