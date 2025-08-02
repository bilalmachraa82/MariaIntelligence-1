/**
 * PDF Import Controller
 * Handles HTTP requests for PDF import functionality
 * 
 * Endpoints:
 * - POST /api/pdf-import - Import reservations from PDF files
 * - POST /api/pdf-import/suggest - Get property suggestions for unmatched names
 * - POST /api/pdf-import/learn - Learn from user corrections
 * - GET /api/pdf-import/report/:id - Get detailed import report
 */

import { Request, Response } from 'express';
import { pdfImportService, PDFImportResult } from '../services/pdfImportService';
import { z } from 'zod';
import multer from 'multer';
import { db } from '../db/index';
import { reservations, properties } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// ===== VALIDATION SCHEMAS =====

const ImportPDFSchema = z.object({
  files: z.array(z.object({
    content: z.string(), // Base64 encoded PDF content
    filename: z.string(),
    mimeType: z.string().optional()
  })).min(1, 'At least one file is required'),
  options: z.object({
    autoMatch: z.boolean().optional().default(true),
    confidenceThreshold: z.number().min(0).max(1).optional().default(0.7),
    createUnmatchedProperties: z.boolean().optional().default(false),
    batchSize: z.number().min(1).max(50).optional().default(10)
  }).optional().default({})
});

const SuggestPropertiesSchema = z.object({
  propertyName: z.string().min(1, 'Property name is required'),
  limit: z.number().min(1).max(20).optional().default(5)
});

const LearnFromMatchSchema = z.object({
  originalName: z.string().min(1, 'Original name is required'),
  propertyId: z.number().int().positive('Property ID must be a positive integer'),
  confidence: z.number().min(0).max(1, 'Confidence must be between 0 and 1')
});

const ConfirmMatchesSchema = z.object({
  matches: z.array(z.object({
    reservationIndex: z.number().int().min(0),
    propertyId: z.number().int().positive(),
    confidence: z.number().min(0).max(1).optional().default(1.0)
  })).min(1, 'At least one match is required')
});

// ===== MULTER CONFIGURATION =====

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20 // Maximum 20 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// ===== CONTROLLER CLASS =====

export class PDFImportController {
  /**
   * Import reservations from PDF files
   * POST /api/pdf-import
   */
  static async importFromPDFs(req: Request, res: Response): Promise<void> {
    try {
      console.log('📄 PDF import request received');

      // Handle both multipart/form-data (file upload) and JSON (base64) requests
      let parsedBody: any;
      
      if (req.files && Array.isArray(req.files)) {
        // File upload via multipart/form-data
        const files = req.files as Express.Multer.File[];
        parsedBody = {
          files: files.map(file => ({
            content: file.buffer.toString('base64'),
            filename: file.originalname,
            mimeType: file.mimetype
          })),
          options: req.body.options ? JSON.parse(req.body.options) : {}
        };
      } else {
        // Direct JSON request with base64 content
        parsedBody = req.body;
      }

      const validatedData = ImportPDFSchema.parse(parsedBody);
      const { files, options } = validatedData;

      console.log(`📦 Processing ${files.length} PDF files with options:`, options);

      // Import reservations from PDFs
      const importResult = await pdfImportService.importFromPDFs(files, options);

      // Store import session for later reference
      const importSession = {
        id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        result: importResult
      };

      // In a real application, you might want to store this in Redis or a database
      // For now, we'll include it in the response
      
      res.status(200).json({
        success: true,
        message: `Successfully processed ${files.length} PDF files`,
        sessionId: importSession.id,
        data: {
          summary: {
            totalFiles: files.length,
            totalReservations: importResult.report.totalReservations,
            matchedReservations: importResult.report.matchedReservations,
            suggestedReservations: importResult.report.suggestedReservations,
            unmatchedReservations: importResult.report.unmatchedReservations,
            processingTime: importResult.report.processingTime
          },
          reservations: importResult.reservations,
          unmatchedProperties: importResult.unmatchedProperties,
          report: importResult.report,
          errors: importResult.errors
        }
      });

    } catch (error) {
      console.error('❌ PDF import error:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to import PDF files',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get property suggestions for unmatched property names
   * POST /api/pdf-import/suggest
   */
  static async suggestProperties(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = SuggestPropertiesSchema.parse(req.body);
      const { propertyName, limit } = validatedData;

      console.log(`🔍 Getting property suggestions for: "${propertyName}"`);

      const suggestions = await pdfImportService.getPropertySuggestions(propertyName, limit);

      res.status(200).json({
        success: true,
        message: `Found ${suggestions.length} suggestions for "${propertyName}"`,
        data: {
          propertyName,
          suggestions: suggestions.map(suggestion => ({
            property: {
              id: suggestion.property.id,
              name: suggestion.property.name,
              aliases: suggestion.property.aliases
            },
            score: Math.round(suggestion.score * 100) / 100, // Round to 2 decimal places
            reason: suggestion.reason
          }))
        }
      });

    } catch (error) {
      console.error('❌ Property suggestions error:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get property suggestions',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Learn from user corrections to improve future matching
   * POST /api/pdf-import/learn
   */
  static async learnFromMatch(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = LearnFromMatchSchema.parse(req.body);
      const { originalName, propertyId, confidence } = validatedData;

      console.log(`🧠 Learning from match: "${originalName}" -> Property ID ${propertyId} (confidence: ${confidence})`);

      // Get the property to validate it exists
      const property = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
      
      if (property.length === 0) {
        res.status(404).json({
          success: false,
          message: `Property with ID ${propertyId} not found`
        });
        return;
      }

      await pdfImportService.learnFromMatch(originalName, property[0], confidence);

      res.status(200).json({
        success: true,
        message: `Successfully learned from match: "${originalName}" -> "${property[0].name}"`
      });

    } catch (error) {
      console.error('❌ Learn from match error:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to learn from match',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Confirm property matches and create reservations
   * POST /api/pdf-import/confirm
   */
  static async confirmMatches(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = ConfirmMatchesSchema.parse(req.body);
      const { matches } = validatedData;

      console.log(`✅ Confirming ${matches.length} property matches`);

      // In a real implementation, you would:
      // 1. Retrieve the import session data
      // 2. Apply the confirmed matches to the reservations
      // 3. Insert the reservations into the database
      // 4. Learn from the confirmed matches

      const results = [];

      for (const match of matches) {
        // This is a simplified implementation
        // In reality, you'd retrieve the actual reservation data from the import session
        
        try {
          // Learn from the confirmed match
          await pdfImportService.learnFromMatch(
            `reservation_${match.reservationIndex}`, // Placeholder - use actual property name
            { id: match.propertyId } as any, // Placeholder - get actual property
            match.confidence
          );

          results.push({
            reservationIndex: match.reservationIndex,
            propertyId: match.propertyId,
            status: 'confirmed',
            message: 'Match confirmed and learned'
          });

        } catch (error) {
          results.push({
            reservationIndex: match.reservationIndex,
            propertyId: match.propertyId,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.filter(r => r.status === 'confirmed').length;
      const errorCount = results.filter(r => r.status === 'error').length;

      res.status(200).json({
        success: true,
        message: `Confirmed ${successCount} matches. ${errorCount} errors.`,
        data: {
          results,
          summary: {
            total: matches.length,
            confirmed: successCount,
            errors: errorCount
          }
        }
      });

    } catch (error) {
      console.error('❌ Confirm matches error:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Failed to confirm matches',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get detailed import report
   * GET /api/pdf-import/report/:sessionId
   */
  static async getImportReport(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      console.log(`📊 Getting import report for session: ${sessionId}`);

      // In a real implementation, you would retrieve the session data from storage
      // For now, we'll return a placeholder response

      res.status(200).json({
        success: true,
        message: `Import report for session ${sessionId}`,
        data: {
          sessionId,
          status: 'completed',
          timestamp: new Date().toISOString(),
          report: {
            totalReservations: 0,
            matchedReservations: 0,
            suggestedReservations: 0,
            unmatchedReservations: 0,
            uniqueProperties: 0,
            unmatchedProperties: 0,
            processingTime: 0,
            confidenceDistribution: { high: 0, medium: 0, low: 0 }
          }
        }
      });

    } catch (error) {
      console.error('❌ Get import report error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get import report',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get import statistics and analytics
   * GET /api/pdf-import/stats
   */
  static async getImportStats(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 Getting PDF import statistics');

      // In a real implementation, you would query the database for historical import data
      const stats = {
        totalImports: 0,
        totalFilesProcessed: 0,
        totalReservationsImported: 0,
        averageMatchRate: 0,
        topUnmatchedProperties: [],
        recentImports: [],
        performanceMetrics: {
          averageProcessingTime: 0,
          averageFileSize: 0,
          successRate: 0
        }
      };

      res.status(200).json({
        success: true,
        message: 'PDF import statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('❌ Get import stats error:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get import statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// ===== ROUTE HANDLERS =====

export const handlePDFImport = [
  upload.array('files', 20),
  PDFImportController.importFromPDFs
];

export const handleSuggestProperties = PDFImportController.suggestProperties;
export const handleLearnFromMatch = PDFImportController.learnFromMatch;
export const handleConfirmMatches = PDFImportController.confirmMatches;
export const handleGetImportReport = PDFImportController.getImportReport;
export const handleGetImportStats = PDFImportController.getImportStats;