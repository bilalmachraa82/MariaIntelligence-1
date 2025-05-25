/**
 * Processador Gemini 2.5 Flash para múltiplas reservas
 * Identifica automaticamente todos os cenários de PDF e extrai dados estruturados
 */

import fs from 'fs';
import pdf from 'pdf-parse';
import { storage } from '../storage';
import { GeminiService } from './gemini.service';

interface ProcessedReservation {
  reference: string;
  propertyName: string;
  propertyId?: number;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  adults?: number;
  children?: number;
  totalAmount?: number;
  platform: string;
  status: string;
  notes: string;
  country?: string;
  missing?: string[];
}

interface ProcessingResult {
  success: boolean;
  reservations: ProcessedReservation[];
  documentType: 'checkin' | 'checkout' | 'control' | 'mixed' | 'unknown';
  scenario: string;
  confidence: number;
  missingData?: string[];
  requiresConfirmation: boolean;
  rawText?: string;
  errors?: string[];
}

/**
 * Processa PDF com múltiplas reservas usando Gemini 2.5 Flash
 */
export async function processMultiReservationPDF(filePath: string): Promise<ProcessingResult> {
  try {
    console.log('🤖 Iniciando processamento com Gemini 2.5 Flash...');
    
    // Extrair texto do PDF
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(pdfBuffer);
    const extractedText = pdfData.text;
    
    // Detectar cenário do documento
    const scenario = detectDocumentScenario(extractedText);
    console.log(`📋 Cenário detectado: ${scenario.type} - ${scenario.description}`);
    
    // Processar com Gemini 2.5 Flash
    const geminiService = new GeminiService();
    const analysisResult = await (geminiService as any).analyzeMultiReservationDocument(
      extractedText,
      scenario
    );
    
    if (!analysisResult.success) {
      return {
        success: false,
        reservations: [],
        documentType: 'unknown',
        scenario: scenario.description,
        confidence: 0,
        requiresConfirmation: false,
        errors: ['Falha na análise do Gemini']
      };
    }
    
    // Converter para formato do sistema e validar
    const processedReservations = await processGeminiResults(
      analysisResult.reservations,
      scenario.type
    );
    
    // Calcular confiança e identificar dados em falta
    const validation = validateReservations(processedReservations);
    
    return {
      success: true,
      reservations: processedReservations,
      documentType: scenario.type,
      scenario: scenario.description,
      confidence: validation.confidence,
      missingData: validation.missingData,
      requiresConfirmation: validation.requiresConfirmation,
      rawText: extractedText
    };
    
  } catch (error) {
    console.error('❌ Erro no processamento Gemini:', error);
    return {
      success: false,
      reservations: [],
      documentType: 'unknown',
      scenario: 'Erro no processamento',
      confidence: 0,
      requiresConfirmation: false,
      errors: [error instanceof Error ? error.message : 'Erro desconhecido']
    };
  }
}

/**
 * Detecta o cenário/tipo do documento baseado no conteúdo
 */
function detectDocumentScenario(text: string): {
  type: 'checkin' | 'checkout' | 'control' | 'mixed' | 'unknown';
  description: string;
  characteristics: string[];
} {
  const lowerText = text.toLowerCase();
  const characteristics = [];
  
  // Características detectadas
  if (lowerText.includes('entradas')) characteristics.push('check-in');
  if (lowerText.includes('saídas')) characteristics.push('check-out');
  if (lowerText.includes('controlo')) characteristics.push('controle');
  if (lowerText.includes('aroeira')) characteristics.push('aroeira');
  if (lowerText.includes('exciting lisbon')) characteristics.push('exciting-lisbon');
  if (lowerText.includes('referência')) characteristics.push('tabular');
  if (lowerText.includes('alojamento')) characteristics.push('multi-property');
  
  // Determinar tipo principal
  if (lowerText.includes('entradas') && !lowerText.includes('saídas')) {
    return {
      type: 'checkin',
      description: 'PDF de Check-in (Entradas) - Formato tabular',
      characteristics
    };
  }
  
  if (lowerText.includes('saídas') && !lowerText.includes('entradas')) {
    return {
      type: 'checkout', 
      description: 'PDF de Check-out (Saídas) - Formato tabular',
      characteristics
    };
  }
  
  if (lowerText.includes('entradas') && lowerText.includes('saídas')) {
    return {
      type: 'mixed',
      description: 'PDF Misto - Check-in e Check-out no mesmo documento',
      characteristics
    };
  }
  
  if (lowerText.includes('controlo') || lowerText.includes('aroeira')) {
    return {
      type: 'control',
      description: 'Arquivo de Controle - Propriedade específica',
      characteristics
    };
  }
  
  return {
    type: 'unknown',
    description: 'Formato não reconhecido',
    characteristics
  };
}

/**
 * Processa resultados do Gemini e converte para formato do sistema
 */
async function processGeminiResults(
  geminiReservations: any[],
  documentType: string
): Promise<ProcessedReservation[]> {
  const processed: ProcessedReservation[] = [];
  
  for (const reservation of geminiReservations) {
    try {
      // Encontrar ID da propriedade
      const propertyId = await findPropertyIdByName(reservation.propertyName);
      
      const processedReservation: ProcessedReservation = {
        reference: reservation.reference || '',
        propertyName: reservation.propertyName || '',
        propertyId,
        guestName: reservation.guestName || '',
        guestPhone: reservation.guestPhone || '',
        guestEmail: reservation.guestEmail || '',
        checkInDate: formatDate(reservation.checkInDate),
        checkOutDate: formatDate(reservation.checkOutDate),
        numGuests: (reservation.adults || 0) + (reservation.children || 0),
        adults: reservation.adults || 0,
        children: reservation.children || 0,
        totalAmount: reservation.totalAmount || 0,
        platform: reservation.platform || 'manual',
        status: reservation.status || 'confirmed',
        notes: `Extraído via Gemini 2.5 Flash - ${documentType} (${new Date().toLocaleDateString()})`,
        country: reservation.country || ''
      };
      
      // Identificar dados em falta
      const missing = [];
      if (!processedReservation.propertyId) missing.push('Propriedade não identificada');
      if (!processedReservation.guestPhone) missing.push('Telefone');
      if (!processedReservation.guestEmail) missing.push('Email');
      if (!processedReservation.totalAmount) missing.push('Valor da reserva');
      if (!processedReservation.checkInDate) missing.push('Data de check-in');
      if (!processedReservation.checkOutDate) missing.push('Data de check-out');
      
      if (missing.length > 0) {
        processedReservation.missing = missing;
      }
      
      processed.push(processedReservation);
      
    } catch (error) {
      console.error('Erro ao processar reserva:', error);
    }
  }
  
  return processed;
}

/**
 * Valida reservas processadas e calcula métricas
 */
function validateReservations(reservations: ProcessedReservation[]): {
  confidence: number;
  missingData: string[];
  requiresConfirmation: boolean;
} {
  let totalFields = 0;
  let validFields = 0;
  const allMissingData = new Set<string>();
  
  for (const reservation of reservations) {
    // Campos obrigatórios
    const requiredFields = [
      'reference', 'propertyName', 'guestName', 'checkInDate', 'checkOutDate'
    ];
    
    // Campos opcionais mas importantes
    const optionalFields = [
      'guestPhone', 'guestEmail', 'totalAmount', 'propertyId'
    ];
    
    totalFields += requiredFields.length + optionalFields.length;
    
    // Contar campos válidos
    requiredFields.forEach(field => {
      if (reservation[field] && reservation[field] !== '') {
        validFields++;
      }
    });
    
    optionalFields.forEach(field => {
      if (reservation[field] && reservation[field] !== '' && reservation[field] !== 0) {
        validFields++;
      }
    });
    
    // Coletar dados em falta
    if (reservation.missing) {
      reservation.missing.forEach(missing => allMissingData.add(missing));
    }
  }
  
  const confidence = totalFields > 0 ? (validFields / totalFields) * 100 : 0;
  const missingData = Array.from(allMissingData);
  const requiresConfirmation = confidence < 80 || missingData.length > 0;
  
  return {
    confidence: Math.round(confidence),
    missingData,
    requiresConfirmation
  };
}

/**
 * Encontra ID da propriedade por nome
 */
async function findPropertyIdByName(propertyName: string): Promise<number | undefined> {
  try {
    if (!propertyName) return undefined;
    
    const properties = await storage.getProperties();
    const normalizedName = normalizePropertyName(propertyName);
    
    for (const property of properties) {
      const normalizedPropertyName = normalizePropertyName(property.name);
      
      // Correspondência exata
      if (normalizedPropertyName === normalizedName) {
        return property.id;
      }
      
      // Correspondência parcial
      if (normalizedPropertyName.includes(normalizedName) || 
          normalizedName.includes(normalizedPropertyName)) {
        return property.id;
      }
      
      // Correspondências especiais para formatos comuns
      if (checkSpecialMatches(normalizedName, normalizedPropertyName)) {
        return property.id;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error('Erro ao buscar propriedade:', error);
    return undefined;
  }
}

/**
 * Normaliza nome da propriedade para comparação
 */
function normalizePropertyName(name: string): string {
  return name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
}

/**
 * Verifica correspondências especiais
 */
function checkSpecialMatches(name1: string, name2: string): boolean {
  // Aroeira com numeração romana
  if (name1.includes('aroeira') && name2.includes('aroeira')) {
    const num1 = name1.match(/aroeira\s*(i|ii|iii|iv|1|2|3|4)/)?.[1];
    const num2 = name2.match(/aroeira\s*(i|ii|iii|iv|1|2|3|4)/)?.[1];
    if (num1 && num2) {
      return normalizeRomanNumeral(num1) === normalizeRomanNumeral(num2);
    }
  }
  
  return false;
}

/**
 * Normaliza numeração romana
 */
function normalizeRomanNumeral(num: string): string {
  const mapping = { '1': 'i', '2': 'ii', '3': 'iii', '4': 'iv' };
  return mapping[num] || num.toLowerCase();
}

/**
 * Formata data para formato YYYY-MM-DD
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Formato DD-MM-YYYY para YYYY-MM-DD
  if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  }
  
  // Já está no formato correto
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  return dateStr;
}