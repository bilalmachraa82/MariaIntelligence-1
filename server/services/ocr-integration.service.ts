/**
 * OCR Integration Service
 * Integrates the new multi-provider OCR system with existing MariaIntelligence infrastructure
 */

import { ocrMultiProviderService, OCRResult } from './ocr-multi-provider.service';
import { OCRValidationUtils } from '../utils/ocr-validation.utils';
import { aiService } from './ai-adapter.service';
import { storage } from '../storage.js';
import { matchPropertyByAlias } from '../utils/matchPropertyByAlias';

export interface ProcessedOCRResult {
  success: boolean;
  provider: string;
  confidence: number;
  processingTime: number;
  text: string;
  structuredData: any;
  validationResult: any;
  bookingValidation: any;
  missingFields: string[];
  enhancedData: any;
  error?: string;
  metadata: {
    fileName?: string;
    fileSize?: string;
    mimeType: string;
    quality: string;
    pageCount?: number;
    language?: string;
  };
}

export class OCRIntegrationService {
  /**
   * Process document using the new multi-provider system
   * This method integrates with existing MariaIntelligence workflows
   */
  static async processDocument(
    fileBase64: string,
    mimeType: string,
    options: {
      fileName?: string;
      preferredProvider?: string;
      requireHighQuality?: boolean;
      enhanceWithPropertyMatching?: boolean;
    } = {}
  ): Promise<ProcessedOCRResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 OCR Integration: Starting document processing');
      
      // Process with multi-provider system
      const ocrResult: OCRResult = await ocrMultiProviderService.processDocument(
        fileBase64,
        mimeType,
        {
          preferredProvider: options.preferredProvider,
          requireHighQuality: options.requireHighQuality !== false,
          timeout: 60000
        }
      );

      if (!ocrResult.success) {
        return {
          success: false,
          provider: ocrResult.provider,
          confidence: 0,
          processingTime: Date.now() - startTime,
          text: '',
          structuredData: {},
          validationResult: null,
          bookingValidation: null,
          missingFields: [],
          enhancedData: {},
          error: ocrResult.error,
          metadata: {
            fileName: options.fileName,
            mimeType,
            quality: 'failed',
          }
        };
      }

      console.log(`✅ OCR completed with ${ocrResult.provider}: ${ocrResult.text.length} characters`);

      // Validate OCR quality
      const validationResult = OCRValidationUtils.validateOCRResult(
        ocrResult.text,
        ocrResult.confidence,
        ocrResult.provider,
        {
          minTextLength: 20,
          maxArtifactPercentage: 0.08,
          minBookingIndicators: 2,
          requireDates: true,
          requireCurrency: false
        }
      );

      console.log(`📊 OCR Validation: ${validationResult.qualityScore}% quality score`);

      // Get or extract structured data
      let structuredData = ocrResult.structuredData;
      
      if (!structuredData || Object.keys(structuredData).length === 0) {
        console.log('🔍 Extracting structured data from text...');
        try {
          // Use Gemini for structured data extraction if available
          const geminiClient = aiService.getGeminiClient();
          if (geminiClient && geminiClient.isConfigured()) {
            structuredData = await geminiClient.parseReservationData(ocrResult.text);
          } else {
            // Fallback to simple pattern matching
            structuredData = this.extractBasicStructuredData(ocrResult.text);
          }
        } catch (structuredError) {
          console.error('❌ Structured data extraction failed:', structuredError);
          structuredData = this.extractBasicStructuredData(ocrResult.text);
        }
      }

      // Validate booking data
      const bookingValidation = OCRValidationUtils.validateBookingData(structuredData);
      
      // Enhance with property matching if requested
      let enhancedData = { ...structuredData };
      const missingFields: string[] = [];

      if (options.enhanceWithPropertyMatching !== false && structuredData.propertyName) {
        try {
          console.log('🏨 Matching property:', structuredData.propertyName);
          const properties = await storage.getProperties();
          const matchedProperty = matchPropertyByAlias(structuredData.propertyName, properties);
          
          if (matchedProperty) {
            enhancedData.propertyId = matchedProperty.id;
            enhancedData.matchedPropertyName = matchedProperty.name;
            console.log(`✅ Property matched: ${matchedProperty.name} (ID: ${matchedProperty.id})`);
          } else {
            missingFields.push('propertyId');
            console.warn(`⚠️ Property not found: ${structuredData.propertyName}`);
          }
        } catch (propertyError) {
          console.error('❌ Property matching error:', propertyError);
          missingFields.push('propertyId');
        }
      }

      // Check for required booking fields
      const requiredFields = ['guestName', 'checkInDate', 'checkOutDate', 'propertyName'];
      const currentMissingFields = requiredFields.filter(field => 
        !enhancedData[field] || enhancedData[field].toString().trim().length === 0
      );
      missingFields.push(...currentMissingFields);

      // Calculate composite confidence
      const compositeConfidence = OCRValidationUtils.calculateCompositeConfidence(
        ocrResult.confidence,
        validationResult,
        bookingValidation
      );

      const totalProcessingTime = Date.now() - startTime;

      console.log(`🎯 OCR Integration completed: ${compositeConfidence * 100}% confidence, ${missingFields.length} missing fields`);

      return {
        success: true,
        provider: ocrResult.provider,
        confidence: compositeConfidence,
        processingTime: totalProcessingTime,
        text: ocrResult.text,
        structuredData: enhancedData,
        validationResult,
        bookingValidation,
        missingFields: [...new Set(missingFields)],
        enhancedData,
        metadata: {
          fileName: options.fileName,
          fileSize: `${(Buffer.byteLength(fileBase64, 'base64') / (1024 * 1024)).toFixed(2)}MB`,
          mimeType,
          quality: validationResult.qualityScore >= 80 ? 'high' : 
                  validationResult.qualityScore >= 60 ? 'medium' : 'low',
          pageCount: ocrResult.metadata?.pageCount || 1,
          language: ocrResult.metadata?.language || 'auto'
        }
      };

    } catch (error: any) {
      console.error('❌ OCR Integration error:', error);
      
      return {
        success: false,
        provider: 'error',
        confidence: 0,
        processingTime: Date.now() - startTime,
        text: '',
        structuredData: {},
        validationResult: null,
        bookingValidation: null,
        missingFields: [],
        enhancedData: {},
        error: error.message,
        metadata: {
          fileName: options.fileName,
          mimeType,
          quality: 'error'
        }
      };
    }
  }

  /**
   * Batch process multiple documents
   */
  static async batchProcessDocuments(
    documents: Array<{
      fileBase64: string;
      mimeType: string;
      fileName?: string;
      id?: string;
    }>,
    options: {
      preferredProvider?: string;
      concurrency?: number;
      enhanceWithPropertyMatching?: boolean;
    } = {}
  ): Promise<Array<ProcessedOCRResult & { documentId: string }>> {
    console.log(`📦 OCR Integration: Starting batch processing of ${documents.length} documents`);

    const startTime = Date.now();
    const results: Array<ProcessedOCRResult & { documentId: string }> = [];

    // Process documents using the multi-provider service
    const batchResults = await ocrMultiProviderService.batchProcess(
      documents.map(doc => ({
        fileBase64: doc.fileBase64,
        mimeType: doc.mimeType,
        id: doc.id || doc.fileName || `doc_${Math.random().toString(36).substr(2, 8)}`
      })),
      {
        preferredProvider: options.preferredProvider,
        concurrency: options.concurrency || 3
      }
    );

    // Enhance each result
    for (const batchResult of batchResults) {
      const originalDoc = documents.find((doc, index) => 
        (doc.id || doc.fileName || `doc_${Math.random().toString(36).substr(2, 8)}`) === batchResult.documentId
      );

      if (!batchResult.success) {
        results.push({
          success: false,
          provider: batchResult.provider,
          confidence: 0,
          processingTime: batchResult.processingTime,
          text: '',
          structuredData: {},
          validationResult: null,
          bookingValidation: null,
          missingFields: [],
          enhancedData: {},
          error: batchResult.error,
          documentId: batchResult.documentId || 'unknown',
          metadata: {
            fileName: originalDoc?.fileName,
            mimeType: originalDoc?.mimeType || 'unknown',
            quality: 'failed'
          }
        });
        continue;
      }

      // Validate and enhance result
      const validationResult = OCRValidationUtils.validateOCRResult(
        batchResult.text,
        batchResult.confidence,
        batchResult.provider
      );

      let structuredData = batchResult.structuredData || {};
      if (Object.keys(structuredData).length === 0 && batchResult.text) {
        structuredData = this.extractBasicStructuredData(batchResult.text);
      }

      const bookingValidation = OCRValidationUtils.validateBookingData(structuredData);

      // Property matching for batch processing
      let enhancedData = { ...structuredData };
      const missingFields: string[] = [];

      if (options.enhanceWithPropertyMatching !== false && structuredData.propertyName) {
        try {
          const properties = await storage.getProperties();
          const matchedProperty = matchPropertyByAlias(structuredData.propertyName, properties);
          
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

      const compositeConfidence = OCRValidationUtils.calculateCompositeConfidence(
        batchResult.confidence,
        validationResult,
        bookingValidation
      );

      results.push({
        success: true,
        provider: batchResult.provider,
        confidence: compositeConfidence,
        processingTime: batchResult.processingTime,
        text: batchResult.text,
        structuredData: enhancedData,
        validationResult,
        bookingValidation,
        missingFields,
        enhancedData,
        documentId: batchResult.documentId || 'unknown',
        metadata: {
          fileName: originalDoc?.fileName,
          mimeType: originalDoc?.mimeType || 'unknown',
          quality: validationResult.qualityScore >= 80 ? 'high' : 
                  validationResult.qualityScore >= 60 ? 'medium' : 'low',
          pageCount: batchResult.metadata?.pageCount || 1,
          language: batchResult.metadata?.language || 'auto'
        }
      });
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    
    console.log(`✅ Batch OCR processing completed: ${successCount}/${documents.length} successful in ${totalTime}ms`);

    return results;
  }

  /**
   * Get OCR system status and recommendations
   */
  static async getSystemStatus(): Promise<{
    status: string;
    providers: any;
    statistics: any;
    recommendations: string[];
    health: {
      overall: 'healthy' | 'degraded' | 'unhealthy';
      issues: string[];
    };
  }> {
    try {
      const [providerStatus, statistics] = await Promise.all([
        ocrMultiProviderService.getProviderStatus(),
        Promise.resolve(ocrMultiProviderService.getStatistics())
      ]);

      const availableProviders = statistics.availableProviders;
      const recommendations: string[] = [];
      const issues: string[] = [];

      // Analyze provider health
      let healthyProviders = 0;
      for (const [name, provider] of Object.entries(providerStatus as any)) {
        if (provider.available && provider.health?.connected !== false) {
          healthyProviders++;
        } else if (provider.available && provider.health?.connected === false) {
          issues.push(`Provider ${name} is configured but not responding`);
        }
      }

      // Generate recommendations
      if (healthyProviders === 0) {
        recommendations.push('Critical: No OCR providers are working. Check API keys and connectivity.');
      } else if (healthyProviders === 1) {
        recommendations.push('Warning: Only one OCR provider is working. Consider configuring backup providers.');
      }

      if (!providerStatus.gemini?.available) {
        recommendations.push('Configure Gemini API for the best OCR quality and structured data extraction.');
      }

      if (!providerStatus.openrouter?.available) {
        recommendations.push('Configure OpenRouter API for backup OCR capabilities.');
      }

      // Determine overall health
      let overall: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyProviders >= 2) {
        overall = 'healthy';
      } else if (healthyProviders === 1) {
        overall = 'degraded';
      } else {
        overall = 'unhealthy';
      }

      return {
        status: overall,
        providers: providerStatus,
        statistics,
        recommendations,
        health: {
          overall,
          issues
        }
      };

    } catch (error: any) {
      console.error('❌ Failed to get OCR system status:', error);
      
      return {
        status: 'error',
        providers: {},
        statistics: {},
        recommendations: ['System health check failed - investigate OCR service status'],
        health: {
          overall: 'unhealthy',
          issues: [`System error: ${error.message}`]
        }
      };
    }
  }

  /**
   * Extract basic structured data using pattern matching
   * Fallback method when AI services are not available
   */
  private static extractBasicStructuredData(text: string): any {
    const structuredData: any = {
      documentType: 'reservation'
    };

    // Extract dates
    const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/g;
    const dates = text.match(datePattern);
    if (dates && dates.length >= 2) {
      structuredData.checkInDate = dates[0];
      structuredData.checkOutDate = dates[1];
    }

    // Extract guest name (improved heuristics)
    const namePatterns = [
      /(?:guest|name|hóspede|nome)[:\s]+([A-Za-zÀ-ÿ\s]{2,40})/i,
      /(?:mr|mrs|ms|sr|sra|dr|dr\.)\s+([A-Za-zÀ-ÿ\s]{2,30})/i,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)/ // Simple pattern for capitalized names
    ];

    for (const pattern of namePatterns) {
      const nameMatch = text.match(pattern);
      if (nameMatch && nameMatch[1]) {
        structuredData.guestName = nameMatch[1].trim();
        break;
      }
    }

    // Extract property name
    const propertyPatterns = [
      /(?:property|propriedade|hotel|apartamento)[:\s]+([A-Za-z0-9\sÀ-ÿ\-\.]{2,50})/i,
      /(?:accommodation|alojamento)[:\s]+([A-Za-z0-9\sÀ-ÿ\-\.]{2,50})/i
    ];

    for (const pattern of propertyPatterns) {
      const propertyMatch = text.match(pattern);
      if (propertyMatch && propertyMatch[1]) {
        structuredData.propertyName = propertyMatch[1].trim();
        break;
      }
    }

    // Extract contact information
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const emailMatch = text.match(emailPattern);
    if (emailMatch) {
      structuredData.guestEmail = emailMatch[1];
    }

    const phonePattern = /(\+?[\d\s\-\(\)]{9,20})/g;
    const phoneMatches = text.match(phonePattern);
    if (phoneMatches) {
      // Filter out dates and other numeric patterns
      const validPhones = phoneMatches.filter(phone => 
        !phone.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/) &&
        phone.replace(/\D/g, '').length >= 9
      );
      if (validPhones.length > 0) {
        structuredData.guestPhone = validPhones[0].trim();
      }
    }

    // Extract monetary values
    const currencyPattern = /(€\s*\d+([,\.]\d{1,2})?|\d+([,\.]\d{1,2})?\s*€|USD\s*\d+([,\.]\d{1,2})?|\$\s*\d+([,\.]\d{1,2})?)/g;
    const currencyMatches = text.match(currencyPattern);
    if (currencyMatches && currencyMatches.length > 0) {
      // Take the last/largest monetary value as total amount
      const amounts = currencyMatches.map(match => {
        const numericValue = parseFloat(match.replace(/[^\d.,]/g, '').replace(',', '.'));
        return { original: match, value: numericValue };
      }).filter(amount => !isNaN(amount.value));

      if (amounts.length > 0) {
        const maxAmount = amounts.reduce((max, current) => 
          current.value > max.value ? current : max
        );
        structuredData.totalAmount = maxAmount.value;
      }
    }

    // Extract number of guests
    const guestCountPattern = /(?:guests?|hóspedes?|pessoas?)[:\s]*(\d+)/i;
    const guestMatch = text.match(guestCountPattern);
    if (guestMatch) {
      structuredData.numGuests = parseInt(guestMatch[1]);
    }

    return structuredData;
  }
}

export default OCRIntegrationService;