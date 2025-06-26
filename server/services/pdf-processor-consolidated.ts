/**
 * Processador de PDF Consolidado - Maria Faz
 * 
 * Esta é a versão consolidada que substitui toda a complexidade atual.
 * Mantém apenas o que funciona: Gemini + validação + base de dados.
 * 
 * Funcionalidades:
 * - Extração de texto via Gemini 2.5 Flash
 * - Parsing estruturado de dados de reserva
 * - Validação completa dos dados
 * - Matching inteligente de propriedades
 * - Cálculos financeiros automáticos
 */

import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { storage } from '../storage';
import { ExtractedReservationData, ValidationResult, ValidationStatus } from './pdf-extract';

// Interface para resultado do processamento
export interface ProcessingResult {
  success: boolean;
  extractedData?: ExtractedReservationData;
  validation?: ValidationResult;
  propertyId?: number;
  message: string;
  error?: string;
}

/**
 * Classe principal do processador consolidado
 */
export class ConsolidatedPDFProcessor {
  
  /**
   * Processa um arquivo PDF e retorna dados estruturados
   * @param filePath Caminho do arquivo PDF
   * @returns Resultado do processamento
   */
  async processPDF(filePath: string): Promise<ProcessingResult> {
    try {
      console.log(`📄 Processando PDF: ${path.basename(filePath)}`);
      
      // 1. Extrair texto do PDF
      const extractedText = await this.extractTextFromPDF(filePath);
      if (!extractedText || extractedText.length < 50) {
        return {
          success: false,
          message: 'PDF vazio ou não contém texto suficiente',
          error: 'INSUFFICIENT_TEXT'
        };
      }
      
      // 2. Usar Gemini para estruturar os dados
      const structuredData = await this.parseWithGemini(extractedText);
      if (!structuredData) {
        return {
          success: false,
          message: 'Falha na extração de dados estruturados',
          error: 'PARSING_FAILED'
        };
      }
      
      // 3. Validar dados extraídos
      const validation = this.validateExtractedData(structuredData);
      
      // 4. Encontrar propriedade na base de dados
      const propertyId = await this.findPropertyMatch(structuredData.propertyName);
      
      // 5. Enriquecer com dados da propriedade
      const enrichedData = await this.enrichWithPropertyData(structuredData, propertyId || undefined);
      
      return {
        success: true,
        extractedData: enrichedData,
        validation,
        propertyId: propertyId || undefined,
        message: `PDF processado com sucesso. Status: ${validation.status}`
      };
      
    } catch (error) {
      console.error('Erro no processamento do PDF:', error);
      return {
        success: false,
        message: 'Erro interno no processamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
  
  /**
   * Extrai texto de um PDF usando pdf-parse
   */
  private async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      const pdfBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(pdfBuffer);
      
      console.log(`✅ Texto extraído: ${data.text.length} caracteres`);
      return data.text;
      
    } catch (error) {
      console.error('Erro na extração de texto:', error);
      throw new Error('Falha na extração de texto do PDF');
    }
  }
  
  /**
   * Usa Gemini para estruturar dados de reserva
   */
  private async parseWithGemini(text: string): Promise<ExtractedReservationData | null> {
    try {
      // Verificar se Gemini está disponível
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY não configurada');
      }
      
      const prompt = `
Analise este documento de reserva e extraia as informações no formato JSON.

TEXTO DO DOCUMENTO:
${text}

Retorne apenas um JSON válido com esta estrutura:
{
  "propertyName": "nome da propriedade",
  "guestName": "nome do hóspede",
  "guestEmail": "email@exemplo.com",
  "guestPhone": "+351999999999",
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-20",
  "numGuests": 2,
  "totalAmount": 150.00,
  "platform": "booking.com",
  "reference": "BK123456",
  "platformFee": 15.00,
  "cleaningFee": 25.00,
  "notes": "observações"
}

Regras importantes:
- Use formato de data YYYY-MM-DD
- Valores numéricos devem ser números, não strings
- Se não encontrar uma informação, omita o campo
- Propriedades Aroeira: especifique o número (Aroeira I, Aroeira II, etc.)
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000
          }
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${result.error?.message || 'Unknown error'}`);
      }
      
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error('Nenhum conteúdo retornado pelo Gemini');
      }
      
      // Extrair JSON da resposta
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Nenhum JSON válido encontrado na resposta');
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      console.log('✅ Dados estruturados extraídos:', parsedData);
      
      return parsedData;
      
    } catch (error) {
      console.error('Erro no parsing com Gemini:', error);
      return null;
    }
  }
  
  /**
   * Valida dados extraídos
   */
  private validateExtractedData(data: ExtractedReservationData): ValidationResult {
    const errors: any[] = [];
    const missingFields: string[] = [];
    const warningFields: string[] = [];
    
    // Campos obrigatórios
    const requiredFields = ['propertyName', 'guestName', 'checkInDate', 'checkOutDate'];
    
    requiredFields.forEach(field => {
      if (!data[field as keyof ExtractedReservationData]) {
        missingFields.push(field);
        errors.push({
          field,
          message: `Campo obrigatório em falta: ${field}`,
          severity: 'error'
        });
      }
    });
    
    // Validar datas
    if (data.checkInDate && data.checkOutDate) {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);
      
      if (checkIn >= checkOut) {
        errors.push({
          field: 'checkOutDate',
          message: 'Data de check-out deve ser posterior ao check-in',
          severity: 'error'
        });
      }
    }
    
    // Validar valores numéricos
    if (data.totalAmount && (isNaN(Number(data.totalAmount)) || Number(data.totalAmount) < 0)) {
      warningFields.push('totalAmount');
      errors.push({
        field: 'totalAmount',
        message: 'Valor total inválido',
        severity: 'warning'
      });
    }
    
    // Determinar status
    let status: ValidationStatus;
    if (missingFields.length === 0 && errors.filter(e => e.severity === 'error').length === 0) {
      status = ValidationStatus.VALID;
    } else if (missingFields.length > 0) {
      status = ValidationStatus.INCOMPLETE;
    } else {
      status = ValidationStatus.NEEDS_REVIEW;
    }
    
    return {
      status,
      isValid: status === ValidationStatus.VALID,
      errors,
      missingFields,
      warningFields,
      dataWithDefaults: data
    };
  }
  
  /**
   * Encontra propriedade correspondente na base de dados
   */
  private async findPropertyMatch(propertyName: string): Promise<number | null> {
    try {
      if (!propertyName) return null;
      
      const properties = await storage.getProperties();
      if (!properties || properties.length === 0) return null;
      
      const normalizedSearchName = this.normalizePropertyName(propertyName);
      console.log(`🔍 Procurando propriedade: "${propertyName}" → "${normalizedSearchName}"`);
      
      let bestMatch: { property: any, score: number } = { property: null, score: 0 };
      
      for (const property of properties) {
        const normalizedPropName = this.normalizePropertyName(property.name);
        const score = this.calculatePropertyScore(normalizedSearchName, normalizedPropName, property);
        
        if (score > bestMatch.score) {
          bestMatch = { property, score };
        }
      }
      
      // Aceitar apenas matches com score > 60
      if (bestMatch.score > 60) {
        console.log(`✅ Propriedade encontrada: ${bestMatch.property.name} (score: ${bestMatch.score})`);
        return bestMatch.property.id;
      } else {
        console.log(`⚠️ Nenhuma propriedade encontrada com score suficiente (melhor: ${bestMatch.score})`);
        return null;
      }
      
    } catch (error) {
      console.error('Erro no matching de propriedade:', error);
      return null;
    }
  }
  
  /**
   * Normaliza nome de propriedade para comparação
   */
  private normalizePropertyName(name: string): string {
    return name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s]/g, "") // Mantém apenas letras, números e espaços
      .trim();
  }
  
  /**
   * Calcula score de similaridade entre propriedades
   */
  private calculatePropertyScore(searchName: string, propertyName: string, property: any): number {
    // Correspondência exata
    if (searchName === propertyName) {
      return 100;
    }
    
    // Casos especiais para Aroeira
    if (searchName.includes('aroeira') && propertyName.includes('aroeira')) {
      const searchNumber = searchName.match(/aroeira\s*(i|ii|iii|iv|1|2|3|4)/i)?.[1];
      const propNumber = propertyName.match(/aroeira\s*(i|ii|iii|iv|1|2|3|4)/i)?.[1];
      
      if (searchNumber && propNumber && searchNumber === propNumber) {
        return 95; // Match quase perfeito para Aroeira com número
      } else if (searchName.includes('aroeira') && propertyName.includes('aroeira')) {
        return 80; // Match parcial para Aroeira
      }
    }
    
    // Correspondência por inclusão
    if (propertyName.includes(searchName) || searchName.includes(propertyName)) {
      const lengthRatio = Math.min(searchName.length, propertyName.length) / 
                         Math.max(searchName.length, propertyName.length);
      return 70 * lengthRatio;
    }
    
    // Correspondência por palavras em comum
    const searchWords = searchName.split(/\s+/);
    const propWords = propertyName.split(/\s+/);
    const commonWords = searchWords.filter(word => propWords.includes(word));
    
    if (commonWords.length > 0) {
      return 40 * (commonWords.length / Math.max(searchWords.length, propWords.length));
    }
    
    return 0;
  }
  
  /**
   * Enriquece dados com informações da propriedade
   */
  private async enrichWithPropertyData(data: ExtractedReservationData, propertyId: number | undefined): Promise<ExtractedReservationData> {
    if (!propertyId) {
      return data;
    }
    
    try {
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return data;
      }
      
      // Calcular taxas baseadas na propriedade
      const totalAmount = Number(data.totalAmount) || 0;
      const platformFee = data.platformFee || 0;
      const cleaningFee = data.cleaningFee || Number(property.cleaningCost) || 0;
      const checkInFee = data.checkInFee || Number(property.checkInFee) || 0;
      const commission = (totalAmount * (Number(property.commission) || 0)) / 100;
      const teamPayment = Number(property.teamPayment) || 0;
      const netAmount = totalAmount - platformFee - commission;
      
      return {
        ...data,
        propertyId,
        cleaningFee,
        checkInFee,
        commission,
        teamPayment
      };
      
    } catch (error) {
      console.error('Erro ao enriquecer dados da propriedade:', error);
      return data;
    }
  }
}

// Instância singleton
export const consolidatedProcessor = new ConsolidatedPDFProcessor();