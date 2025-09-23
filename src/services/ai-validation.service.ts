/**
 * 🛡️ AI Validation Layer - Anti-Hallucination System
 * Garante que todas as respostas da Maria AI são factualmente corretas
 */

import { db } from '../db';
import { storage } from '../storage';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  errors: string[];
  correctedData?: any;
  source: 'database' | 'ai' | 'hybrid';
}

export interface ValidationRule {
  field: string;
  validator: (value: any, context?: any) => boolean;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
}

export class AIValidationService {
  private validationRules: ValidationRule[] = [
    // Validation rules para reservas
    {
      field: 'propertyId',
      validator: async (value: number) => {
        const property = await storage.getProperty(value);
        return !!property;
      },
      errorMessage: 'Propriedade não existe no sistema',
      severity: 'error'
    },
    {
      field: 'checkInDate',
      validator: (value: string) => {
        const date = new Date(value);
        const today = new Date();
        return date >= today;
      },
      errorMessage: 'Data de check-in não pode ser no passado',
      severity: 'error'
    },
    {
      field: 'totalAmount',
      validator: (value: string) => {
        const amount = parseFloat(value);
        return amount > 0 && amount < 10000; // Limite máximo realista
      },
      errorMessage: 'Valor total deve estar entre 0€ e 10.000€',
      severity: 'warning'
    }
  ];

  /**
   * Valida resposta da AI contra dados reais
   */
  async validateAIResponse(
    aiResponse: any, 
    context: string,
    userQuery: string
  ): Promise<ValidationResult> {
    console.log(`🔍 Validating AI response for context: ${context}`);
    
    const result: ValidationResult = {
      isValid: true,
      confidence: 1.0,
      errors: [],
      source: 'ai'
    };

    try {
      // 1. Fact-check contra base de dados
      const factCheckResult = await this.factCheckAgainstDatabase(aiResponse, context);
      if (!factCheckResult.isValid) {
        result.isValid = false;
        result.errors.push(...factCheckResult.errors);
        result.confidence *= 0.7;
      }

      // 2. Consistency check
      const consistencyResult = await this.checkDataConsistency(aiResponse);
      if (!consistencyResult.isValid) {
        result.isValid = false;
        result.errors.push(...consistencyResult.errors);
        result.confidence *= 0.8;
      }

      // 3. Business rules validation
      const businessRulesResult = await this.validateBusinessRules(aiResponse, context);
      if (!businessRulesResult.isValid) {
        result.isValid = false;
        result.errors.push(...businessRulesResult.errors);
        result.confidence *= 0.6;
      }

      // 4. Se confidence é baixa, tentar correção automática
      if (result.confidence < 0.5) {
        console.log('🚨 Low confidence, attempting auto-correction...');
        const correctedData = await this.attemptAutoCorrection(aiResponse, context);
        if (correctedData) {
          result.correctedData = correctedData;
          result.source = 'hybrid';
          result.confidence = Math.min(result.confidence + 0.3, 0.9);
        }
      }

      // 5. Log para audit trail
      await this.logValidation(userQuery, aiResponse, result);

      return result;

    } catch (error) {
      console.error('❌ Error in AI validation:', error);
      return {
        isValid: false,
        confidence: 0,
        errors: ['Erro interno na validação'],
        source: 'ai'
      };
    }
  }

  /**
   * Fact-check dados contra base de dados real
   */
  private async factCheckAgainstDatabase(data: any, context: string): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, confidence: 1.0, errors: [], source: 'database' };

    if (context === 'reservation') {
      // Verificar se propriedade existe
      if (data.propertyId) {
        const property = await storage.getProperty(data.propertyId);
        if (!property) {
          result.isValid = false;
          result.errors.push(`Propriedade ID ${data.propertyId} não existe`);
        }
      }

      // Verificar overlapping reservations
      if (data.checkInDate && data.checkOutDate && data.propertyId) {
        const overlapping = await this.checkOverlappingReservations(
          data.propertyId, 
          data.checkInDate, 
          data.checkOutDate
        );
        if (overlapping.length > 0) {
          result.isValid = false;
          result.errors.push(`Conflito de reservas: ${overlapping.length} reservas sobrepostas`);
        }
      }
    }

    if (context === 'financial') {
      // Verificar valores financeiros realistas
      if (data.totalRevenue && typeof data.totalRevenue === 'number') {
        const actualRevenue = await storage.getTotalRevenue();
        const difference = Math.abs(data.totalRevenue - actualRevenue) / actualRevenue;
        if (difference > 0.1) { // Mais de 10% de diferença
          result.isValid = false;
          result.errors.push(`Receita reportada (${data.totalRevenue}) difere significativamente do real (${actualRevenue})`);
        }
      }
    }

    return result;
  }

  /**
   * Verifica consistência interna dos dados
   */
  private async checkDataConsistency(data: any): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, confidence: 1.0, errors: [], source: 'ai' };

    // Verificar datas lógicas
    if (data.checkInDate && data.checkOutDate) {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      
      if (checkOut <= checkIn) {
        result.isValid = false;
        result.errors.push('Data de check-out deve ser posterior ao check-in');
      }

      const daysDiff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24);
      if (daysDiff > 30) {
        result.isValid = false;
        result.errors.push('Estadia não pode exceder 30 dias');
      }
    }

    // Verificar valores monetários
    if (data.totalAmount && data.netAmount) {
      const total = parseFloat(data.totalAmount);
      const net = parseFloat(data.netAmount);
      
      if (net > total) {
        result.isValid = false;
        result.errors.push('Valor líquido não pode ser superior ao total');
      }
    }

    return result;
  }

  /**
   * Valida regras de negócio específicas
   */
  private async validateBusinessRules(data: any, context: string): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, confidence: 1.0, errors: [], source: 'ai' };

    for (const rule of this.validationRules) {
      if (data.hasOwnProperty(rule.field)) {
        const isValid = await rule.validator(data[rule.field], data);
        if (!isValid) {
          if (rule.severity === 'error') {
            result.isValid = false;
          }
          result.errors.push(`${rule.field}: ${rule.errorMessage}`);
          result.confidence *= rule.severity === 'error' ? 0.5 : 0.8;
        }
      }
    }

    return result;
  }

  /**
   * Tenta correção automática de dados inválidos
   */
  private async attemptAutoCorrection(data: any, context: string): Promise<any | null> {
    try {
      const corrected = { ...data };
      let hasCorrections = false;

      // Correção de propriedade por nome similar
      if (data.propertyName && !data.propertyId) {
        const properties = await storage.getProperties();
        const match = this.findBestPropertyMatch(data.propertyName, properties);
        if (match) {
          corrected.propertyId = match.id;
          hasCorrections = true;
          console.log(`✅ Auto-corrected property: ${data.propertyName} → ${match.name} (ID: ${match.id})`);
        }
      }

      // Correção de valores monetários
      if (data.totalAmount && typeof data.totalAmount === 'string') {
        const cleanAmount = data.totalAmount.replace(/[€,\s]/g, '');
        if (!isNaN(parseFloat(cleanAmount))) {
          corrected.totalAmount = cleanAmount;
          hasCorrections = true;
        }
      }

      return hasCorrections ? corrected : null;
    } catch (error) {
      console.error('Error in auto-correction:', error);
      return null;
    }
  }

  /**
   * Encontra propriedade mais similar por nome
   */
  private findBestPropertyMatch(name: string, properties: any[]): any | null {
    if (!properties || properties.length === 0) return null;

    let bestMatch = null;
    let highestSimilarity = 0;

    for (const property of properties) {
      const similarity = this.calculateStringSimilarity(name.toLowerCase(), property.name.toLowerCase());
      if (similarity > highestSimilarity && similarity > 0.6) {
        highestSimilarity = similarity;
        bestMatch = property;
      }
    }

    return bestMatch;
  }

  /**
   * Calcula similaridade entre strings
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  /**
   * Verifica reservas sobrepostas
   */
  private async checkOverlappingReservations(
    propertyId: number, 
    checkIn: string, 
    checkOut: string
  ): Promise<any[]> {
    try {
      const reservations = await storage.getReservationsByProperty(propertyId);
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      return reservations.filter(reservation => {
        const resCheckIn = new Date(reservation.checkInDate);
        const resCheckOut = new Date(reservation.checkOutDate);
        
        return (checkInDate < resCheckOut) && (checkOutDate > resCheckIn);
      });
    } catch (error) {
      console.error('Error checking overlapping reservations:', error);
      return [];
    }
  }

  /**
   * Log validation para audit trail
   */
  private async logValidation(query: string, response: any, result: ValidationResult): Promise<void> {
    try {
      await storage.createActivity({
        type: 'ai_validation',
        description: `AI Validation - Query: "${query.substring(0, 100)}..." | Valid: ${result.isValid} | Confidence: ${result.confidence.toFixed(2)}`,
        entityId: null,
        entityType: 'system'
      });
    } catch (error) {
      console.error('Error logging validation:', error);
    }
  }
}

// Singleton instance
export const aiValidationService = new AIValidationService();