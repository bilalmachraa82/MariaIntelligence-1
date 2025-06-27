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
  private async parseWithGemini(text: string, attempt: number = 1): Promise<ExtractedReservationData | null> {
    try {
      // Verificar se Gemini está disponível
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY não configurada');
      }
      
      // Preprocess text to extract only relevant reservation data
      const cleanedText = this.extractRelevantData(text);
      
      const prompt = `Extract reservation data from this text and return only JSON:

${cleanedText.substring(0, 2500)}

Format: {"propertyName":"","guestName":"","guestEmail":"","guestPhone":"","checkInDate":"YYYY-MM-DD","checkOutDate":"YYYY-MM-DD","numGuests":0,"platform":"","reference":""}. Omit missing fields.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Gemini API error: ${result.error?.message || 'Unknown error'}`);
      }
      
      // Log da resposta completa para debug
      console.log('🔍 Resposta completa do Gemini:', JSON.stringify(result, null, 2));
      
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        console.log('❌ Erro: Nenhum texto gerado pelo Gemini');
        console.log('📊 Candidatos disponíveis:', result.candidates?.length || 0);
        console.log('🚫 Razão de término:', result.candidates?.[0]?.finishReason);
        
        if (result.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
          console.log(`⚠️ Limite de tokens atingido na tentativa ${attempt}`);
          
          if (attempt >= 3) {
            console.log('❌ Máximo de tentativas atingido - tentando extração manual');
            return this.manualExtraction(text);
          }
          
          // Reduzir significativamente o texto para a próxima tentativa
          const newLength = Math.max(500, Math.floor(text.length / (attempt + 1)));
          console.log(`🔄 Tentativa ${attempt + 1}: reduzindo texto para ${newLength} caracteres`);
          return await this.parseWithGemini(text.substring(0, newLength), attempt + 1);
        }
        
        if (result.candidates?.[0]) {
          console.log('📄 Primeiro candidato:', JSON.stringify(result.candidates[0], null, 2));
        }
        throw new Error('Nenhum conteúdo retornado pelo Gemini');
      }
      
      // Extrair JSON da resposta (completo ou parcial)
      let jsonText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Se não é um JSON válido completo, tentar completar com dados básicos
      if (!jsonText.startsWith('{') || !jsonText.endsWith('}')) {
        // Encontrar apenas a parte JSON
        const jsonStart = jsonText.indexOf('{');
        if (jsonStart !== -1) {
          jsonText = jsonText.substring(jsonStart);
          // Se não termina com }, tentar completar
          if (!jsonText.endsWith('}')) {
            jsonText = jsonText + '"}';
          }
        } else {
          throw new Error('Nenhum JSON encontrado na resposta');
        }
      }
      
      let parsedData;
      try {
        parsedData = JSON.parse(jsonText);
      } catch (parseError) {
        console.log('🔧 Tentando reparar JSON incompleto...');
        // Tentar reparar JSON incompleto
        const repairedJson = this.repairIncompleteJson(jsonText);
        parsedData = JSON.parse(repairedJson);
      }
      
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
   * Extrai apenas dados relevantes de reserva do texto, removendo repetições
   */
  private extractRelevantData(text: string): string {
    const lines = text.split('\n');
    const relevantLines: string[] = [];
    const seenLines = new Set<string>();
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and very short lines
      if (trimmed.length < 3) continue;
      
      // Skip header-type repetitive content
      if (trimmed.includes('Check-in') && trimmed.includes('Check-out') && trimmed.includes('Estado')) continue;
      if (trimmed.includes('Alojamento') && trimmed.includes('Todos')) continue;
      if (trimmed.includes('Edifício') && trimmed.includes('Não mostrar')) continue;
      
      // Focus on lines with actual data - names, emails, phones, dates, references
      const hasEmail = trimmed.includes('@');
      const hasPhone = /\+?\d{9,}/.test(trimmed);
      const hasDate = /\d{2}-\d{2}-\d{4}/.test(trimmed);
      const hasReference = /[A-Z]\d{3}-/.test(trimmed);
      const hasName = /[A-Z][a-z]+\s+[A-Z][a-z]+/.test(trimmed);
      const hasProperty = trimmed.includes('Almada') || trimmed.includes('Aroeira') || trimmed.includes('Nazare');
      
      // Include lines with actual reservation data
      if (hasEmail || hasPhone || hasDate || hasReference || hasName || hasProperty) {
        // Avoid duplicates
        if (!seenLines.has(trimmed)) {
          relevantLines.push(trimmed);
          seenLines.add(trimmed);
        }
      }
    }
    
    const result = relevantLines.slice(0, 50).join('\n'); // Limit to first 50 relevant lines
    console.log(`📝 Texto original: ${text.length} chars → Texto filtrado: ${result.length} chars`);
    return result;
  }

  /**
   * Extração manual usando regex para casos onde AI falha
   */
  private manualExtraction(text: string): any {
    console.log('🔧 Iniciando extração manual por regex...');
    
    const result: any = {};
    
    // Extract property names - melhorado para nomes quebrados em linhas
    const propertyPatterns = [
      // Padrões para nomes quebrados em linhas (como "São João\nBatista T3")
      /São\s+João[\s\n]*Batista\s+T\d/i,
      /Almada[\s\n]*Noronha\s+\d+/i,
      /Casa[\s\n]*dos[\s\n]*Barcos\s+T\d/i,
      // Padrões diretos
      /Peniche\s+\d+\s+K/i,
      /Peniche\s+[A-Z]+\s*\([^\)]*\)/i,
      /Peniche\s+RC\s+[A-Z]/i,
      // Padrões existentes
      /Almada\s+[^\n]+/i,
      /Aroeira\s+[IVX]+/i,
      /Nazaré?\s+T\d/i,
      /EXCITING\s+LISBON\s+[^\n]+/i
    ];
    
    for (const pattern of propertyPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.propertyName = match[0].trim();
        break;
      }
    }
    
    // Extract guest names - melhorado para arquivos de controle
    let guestName = null;
    
    // Primeiro tentar padrão específico para arquivos de controle
    const controlNameMatch = text.match(/([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+(?:\s+[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+)+)\s+\1\s+[\+\d]/);
    if (controlNameMatch) {
      guestName = controlNameMatch[1].trim();
    } else {
      // Fallback para padrão geral
      const nameMatch = text.match(/([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+\s+[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+(?:\s+[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+)?)/);
      if (nameMatch) {
        guestName = nameMatch[1];
      }
    }
    
    if (guestName) {
      // Limpar quebras de linha e espaços extras
      result.guestName = guestName.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    // Extract email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      result.guestEmail = emailMatch[1];
    }
    
    // Extract phone numbers
    const phoneMatch = text.match(/(\+\d{1,3}\s?\d{8,})/);
    if (phoneMatch) {
      result.guestPhone = phoneMatch[1];
    }
    
    // Extract dates (DD-MM-YYYY format)
    const dateMatches = text.match(/(\d{2}-\d{2}-\d{4})/g);
    if (dateMatches && dateMatches.length >= 2) {
      const date1 = this.convertDate(dateMatches[0]);
      const date2 = this.convertDate(dateMatches[1]);
      
      // Assign earlier date as check-in, later as check-out
      if (new Date(date1) <= new Date(date2)) {
        result.checkInDate = date1;
        result.checkOutDate = date2;
      } else {
        result.checkInDate = date2;
        result.checkOutDate = date1;
      }
    }
    
    // Extract reference
    const refMatch = text.match(/([A-Z]\d{3}-[A-Z0-9]+)/);
    if (refMatch) {
      result.reference = refMatch[1];
    }
    
    // Extract number of guests (look for adult count)
    const guestMatch = text.match(/(\d+)\s*(?:Adult|Adul)/i);
    if (guestMatch) {
      result.numGuests = parseInt(guestMatch[1]);
    }
    
    console.log('✅ Extração manual concluída:', result);
    return result;
  }

  /**
   * Converte data de DD-MM-YYYY para YYYY-MM-DD
   */
  private convertDate(dateStr: string): string {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  }

  /**
   * Repara JSON incompleto truncado pelo limite de tokens
   */
  private repairIncompleteJson(jsonText: string): string {
    let cleaned = jsonText.trim();
    console.log('🔧 JSON original:', cleaned);
    
    // Remove trailing commas
    if (cleaned.endsWith(',')) {
      cleaned = cleaned.slice(0, -1);
    }
    
    // Handle incomplete string at the end
    if (cleaned.endsWith('",')) {
      // Remove trailing comma after incomplete string
      cleaned = cleaned.slice(0, -1);
    } else if (cleaned.endsWith('"')) {
      // If ends with quote but might be incomplete key-value
      const lastColonIndex = cleaned.lastIndexOf(':');
      const lastQuoteIndex = cleaned.lastIndexOf('"');
      
      // If there's a colon after the last quote, it's likely an incomplete value
      if (lastColonIndex > lastQuoteIndex) {
        cleaned = cleaned + '""';
      }
    } else if (cleaned.endsWith(':')) {
      // Incomplete key-value pair
      cleaned = cleaned + '""';
    } else if (!cleaned.endsWith('}') && !cleaned.endsWith(']')) {
      // Incomplete structure - try to determine what to close
      let openBraces = 0;
      let openBrackets = 0;
      
      for (const char of cleaned) {
        if (char === '{') openBraces++;
        if (char === '}') openBraces--;
        if (char === '[') openBrackets++;
        if (char === ']') openBrackets--;
      }
      
      // Close any incomplete strings first
      const lastQuote = cleaned.lastIndexOf('"');
      const secondLastQuote = cleaned.lastIndexOf('"', lastQuote - 1);
      
      // If odd number of quotes, we have an incomplete string
      const quoteCount = (cleaned.match(/"/g) || []).length;
      if (quoteCount % 2 === 1) {
        cleaned += '"';
      }
      
      // Close braces and brackets
      while (openBraces > 0) {
        cleaned += '}';
        openBraces--;
      }
      while (openBrackets > 0) {
        cleaned += ']';
        openBrackets--;
      }
    }
    
    console.log('🔧 JSON reparado:', cleaned);
    return cleaned;
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