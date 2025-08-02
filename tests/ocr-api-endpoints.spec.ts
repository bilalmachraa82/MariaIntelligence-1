/**
 * OCR API Endpoints Tests
 * Tests the HTTP endpoints for OCR functionality
 * Validates file upload, processing, and response formats
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import express from 'express';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios, { AxiosResponse } from 'axios';
import multer from 'multer';

// Import the OCR controller and routes setup
import * as ocrController from '../server/controllers/ocr.controller';
import { pdfUpload } from '../server/middleware/upload';

// Test configuration
const TEST_CONFIG = {
  SERVER_PORT: 0, // Use random available port
  PUBLIC_DIR: path.join(process.cwd(), 'public'),
  TIMEOUT: 60000, // 60 seconds for API tests
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

// Test server setup
let testServer: any;
let serverBaseUrl: string;
let availablePDFs: string[] = [];

// Response interfaces
interface OCRResponse {
  success: boolean;
  provider?: string;
  reservations?: any[];
  boxes?: any;
  extractedData?: any;
  missing?: string[];
  rawText?: string;
  metrics?: {
    latencyMs: number;
    provider: string;
    textLength: number;
  };
  error?: string;
  message?: string;
  details?: string;
}

describe('OCR API Endpoints Tests', () => {
  beforeAll(async () => {
    // Set up test server
    const app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Configure upload middleware
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: TEST_CONFIG.MAX_FILE_SIZE,
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only PDF files are allowed'), false);
        }
      }
    });

    // Set up OCR routes
    app.post('/api/ocr/upload', upload.single('file'), ocrController.postOcr);
    app.post('/api/ocr/process', upload.single('file'), ocrController.processOCR);
    app.post('/api/ocr/base64', ocrController.processOCR);

    // Error handling middleware
    app.use((error: any, req: any, res: any, next: any) => {
      console.error('Test server error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    });

    // Start test server
    testServer = app.listen(TEST_CONFIG.SERVER_PORT);
    const address = testServer.address();
    const port = typeof address === 'string' ? address : address?.port;
    serverBaseUrl = `http://localhost:${port}`;
    
    console.log(`Test server started on ${serverBaseUrl}`);

    // Discover available PDF files
    try {
      const files = fs.readdirSync(TEST_CONFIG.PUBLIC_DIR);
      availablePDFs = files.filter(f => f.endsWith('.pdf'));
      console.log(`Found ${availablePDFs.length} PDF files for API testing`);
    } catch (error) {
      console.error('Error reading public directory:', error);
      availablePDFs = [];
    }
  });

  afterAll(async () => {
    if (testServer) {
      testServer.close();
      console.log('Test server closed');
    }
  });

  describe('Server Setup and Health', () => {
    it('should start test server successfully', async () => {
      const response = await axios.get(`${serverBaseUrl}/api/health`).catch(() => null);
      // Server might not have health endpoint, but should respond to requests
      expect(serverBaseUrl).toBeTruthy();
      expect(testServer.listening).toBe(true);
    });

    it('should have PDF files available for testing', () => {
      expect(availablePDFs.length).toBeGreaterThan(0);
      console.log('Available test PDFs:', availablePDFs);
    });
  });

  describe('File Upload Endpoint Tests', () => {
    it('should upload and process PDF via /api/ocr/upload', async () => {
      if (availablePDFs.length === 0) {
        console.warn('No PDFs available for upload test');
        return;
      }

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));

      try {
        const response: AxiosResponse<OCRResponse> = await axios.post(
          `${serverBaseUrl}/api/ocr/upload`,
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
            timeout: TEST_CONFIG.TIMEOUT,
          }
        );

        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(response.data.success).toBe(true);
        expect(response.data.rawText).toBeTruthy();
        expect(response.data.rawText!.length).toBeGreaterThan(0);
        expect(response.data.provider).toBeTruthy();
        expect(response.data.metrics).toBeDefined();
        expect(response.data.metrics!.latencyMs).toBeGreaterThan(0);

        console.log(`Upload test successful for ${testFile}:`);
        console.log(`  Provider: ${response.data.provider}`);
        console.log(`  Text length: ${response.data.rawText!.length} chars`);
        console.log(`  Processing time: ${response.data.metrics!.latencyMs}ms`);

      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Upload failed:', error.response?.data || error.message);
        }
        throw error;
      }
    }, TEST_CONFIG.TIMEOUT);

    it('should process PDF via /api/ocr/process with file upload', async () => {
      if (availablePDFs.length === 0) return;

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));

      const response: AxiosResponse<OCRResponse> = await axios.post(
        `${serverBaseUrl}/api/ocr/process`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          timeout: TEST_CONFIG.TIMEOUT,
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.rawText).toBeTruthy();
      expect(response.data.metrics).toBeDefined();

      console.log(`Process endpoint test successful for ${testFile}`);
    }, TEST_CONFIG.TIMEOUT);

    it('should reject non-PDF files', async () => {
      // Create a fake non-PDF file
      const fakeFile = Buffer.from('This is not a PDF file');
      
      const form = new FormData();
      form.append('file', fakeFile, { filename: 'fake.txt', contentType: 'text/plain' });

      try {
        await axios.post(
          `${serverBaseUrl}/api/ocr/upload`,
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
            timeout: TEST_CONFIG.TIMEOUT,
          }
        );

        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          expect(error.response?.status).toBe(422);
          expect(error.response?.data.success).toBe(false);
          expect(error.response?.data.message).toContain('PDF');
        }
      }
    });

    it('should handle oversized files', async () => {
      // Create a large buffer (larger than 10MB limit)
      const largeBuffer = Buffer.alloc(TEST_CONFIG.MAX_FILE_SIZE + 1024);
      
      const form = new FormData();
      form.append('file', largeBuffer, { filename: 'large.pdf', contentType: 'application/pdf' });

      try {
        await axios.post(
          `${serverBaseUrl}/api/ocr/upload`,
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
            timeout: TEST_CONFIG.TIMEOUT,
          }
        );

        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          // Should be rejected due to file size
          expect(error.response?.status).toBeGreaterThanOrEqual(400);
        }
      }
    });
  });

  describe('Base64 Upload Endpoint Tests', () => {
    it('should process PDF via base64 upload', async () => {
      if (availablePDFs.length === 0) return;

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfBase64 = pdfBuffer.toString('base64');

      const payload = {
        fileBase64: pdfBase64,
        fileName: testFile,
        provider: 'auto'
      };

      const response: AxiosResponse<OCRResponse> = await axios.post(
        `${serverBaseUrl}/api/ocr/base64`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: TEST_CONFIG.TIMEOUT,
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.rawText).toBeTruthy();
      expect(response.data.provider).toBeTruthy();

      console.log(`Base64 upload test successful for ${testFile}`);
      console.log(`  Provider: ${response.data.provider}`);
      console.log(`  Text length: ${response.data.rawText!.length} chars`);
    }, TEST_CONFIG.TIMEOUT);

    it('should handle invalid base64 data', async () => {
      const payload = {
        fileBase64: 'invalid-base64-data',
        fileName: 'test.pdf'
      };

      try {
        await axios.post(
          `${serverBaseUrl}/api/ocr/base64`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: TEST_CONFIG.TIMEOUT,
          }
        );

        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          expect(error.response?.status).toBeGreaterThanOrEqual(400);
          expect(error.response?.data.success).toBe(false);
        }
      }
    });
  });

  describe('Provider Selection Tests', () => {
    it('should accept provider parameter in query string', async () => {
      if (availablePDFs.length === 0) return;
      if (!process.env.OPENROUTER_API_KEY) {
        console.warn('OPENROUTER_API_KEY not configured, skipping provider selection test');
        return;
      }

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));

      const response: AxiosResponse<OCRResponse> = await axios.post(
        `${serverBaseUrl}/api/ocr/upload?provider=openrouter`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          timeout: TEST_CONFIG.TIMEOUT,
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.provider).toBe('openrouter');

      console.log(`Provider selection test successful: ${response.data.provider}`);
    }, TEST_CONFIG.TIMEOUT);

    it('should test all available providers', async () => {
      if (availablePDFs.length === 0) return;

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      
      const providers = [
        { name: 'auto', requiresKey: false },
        { name: 'mistral-ocr', requiresKey: 'MISTRAL_API_KEY' },
        { name: 'openrouter', requiresKey: 'OPENROUTER_API_KEY' },
        { name: 'rolm', requiresKey: 'HF_TOKEN' },
        { name: 'native', requiresKey: false }
      ];

      const results: Array<{
        provider: string;
        success: boolean;
        textLength: number;
        processingTime: number;
        error?: string;
      }> = [];

      for (const provider of providers) {
        // Skip if required key is not available
        if (provider.requiresKey && !process.env[provider.requiresKey]) {
          console.log(`Skipping ${provider.name} - ${provider.requiresKey} not configured`);
          continue;
        }

        try {
          const form = new FormData();
          form.append('file', fs.createReadStream(filePath));

          const startTime = Date.now();
          const response: AxiosResponse<OCRResponse> = await axios.post(
            `${serverBaseUrl}/api/ocr/upload?provider=${provider.name}`,
            form,
            {
              headers: {
                ...form.getHeaders(),
              },
              timeout: TEST_CONFIG.TIMEOUT,
            }
          );

          const processingTime = Date.now() - startTime;

          if (response.data.success) {
            results.push({
              provider: provider.name,
              success: true,
              textLength: response.data.rawText!.length,
              processingTime: response.data.metrics?.latencyMs || processingTime
            });
          } else {
            results.push({
              provider: provider.name,
              success: false,
              textLength: 0,
              processingTime,
              error: response.data.error || 'Unknown error'
            });
          }
        } catch (error) {
          results.push({
            provider: provider.name,
            success: false,
            textLength: 0,
            processingTime: 0,
            error: axios.isAxiosError(error) ? error.message : 'Unknown error'
          });
        }
      }

      console.log('\nProvider API Test Results:');
      console.log('=' .repeat(70));
      results.forEach(result => {
        if (result.success) {
          console.log(`${result.provider.padEnd(12)} | SUCCESS | ${result.textLength.toString().padStart(6)} chars | ${result.processingTime.toString().padStart(6)}ms`);
        } else {
          console.log(`${result.provider.padEnd(12)} | FAILED  | ${result.error}`);
        }
      });

      const successfulTests = results.filter(r => r.success);
      expect(successfulTests.length).toBeGreaterThan(0);
    }, TEST_CONFIG.TIMEOUT * 6);
  });

  describe('Response Format Validation', () => {
    it('should return properly structured response', async () => {
      if (availablePDFs.length === 0) return;

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));

      const response: AxiosResponse<OCRResponse> = await axios.post(
        `${serverBaseUrl}/api/ocr/upload`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          timeout: TEST_CONFIG.TIMEOUT,
        }
      );

      // Validate response structure
      expect(response.data).toHaveProperty('success');
      expect(response.data).toHaveProperty('provider');
      expect(response.data).toHaveProperty('rawText');
      expect(response.data).toHaveProperty('metrics');
      
      if (response.data.success) {
        expect(response.data.metrics).toHaveProperty('latencyMs');
        expect(response.data.metrics).toHaveProperty('provider');
        expect(response.data.metrics).toHaveProperty('textLength');
        expect(response.data.metrics!.textLength).toBe(response.data.rawText!.length);
      }

      // Validate data types
      expect(typeof response.data.success).toBe('boolean');
      expect(typeof response.data.provider).toBe('string');
      expect(typeof response.data.rawText).toBe('string');
      expect(typeof response.data.metrics!.latencyMs).toBe('number');

      console.log('Response structure validation passed');
    }, TEST_CONFIG.TIMEOUT);

    it('should include reservation data when detected', async () => {
      if (availablePDFs.length === 0) return;

      // Use a Controlo file which is more likely to contain reservation data
      const controloFiles = availablePDFs.filter(f => f.startsWith('Controlo_'));
      if (controloFiles.length === 0) {
        console.warn('No Controlo files available for reservation data test');
        return;
      }

      const testFile = controloFiles[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));

      const response: AxiosResponse<OCRResponse> = await axios.post(
        `${serverBaseUrl}/api/ocr/upload`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          timeout: TEST_CONFIG.TIMEOUT,
        }
      );

      expect(response.data.success).toBe(true);
      
      // Check if reservation data is present
      if (response.data.reservations && response.data.reservations.length > 0) {
        expect(Array.isArray(response.data.reservations)).toBe(true);
        console.log(`Found ${response.data.reservations.length} reservations in ${testFile}`);
        
        // Validate reservation structure
        const reservation = response.data.reservations[0];
        expect(typeof reservation).toBe('object');
        
        // Check for common reservation fields
        const reservationFields = Object.keys(reservation);
        console.log('Reservation fields found:', reservationFields);
        
        if (reservationFields.includes('guestName')) {
          expect(typeof reservation.guestName).toBe('string');
        }
        if (reservationFields.includes('propertyName')) {
          expect(typeof reservation.propertyName).toBe('string');
        }
      } else {
        console.log(`No reservation data extracted from ${testFile}`);
      }
    }, TEST_CONFIG.TIMEOUT);
  });

  describe('Error Handling Tests', () => {
    it('should handle missing file parameter', async () => {
      try {
        await axios.post(
          `${serverBaseUrl}/api/ocr/upload`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: TEST_CONFIG.TIMEOUT,
          }
        );

        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          expect(error.response?.status).toBe(422);
          expect(error.response?.data.success).toBe(false);
          expect(error.response?.data.message).toContain('arquivo');
        }
      }
    });

    it('should handle malformed JSON in base64 endpoint', async () => {
      try {
        await axios.post(
          `${serverBaseUrl}/api/ocr/base64`,
          'invalid json',
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: TEST_CONFIG.TIMEOUT,
          }
        );

        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          expect(error.response?.status).toBeGreaterThanOrEqual(400);
        }
      }
    });

    it('should handle server errors gracefully', async () => {
      // Test with an invalid provider that should trigger an error
      if (availablePDFs.length === 0) return;

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));

      const response = await axios.post(
        `${serverBaseUrl}/api/ocr/upload?provider=invalid-provider`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
          timeout: TEST_CONFIG.TIMEOUT,
          validateStatus: () => true, // Accept any status code
        }
      );

      // Should return error response but not crash
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data).toHaveProperty('success');
      expect(response.data.success).toBe(false);
      expect(response.data).toHaveProperty('error');
    }, TEST_CONFIG.TIMEOUT);
  });

  describe('Performance and Load Tests', () => {
    it('should handle concurrent requests', async () => {
      if (availablePDFs.length === 0) return;

      const testFile = availablePDFs[0];
      const filePath = path.join(TEST_CONFIG.PUBLIC_DIR, testFile);
      const concurrentRequests = 3;

      const promises = Array.from({ length: concurrentRequests }, () => {
        const form = new FormData();
        form.append('file', fs.createReadStream(filePath));

        return axios.post(
          `${serverBaseUrl}/api/ocr/upload`,
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
            timeout: TEST_CONFIG.TIMEOUT,
          }
        );
      });

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        console.log(`Concurrent request ${index + 1}: ${response.data.metrics?.latencyMs}ms`);
      });

      const avgTimePerRequest = totalTime / concurrentRequests;
      console.log(`Concurrent test: ${concurrentRequests} requests in ${totalTime}ms (avg: ${avgTimePerRequest.toFixed(2)}ms)`);

      expect(responses.length).toBe(concurrentRequests);
    }, TEST_CONFIG.TIMEOUT * 2);
  });
});