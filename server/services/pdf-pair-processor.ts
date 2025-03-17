/**
 * Serviço para processamento de pares de PDFs de check-in e check-out
 * Identifica o tipo de cada documento e combina as informações para
 * extrair todos os detalhes da reserva
 */

import fs from 'fs';
import path from 'path';
import { extractTextWithPdfParse, parseReservationFromText, ValidationResult, validateReservationData, ExtractedReservationData } from './pdf-extract';
import { log } from '../vite';

export enum DocumentType {
  CHECK_IN = 'check-in',
  CHECK_OUT = 'check-out',
  UNKNOWN = 'unknown'
}

export interface DocumentInfo {
  path: string;
  type: DocumentType;
  text: string;
  filename: string;
}

export interface PairProcessingResult {
  checkIn?: DocumentInfo;
  checkOut?: DocumentInfo;
  isPairComplete: boolean;
  reservationData?: ExtractedReservationData;
  validationResult?: ValidationResult;
  errors: string[];
}

/**
 * Identifica o tipo de documento com base no nome e conteúdo
 * @param filePath Caminho completo do arquivo
 * @returns Informações do documento incluindo tipo e texto extraído
 */
export async function identifyDocumentType(filePath: string): Promise<DocumentInfo> {
  // Inicializar com valores padrão
  const result: DocumentInfo = {
    path: filePath,
    type: DocumentType.UNKNOWN,
    text: '',
    filename: path.basename(filePath)
  };
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      log(`Arquivo não encontrado: ${filePath}`, 'pdf-pair');
      return result;
    }
    
    // Ler o arquivo
    const pdfBuffer = fs.readFileSync(filePath);
    log(`PDF carregado: ${result.filename} (${Math.round(pdfBuffer.length / 1024)} KB)`, 'pdf-pair');
    
    // Extrair texto
    const extractedText = await extractTextWithPdfParse(pdfBuffer);
    result.text = extractedText;
    
    // Normalizar texto para comparação
    const normalizedText = extractedText.toLowerCase();
    const filename = filePath.toLowerCase();
    
    // 1. Determinar pelo nome do arquivo (método mais confiável)
    if (filename.includes('check-in') || filename.includes('checkin')) {
      result.type = DocumentType.CHECK_IN;
    } else if (filename.includes('check-out') || filename.includes('checkout') || 
               filename.includes('check-outs') || filename.includes('checkouts')) {
      result.type = DocumentType.CHECK_OUT;
    }
    
    // 2. Se não conseguimos determinar pelo nome, analisar o conteúdo
    if (result.type === DocumentType.UNKNOWN) {
      // Contagem de ocorrências de palavras-chave específicas
      const checkInCount = (normalizedText.match(/check-in|checkin|check in/g) || []).length;
      const checkOutCount = (normalizedText.match(/check-out|checkout|check out/g) || []).length;
      
      if (checkInCount > checkOutCount) {
        result.type = DocumentType.CHECK_IN;
      } else if (checkOutCount > checkInCount) {
        result.type = DocumentType.CHECK_OUT;
      } else {
        // Se as contagens forem iguais, verificar contexto específico
        if (normalizedText.includes('departure') || normalizedText.includes('saída')) {
          result.type = DocumentType.CHECK_OUT;
        } else if (normalizedText.includes('arrival') || normalizedText.includes('chegada')) {
          result.type = DocumentType.CHECK_IN;
        }
      }
    }
    
    log(`Documento identificado como: ${result.type}`, 'pdf-pair');
    return result;
  } catch (error: any) {
    log(`Erro ao identificar tipo de documento: ${error.message}`, 'pdf-pair');
    return result;
  }
}

/**
 * Processa um par de PDFs de check-in e check-out para extrair informações
 * completas da reserva. Se apenas um documento estiver disponível, 
 * processa com as informações parciais.
 * 
 * @param files Lista de caminhos para os arquivos PDF
 * @param apiKey Chave da API Mistral para processamento de texto
 * @returns Resultado do processamento com informações da reserva
 */
export async function processPdfPair(
  files: string[], 
  apiKey: string
): Promise<PairProcessingResult> {
  log(`Iniciando processamento de ${files.length} arquivos`, 'pdf-pair');
  
  const result: PairProcessingResult = {
    isPairComplete: false,
    errors: []
  };
  
  try {
    // Fase 1: Identificar os documentos
    const documents: DocumentInfo[] = [];
    
    for (const filePath of files) {
      const docInfo = await identifyDocumentType(filePath);
      if (docInfo.type !== DocumentType.UNKNOWN) {
        documents.push(docInfo);
      } else {
        result.errors.push(`Não foi possível identificar o tipo do documento: ${path.basename(filePath)}`);
      }
    }
    
    // Fase 2: Separar em check-in e check-out
    result.checkIn = documents.find(doc => doc.type === DocumentType.CHECK_IN);
    result.checkOut = documents.find(doc => doc.type === DocumentType.CHECK_OUT);
    
    // Verificar se temos um par completo
    result.isPairComplete = !!result.checkIn && !!result.checkOut;
    
    if (!result.checkIn && !result.checkOut) {
      result.errors.push('Nenhum documento válido de check-in ou check-out encontrado');
      return result;
    }
    
    // Fase 3: Extrair informações da reserva
    // Preferimos usar o check-in para dados básicos da reserva
    const primaryDoc = result.checkIn || result.checkOut;
    
    if (!primaryDoc) {
      result.errors.push('Erro interno: documento primário não encontrado');
      return result;
    }
    
    // Processar o texto para extrair informações estruturadas
    log(`Processando texto do documento: ${primaryDoc.filename}`, 'pdf-pair');
    result.reservationData = await parseReservationFromText(primaryDoc.text, apiKey);
    
    // Adicionar informação sobre o tipo de documento processado
    if (result.reservationData) {
      result.reservationData.documentType = primaryDoc.type;
    }
    
    // Fase 4: Validar os dados extraídos
    if (result.reservationData) {
      result.validationResult = validateReservationData(result.reservationData);
      
      // Adicionar informações sobre a validação
      if (result.validationResult) {
        log(`Validação concluída: ${result.validationResult.status}`, 'pdf-pair');
        
        if (result.validationResult.missingFields.length > 0) {
          log(`Campos ausentes: ${result.validationResult.missingFields.join(', ')}`, 'pdf-pair');
        }
      }
    }
    
    return result;
  } catch (error: any) {
    log(`Erro ao processar par de PDFs: ${error.message}`, 'pdf-pair');
    result.errors.push(`Erro durante o processamento: ${error.message}`);
    return result;
  }
}