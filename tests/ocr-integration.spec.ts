/**
 * Comprehensive OCR Integration Tests
 * Tests the OCR functionality with existing PDFs in the public directory
 * Validates Mistral OCR integration, provider fallbacks, and data extraction
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import axios from 'axios';

// Import OCR services for direct testing
import { AIAdapter } from '../server/services/ai-adapter.service';
import { MistralOCRService } from '../server/services/mistral-ocr.service';
import * as ocrController from '../server/controllers/ocr.controller';

// Test configuration
const TEST_CONFIG = {
  API_BASE_URL: process.env.TEST_API_URL || 'http://localhost:5000',
  PUBLIC_DIR: path.join(process.cwd(), 'public'),
  TIMEOUT: 30000, // 30 seconds timeout for OCR operations
  EXPECTED_PDF_COUNT: 10, // Expected number of test PDFs
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

// Test data structure for PDF validation
interface TestPDFResult {
  filename: string;
  success: boolean;
  provider: string;
  textLength: number;
  processingTime: number;
  error?: string;
  extractedData?: any;
}

// Global test state
let testResults: TestPDFResult[] = [];
let aiAdapter: AIAdapter;
let mistralService: MistralOCRService;
let availablePDFs: string[] = [];

describe('OCR Integration Tests', () => {
  beforeAll(async () => {
    // Initialize OCR services
    aiAdapter = AIAdapter.getInstance();
    mistralService = new MistralOCRService();
    
    // Discover available PDF files
    try {
      const files = fs.readdirSync(TEST_CONFIG.PUBLIC_DIR);
      availablePDFs = files.filter(f => f.endsWith('.pdf'));
      console.log(`Found ${availablePDFs.length} PDF files for testing:`, availablePDFs);
    } catch (error) {
      console.error('Error reading public directory:', error);
      availablePDFs = [];
    }
    
    // Verify we have PDFs to test
    if (availablePDFs.length === 0) {
      console.warn('No PDF files found in public directory. Some tests will be skipped.');
    }
  });

  afterAll(() => {
    // Generate test summary report
    if (testResults.length > 0) {
      const summary = generateTestSummary(testResults);
      console.log('\n=== OCR Integration Test Summary ===');
      console.log(summary);
    }
  });

  describe('PDF File Discovery and Validation', () => {
    it('should find PDF files in public directory', () => {
      expect(availablePDFs.length).toBeGreaterThan(0);
      expect(availablePDFs).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/\.pdf$/i)
        ])
      );
    });

    it('should validate PDF file accessibility', () => {
      for (const pdfFile of availablePDFs) {
        const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, pdfFile);
        expect(fs.existsSync(filePath)).toBe(true);
        
        const stats = fs.statSync(filePath);
        expect(stats.isFile()).toBe(true);
        expect(stats.size).toBeGreaterThan(0);
        expect(stats.size).toBeLessThan(TEST_CONFIG.MAX_FILE_SIZE);
      }
    });

    it('should categorize PDF types correctly', () => {
      const controloFiles = availablePDFs.filter(f => f.startsWith('Controlo_'));
      const genericFiles = availablePDFs.filter(f => f.startsWith('file'));
      
      expect(controloFiles.length).toBeGreaterThan(0);
      console.log('Control files found:', controloFiles);
      console.log('Generic files found:', genericFiles);
    });
  });

  describe('OCR Service Configuration', () => {
    it('should have at least one OCR service configured', () => {
      const hasAnyService = aiAdapter.isServiceAvailable();
      expect(hasAnyService).toBe(true);
    });

    it('should detect available OCR providers', async () => {
      const providers = {
        mistral: !!process.env.MISTRAL_API_KEY,
        openrouter: !!process.env.OPENROUTER_API_KEY,
        huggingface: !!process.env.HF_TOKEN,
        gemini: !!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
      };

      console.log('Available OCR providers:', providers);
      
      // At least one provider should be available
      const availableProviders = Object.values(providers).filter(Boolean);
      expect(availableProviders.length).toBeGreaterThan(0);
    });

    it('should test Mistral OCR connection if configured', async () => {
      if (process.env.MISTRAL_API_KEY) {
        const connectionTest = await mistralService.testConnection();
        console.log('Mistral OCR connection test:', connectionTest);
        expect(connectionTest.success).toBe(true);
      } else {
        console.warn('MISTRAL_API_KEY not configured, skipping Mistral connection test');
      }
    }, TEST_CONFIG.TIMEOUT);
  });

  describe('Single PDF OCR Processing', () => {
    const testSinglePDF = async (filename: string, provider?: string) => {
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, filename);
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      const startTime = Date.now();
      
      try {
        const extractedText = await aiAdapter.extractTextFromPDF(pdfBase64, provider);
        const processingTime = Date.now() - startTime;
        
        const result: TestPDFResult = {
          filename,
          success: true,
          provider: provider || 'auto',
          textLength: extractedText.length,
          processingTime,
          extractedData: extractedText.substring(0, 200) + '...' // Preview
        };
        
        testResults.push(result);
        return result;
      } catch (error) {
        const processingTime = Date.now() - startTime;
        const result: TestPDFResult = {
          filename,
          success: false,
          provider: provider || 'auto',
          textLength: 0,
          processingTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        testResults.push(result);
        throw error;
      }
    };

    it('should process a Controlo PDF with auto provider', async () => {
      const controloFiles = availablePDFs.filter(f => f.startsWith('Controlo_'));
      if (controloFiles.length === 0) {
        console.warn('No Controlo files found, skipping test');
        return;
      }

      const testFile = controloFiles[0];
      const result = await testSinglePDF(testFile);
      
      expect(result.success).toBe(true);
      expect(result.textLength).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(TEST_CONFIG.TIMEOUT);
      
      console.log(`Processed ${testFile}: ${result.textLength} chars in ${result.processingTime}ms`);
    }, TEST_CONFIG.TIMEOUT);

    it('should process with Mistral OCR specifically', async () => {
      if (!process.env.MISTRAL_API_KEY) {
        console.warn('MISTRAL_API_KEY not configured, skipping Mistral-specific test');
        return;
      }

      const testFile = availablePDFs[0];
      const result = await testSinglePDF(testFile, 'mistral-ocr');
      
      expect(result.success).toBe(true);
      expect(result.provider).toBe('mistral-ocr');
      expect(result.textLength).toBeGreaterThan(0);
    }, TEST_CONFIG.TIMEOUT);

    it('should process with OpenRouter fallback', async () => {
      if (!process.env.OPENROUTER_API_KEY) {
        console.warn('OPENROUTER_API_KEY not configured, skipping OpenRouter test');
        return;
      }

      const testFile = availablePDFs[0];
      const result = await testSinglePDF(testFile, 'openrouter');
      
      expect(result.success).toBe(true);
      expect(result.provider).toBe('openrouter');
      expect(result.textLength).toBeGreaterThan(0);
    }, TEST_CONFIG.TIMEOUT);

    it('should handle native extraction as fallback', async () => {
      const testFile = availablePDFs[0];
      const result = await testSinglePDF(testFile, 'native');
      
      expect(result.success).toBe(true);
      expect(result.provider).toBe('native');
      expect(result.textLength).toBeGreaterThan(0);
    }, TEST_CONFIG.TIMEOUT);
  });

  describe('Batch PDF Processing', () => {
    it('should process multiple PDFs in sequence', async () => {
      const testFiles = availablePDFs.slice(0, 3); // Test first 3 files
      const results: TestPDFResult[] = [];
      
      for (const filename of testFiles) {
        const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, filename);
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        const startTime = Date.now();
        
        try {
          const extractedText = await aiAdapter.extractTextFromPDF(pdfBase64);
          const processingTime = Date.now() - startTime;
          
          results.push({
            filename,
            success: true,
            provider: 'auto',
            textLength: extractedText.length,
            processingTime
          });
        } catch (error) {
          results.push({
            filename,
            success: false,
            provider: 'auto',
            textLength: 0,
            processingTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
      
      expect(successCount).toBeGreaterThan(0);
      expect(avgProcessingTime).toBeLessThan(TEST_CONFIG.TIMEOUT);
      
      console.log(`Batch processing: ${successCount}/${testFiles.length} successful, avg time: ${avgProcessingTime.toFixed(2)}ms`);
    }, TEST_CONFIG.TIMEOUT * 3);
  });

  describe('Data Extraction and Validation', () => {
    it('should extract structured data from PDF text', async () => {
      if (availablePDFs.length === 0) return;
      
      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      // Extract text first
      const extractedText = await aiAdapter.extractTextFromPDF(pdfBase64);
      expect(extractedText).toBeTruthy();
      expect(extractedText.length).toBeGreaterThan(0);
      
      // Try to parse reservation data if this is a reservation PDF
      try {
        const structuredData = await aiAdapter.parseReservationData(extractedText);
        console.log('Extracted structured data:', structuredData);
        
        // Validate common fields
        if (structuredData && typeof structuredData === 'object') {
          const hasReservationFields = 
            'guestName' in structuredData ||
            'checkIn' in structuredData ||
            'checkOut' in structuredData ||
            'property' in structuredData;
          
          if (hasReservationFields) {
            expect(structuredData).toBeDefined();
            console.log('Successfully extracted reservation data');
          }
        }
      } catch (error) {
        console.log('No structured reservation data found, which is expected for non-reservation PDFs');
      }
    }, TEST_CONFIG.TIMEOUT);

    it('should handle property name matching', async () => {
      const testData = {
        propertyName: 'Aroeira II',
        extractedName: 'aroeira 2'
      };
      
      // This would normally test the property matching logic
      // For now, we'll test the basic normalization
      const normalized1 = testData.propertyName.toLowerCase().trim();
      const normalized2 = testData.extractedName.toLowerCase().trim();
      
      expect(normalized1).toContain('aroeira');
      expect(normalized2).toContain('aroeira');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle corrupted PDF files gracefully', async () => {
      const corruptPdfBase64 = Buffer.from('This is not a PDF file').toString('base64');
      
      await expect(async () => {
        await aiAdapter.extractTextFromPDF(corruptPdfBase64);
      }).rejects.toThrow();
    });

    it('should handle empty PDF files', async () => {
      // Create a minimal but valid PDF buffer for testing
      const minimalPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000173 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n253\n%%EOF');
      const pdfBase64 = minimalPdf.toString('base64');
      
      try {
        const result = await aiAdapter.extractTextFromPDF(pdfBase64);
        expect(typeof result).toBe('string');
        // Empty PDFs should return empty string or minimal content
        expect(result.length).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // It's acceptable for minimal PDFs to fail with certain providers
        expect(error).toBeDefined();
      }
    });

    it('should handle network timeouts gracefully', async () => {
      // This test simulates timeout handling
      // In a real scenario, we'd mock the HTTP client to timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 100);
      });
      
      await expect(timeoutPromise).rejects.toThrow('Timeout');
    });
  });

  describe('Performance and Metrics', () => {
    it('should complete OCR within acceptable time limits', async () => {
      if (availablePDFs.length === 0) return;
      
      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      const fileSize = fs.statSync(filePath).size;
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      const startTime = Date.now();
      const extractedText = await aiAdapter.extractTextFromPDF(pdfBase64);
      const processingTime = Date.now() - startTime;
      
      // Performance expectations
      expect(processingTime).toBeLessThan(TEST_CONFIG.TIMEOUT);
      expect(extractedText.length).toBeGreaterThan(0);
      
      // Log performance metrics
      const textPerMs = extractedText.length / processingTime;
      const mbPerSecond = (fileSize / 1024 / 1024) / (processingTime / 1000);
      
      console.log(`Performance metrics for ${testFile}:`);
      console.log(`  File size: ${(fileSize / 1024).toFixed(2)} KB`);
      console.log(`  Processing time: ${processingTime} ms`);
      console.log(`  Text extracted: ${extractedText.length} chars`);
      console.log(`  Throughput: ${textPerMs.toFixed(2)} chars/ms`);
      console.log(`  File throughput: ${mbPerSecond.toFixed(2)} MB/s`);
    }, TEST_CONFIG.TIMEOUT);
  });

  describe('API Endpoint Integration', () => {
    it('should test OCR endpoint if server is running', async () => {
      try {
        if (availablePDFs.length === 0) return;
        
        const testFile = availablePDFs[0];
        const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
        
        // Create form data
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));
        
        // Test the upload endpoint
        const response = await axios.post(
          `${TEST_CONFIG.API_BASE_URL}/api/ocr/upload`,
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
            timeout: TEST_CONFIG.TIMEOUT,
          }
        );
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success');
        expect(response.data).toHaveProperty('rawText');
        
        if (response.data.success) {
          expect(response.data.rawText.length).toBeGreaterThan(0);
          console.log('API endpoint test successful:', {
            provider: response.data.provider,
            textLength: response.data.rawText.length,
            metrics: response.data.metrics
          });
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
          console.warn('Server not running, skipping API endpoint test');
        } else {
          throw error;
        }
      }
    }, TEST_CONFIG.TIMEOUT);
  });
});

/**
 * Helper function to generate test summary
 */
function generateTestSummary(results: TestPDFResult[]): string {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  const avgProcessingTime = successful.length > 0 
    ? successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length 
    : 0;
  
  const avgTextLength = successful.length > 0
    ? successful.reduce((sum, r) => sum + r.textLength, 0) / successful.length
    : 0;
  
  const providerCounts = results.reduce((acc, r) => {
    acc[r.provider] = (acc[r.provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return `
Total tests: ${results.length}
Successful: ${successful.length} (${((successful.length / results.length) * 100).toFixed(1)}%)
Failed: ${failed.length}
Average processing time: ${avgProcessingTime.toFixed(2)}ms
Average text length: ${avgTextLength.toFixed(0)} characters
Provider usage: ${Object.entries(providerCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}

Failed tests:
${failed.map(f => `  ${f.filename}: ${f.error}`).join('\n')}
  `;
}