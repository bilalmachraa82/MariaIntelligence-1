/**
 * OCR Routes Integration for MariaIntelligence
 * Integrates new multi-provider OCR system with existing routes
 * This file provides the integration points for updating the main routes.ts file
 */

import type { Express, Request, Response } from "express";
import multer from "multer";
import ocrProcessingRouter from './ocr-processing.route';
import OCRIntegrationService from '../services/ocr-integration.service';
import * as fs from 'fs';

// Configure multer for the integrated routes (maintains compatibility)
const legacyPdfUpload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

/**
 * Enhanced OCR route that maintains backward compatibility
 * while using the new multi-provider system
 */
async function enhancedOcrRoute(req: Request, res: Response) {
  const requestId = Math.random().toString(36).substr(2, 9);
  console.log(`📄 [${requestId}] Legacy OCR route with multi-provider enhancement`);

  try {
    // Handle file input (same as legacy)
    if (!req.file) {
      return res.status(422).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Read file
    let fileBuffer: Buffer;
    try {
      fileBuffer = fs.readFileSync(req.file.path);
    } catch (readError) {
      console.error('Error reading uploaded file:', readError);
      return res.status(500).json({
        success: false,
        message: 'Error reading uploaded file'
      });
    }

    // Clean up temp file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.warn('Warning: Failed to clean up temp file:', cleanupError);
    }

    const fileBase64 = fileBuffer.toString('base64');
    const mimeType = req.file.mimetype;

    // Get options (backward compatible with existing query params)
    const preferredProvider = (req.query.provider as string) || 'auto';
    
    // Process using the new integration service
    const result = await OCRIntegrationService.processDocument(
      fileBase64,
      mimeType,
      {
        fileName: req.file.originalname,
        preferredProvider: preferredProvider === 'auto' ? undefined : preferredProvider,
        requireHighQuality: true,
        enhanceWithPropertyMatching: true
      }
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'OCR processing failed',
        error: result.error,
        provider: result.provider
      });
    }

    // Format response to match legacy expectations
    const legacyResponse = {
      success: true,
      provider: result.provider,
      confidence: Math.round(result.confidence * 100) / 100,
      
      // Legacy format compatibility
      reservations: result.structuredData ? [result.structuredData] : [],
      extractedData: result.structuredData,
      rawText: result.text,
      missing: result.missingFields,
      boxes: {}, // Placeholder for bounding boxes
      
      // Enhanced data
      validationResult: {
        isValid: result.validationResult?.isValid || false,
        qualityScore: result.validationResult?.qualityScore || 0,
        issues: result.validationResult?.issues || [],
        suggestions: result.validationResult?.suggestions || []
      },
      
      // Metrics
      metrics: {
        latencyMs: result.processingTime,
        provider: result.provider,
        textLength: result.text.length,
        quality: result.metadata.quality,
        compositeConfidence: result.confidence
      }
    };

    console.log(`✅ [${requestId}] Legacy OCR route completed: ${result.provider}, ${legacyResponse.metrics.quality} quality`);

    return res.json(legacyResponse);

  } catch (error: any) {
    console.error(`❌ [${requestId}] Enhanced OCR route error:`, error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error during OCR processing',
      error: error.message
    });
  }
}

/**
 * Function to register enhanced OCR routes in the main Express app
 * Call this from the main routes.ts file
 */
export function registerEnhancedOcrRoutes(app: Express): void {
  console.log('🔧 Registering enhanced OCR routes with multi-provider support');

  // New comprehensive OCR processing routes
  app.use('/api/ocr', ocrProcessingRouter);

  // Enhanced legacy compatibility route
  app.post('/api/ocr/legacy', legacyPdfUpload.single('file'), enhancedOcrRoute);

  // Backward compatible route (replaces existing /api/ocr)
  app.post('/api/ocr/process-pdf', legacyPdfUpload.single('file'), enhancedOcrRoute);

  // Health check route for OCR system
  app.get('/api/ocr/health', async (req: Request, res: Response) => {
    try {
      const systemStatus = await OCRIntegrationService.getSystemStatus();
      
      res.json({
        success: true,
        status: systemStatus.status,
        timestamp: new Date().toISOString(),
        health: systemStatus.health,
        providers: Object.keys(systemStatus.providers).length,
        recommendations: systemStatus.recommendations
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get OCR system health',
        details: error.message
      });
    }
  });

  console.log('✅ Enhanced OCR routes registered successfully');
}

/**
 * Middleware for OCR request logging
 */
export function ocrRequestLogger(req: Request, res: Response, next: any) {
  const startTime = Date.now();
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const processingTime = Date.now() - startTime;
    console.log(`📊 OCR Request: ${req.method} ${req.path} - ${res.statusCode} (${processingTime}ms)`);
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Error handler for OCR routes
 */
export function ocrErrorHandler(error: any, req: Request, res: Response, next: any) {
  console.error('❌ OCR Route Error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large. Maximum size is 20MB.'
      });
    }
  }

  if (error.message && error.message.includes('Only PDF files')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error during OCR processing',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}

export { enhancedOcrRoute };
export default { registerEnhancedOcrRoutes, ocrRequestLogger, ocrErrorHandler };