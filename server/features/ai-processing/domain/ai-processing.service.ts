import type {
  AIProcessingTask,
  OCRRequest,
  OCRResponse,
  TextAnalysisRequest,
  TextAnalysisResponse,
  DocumentLearningRequest,
  DocumentLearningResponse,
  AIServiceStatus
} from "./ai-processing.entity.js";
import type { ServiceResult } from "../../../shared/types/common.js";

export interface AIProcessingService {
  processOCR(request: OCRRequest): Promise<ServiceResult<OCRResponse>>;
  analyzeText(request: TextAnalysisRequest): Promise<ServiceResult<TextAnalysisResponse>>;
  learnDocumentFormat(request: DocumentLearningRequest): Promise<ServiceResult<DocumentLearningResponse>>;
  getServiceStatus(): Promise<ServiceResult<AIServiceStatus[]>>;
  setActiveProvider(provider: string): Promise<ServiceResult<boolean>>;
  testConnection(provider?: string): Promise<ServiceResult<boolean>>;
}

export class AIProcessingDomainService implements AIProcessingService {
  constructor(
    private readonly aiRepository: AIProcessingRepository,
    private readonly aiAdapterService: AIAdapterService,
    private readonly taskRepository: AITaskRepository
  ) {}

  async processOCR(request: OCRRequest): Promise<ServiceResult<OCRResponse>> {
    try {
      // Create task record
      const task = await this.taskRepository.create({
        type: 'ocr',
        status: 'processing',
        input: {
          fileBase64: request.fileBase64,
          mimeType: request.mimeType,
          fileName: request.fileName
        }
      });

      const startTime = Date.now();

      try {
        const result = await this.aiAdapterService.extractTextFromPDF(
          request.fileBase64,
          request.provider
        );

        const processingTime = Date.now() - startTime;

        const response: OCRResponse = {
          success: true,
          extractedText: result.text,
          extractedData: result.structuredData,
          confidence: result.confidence,
          processingTime,
          provider: result.provider
        };

        // Update task with success
        await this.taskRepository.update(task.id, {
          status: 'completed',
          output: {
            extractedData: response,
            processingTime,
            confidence: result.confidence
          }
        });

        return { success: true, data: response };

      } catch (error) {
        // Update task with failure
        await this.taskRepository.update(task.id, {
          status: 'failed',
          output: {
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            processingTime: Date.now() - startTime
          }
        });

        throw error;
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process OCR'
      };
    }
  }

  async analyzeText(request: TextAnalysisRequest): Promise<ServiceResult<TextAnalysisResponse>> {
    try {
      const task = await this.taskRepository.create({
        type: 'text_analysis',
        status: 'processing',
        input: {
          text: request.text
        }
      });

      const startTime = Date.now();

      try {
        let result;
        switch (request.analysisType) {
          case 'reservation_data':
            result = await this.aiAdapterService.parseReservationData(request.text);
            break;
          case 'financial_document':
            result = await this.aiAdapterService.parseFinancialDocument(request.text);
            break;
          default:
            result = await this.aiAdapterService.analyzeGenericText(request.text);
        }

        const processingTime = Date.now() - startTime;

        const response: TextAnalysisResponse = {
          success: true,
          structuredData: result.data,
          confidence: result.confidence,
          clarificationQuestions: result.clarificationQuestions,
          validationResult: result.validationResult
        };

        await this.taskRepository.update(task.id, {
          status: 'completed',
          output: {
            extractedData: response,
            processingTime,
            confidence: result.confidence
          }
        });

        return { success: true, data: response };

      } catch (error) {
        await this.taskRepository.update(task.id, {
          status: 'failed',
          output: {
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            processingTime: Date.now() - startTime
          }
        });

        throw error;
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze text'
      };
    }
  }

  async learnDocumentFormat(request: DocumentLearningRequest): Promise<ServiceResult<DocumentLearningResponse>> {
    try {
      const task = await this.taskRepository.create({
        type: 'document_learning',
        status: 'processing',
        input: {
          fileBase64: request.fileBase64,
          mimeType: request.mimeType,
          fileName: request.fileName
        }
      });

      const startTime = Date.now();

      try {
        const result = await this.aiAdapterService.learnNewDocumentFormat(
          request.fileBase64,
          request.mimeType,
          request.fields
        );

        const processingTime = Date.now() - startTime;

        const response: DocumentLearningResponse = {
          success: result.success,
          extractedData: result.extractedData,
          learnedPattern: result.pattern
        };

        await this.taskRepository.update(task.id, {
          status: 'completed',
          output: {
            extractedData: response,
            processingTime
          }
        });

        return { success: true, data: response };

      } catch (error) {
        await this.taskRepository.update(task.id, {
          status: 'failed',
          output: {
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            processingTime: Date.now() - startTime
          }
        });

        throw error;
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to learn document format'
      };
    }
  }

  async getServiceStatus(): Promise<ServiceResult<AIServiceStatus[]>> {
    try {
      const status = await this.aiAdapterService.getAllServiceStatus();
      return { success: true, data: status };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get service status'
      };
    }
  }

  async setActiveProvider(provider: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.aiAdapterService.setActiveProvider(provider);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set active provider'
      };
    }
  }

  async testConnection(provider?: string): Promise<ServiceResult<boolean>> {
    try {
      const result = await this.aiAdapterService.testConnection(provider);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

// Repository interfaces
export interface AIProcessingRepository {
  processOCR(request: OCRRequest): Promise<OCRResponse>;
  analyzeText(request: TextAnalysisRequest): Promise<TextAnalysisResponse>;
  learnDocumentFormat(request: DocumentLearningRequest): Promise<DocumentLearningResponse>;
}

export interface AIAdapterService {
  extractTextFromPDF(fileBase64: string, provider?: string): Promise<any>;
  parseReservationData(text: string): Promise<any>;
  parseFinancialDocument(text: string): Promise<any>;
  analyzeGenericText(text: string): Promise<any>;
  learnNewDocumentFormat(fileBase64: string, mimeType: string, fields: string[]): Promise<any>;
  getAllServiceStatus(): Promise<AIServiceStatus[]>;
  setActiveProvider(provider: string): Promise<boolean>;
  testConnection(provider?: string): Promise<boolean>;
}

export interface AITaskRepository {
  create(task: Partial<AIProcessingTask>): Promise<AIProcessingTask>;
  update(id: number, updates: Partial<AIProcessingTask>): Promise<AIProcessingTask>;
  findById(id: number): Promise<AIProcessingTask | null>;
  findByStatus(status: string): Promise<AIProcessingTask[]>;
}