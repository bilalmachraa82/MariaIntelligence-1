import { WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { ValidationRulesEngine } from '../utils/validation-rules.engine';
import { FactCheckingService } from './fact-checking.service';
import { ConfidenceCalibrator } from './confidence-calibrator.service';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  corrections: ValidationCorrection[];
  metadata: ValidationMetadata;
  auditTrail: AuditEntry[];
}

export interface ValidationError {
  type: 'syntax' | 'semantic' | 'business' | 'factual' | 'consistency';
  severity: 'critical' | 'major' | 'minor';
  field: string;
  message: string;
  suggestedFix?: string;
  confidence: number;
  source: string;
}

export interface ValidationWarning {
  type: 'potential_issue' | 'best_practice' | 'performance';
  field: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ValidationCorrection {
  field: string;
  originalValue: any;
  correctedValue: any;
  confidence: number;
  reason: string;
  autoApplied: boolean;
}

export interface ValidationMetadata {
  processingTimeMs: number;
  validationLayers: string[];
  sourcesChecked: string[];
  rulesApplied: number;
  confidenceScore: number;
}

export interface AuditEntry {
  timestamp: Date;
  action: string;
  details: any;
  confidence: number;
  source: string;
}

export class AIValidationEnhancedService extends EventEmitter {
  private rulesEngine: ValidationRulesEngine;
  private factChecker: FactCheckingService;
  private confidenceCalibrator: ConfidenceCalibrator;
  private websockets: Set<WebSocket> = new Set();
  private validationHistory: Map<string, ValidationResult[]> = new Map();
  private metrics = {
    totalValidations: 0,
    successfulValidations: 0,
    autoCorrections: 0,
    falsePositives: 0,
    averageProcessingTime: 0
  };

  constructor() {
    super();
    this.rulesEngine = new ValidationRulesEngine();
    this.factChecker = new FactCheckingService();
    this.confidenceCalibrator = new ConfidenceCalibrator();
    this.initializeRealtimeValidation();
  }

  /**
   * Enhanced multi-layered validation pipeline
   */
  async validateAIResponse(
    response: any,
    context: ValidationContext,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const auditTrail: AuditEntry[] = [];
    
    try {
      // Layer 1: Syntax Validation
      const syntaxResult = await this.validateSyntax(response, context);
      auditTrail.push({
        timestamp: new Date(),
        action: 'syntax_validation',
        details: syntaxResult,
        confidence: syntaxResult.confidence,
        source: 'syntax_validator'
      });

      // Layer 2: Semantic Validation
      const semanticResult = await this.validateSemantics(response, context);
      auditTrail.push({
        timestamp: new Date(),
        action: 'semantic_validation',
        details: semanticResult,
        confidence: semanticResult.confidence,
        source: 'semantic_validator'
      });

      // Layer 3: Business Logic Validation
      const businessResult = await this.validateBusinessLogic(response, context);
      auditTrail.push({
        timestamp: new Date(),
        action: 'business_validation',
        details: businessResult,
        confidence: businessResult.confidence,
        source: 'business_validator'
      });

      // Layer 4: Fact Checking
      const factResult = await this.validateFacts(response, context);
      auditTrail.push({
        timestamp: new Date(),
        action: 'fact_checking',
        details: factResult,
        confidence: factResult.confidence,
        source: 'fact_checker'
      });

      // Layer 5: Consistency Checking
      const consistencyResult = await this.validateConsistency(response, context);
      auditTrail.push({
        timestamp: new Date(),
        action: 'consistency_check',
        details: consistencyResult,
        confidence: consistencyResult.confidence,
        source: 'consistency_checker'
      });

      // Aggregate results
      const aggregatedResult = await this.aggregateValidationResults([
        syntaxResult,
        semanticResult,
        businessResult,
        factResult,
        consistencyResult
      ]);

      // Apply progressive corrections
      const corrections = await this.applyProgressiveCorrections(
        response,
        aggregatedResult,
        context
      );

      // Calculate final confidence score
      const finalConfidence = await this.confidenceCalibrator.calibrate(
        aggregatedResult,
        context,
        corrections
      );

      const processingTime = Date.now() - startTime;
      
      const validationResult: ValidationResult = {
        isValid: aggregatedResult.errors.filter(e => e.severity === 'critical').length === 0,
        confidence: finalConfidence,
        errors: aggregatedResult.errors,
        warnings: aggregatedResult.warnings,
        corrections,
        metadata: {
          processingTimeMs: processingTime,
          validationLayers: ['syntax', 'semantic', 'business', 'factual', 'consistency'],
          sourcesChecked: await this.factChecker.getSourcesUsed(),
          rulesApplied: this.rulesEngine.getRulesAppliedCount(),
          confidenceScore: finalConfidence
        },
        auditTrail
      };

      // Update metrics
      this.updateMetrics(validationResult);

      // Store in history
      this.storeValidationHistory(context.requestId, validationResult);

      // Emit real-time updates
      this.emitRealtimeUpdate('validation_complete', validationResult);

      return validationResult;

    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        confidence: 0,
        errors: [{
          type: 'critical' as any,
          severity: 'critical',
          field: 'system',
          message: `Validation failed: ${error.message}`,
          confidence: 1.0,
          source: 'validation_service'
        }],
        warnings: [],
        corrections: [],
        metadata: {
          processingTimeMs: Date.now() - startTime,
          validationLayers: [],
          sourcesChecked: [],
          rulesApplied: 0,
          confidenceScore: 0
        },
        auditTrail
      };

      this.emit('validation_error', error, errorResult);
      return errorResult;
    }
  }

  /**
   * Syntax validation layer
   */
  private async validateSyntax(response: any, context: ValidationContext) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // JSON structure validation
    if (typeof response === 'object' && response !== null) {
      const requiredFields = this.getRequiredFields(context.responseType);
      for (const field of requiredFields) {
        if (!(field in response)) {
          errors.push({
            type: 'syntax',
            severity: 'major',
            field,
            message: `Missing required field: ${field}`,
            confidence: 0.95,
            source: 'syntax_validator'
          });
        }
      }
    }

    // Data type validation
    const typeErrors = await this.rulesEngine.validateDataTypes(response, context);
    errors.push(...typeErrors);

    // Format validation (dates, emails, phones, etc.)
    const formatErrors = await this.rulesEngine.validateFormats(response, context);
    errors.push(...formatErrors);

    return {
      errors,
      warnings,
      confidence: errors.length === 0 ? 0.95 : Math.max(0.1, 0.95 - (errors.length * 0.1))
    };
  }

  /**
   * Semantic validation layer
   */
  private async validateSemantics(response: any, context: ValidationContext) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Contextual meaning validation
    const semanticErrors = await this.rulesEngine.validateSemantics(response, context);
    errors.push(...semanticErrors);

    // Intent matching validation
    const intentScore = await this.validateIntent(response, context);
    if (intentScore < 0.7) {
      warnings.push({
        type: 'potential_issue',
        field: 'intent',
        message: 'Response may not match user intent',
        impact: 'medium'
      });
    }

    return {
      errors,
      warnings,
      confidence: Math.max(0.1, intentScore)
    };
  }

  /**
   * Business logic validation layer - 20+ rules
   */
  private async validateBusinessLogic(response: any, context: ValidationContext) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Apply all business rules
    const businessErrors = await this.rulesEngine.applyBusinessRules(response, context);
    errors.push(...businessErrors);

    // Property-specific validations
    if (context.domain === 'property_management') {
      const propertyErrors = await this.validatePropertyRules(response, context);
      errors.push(...propertyErrors);
    }

    // Financial validations
    if (response.pricing || response.financial) {
      const financialErrors = await this.validateFinancialRules(response, context);
      errors.push(...financialErrors);
    }

    // Booking/reservation validations
    if (response.booking || response.reservation) {
      const bookingErrors = await this.validateBookingRules(response, context);
      errors.push(...bookingErrors);
    }

    return {
      errors,
      warnings,
      confidence: errors.filter(e => e.severity === 'critical').length === 0 ? 0.9 : 0.3
    };
  }

  /**
   * Fact validation layer
   */
  private async validateFacts(response: any, context: ValidationContext) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Cross-reference with fact database
    const factErrors = await this.factChecker.validateFacts(response, context);
    errors.push(...factErrors);

    // External API verification
    const externalValidation = await this.factChecker.verifyWithExternalSources(response, context);
    if (externalValidation.conflicts.length > 0) {
      for (const conflict of externalValidation.conflicts) {
        errors.push({
          type: 'factual',
          severity: 'major',
          field: conflict.field,
          message: `Fact conflict detected: ${conflict.message}`,
          confidence: conflict.confidence,
          source: conflict.source
        });
      }
    }

    return {
      errors,
      warnings,
      confidence: errors.length === 0 ? 0.95 : Math.max(0.1, 0.95 - (errors.length * 0.15))
    };
  }

  /**
   * Consistency validation layer
   */
  private async validateConsistency(response: any, context: ValidationContext) {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Internal consistency checks
    const consistencyErrors = await this.rulesEngine.validateConsistency(response, context);
    errors.push(...consistencyErrors);

    // Historical consistency
    const history = this.validationHistory.get(context.sessionId);
    if (history && history.length > 0) {
      const historyErrors = await this.validateHistoricalConsistency(response, history);
      errors.push(...historyErrors);
    }

    return {
      errors,
      warnings,
      confidence: errors.length === 0 ? 0.9 : Math.max(0.2, 0.9 - (errors.length * 0.1))
    };
  }

  /**
   * Progressive correction system
   */
  private async applyProgressiveCorrections(
    response: any,
    validationResult: any,
    context: ValidationContext
  ): Promise<ValidationCorrection[]> {
    const corrections: ValidationCorrection[] = [];

    for (const error of validationResult.errors) {
      if (error.confidence > 0.8 && error.suggestedFix) {
        const correction: ValidationCorrection = {
          field: error.field,
          originalValue: response[error.field],
          correctedValue: error.suggestedFix,
          confidence: error.confidence,
          reason: error.message,
          autoApplied: error.confidence > 0.95
        };

        if (correction.autoApplied) {
          response[error.field] = correction.correctedValue;
          this.metrics.autoCorrections++;
        }

        corrections.push(correction);
      }
    }

    return corrections;
  }

  /**
   * Real-time validation setup
   */
  private initializeRealtimeValidation() {
    this.on('validation_complete', (result: ValidationResult) => {
      this.broadcastToWebSockets('validation_update', result);
    });

    this.on('validation_error', (error: Error, result: ValidationResult) => {
      this.broadcastToWebSockets('validation_error', { error: error.message, result });
    });
  }

  /**
   * WebSocket management
   */
  addWebSocket(ws: WebSocket) {
    this.websockets.add(ws);
    ws.on('close', () => {
      this.websockets.delete(ws);
    });
  }

  private broadcastToWebSockets(event: string, data: any) {
    const message = JSON.stringify({ event, data, timestamp: new Date() });
    
    for (const ws of this.websockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  private emitRealtimeUpdate(event: string, data: any) {
    this.emit(event, data);
  }

  /**
   * Metrics and monitoring
   */
  private updateMetrics(result: ValidationResult) {
    this.metrics.totalValidations++;
    if (result.isValid) {
      this.metrics.successfulValidations++;
    }
    
    const currentAvg = this.metrics.averageProcessingTime;
    const count = this.metrics.totalValidations;
    this.metrics.averageProcessingTime = 
      (currentAvg * (count - 1) + result.metadata.processingTimeMs) / count;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalValidations > 0 
        ? this.metrics.successfulValidations / this.metrics.totalValidations 
        : 0,
      autoCorrectionRate: this.metrics.totalValidations > 0
        ? this.metrics.autoCorrections / this.metrics.totalValidations
        : 0
    };
  }

  /**
   * Validation history management
   */
  private storeValidationHistory(requestId: string, result: ValidationResult) {
    if (!this.validationHistory.has(requestId)) {
      this.validationHistory.set(requestId, []);
    }
    
    const history = this.validationHistory.get(requestId)!;
    history.push(result);
    
    // Keep only last 50 results per session
    if (history.length > 50) {
      history.shift();
    }
  }

  getValidationHistory(requestId: string): ValidationResult[] {
    return this.validationHistory.get(requestId) || [];
  }

  // Helper methods
  private getRequiredFields(responseType: string): string[] {
    const fieldMap: { [key: string]: string[] } = {
      'property_info': ['id', 'name', 'address', 'price'],
      'booking_response': ['bookingId', 'dates', 'guestCount', 'totalPrice'],
      'availability': ['propertyId', 'dates', 'available'],
      'pricing': ['basePrice', 'fees', 'total'],
      'recommendation': ['recommendations', 'criteria', 'confidence']
    };
    return fieldMap[responseType] || [];
  }

  private async validateIntent(response: any, context: ValidationContext): Promise<number> {
    // Intent matching logic would go here
    // This is a simplified version
    return 0.85;
  }

  private async validatePropertyRules(response: any, context: ValidationContext): Promise<ValidationError[]> {
    // Property-specific business rules
    return await this.rulesEngine.validatePropertySpecificRules(response, context);
  }

  private async validateFinancialRules(response: any, context: ValidationContext): Promise<ValidationError[]> {
    // Financial validation rules
    return await this.rulesEngine.validateFinancialRules(response, context);
  }

  private async validateBookingRules(response: any, context: ValidationContext): Promise<ValidationError[]> {
    // Booking validation rules
    return await this.rulesEngine.validateBookingRules(response, context);
  }

  private async aggregateValidationResults(results: any[]): Promise<{errors: ValidationError[], warnings: ValidationWarning[]}> {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];
    
    for (const result of results) {
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }
    
    return { errors: allErrors, warnings: allWarnings };
  }

  private async validateHistoricalConsistency(response: any, history: ValidationResult[]): Promise<ValidationError[]> {
    // Historical consistency validation logic
    return [];
  }
}

export interface ValidationContext {
  requestId: string;
  sessionId: string;
  responseType: string;
  domain: string;
  userRole?: string;
  propertyType?: string;
  season?: string;
  timestamp: Date;
}

export interface ValidationOptions {
  enableAutoCorrection?: boolean;
  confidenceThreshold?: number;
  skipLayers?: string[];
  enableRealtimeUpdates?: boolean;
}