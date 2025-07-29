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
 * Processa um ou dois PDFs para extrair informações de reserva.
 * 
 * Comportamento:
 * - Com um arquivo: extrai os dados básicos da reserva do documento
 * - Com dois arquivos: identifica check-in e check-out, combinando informações de ambos
 *   para criar uma visão mais completa da reserva
 * 
 * Quando dois documentos estão presentes, tenta identificá-los automaticamente por
 * conteúdo e nome, e caso falhe, atribui o primeiro como check-in e o segundo como check-out.
 * 
 * @param files Lista de caminhos para os arquivos PDF (um ou dois arquivos)
 * @param apiKey Chave da API Gemini para processamento de texto
 * @returns Resultado do processamento com informações da reserva
 */
export async function processPdfPair(
  files: string[], 
  apiKey: string
): Promise<PairProcessingResult> {
  // Verifica se temos arquivos para processar
  if (!files || files.length === 0) {
    return {
      isPairComplete: false,
      errors: ['Nenhum arquivo fornecido para processamento']
    };
  }
  
  log(`Iniciando processamento de ${files.length} arquivo(s)`, 'pdf-pair');
  
  const result: PairProcessingResult = {
    isPairComplete: false,
    errors: []
  };
  
  try {
    // Fase 1: Identificar os documentos
    const documents: DocumentInfo[] = [];
    
    for (const filePath of files) {
      const docInfo = await identifyDocumentType(filePath);
      documents.push(docInfo); // Incluímos todos, mesmo os não identificados
    }
    
    // Fase 2: Separar em check-in e check-out
    // Primeiro, tentamos usar a identificação automática
    let checkInDoc = documents.find(doc => doc.type === DocumentType.CHECK_IN);
    let checkOutDoc = documents.find(doc => doc.type === DocumentType.CHECK_OUT);
    
    // Se temos dois documentos, mas não foram identificados corretamente como par,
    // vamos forçar a identificação para que sempre tenhamos um par completo
    if (documents.length === 2) {
      if (!checkInDoc && !checkOutDoc) {
        // Nenhum foi identificado, então definimos o primeiro como check-in e o segundo como check-out
        documents[0].type = DocumentType.CHECK_IN;
        documents[1].type = DocumentType.CHECK_OUT;
        checkInDoc = documents[0];
        checkOutDoc = documents[1];
        log('Forçando identificação: primeiro arquivo como check-in, segundo como check-out', 'pdf-pair');
      } 
      else if (checkInDoc && !checkOutDoc) {
        // Apenas check-in foi identificado, então o outro é check-out
        const otherDoc = documents.find(doc => doc !== checkInDoc);
        if (otherDoc) {
          otherDoc.type = DocumentType.CHECK_OUT;
          checkOutDoc = otherDoc;
          log('Forçando identificação: segundo arquivo como check-out', 'pdf-pair');
        }
      } 
      else if (!checkInDoc && checkOutDoc) {
        // Apenas check-out foi identificado, então o outro é check-in
        const otherDoc = documents.find(doc => doc !== checkOutDoc);
        if (otherDoc) {
          otherDoc.type = DocumentType.CHECK_IN;
          checkInDoc = otherDoc;
          log('Forçando identificação: primeiro arquivo como check-in', 'pdf-pair');
        }
      }
      else if (checkInDoc && checkOutDoc && checkInDoc === checkOutDoc) {
        // O mesmo documento foi identificado como ambos, o que não deveria acontecer
        // Neste caso, o primeiro é check-in e o segundo é check-out
        documents[0].type = DocumentType.CHECK_IN;
        documents[1].type = DocumentType.CHECK_OUT;
        checkInDoc = documents[0];
        checkOutDoc = documents[1];
        log('Corrigindo identificação conflitante: primeiro arquivo como check-in, segundo como check-out', 'pdf-pair');
      }
    }
    
    result.checkIn = checkInDoc;
    result.checkOut = checkOutDoc;
    
    // Verificar se temos um par completo
    result.isPairComplete = !!result.checkIn && !!result.checkOut;
    
    if (result.isPairComplete) {
      log('Par completo de documentos identificado (check-in + check-out)', 'pdf-pair');
    } else if (result.checkIn) {
      log('Apenas documento de check-in identificado', 'pdf-pair');
    } else if (result.checkOut) {
      log('Apenas documento de check-out identificado', 'pdf-pair');
    } else {
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
      
      // Se temos ambos os documentos, podemos enriquecer os dados com informações do segundo documento
      if (result.isPairComplete && result.checkOut && result.checkIn !== result.checkOut) {
        try {
          // Extrair informações adicionais do documento de check-out, se necessário
          // Isso pode ser usado para complementar dados ausentes no documento primário
          const secondaryData = await parseReservationFromText(result.checkOut.text, apiKey);
          
          if (secondaryData) {
            // Preencher campos ausentes no documento primário com dados do secundário
            for (const key in secondaryData) {
              if (!result.reservationData[key] && secondaryData[key]) {
                result.reservationData[key] = secondaryData[key];
                log(`Campo '${key}' preenchido com dados do documento secundário`, 'pdf-pair');
              }
            }
          }
        } catch (error) {
          log(`Erro ao processar documento secundário: ${error.message}`, 'pdf-pair');
          // Não interrompe o processamento principal
        }
      }
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