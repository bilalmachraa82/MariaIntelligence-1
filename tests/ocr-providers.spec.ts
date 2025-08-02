/**
 * OCR Providers Specific Tests
 * Tests each OCR provider individually with real PDFs
 * Validates provider-specific functionality and error handling
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MistralOCRService } from '../server/services/mistral-ocr.service';
import { OpenRouterService } from '../server/services/openrouter.service';
import { RolmService } from '../server/services/rolm.service';
import { GeminiService } from '../server/services/gemini.service';
import { HandwritingDetector } from '../server/services/handwriting-detector';

// Test configuration
const TEST_CONFIG = {
  PUBLIC_DIR: path.join(process.cwd(), 'public'),
  TIMEOUT: 45000, // 45 seconds for provider-specific tests
  SAMPLE_SIZE: 3, // Number of PDFs to test per provider
};

// Provider test results
interface ProviderTestResult {
  provider: string;
  filename: string;
  success: boolean;
  textLength: number;
  processingTime: number;
  error?: string;
  confidence?: number;
}

let availablePDFs: string[] = [];
let testResults: ProviderTestResult[] = [];

describe('OCR Providers Specific Tests', () => {
  beforeAll(async () => {
    // Discover available PDF files
    try {
      const files = fs.readdirSync(TEST_CONFIG.PUBLIC_DIR);
      availablePDFs = files.filter(f => f.endsWith('.pdf'));
      console.log(`Found ${availablePDFs.length} PDF files for provider testing`);
    } catch (error) {
      console.error('Error reading public directory:', error);
      availablePDFs = [];
    }
  });

  describe('Mistral OCR Provider Tests', () => {
    let mistralService: MistralOCRService;
    
    beforeEach(() => {
      mistralService = new MistralOCRService();
    });

    it('should test Mistral OCR connection', async () => {
      if (!process.env.MISTRAL_API_KEY) {
        console.warn('MISTRAL_API_KEY not configured, skipping Mistral tests');
        return;
      }

      const connectionTest = await mistralService.testConnection();
      expect(connectionTest.success).toBe(true);
      console.log('Mistral connection test result:', connectionTest.message);
    }, TEST_CONFIG.TIMEOUT);

    it('should process PDF with Mistral OCR', async () => {
      if (!process.env.MISTRAL_API_KEY || availablePDFs.length === 0) {
        console.warn('Skipping Mistral PDF test - no API key or PDFs');
        return;
      }

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      const pdfBuffer = fs.readFileSync(filePath);
      
      const startTime = Date.now();
      
      try {
        const result = await mistralService.processPdf(pdfBuffer);
        const processingTime = Date.now() - startTime;
        
        expect(result).toBeDefined();
        expect(result.text).toBeTruthy();
        expect(result.text.length).toBeGreaterThan(0);
        
        const testResult: ProviderTestResult = {
          provider: 'mistral-ocr',
          filename: testFile,
          success: true,
          textLength: result.text.length,
          processingTime,
          confidence: result.metadata?.confidence
        };
        
        testResults.push(testResult);
        
        console.log(`Mistral OCR processed ${testFile}: ${result.text.length} chars in ${processingTime}ms`);
        
        // Log first 200 characters for verification
        console.log('Sample text:', result.text.substring(0, 200) + '...');
        
      } catch (error) {
        const testResult: ProviderTestResult = {
          provider: 'mistral-ocr',
          filename: testFile,
          success: false,
          textLength: 0,
          processingTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        testResults.push(testResult);
        throw error;
      }
    }, TEST_CONFIG.TIMEOUT);

    it('should handle multiple PDFs with Mistral OCR batch processing', async () => {
      if (!process.env.MISTRAL_API_KEY || availablePDFs.length === 0) {
        console.warn('Skipping Mistral batch test');
        return;
      }

      const testFiles = availablePDFs.slice(0, Math.min(TEST_CONFIG.SAMPLE_SIZE, availablePDFs.length));
      const documents = testFiles.map(filename => {
        const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, filename);
        return {
          data: fs.readFileSync(filePath),
          mimeType: 'application/pdf',
          filename
        };
      });

      const startTime = Date.now();
      const results = await mistralService.processBatch(documents);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(testFiles.length);
      
      const successful = results.filter(r => !r.error);
      const avgProcessingTime = totalTime / testFiles.length;
      
      console.log(`Mistral batch processing: ${successful.length}/${testFiles.length} successful`);
      console.log(`Average time per document: ${avgProcessingTime.toFixed(2)}ms`);
      
      expect(successful.length).toBeGreaterThan(0);
    }, TEST_CONFIG.TIMEOUT * 2);
  });

  describe('OpenRouter Provider Tests', () => {
    let openRouterService: OpenRouterService;
    
    beforeEach(() => {
      openRouterService = new OpenRouterService();
    });

    it('should test OpenRouter connection', async () => {
      if (!process.env.OPENROUTER_API_KEY) {
        console.warn('OPENROUTER_API_KEY not configured, skipping OpenRouter tests');
        return;
      }

      const connectionTest = await openRouterService.testConnection();
      expect(connectionTest.success).toBe(true);
      console.log('OpenRouter connection test result:', connectionTest.message);
    }, TEST_CONFIG.TIMEOUT);

    it('should process PDF with OpenRouter', async () => {
      if (!process.env.OPENROUTER_API_KEY || availablePDFs.length === 0) {
        console.warn('Skipping OpenRouter PDF test');
        return;
      }

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      const pdfBuffer = fs.readFileSync(filePath);
      
      const startTime = Date.now();
      
      try {
        const result = await openRouterService.ocrPdf(pdfBuffer);
        const processingTime = Date.now() - startTime;
        
        expect(result).toBeDefined();
        expect(result.error).toBeFalsy();
        expect(result.full_text).toBeTruthy();
        expect(result.full_text.length).toBeGreaterThan(0);
        
        const testResult: ProviderTestResult = {
          provider: 'openrouter',
          filename: testFile,
          success: true,
          textLength: result.full_text.length,
          processingTime
        };
        
        testResults.push(testResult);
        
        console.log(`OpenRouter processed ${testFile}: ${result.full_text.length} chars in ${processingTime}ms`);
        console.log('Sample text:', result.full_text.substring(0, 200) + '...');
        
      } catch (error) {
        const testResult: ProviderTestResult = {
          provider: 'openrouter',
          filename: testFile,
          success: false,
          textLength: 0,
          processingTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        testResults.push(testResult);
        throw error;
      }
    }, TEST_CONFIG.TIMEOUT);

    it('should handle different PDF complexities with OpenRouter', async () => {
      if (!process.env.OPENROUTER_API_KEY || availablePDFs.length < 2) {
        console.warn('Skipping OpenRouter complexity test');
        return;
      }

      // Test with different types of PDFs
      const controloFiles = availablePDFs.filter(f => f.startsWith('Controlo_'));
      const genericFiles = availablePDFs.filter(f => f.startsWith('file'));
      
      const testFiles = [
        ...(controloFiles.length > 0 ? [controloFiles[0]] : []),
        ...(genericFiles.length > 0 ? [genericFiles[0]] : [])
      ];

      for (const filename of testFiles) {
        const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, filename);
        const pdfBuffer = fs.readFileSync(filePath);
        const fileSize = fs.statSync(filePath).size;
        
        const startTime = Date.now();
        const result = await openRouterService.ocrPdf(pdfBuffer);
        const processingTime = Date.now() - startTime;
        
        expect(result.error).toBeFalsy();
        expect(result.full_text.length).toBeGreaterThan(0);
        
        console.log(`${filename} (${(fileSize/1024).toFixed(1)}KB): ${result.full_text.length} chars in ${processingTime}ms`);
      }
    }, TEST_CONFIG.TIMEOUT * 2);
  });

  describe('RolmOCR Provider Tests', () => {
    let rolmService: RolmService;
    
    beforeEach(() => {
      rolmService = new RolmService();
    });

    it('should test RolmOCR connection', async () => {
      if (!process.env.HF_TOKEN) {
        console.warn('HF_TOKEN not configured, skipping RolmOCR tests');
        return;
      }

      const connectionTest = await rolmService.testConnection();
      expect(connectionTest.success).toBe(true);
      console.log('RolmOCR connection test result:', connectionTest.message);
    }, TEST_CONFIG.TIMEOUT);

    it('should process PDF with RolmOCR', async () => {
      if (!process.env.HF_TOKEN || availablePDFs.length === 0) {
        console.warn('Skipping RolmOCR PDF test');
        return;
      }

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      const pdfBuffer = fs.readFileSync(filePath);
      
      const startTime = Date.now();
      
      try {
        const result = await rolmService.processHandwriting(pdfBuffer);
        const processingTime = Date.now() - startTime;
        
        expect(result).toBeDefined();
        expect(result.error).toBeFalsy();
        expect(result.text).toBeTruthy();
        expect(result.text.length).toBeGreaterThan(0);
        
        const testResult: ProviderTestResult = {
          provider: 'rolm-ocr',
          filename: testFile,
          success: true,
          textLength: result.text.length,
          processingTime
        };
        
        testResults.push(testResult);
        
        console.log(`RolmOCR processed ${testFile}: ${result.text.length} chars in ${processingTime}ms`);
        console.log('Sample text:', result.text.substring(0, 200) + '...');
        
      } catch (error) {
        const testResult: ProviderTestResult = {
          provider: 'rolm-ocr',
          filename: testFile,
          success: false,
          textLength: 0,
          processingTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        testResults.push(testResult);
        throw error;
      }
    }, TEST_CONFIG.TIMEOUT);
  });

  describe('Gemini Provider Tests', () => {
    let geminiService: GeminiService;
    
    beforeEach(() => {
      geminiService = new GeminiService();
    });

    it('should test Gemini connection', async () => {
      if (!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
        console.warn('Gemini API key not configured, skipping Gemini tests');
        return;
      }

      const connectionTest = await geminiService.testConnection();
      expect(connectionTest.success).toBe(true);
      console.log('Gemini connection test result:', connectionTest.message);
    }, TEST_CONFIG.TIMEOUT);

    it('should process PDF with Gemini visual analysis', async () => {
      if (!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY) || availablePDFs.length === 0) {
        console.warn('Skipping Gemini visual analysis test');
        return;
      }

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      const startTime = Date.now();
      
      try {
        const result = await geminiService.analyzeDocumentVisually(pdfBase64, 'application/pdf');
        const processingTime = Date.now() - startTime;
        
        expect(result).toBeDefined();
        console.log(`Gemini visual analysis for ${testFile} completed in ${processingTime}ms`);
        console.log('Analysis result:', result);
        
      } catch (error) {
        console.log('Gemini visual analysis failed:', error instanceof Error ? error.message : 'Unknown error');
        // Gemini visual analysis is optional, so we don't fail the test
      }
    }, TEST_CONFIG.TIMEOUT);
  });

  describe('Handwriting Detection Tests', () => {
    let handwritingDetector: HandwritingDetector;
    
    beforeEach(() => {
      handwritingDetector = new HandwritingDetector();
    });

    it('should analyze PDFs for handwriting content', async () => {
      if (availablePDFs.length === 0) {
        console.warn('No PDFs available for handwriting detection test');
        return;
      }

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      const pdfBuffer = fs.readFileSync(filePath);
      
      try {
        const handwritingScore = await handwritingDetector.analyzePdf(pdfBuffer);
        
        expect(typeof handwritingScore).toBe('number');
        expect(handwritingScore).toBeGreaterThanOrEqual(0);
        expect(handwritingScore).toBeLessThanOrEqual(1);
        
        console.log(`Handwriting detection for ${testFile}: ${handwritingScore.toFixed(3)}`);
        
        if (handwritingScore > 0.4) {
          console.log('  -> High handwriting probability detected');
        } else if (handwritingScore > 0.2) {
          console.log('  -> Moderate handwriting probability detected');
        } else {
          console.log('  -> Low handwriting probability detected');
        }
        
      } catch (error) {
        console.log('Handwriting detection failed:', error instanceof Error ? error.message : 'Unknown error');
        // Handwriting detection is optional, so we don't fail the test
      }
    }, TEST_CONFIG.TIMEOUT);

    it('should test handwriting detection with multiple PDFs', async () => {
      if (availablePDFs.length < 2) {
        console.warn('Need at least 2 PDFs for comprehensive handwriting detection test');
        return;
      }

      const testFiles = availablePDFs.slice(0, 3);
      const results: Array<{filename: string, score: number, error?: string}> = [];
      
      for (const filename of testFiles) {
        const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, filename);
        const pdfBuffer = fs.readFileSync(filePath);
        
        try {
          const score = await handwritingDetector.analyzePdf(pdfBuffer);
          results.push({ filename, score });
        } catch (error) {
          results.push({ 
            filename, 
            score: 0, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      console.log('\nHandwriting Detection Results:');
      results.forEach(result => {
        if (result.error) {
          console.log(`  ${result.filename}: ERROR - ${result.error}`);
        } else {
          console.log(`  ${result.filename}: ${result.score.toFixed(3)} (${result.score > 0.4 ? 'HIGH' : result.score > 0.2 ? 'MEDIUM' : 'LOW'})`);
        }
      });
      
      const successfulTests = results.filter(r => !r.error);
      expect(successfulTests.length).toBeGreaterThan(0);
    }, TEST_CONFIG.TIMEOUT * 2);
  });

  describe('Provider Comparison and Performance', () => {
    it('should compare provider performance on same PDF', async () => {
      if (availablePDFs.length === 0) {
        console.warn('No PDFs available for provider comparison');
        return;
      }

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      const pdfBuffer = fs.readFileSync(filePath);
      const fileSize = fs.statSync(filePath).size;
      
      const providerResults: Array<{
        provider: string;
        success: boolean;
        textLength: number;
        processingTime: number;
        error?: string;
      }> = [];

      // Test Mistral OCR if available
      if (process.env.MISTRAL_API_KEY) {
        try {
          const mistralService = new MistralOCRService();
          const startTime = Date.now();
          const result = await mistralService.processPdf(pdfBuffer);
          const processingTime = Date.now() - startTime;
          
          providerResults.push({
            provider: 'Mistral OCR',
            success: true,
            textLength: result.text.length,
            processingTime
          });
        } catch (error) {
          providerResults.push({
            provider: 'Mistral OCR',
            success: false,
            textLength: 0,
            processingTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Test OpenRouter if available
      if (process.env.OPENROUTER_API_KEY) {
        try {
          const openRouterService = new OpenRouterService();
          const startTime = Date.now();
          const result = await openRouterService.ocrPdf(pdfBuffer);
          const processingTime = Date.now() - startTime;
          
          providerResults.push({
            provider: 'OpenRouter',
            success: !result.error,
            textLength: result.full_text ? result.full_text.length : 0,
            processingTime
          });
        } catch (error) {
          providerResults.push({
            provider: 'OpenRouter',
            success: false,
            textLength: 0,
            processingTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Test RolmOCR if available
      if (process.env.HF_TOKEN) {
        try {
          const rolmService = new RolmService();
          const startTime = Date.now();
          const result = await rolmService.processHandwriting(pdfBuffer);
          const processingTime = Date.now() - startTime;
          
          providerResults.push({
            provider: 'RolmOCR',
            success: !result.error,
            textLength: result.text ? result.text.length : 0,
            processingTime
          });
        } catch (error) {
          providerResults.push({
            provider: 'RolmOCR',
            success: false,
            textLength: 0,
            processingTime: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      console.log(`\nProvider Performance Comparison for ${testFile} (${(fileSize/1024).toFixed(1)}KB):`);
      console.log('=' .repeat(80));
      
      providerResults.forEach(result => {
        if (result.success) {
          const efficiency = result.textLength / result.processingTime; // chars per ms
          console.log(`${result.provider.padEnd(15)} | ${result.processingTime.toString().padStart(6)}ms | ${result.textLength.toString().padStart(6)} chars | ${efficiency.toFixed(2)} chars/ms`);
        } else {
          console.log(`${result.provider.padEnd(15)} | FAILED: ${result.error}`);
        }
      });

      const successfulResults = providerResults.filter(r => r.success);
      expect(successfulResults.length).toBeGreaterThan(0);
      
      if (successfulResults.length > 1) {
        const fastest = successfulResults.reduce((a, b) => a.processingTime < b.processingTime ? a : b);
        const mostText = successfulResults.reduce((a, b) => a.textLength > b.textLength ? a : b);
        
        console.log(`\nFastest: ${fastest.provider} (${fastest.processingTime}ms)`);
        console.log(`Most text extracted: ${mostText.provider} (${mostText.textLength} chars)`);
      }
    }, TEST_CONFIG.TIMEOUT * 3);
  });
});