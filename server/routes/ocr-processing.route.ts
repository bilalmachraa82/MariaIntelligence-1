/**
 * OCR Processing Routes for MariaIntelligence
 * Handles OCR requests with multi-provider support and intelligent failover
 */

import express from 'express';
import multer from 'multer';
import { Request, Response } from 'express';
import { ocrMultiProviderService, OCRResult } from '../services/ocr-multi-provider.service';
import { storage } from '../storage';
import { matchPropertyByAlias } from '../utils/matchPropertyByAlias';
import { rateLimiter } from '../services/rate-limiter.service';
const { getAvailableProviders, getOptimalProvider, validateConfiguration } = require('../config/ocr-providers.config');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Max 10 files for batch processing
  },
  fileFilter: (req, file, cb) => {
    // Accept PDFs and images
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
    }
  }
});

/**
 * POST /api/ocr/process
 * Main OCR processing endpoint with multi-provider support
 */
router.post('/process', upload.single('file'), async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  console.log(`📄 [${requestId}] OCR process request received`);

  try {
    let fileBase64: string;
    let mimeType: string;
    let originalFileName: string;

    // Handle file from upload or base64 from body
    if (req.file) {
      // File uploaded via multipart form
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(req.file.path);
      fileBase64 = fileBuffer.toString('base64');
      mimeType = req.file.mimetype;
      originalFileName = req.file.originalname || 'uploaded_file';
      
      // Clean up temp file
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn('Warning: Failed to clean up temp file:', cleanupError);
      }
    } else if (req.body.fileBase64) {
      // File sent as base64 in request body
      fileBase64 = req.body.fileBase64;
      mimeType = req.body.mimeType || 'application/pdf';
      originalFileName = req.body.fileName || 'document';
    } else {
      return res.status(400).json({
        success: false,
        error: 'No file provided. Send file via multipart form or as base64 in request body.',
        requestId
      });
    }

    // Validate file size
    const fileSizeMB = Buffer.byteLength(fileBase64, 'base64') / (1024 * 1024);
    const maxSizeMB = 20; // 20MB limit for OCR processing

    if (fileSizeMB > maxSizeMB) {
      return res.status(413).json({
        success: false,
        error: `File too large. Maximum size is ${maxSizeMB}MB, received ${fileSizeMB.toFixed(2)}MB.`,
        requestId
      });
    }

    // Get processing options
    const options = {
      preferredProvider: req.body.preferredProvider || req.query.provider as string,
      requireHighQuality: req.body.requireHighQuality !== false, // Default to true
      timeout: parseInt(req.body.timeout as string) || 60000,
      documentType: req.body.documentType || 'booking_pdf'
    };

    console.log(`🔍 [${requestId}] Processing ${originalFileName} (${fileSizeMB.toFixed(2)}MB, ${mimeType})`);
    console.log(`⚙️ [${requestId}] Options:`, {
      preferredProvider: options.preferredProvider || 'auto',
      requireHighQuality: options.requireHighQuality,
      documentType: options.documentType
    });

    // Use rate limiter to prevent overwhelming the system
    const processWithRateLimit = rateLimiter.rateLimitedFunction(
      async () => {
        return await ocrMultiProviderService.processDocument(fileBase64, mimeType, {
          preferredProvider: options.preferredProvider,
          requireHighQuality: options.requireHighQuality,
          timeout: options.timeout
        });
      },
      `ocr_process_${requestId}`,
      30 * 1000 // 30 second cache
    );

    // Process the document
    const result: OCRResult = await processWithRateLimit();
    const totalProcessingTime = Date.now() - startTime;

    console.log(`⏱️ [${requestId}] Total processing time: ${totalProcessingTime}ms`);

    if (!result.success) {
      console.error(`❌ [${requestId}] OCR processing failed:`, result.error);
      return res.status(500).json({
        success: false,
        error: result.error || 'OCR processing failed',
        provider: result.provider,
        processingTime: totalProcessingTime,
        requestId
      });
    }

    // Enhance structured data with property matching
    let enhancedData = result.structuredData || {};
    const missingFields: string[] = [];

    if (enhancedData.propertyName) {
      try {
        const properties = await storage.getProperties();
        const matchedProperty = matchPropertyByAlias(enhancedData.propertyName, properties);
        
        if (matchedProperty) {
          enhancedData.propertyId = matchedProperty.id;
          enhancedData.matchedPropertyName = matchedProperty.name;
          console.log(`✅ [${requestId}] Property matched: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
        } else {
          missingFields.push('propertyId');
          console.warn(`⚠️ [${requestId}] Property not found: ${enhancedData.propertyName}`);
        }
      } catch (propertyError) {
        console.error(`❌ [${requestId}] Property matching error:`, propertyError);
        missingFields.push('propertyId');
      }
    }

    // Check for required booking fields
    const requiredFields = ['guestName', 'checkInDate', 'checkOutDate', 'propertyName'];
    const currentMissingFields = requiredFields.filter(field => !enhancedData[field]);
    missingFields.push(...currentMissingFields);

    // Prepare response
    const response = {
      success: true,
      requestId,
      provider: result.provider,
      confidence: result.confidence,
      processingTime: totalProcessingTime,
      ocrTime: result.processingTime,
      text: result.text,
      textLength: result.text.length,
      structuredData: enhancedData,
      missingFields: [...new Set(missingFields)], // Remove duplicates
      metadata: {
        fileName: originalFileName,
        fileSize: `${fileSizeMB.toFixed(2)}MB`,
        mimeType,
        documentType: options.documentType,
        quality: result.metadata?.quality || 'unknown',
        pageCount: result.metadata?.pageCount || 1,
        language: result.metadata?.language || 'auto'
      },
      // Legacy compatibility fields
      extractedData: enhancedData,
      rawText: result.text,
      boxes: {}, // Placeholder for bounding boxes if available
      missing: missingFields
    };

    console.log(`✅ [${requestId}] OCR processing completed successfully`);
    console.log(`📊 [${requestId}] Stats: ${result.confidence}% confidence, ${result.text.length} chars, ${missingFields.length} missing fields`);

    return res.json(response);

  } catch (error: any) {
    const totalProcessingTime = Date.now() - startTime;
    console.error(`❌ [${requestId}] OCR processing error:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during OCR processing',
      details: error.message,
      processingTime: totalProcessingTime,
      requestId
    });
  }
});

/**
 * POST /api/ocr/batch
 * Batch OCR processing for multiple documents
 */
router.post('/batch', upload.array('files', 10), async (req: Request, res: Response) => {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`📦 [${requestId}] Batch OCR processing request`);

  try {
    let documents: Array<{ fileBase64: string; mimeType: string; id: string }> = [];

    if (req.files && Array.isArray(req.files)) {
      // Files uploaded via multipart form
      const fs = require('fs');
      
      documents = req.files.map((file: any, index: number) => {
        const fileBuffer = fs.readFileSync(file.path);
        
        // Clean up temp file
        try {
          fs.unlinkSync(file.path);
        } catch (cleanupError) {
          console.warn('Warning: Failed to clean up temp file:', cleanupError);
        }
        
        return {
          fileBase64: fileBuffer.toString('base64'),
          mimeType: file.mimetype,
          id: file.originalname || `document_${index + 1}`
        };
      });
    } else if (req.body.documents && Array.isArray(req.body.documents)) {
      // Documents sent as base64 array
      documents = req.body.documents.map((doc: any, index: number) => ({
        fileBase64: doc.fileBase64,
        mimeType: doc.mimeType || 'application/pdf',
        id: doc.id || doc.fileName || `document_${index + 1}`
      }));
    } else {
      return res.status(400).json({
        success: false,
        error: 'No documents provided for batch processing',
        requestId
      });
    }

    if (documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid documents found for processing',
        requestId
      });
    }

    if (documents.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 documents allowed per batch',
        requestId
      });
    }

    const options = {
      concurrency: parseInt(req.body.concurrency as string) || 3,
      preferredProvider: req.body.preferredProvider || req.query.provider as string
    };

    console.log(`📊 [${requestId}] Processing ${documents.length} documents with concurrency: ${options.concurrency}`);

    const startTime = Date.now();
    const results = await ocrMultiProviderService.batchProcess(documents, options);
    const totalTime = Date.now() - startTime;

    // Enhance results with property matching
    const enhancedResults = await Promise.all(results.map(async (result) => {
      let enhancedData = result.structuredData || {};
      const missingFields: string[] = [];

      if (enhancedData.propertyName) {
        try {
          const properties = await storage.getProperties();
          const matchedProperty = matchPropertyByAlias(enhancedData.propertyName, properties);
          
          if (matchedProperty) {
            enhancedData.propertyId = matchedProperty.id;
            enhancedData.matchedPropertyName = matchedProperty.name;
          } else {
            missingFields.push('propertyId');
          }
        } catch (propertyError) {
          missingFields.push('propertyId');
        }
      }

      return {
        ...result,
        structuredData: enhancedData,
        missingFields
      };
    }));

    const successCount = enhancedResults.filter(r => r.success).length;
    const failureCount = documents.length - successCount;

    console.log(`✅ [${requestId}] Batch processing completed: ${successCount} successful, ${failureCount} failed`);

    return res.json({
      success: true,
      requestId,
      summary: {
        total: documents.length,
        successful: successCount,
        failed: failureCount,
        processingTime: totalTime,
        averageTimePerDocument: Math.round(totalTime / documents.length)
      },
      results: enhancedResults
    });

  } catch (error: any) {
    console.error(`❌ [${requestId}] Batch OCR processing error:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during batch OCR processing',
      details: error.message,
      requestId
    });
  }
});

/**
 * GET /api/ocr/providers
 * Get available OCR providers and their status
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const [providerStatus, configValidation] = await Promise.all([
      ocrMultiProviderService.getProviderStatus(),
      Promise.resolve(validateConfiguration())
    ]);

    const availableProviders = getAvailableProviders();
    const statistics = ocrMultiProviderService.getStatistics();

    return res.json({
      success: true,
      providers: providerStatus,
      availableProviders,
      statistics,
      configuration: configValidation,
      recommendations: configValidation.recommendations
    });
  } catch (error: any) {
    console.error('Error fetching provider status:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch provider status',
      details: error.message
    });
  }
});

/**
 * GET /api/ocr/status
 * Get OCR service health and statistics
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const statistics = ocrMultiProviderService.getStatistics();
    const configValidation = validateConfiguration();
    
    return res.json({
      success: true,
      status: 'operational',
      timestamp: new Date().toISOString(),
      statistics,
      configuration: {
        valid: configValidation.valid,
        issues: configValidation.issues,
        availableProviders: configValidation.availableProviders
      },
      version: '1.0.0'
    });
  } catch (error: any) {
    console.error('Error fetching OCR status:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch OCR status',
      details: error.message
    });
  }
});

/**
 * POST /api/ocr/validate
 * Validate OCR result quality
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { text, confidence, provider } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for validation'
      });
    }

    // Mock validation (in real implementation, this would use the validation logic from the service)
    const validation = {
      isValid: text.length >= 10 && (confidence || 0) >= 0.5,
      confidence: confidence || 0,
      issues: [],
      corrections: [],
      qualityScore: Math.min(100, (text.length / 10) * (confidence || 0.5) * 100)
    };

    if (text.length < 50) {
      validation.issues.push('Text appears to be too short');
      validation.qualityScore *= 0.8;
    }

    if ((confidence || 0) < 0.7) {
      validation.issues.push('Low confidence score from OCR provider');
      validation.qualityScore *= 0.9;
    }

    // Check for booking indicators
    const bookingPatterns = [
      /check.?in/i, /check.?out/i, /guest/i, /booking/i, /reservation/i
    ];
    const indicatorCount = bookingPatterns.filter(pattern => pattern.test(text)).length;
    
    if (indicatorCount < 2) {
      validation.issues.push('Missing typical booking document indicators');
      validation.qualityScore *= 0.85;
    }

    validation.qualityScore = Math.round(Math.max(0, Math.min(100, validation.qualityScore)));
    validation.isValid = validation.qualityScore >= 60;

    return res.json({
      success: true,
      validation,
      recommendations: validation.isValid ? [] : [
        'Consider using a different OCR provider',
        'Check document image quality',
        'Verify document type matches expected format'
      ]
    });

  } catch (error: any) {
    console.error('Error validating OCR result:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to validate OCR result',
      details: error.message
    });
  }
});

/**
 * Error handler middleware
 */
router.use((error: any, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large. Maximum size is 50MB.'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 10 files per request.'
      });
    }
  }

  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  console.error('OCR route error:', error);
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

export default router;