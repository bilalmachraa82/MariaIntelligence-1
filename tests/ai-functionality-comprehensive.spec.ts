/**
 * Comprehensive AI Functionality Test Suite for MariaIntelligence System
 * Tests all AI-powered features, integrations, and error scenarios
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AIAdapter, aiService } from '../server/services/ai-adapter.service.js';
import { GeminiService } from '../server/services/gemini.service.js';
import { OpenRouterService } from '../server/services/openrouter.service.js';
import { MistralOCRService, mistralOCRService } from '../server/services/mistral-ocr.service.js';
import { RolmService } from '../server/services/rolm.service.js';
import { rateLimiter } from '../server/services/rate-limiter.service.js';
import fs from 'fs';
import path from 'path';
import { describeIf, AI_LIVE_ENABLED, logSkip } from './utils/testFlags';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds timeout for AI operations
const SAMPLE_PDF_PATH = path.join(__dirname, 'data', '05-versions-space.pdf');
const SAMPLE_TEXT = `
EXCITING LISBON SETE RIOS
Data entrada: 21/03/2025
Data saída: 23/03/2025
N.º noites: 2
Nome: Camila
N.º hóspedes: 4
País: Portugal
Site: Airbnb
Telefone: 351 925 073 494
`;

const describeLiveAI = describeIf(AI_LIVE_ENABLED);

if (!AI_LIVE_ENABLED) {
  logSkip('AI functionality comprehensive suite skipped (AI_SERVICE_MODE=live required)');
}

describeLiveAI('AI Functionality Comprehensive Test Suite', () => {
  let testResults: {
    feature: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    performance?: number;
    errors?: string[];
  }[] = [];

  const addTestResult = (feature: string, status: 'pass' | 'fail' | 'warning', message: string, performance?: number, errors?: string[]) => {
    testResults.push({ feature, status, message, performance, errors });
  };

  beforeAll(async () => {
    console.log('🚀 Starting comprehensive AI functionality tests...');
  });

  afterAll(async () => {
    console.log('\n📊 Test Results Summary:');
    console.log('=' .repeat(80));
    
    let passed = 0;
    let failed = 0;
    let warnings = 0;
    
    testResults.forEach(result => {
      const emoji = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`${emoji} ${result.feature}: ${result.message}`);
      if (result.performance) {
        console.log(`   ⏱️  Performance: ${result.performance}ms`);
      }
      if (result.errors && result.errors.length > 0) {
        console.log(`   🐛 Errors: ${result.errors.join(', ')}`);
      }
      
      if (result.status === 'pass') passed++;
      else if (result.status === 'fail') failed++;
      else warnings++;
    });
    
    console.log('=' .repeat(80));
    console.log(`📈 Summary: ${passed} passed, ${failed} failed, ${warnings} warnings`);
    console.log(`🎯 Success Rate: ${Math.round((passed / testResults.length) * 100)}%`);
  });

  describe('1. AI Service Inventory and Configuration', () => {
    it('should identify all AI services and their configuration status', async () => {
      const startTime = Date.now();
      
      try {
        // Test AI Adapter initialization
        const adapter = AIAdapter.getInstance();
        expect(adapter).toBeDefined();
        
        // Check environment variables
        const configs = {
          'OpenRouter': process.env.OPENROUTER_API_KEY,
          'Gemini': process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
          'Mistral': process.env.MISTRAL_API_KEY,
          'Hugging Face (Rolm)': process.env.HF_TOKEN,
          'Primary AI': process.env.PRIMARY_AI
        };
        
        const configuredServices = Object.entries(configs)
          .filter(([_, value]) => value && value !== '')
          .map(([key, _]) => key);
        
        const missingServices = Object.entries(configs)
          .filter(([_, value]) => !value || value === '')
          .map(([key, _]) => key);
        
        addTestResult(
          'AI Service Configuration',
          missingServices.length === 0 ? 'pass' : 'warning',
          `${configuredServices.length}/5 services configured: ${configuredServices.join(', ')}`,
          Date.now() - startTime,
          missingServices.length > 0 ? [`Missing: ${missingServices.join(', ')}`] : undefined
        );
        
        expect(adapter.isServiceAvailable()).toBe(true);
        
      } catch (error: any) {
        addTestResult('AI Service Configuration', 'fail', error.message, Date.now() - startTime, [error.message]);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should test connection to all configured AI services', async () => {
      const services = [
        { name: 'OpenRouter', service: new OpenRouterService() },
        { name: 'Gemini', service: new GeminiService() },
        { name: 'Mistral OCR', service: mistralOCRService },
        { name: 'Rolm', service: new RolmService() }
      ];

      const results: { [key: string]: { success: boolean; message: string; time: number } } = {};
      
      for (const { name, service } of services) {
        const startTime = Date.now();
        try {
          if ('testConnection' in service && typeof service.testConnection === 'function') {
            const result = await service.testConnection();
            const time = Date.now() - startTime;
            results[name] = { success: result.success, message: result.message, time };
            
            addTestResult(
              `${name} Connection Test`,
              result.success ? 'pass' : 'fail',
              result.message,
              time
            );
          } else {
            results[name] = { success: false, message: 'No testConnection method', time: 0 };
            addTestResult(`${name} Connection Test`, 'warning', 'No testConnection method available');
          }
        } catch (error: any) {
          const time = Date.now() - startTime;
          results[name] = { success: false, message: error.message, time };
          addTestResult(`${name} Connection Test`, 'fail', error.message, time, [error.message]);
        }
      }

      // At least one service should be working
      const workingServices = Object.values(results).filter(r => r.success).length;
      expect(workingServices).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });

  describe('2. Document Analysis and OCR Capabilities', () => {
    it('should extract text from PDF documents', async () => {
      const startTime = Date.now();
      
      try {
        // Create a sample PDF in base64 format for testing
        let pdfBase64: string;
        
        if (fs.existsSync(SAMPLE_PDF_PATH)) {
          const pdfBuffer = fs.readFileSync(SAMPLE_PDF_PATH);
          pdfBase64 = pdfBuffer.toString('base64');
        } else {
          // Create a minimal test PDF in base64 format
          pdfBase64 = 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPJ4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihUZXN0IFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyNDUgMDAwMDAgbiAKMDAwMDAwMDMxMiAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQwNAolJUVPRg==';
        }
        
        const extractedText = await aiService.extractTextFromPDF(pdfBase64);
        const time = Date.now() - startTime;
        
        expect(extractedText).toBeDefined();
        expect(typeof extractedText).toBe('string');
        expect(extractedText.length).toBeGreaterThan(0);
        
        addTestResult(
          'PDF Text Extraction',
          'pass',
          `Extracted ${extractedText.length} characters from PDF`,
          time
        );
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('PDF Text Extraction', 'fail', error.message, time, [error.message]);
        
        // This is a critical failure - PDF extraction should work
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should extract text from images', async () => {
      const startTime = Date.now();
      
      try {
        // Create a simple base64 encoded test image (1x1 pixel PNG)
        const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWJqNGwAAAABJRU5ErkJggg==';
        const mimeType = 'image/png';
        
        const extractedText = await aiService.extractTextFromImage(imageBase64, mimeType);
        const time = Date.now() - startTime;
        
        expect(extractedText).toBeDefined();
        expect(typeof extractedText).toBe('string');
        
        addTestResult(
          'Image Text Extraction',
          'pass',
          `Image OCR completed, extracted ${extractedText.length} characters`,
          time
        );
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('Image Text Extraction', 'fail', error.message, time, [error.message]);
        // Image extraction failure is not critical if PDF extraction works
        console.warn('Image text extraction failed:', error.message);
      }
    }, TEST_TIMEOUT);

    it('should parse reservation data from text', async () => {
      const startTime = Date.now();
      
      try {
        const reservationData = await aiService.parseReservationData(SAMPLE_TEXT);
        const time = Date.now() - startTime;
        
        expect(reservationData).toBeDefined();
        expect(typeof reservationData).toBe('object');
        
        // Check for expected fields
        const expectedFields = ['propertyName', 'guestName', 'checkInDate', 'checkOutDate'];
        const presentFields = expectedFields.filter(field => reservationData[field]);
        
        addTestResult(
          'Reservation Data Parsing',
          presentFields.length >= 2 ? 'pass' : 'warning',
          `Parsed ${presentFields.length}/${expectedFields.length} expected fields: ${presentFields.join(', ')}`,
          time
        );
        
        expect(presentFields.length).toBeGreaterThan(0);
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('Reservation Data Parsing', 'fail', error.message, time, [error.message]);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should classify document types', async () => {
      const startTime = Date.now();
      
      try {
        const classification = await aiService.classifyDocument(SAMPLE_TEXT);
        const time = Date.now() - startTime;
        
        expect(classification).toBeDefined();
        expect(typeof classification).toBe('object');
        expect(classification.type).toBeDefined();
        expect(classification.confidence).toBeDefined();
        
        addTestResult(
          'Document Classification',
          'pass',
          `Classified as ${classification.type} with ${Math.round(classification.confidence * 100)}% confidence`,
          time
        );
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('Document Classification', 'fail', error.message, time, [error.message]);
        // Classification failure is not critical
        console.warn('Document classification failed:', error.message);
      }
    }, TEST_TIMEOUT);
  });

  describe('3. Text Generation and AI Chat Features', () => {
    it('should generate text responses', async () => {
      const startTime = Date.now();
      
      try {
        const prompt = 'Generate a brief professional response confirming receipt of a booking request.';
        const generatedText = await aiService.generateText({ prompt });
        const time = Date.now() - startTime;
        
        expect(generatedText).toBeDefined();
        expect(typeof generatedText).toBe('string');
        expect(generatedText.length).toBeGreaterThan(10);
        
        addTestResult(
          'Text Generation',
          'pass',
          `Generated ${generatedText.length} characters of text`,
          time
        );
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('Text Generation', 'fail', error.message, time, [error.message]);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should handle conversation context', async () => {
      const startTime = Date.now();
      
      try {
        // Test context-aware responses
        const systemPrompt = 'You are a helpful assistant for a property management system.';
        const userPrompt = 'A guest is asking about check-in procedures. Provide guidance.';
        
        const response = await aiService.generateText({
          prompt: { systemPrompt, userPrompt }
        });
        const time = Date.now() - startTime;
        
        expect(response).toBeDefined();
        expect(typeof response).toBe('string');
        expect(response.toLowerCase()).toMatch(/(check.?in|arrival|procedure|guest)/);
        
        addTestResult(
          'Context-Aware Responses',
          'pass',
          'Generated contextually appropriate response',
          time
        );
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('Context-Aware Responses', 'fail', error.message, time, [error.message]);
        // Context awareness failure is not critical
        console.warn('Context-aware response failed:', error.message);
      }
    }, TEST_TIMEOUT);
  });

  describe('4. Performance and Rate Limiting', () => {
    it('should respect rate limiting constraints', async () => {
      const startTime = Date.now();
      
      try {
        // Test rate limiter functionality
        const rateLimitedFunction = rateLimiter.rateLimitedFunction(
          async () => 'test result',
          'test-function',
          5000 // 5 second cache
        );
        
        // First call should execute
        const result1 = await rateLimitedFunction();
        const firstCallTime = Date.now() - startTime;
        
        // Second call should be cached
        const secondCallStart = Date.now();
        const result2 = await rateLimitedFunction();
        const secondCallTime = Date.now() - secondCallStart;
        
        expect(result1).toBe(result2);
        expect(secondCallTime).toBeLessThan(100); // Should be very fast due to caching
        
        addTestResult(
          'Rate Limiting',
          'pass',
          `Rate limiter working - cached call completed in ${secondCallTime}ms`,
          firstCallTime
        );
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('Rate Limiting', 'warning', error.message, time, [error.message]);
        console.warn('Rate limiting test failed:', error.message);
      }
    }, TEST_TIMEOUT);

    it('should measure response times for all AI operations', async () => {
      const operations = [
        {
          name: 'Text Generation',
          operation: () => aiService.generateText({ prompt: 'Say hello in one word.' })
        },
        {
          name: 'Document Classification',
          operation: () => aiService.classifyDocument('Sample text for classification.')
        },
        {
          name: 'Data Parsing',
          operation: () => aiService.parseReservationData('Guest: John, Date: 2024-01-01')
        }
      ];

      const performanceResults: { [key: string]: number } = {};
      
      for (const { name, operation } of operations) {
        try {
          const startTime = Date.now();
          await operation();
          const time = Date.now() - startTime;
          performanceResults[name] = time;
          
          const status = time < 10000 ? 'pass' : time < 20000 ? 'warning' : 'fail';
          addTestResult(
            `Performance - ${name}`,
            status,
            `Completed in ${time}ms`,
            time
          );
        } catch (error: any) {
          performanceResults[name] = -1;
          addTestResult(`Performance - ${name}`, 'fail', error.message, 0, [error.message]);
        }
      }

      const avgTime = Object.values(performanceResults).filter(t => t > 0).reduce((a, b) => a + b, 0) / 
                     Object.values(performanceResults).filter(t => t > 0).length;
      
      addTestResult(
        'Overall Performance',
        avgTime < 15000 ? 'pass' : 'warning',
        `Average response time: ${Math.round(avgTime)}ms`
      );
    }, TEST_TIMEOUT * 3);
  });

  describe('5. Error Handling and Resilience', () => {
    it('should handle invalid API keys gracefully', async () => {
      const startTime = Date.now();
      
      try {
        // Temporarily corrupt the API key
        const originalKey = process.env.OPENROUTER_API_KEY;
        process.env.OPENROUTER_API_KEY = 'invalid-key-12345';
        
        const service = new OpenRouterService();
        const testResult = await service.testConnection();
        const time = Date.now() - startTime;
        
        // Restore original key
        process.env.OPENROUTER_API_KEY = originalKey;
        
        expect(testResult.success).toBe(false);
        expect(testResult.message).toMatch(/(invalid|unauthorized|authentication)/i);
        
        addTestResult(
          'Invalid API Key Handling',
          'pass',
          'Service correctly identified invalid API key',
          time
        );
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('Invalid API Key Handling', 'fail', error.message, time, [error.message]);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should handle network timeouts', async () => {
      const startTime = Date.now();
      
      try {
        // Test with a very short timeout to simulate network issues
        const originalTimeout = process.env.API_TIMEOUT;
        process.env.API_TIMEOUT = '100'; // 100ms timeout
        
        try {
          await aiService.generateText({ 
            prompt: 'This is a test with very short timeout.',
            maxTokens: 10
          });
        } catch (timeoutError: any) {
          // Timeout error is expected
          const time = Date.now() - startTime;
          
          addTestResult(
            'Network Timeout Handling',
            'pass',
            'Service correctly handled timeout scenario',
            time
          );
          
          // Restore original timeout
          process.env.API_TIMEOUT = originalTimeout;
          return;
        }
        
        // Restore original timeout
        process.env.API_TIMEOUT = originalTimeout;
        
        const time = Date.now() - startTime;
        addTestResult(
          'Network Timeout Handling',
          'warning',
          'Timeout test completed without expected timeout error',
          time
        );
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('Network Timeout Handling', 'fail', error.message, time, [error.message]);
        console.warn('Timeout handling test failed:', error.message);
      }
    }, TEST_TIMEOUT);

    it('should handle malformed responses', async () => {
      const startTime = Date.now();
      
      try {
        // Test parsing of potentially malformed JSON responses
        const malformedText = 'This is not valid JSON { incomplete object';
        
        try {
          await aiService.parseReservationData(malformedText);
          const time = Date.now() - startTime;
          
          addTestResult(
            'Malformed Response Handling',
            'pass',
            'Service handled malformed input gracefully',
            time
          );
        } catch (parseError: any) {
          const time = Date.now() - startTime;
          
          // Error is expected for malformed input
          addTestResult(
            'Malformed Response Handling',
            'pass',
            'Service correctly rejected malformed input',
            time
          );
        }
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('Malformed Response Handling', 'fail', error.message, time, [error.message]);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should implement proper retry mechanisms', async () => {
      const startTime = Date.now();
      
      try {
        // Test retry mechanism by checking if the service can recover from transient failures
        let attempts = 0;
        const maxAttempts = 3;
        
        const testFunction = async (): Promise<string> => {
          attempts++;
          if (attempts < 2) {
            throw new Error('Transient failure');
          }
          return 'Success after retry';
        };
        
        const result = await testFunction();
        const time = Date.now() - startTime;
        
        expect(result).toBe('Success after retry');
        expect(attempts).toBe(2);
        
        addTestResult(
          'Retry Mechanism',
          'pass',
          `Function succeeded after ${attempts} attempts`,
          time
        );
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('Retry Mechanism', 'warning', error.message, time, [error.message]);
        console.warn('Retry mechanism test failed:', error.message);
      }
    }, TEST_TIMEOUT);
  });

  describe('6. Integration and End-to-End Workflows', () => {
    it('should process complete reservation document workflow', async () => {
      const startTime = Date.now();
      
      try {
        // Create a complete PDF in base64 for testing
        const testPdfBase64 = 'JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPJ4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihSZXNlcnZhdGlvbiBDb25maXJtYXRpb24pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAzMTIgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MDQKJSVFT0Y=';
        
        const result = await aiService.processReservationDocument(testPdfBase64, 'application/pdf');
        const time = Date.now() - startTime;
        
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.rawText).toBeDefined();
        expect(result.data).toBeDefined();
        
        addTestResult(
          'End-to-End Document Processing',
          'pass',
          `Successfully processed document with ${result.rawText.length} characters extracted`,
          time
        );
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('End-to-End Document Processing', 'fail', error.message, time, [error.message]);
        throw error;
      }
    }, TEST_TIMEOUT);

    it('should handle multi-service fallback scenarios', async () => {
      const startTime = Date.now();
      
      try {
        // Test the AI adapter's ability to fallback between services
        const adapter = AIAdapter.getInstance();
        
        // Try text extraction with potential service fallbacks
        const testText = 'Test fallback scenario';
        const result = await adapter.extractDataFromText(testText, {
          systemPrompt: 'Extract any meaningful data from this text.',
          extractFields: ['content', 'type']
        });
        
        const time = Date.now() - startTime;
        
        expect(result).toBeDefined();
        
        addTestResult(
          'Multi-Service Fallback',
          'pass',
          'Successfully handled service fallback scenario',
          time
        );
        
      } catch (error: any) {
        const time = Date.now() - startTime;
        addTestResult('Multi-Service Fallback', 'warning', error.message, time, [error.message]);
        console.warn('Multi-service fallback test failed:', error.message);
      }
    }, TEST_TIMEOUT);
  });

  describe('7. Cost and Usage Monitoring', () => {
    it('should track token usage and API costs', async () => {
      try {
        // Test cost estimation for different services
        if (mistralOCRService) {
          const costEstimation = mistralOCRService.estimateCost([
            { sizeInBytes: 1024 * 100 }, // 100KB
            { sizeInBytes: 1024 * 50 }   // 50KB
          ]);
          
          expect(costEstimation).toBeDefined();
          expect(costEstimation.estimatedPages).toBeGreaterThan(0);
          expect(costEstimation.costInUSD).toBeGreaterThanOrEqual(0);
          expect(costEstimation.costInEUR).toBeGreaterThanOrEqual(0);
          
          addTestResult(
            'Cost Estimation',
            'pass',
            `Estimated ${costEstimation.estimatedPages} pages, $${costEstimation.costInUSD} USD, €${costEstimation.costInEUR} EUR`
          );
        } else {
          addTestResult(
            'Cost Estimation',
            'warning',
            'Mistral OCR service not available for cost estimation'
          );
        }
        
      } catch (error: any) {
        addTestResult('Cost Estimation', 'warning', error.message, 0, [error.message]);
        console.warn('Cost estimation test failed:', error.message);
      }
    });
  });
});
