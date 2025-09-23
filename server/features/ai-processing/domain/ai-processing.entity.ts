import type { BaseEntity } from "../../../shared/types/common.js";

export interface AIProcessingTask extends BaseEntity {
  type: 'ocr' | 'text_analysis' | 'document_learning' | 'reservation_import';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: {
    text?: string;
    fileBase64?: string;
    mimeType?: string;
    fileName?: string;
  };
  output?: {
    extractedData?: any;
    confidence?: number;
    processingTime?: number;
    errors?: string[];
  };
  metadata?: {
    userId?: string;
    sessionId?: string;
    propertyId?: number;
  };
}

export interface OCRRequest {
  fileBase64: string;
  mimeType: string;
  fileName?: string;
  provider?: 'gemini' | 'mistral' | 'rolm' | 'auto';
}

export interface OCRResponse {
  success: boolean;
  extractedText?: string;
  extractedData?: any;
  confidence?: number;
  processingTime?: number;
  provider?: string;
  error?: string;
}

export interface TextAnalysisRequest {
  text: string;
  analysisType: 'reservation_data' | 'financial_document' | 'general';
  context?: Record<string, any>;
}

export interface TextAnalysisResponse {
  success: boolean;
  structuredData?: any;
  confidence?: number;
  clarificationQuestions?: string[];
  validationResult?: {
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
    warnings: Array<{ field: string; message: string }>;
  };
  error?: string;
}

export interface DocumentLearningRequest {
  fileBase64: string;
  mimeType: string;
  fields: string[];
  fileName?: string;
}

export interface DocumentLearningResponse {
  success: boolean;
  extractedData?: Record<string, any>;
  learnedPattern?: {
    documentType: string;
    fieldMappings: Record<string, any>;
    confidence: number;
  };
  error?: string;
}

export interface AIServiceStatus {
  provider: string;
  available: boolean;
  healthy: boolean;
  lastCheck: Date;
  capabilities: string[];
  rateLimitStatus?: {
    remaining: number;
    resetTime: Date;
  };
}