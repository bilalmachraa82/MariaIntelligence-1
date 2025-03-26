/**
 * Serviço de extração de texto de PDF
 * Fornece funcionalidades para processar PDFs e extrair texto
 * Implementa estratégias alternativas quando a visão do Mistral não está disponível
 * Inclui validação para dados ausentes ou incompletos
 */

import fs from 'fs';
import { Mistral } from '@mistralai/mistralai';
import { log } from '../vite';
import pdfParse from 'pdf-parse';

/**
 * Interface para dados extraídos
 * Campos marcados como obrigatórios são essenciais
 * para o funcionamento do sistema
 */
export interface ExtractedReservationData {
  propertyId?: number;
  propertyName: string;          // Obrigatório
  guestName: string;             // Obrigatório
  guestEmail?: string;           // Opcional
  guestPhone?: string;           // Opcional
  checkInDate: string;           // Obrigatório
  checkOutDate: string;          // Obrigatório
  numGuests?: number;            // Opcional
  totalAmount?: number;          // Opcional
  platform?: string;             // Opcional
  platformFee?: number;          // Opcional
  cleaningFee?: number;          // Opcional
  checkInFee?: number;           // Opcional
  commissionFee?: number;        // Opcional
  teamPayment?: number;          // Opcional
  rawText?: string;              // Texto bruto extraído
  documentType?: string;         // Tipo de documento (reserva, fatura, etc.)
  observations?: string;         // Observações adicionais
  validationStatus?: ValidationStatus; // Status de validação
}

/**
 * Enum para status de validação
 */
export enum ValidationStatus {
  VALID = 'valid',               // Todos os campos obrigatórios presentes
  INCOMPLETE = 'incomplete',     // Faltam alguns campos obrigatórios
  NEEDS_REVIEW = 'needs_review', // Tem informações mas precisa de revisão manual
  FAILED = 'failed'              // Falha na extração ou validação
}

/**
 * Interface para erros de validação
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Interface para resultado da validação
 */
export interface ValidationResult {
  status: ValidationStatus;
  isValid: boolean;
  errors: ValidationError[];
  missingFields: string[];
  warningFields: string[];
  dataWithDefaults: ExtractedReservationData;
}

/**
 * Tenta extrair texto de um PDF usando o cliente Mistral AI
 * Esta função é mantida para compatibilidade com o código existente
 * Na implementação atual, sempre retorna um erro 'VISION_MODEL_UNAVAILABLE'
 * para que o fluxo use o método alternativo (pdf-parse)
 * 
 * @param pdfBase64 PDF em base64
 * @param apiKey Chave API do Mistral
 */
export async function extractTextFromPdfWithMistral(pdfBase64: string, apiKey: string): Promise<string> {
  log('Tentando extrair texto com Mistral Vision...', 'pdf-extract');
  throw new Error('VISION_MODEL_UNAVAILABLE');
}

/**
 * Extrai texto de um PDF usando pdf-parse
 * Método alternativo quando o modelo vision não está disponível
 * @param pdfBuffer Buffer do PDF
 */
export async function extractTextWithPdfParse(pdfBuffer: Buffer): Promise<string> {
  try {
    log('Extraindo texto do PDF com pdf-parse...', 'pdf-extract');
    
    // Configuração para melhorar a performance
    const options = {
      max: 0 // Sem limite de páginas
    };
    
    // Fazer o parsing do PDF
    const data = await pdfParse(pdfBuffer, options);
    
    // Verificar se temos texto
    if (!data || !data.text || data.text.trim() === '') {
      throw new Error('Texto extraído está vazio');
    }
    
    log(`Texto extraído com sucesso (${data.text.length} caracteres)`, 'pdf-extract');
    return data.text;
  } catch (error: any) {
    log(`Erro ao extrair texto com pdf-parse: ${error.message}`, 'pdf-extract');
    throw error;
  }
}

/**
 * Processa texto já extraído para obter informações estruturadas de reserva
 * @param text Texto extraído do documento
 * @param apiKey Chave API do Mistral
 * @param timeout Tempo limite em milissegundos (padrão: 25 segundos)
 */
export async function parseReservationFromText(
  text: string, 
  apiKey: string, 
  timeout: number = 25000,
  options: { skipQualityCheck?: boolean; useCache?: boolean } = {}
): Promise<ExtractedReservationData> {
  const { skipQualityCheck = false, useCache = false } = options;
  // Criar uma promessa com timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Tempo limite excedido ao processar texto')), timeout);
  });
  
  try {
    log('Analisando texto para extrair dados de reserva...', 'pdf-extract');
    
    // Função principal de processamento
    const processingPromise = async (): Promise<ExtractedReservationData> => {
      try {
        // Limitar o texto para evitar problemas com tokens muito longos
        const limitedText = text.slice(0, 5000);
        
        // Limpar e normalizar o texto
        const cleanedText = cleanExtractedText(limitedText);
        
        // Inicializar cliente Mistral
        const client = new Mistral({ apiKey });
        
        // Preparar a requisição para o modelo Mistral (tiny é o mais confiável para function calling)
        log(`Usando modelo mistral-tiny para processamento (skipQualityCheck: ${skipQualityCheck})`, 'pdf-extract');
        
        // Adicionar instruções específicas se skipQualityCheck estiver ativado
        const systemContent = skipQualityCheck 
          ? `Você é um assistente especializado em extrair informações estruturadas de documentos de reservas de alojamento local.
             Sua tarefa é analisar o texto extraído de um PDF e identificar as informações relevantes da reserva.
             Extraia todos os dados solicitados quando disponíveis. Se um dado não estiver explícito no texto, faça uma suposição razoável.
             Priorize velocidade e preenchimento de todos os campos solicitados, mesmo que com aproximações ou suposições razoáveis.
             Retorne os valores nos formatos especificados.`
          : `Você é um assistente especializado em extrair informações estruturadas de documentos de reservas de alojamento local.
             Sua tarefa é analisar o texto extraído de um PDF e identificar as informações relevantes da reserva.
             Extraia todos os dados solicitados quando disponíveis. Se um dado não estiver explícito no texto, não invente.
             Use apenas o que está claramente indicado no documento. Retorne os valores nos formatos especificados.`;
        
        const response = await client.chat.complete({
          model: "mistral-tiny",
          messages: [
            {
              role: "system",
              content: systemContent
            },
            {
              role: "user",
              content: `Extraia os detalhes da reserva deste texto:\n\n${cleanedText}`
            }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extractReservationData",
                description: "Extrair dados estruturados de uma reserva a partir do texto",
                parameters: {
                  type: "object",
                  properties: {
                    documentType: {
                      type: "string",
                      description: "Tipo de documento (reserva, check-in, fatura, etc.)"
                    },
                    propertyName: {
                      type: "string",
                      description: "Nome da propriedade"
                    },
                    guestName: {
                      type: "string",
                      description: "Nome completo do hóspede"
                    },
                    guestEmail: {
                      type: "string",
                      description: "Email do hóspede (se disponível)"
                    },
                    guestPhone: {
                      type: "string",
                      description: "Telefone do hóspede (se disponível)"
                    },
                    checkInDate: {
                      type: "string",
                      description: "Data de check-in no formato YYYY-MM-DD"
                    },
                    checkOutDate: {
                      type: "string",
                      description: "Data de check-out no formato YYYY-MM-DD"
                    },
                    numGuests: {
                      type: "integer",
                      description: "Número de hóspedes"
                    },
                    totalAmount: {
                      type: "number",
                      description: "Valor total da reserva"
                    },
                    platform: {
                      type: "string",
                      description: "Plataforma de reserva (Airbnb, Booking, etc.)"
                    },
                    cleaningFee: {
                      type: "number",
                      description: "Taxa de limpeza (se disponível)"
                    },
                    checkInFee: {
                      type: "number",
                      description: "Taxa de check-in (se disponível)"
                    },
                    commissionFee: {
                      type: "number",
                      description: "Taxa de comissão (se disponível)"
                    },
                    teamPayment: {
                      type: "number",
                      description: "Pagamento à equipe (se disponível)"
                    },
                    platformFee: {
                      type: "number",
                      description: "Taxa da plataforma (se disponível)"
                    },
                    observations: {
                      type: "string",
                      description: "Observações adicionais ou notas relevantes"
                    }
                  },
                  required: ["propertyName", "guestName", "checkInDate", "checkOutDate"]
                }
              }
            }
          ],
          toolChoice: { type: "function", function: { name: "extractReservationData" } },
          temperature: 0.1,
          maxTokens: 1500 // Reduzir tokens para processamento mais rápido
        });
        
        // Extrair os dados da resposta
        log('Resposta recebida da API Mistral, processando...', 'pdf-extract');
        if (response && 
            response.choices && 
            response.choices[0] && 
            response.choices[0].message && 
            response.choices[0].message.toolCalls && 
            response.choices[0].message.toolCalls.length > 0) {
          
          const toolCall = response.choices[0].message.toolCalls[0];
          
          if (toolCall.function && toolCall.function.arguments) {
            // Parse JSON da resposta
            const functionArgs = toolCall.function.arguments;
            const argsString = typeof functionArgs === 'string' 
              ? functionArgs
              : JSON.stringify(functionArgs);
              
            const extractedData = JSON.parse(argsString);
            
            // Adicionar o texto bruto para referência
            extractedData.rawText = text;
            
            // Remover campos vazios ou undefined
            for (const key in extractedData) {
              if (extractedData[key] === undefined || extractedData[key] === null || extractedData[key] === '') {
                delete extractedData[key];
              }
            }
            
            log('Dados extraídos com sucesso', 'pdf-extract');
            
            return extractedData as ExtractedReservationData;
          } else {
            throw new Error('Resposta do Mistral não contém argumentos válidos');
          }
        } else {
          throw new Error('Resposta do Mistral não contém toolCalls');
        }
      } catch (error) {
        console.error('Erro ao extrair dados de reserva:', error);
        log(`Falha na API Mistral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'pdf-extract');
        
        // Verificar se é um erro de serviço indisponível
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        const isServiceUnavailable = errorMessage.includes('Service unavailable') || 
                                    errorMessage.includes('500') ||
                                    errorMessage.includes('internal_server_error');
        
        // Em caso de erro, retornar objeto vazio com status de falha
        return {
          propertyName: 'Desconhecido',
          guestName: 'Desconhecido',
          checkInDate: 'Desconhecido',
          checkOutDate: 'Desconhecido',
          validationStatus: ValidationStatus.FAILED,
          rawText: text,
          observations: isServiceUnavailable
            ? 'Serviço Mistral temporariamente indisponível. Tente novamente mais tarde.'
            : `Erro na extração: ${errorMessage}`
        };
      }
    };
    
    // Executar a promessa principal com um limite de tempo
    return await Promise.race([processingPromise(), timeoutPromise]) as ExtractedReservationData;
  } catch (error) {
    log(`Erro ao processar texto: ${error instanceof Error ? error.message : String(error)}`, 'pdf-extract');
    
    // Verificar se o erro foi de timeout
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const isTimeout = errorMessage.includes('Tempo limite excedido');
    const isServiceError = errorMessage.includes('Service unavailable') || 
                           errorMessage.includes('500') ||
                           errorMessage.includes('internal_server_error');
    
    // Em caso de erro, retornar objeto vazio com status de falha
    return {
      propertyName: 'Desconhecido',
      guestName: 'Desconhecido',
      checkInDate: 'Desconhecido',
      checkOutDate: 'Desconhecido',
      validationStatus: ValidationStatus.FAILED,
      rawText: text,
      observations: isTimeout 
        ? 'O processamento demorou muito tempo e foi interrompido. Por favor, tente novamente mais tarde.' 
        : isServiceError
          ? 'Serviço Mistral temporariamente indisponível. Por favor, tente novamente mais tarde.'
          : `Erro na extração: ${errorMessage}`
    };
  }
}

/**
 * Limpa e normaliza o texto extraído para melhorar o processamento
 * @param text Texto bruto extraído do PDF
 */
function cleanExtractedText(text: string): string {
  // Remover caracteres de controle e espaços em branco excessivos
  let cleaned = text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Melhorar formatação para processamento
  cleaned = cleaned.replace(/(\d+)[.,](\d+)[.,](\d+)/g, '$1-$2-$3'); // Normalizar datas
  cleaned = cleaned.replace(/(\d+)[,.](\d+)(?!\d)/g, '$1.$2'); // Normalizar números decimais
  
  return cleaned;
}

/**
 * Valida os dados extraídos e preenche valores padrão para campos ausentes
 * @param data Dados extraídos do PDF
 * @returns Resultado da validação
 */
export function validateReservationData(data: ExtractedReservationData): ValidationResult {
  const requiredFields = ['propertyName', 'guestName', 'checkInDate', 'checkOutDate'];
  const financialFields = ['totalAmount', 'cleaningFee', 'checkInFee'];
  const contactFields = ['guestEmail', 'guestPhone'];
  
  const missingFields: string[] = [];
  const warningFields: string[] = [];
  const errors: ValidationError[] = [];
  
  // Verificar campos obrigatórios
  for (const field of requiredFields) {
    if (!data[field as keyof ExtractedReservationData]) {
      missingFields.push(field);
      errors.push({
        field,
        message: `Campo obrigatório ${field} está ausente`,
        severity: 'error'
      });
    }
  }
  
  // Verificar campos financeiros importantes (não obrigatórios, mas importantes)
  for (const field of financialFields) {
    if (!data[field as keyof ExtractedReservationData]) {
      warningFields.push(field);
      errors.push({
        field,
        message: `Campo financeiro ${field} está ausente`,
        severity: 'warning'
      });
    }
  }
  
  // Verificar pelo menos um campo de contato
  if (!data.guestEmail && !data.guestPhone) {
    warningFields.push('contactInfo');
    errors.push({
      field: 'contactInfo',
      message: 'Nenhuma informação de contato (email ou telefone) está disponível',
      severity: 'warning'
    });
  }
  
  // Validar e converter formato de data
  const dateRegexISO = /^\d{4}-\d{2}-\d{2}$/;
  const dateRegexEU = /^(\d{2})[-.\/](\d{2})[-.\/](\d{4})$/;
  
  // Função para tentar converter a data para o formato ISO
  const convertToISODate = (dateStr: string): string => {
    // Verificar se já está no formato ISO
    if (dateRegexISO.test(dateStr)) return dateStr;
    
    // Tentar converter do formato DD-MM-YYYY ou DD/MM/YYYY
    const euMatch = dateStr.match(dateRegexEU);
    if (euMatch) {
      const [_, day, month, year] = euMatch;
      return `${year}-${month}-${day}`;
    }
    
    // Tentar converter outros formatos comuns
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return dateStr;
  };
  
  // Converter e verificar data de check-in
  if (data.checkInDate) {
    const isoDate = convertToISODate(data.checkInDate);
    
    if (dateRegexISO.test(isoDate)) {
      data.checkInDate = isoDate;
    } else {
      errors.push({
        field: 'checkInDate',
        message: 'Formato de data de check-in inválido. Deve ser YYYY-MM-DD',
        severity: 'error'
      });
      missingFields.push('checkInDate');
    }
  }
  
  // Converter e verificar data de check-out
  if (data.checkOutDate) {
    const isoDate = convertToISODate(data.checkOutDate);
    
    if (dateRegexISO.test(isoDate)) {
      data.checkOutDate = isoDate;
    } else {
      errors.push({
        field: 'checkOutDate',
        message: 'Formato de data de check-out inválido. Deve ser YYYY-MM-DD',
        severity: 'error'
      });
      missingFields.push('checkOutDate');
    }
  }
  
  // Determinar status geral
  let status: ValidationStatus;
  
  if (missingFields.length === 0 && warningFields.length === 0) {
    status = ValidationStatus.VALID;
  } else if (missingFields.length > 0) {
    status = ValidationStatus.INCOMPLETE;
  } else if (warningFields.length > 0) {
    status = ValidationStatus.NEEDS_REVIEW;
  } else {
    status = ValidationStatus.VALID;
  }
  
  // Criar cópia com valores padrão para campos ausentes
  const dataWithDefaults: ExtractedReservationData = {
    ...data,
    totalAmount: data.totalAmount || 0,
    numGuests: data.numGuests || 1,
    platformFee: data.platformFee || 0,
    cleaningFee: data.cleaningFee || 0,
    checkInFee: data.checkInFee || 0,
    commissionFee: data.commissionFee || 0,
    teamPayment: data.teamPayment || 0,
    platform: data.platform || 'direct',
    validationStatus: status
  };
  
  return {
    status,
    isValid: status === ValidationStatus.VALID,
    errors,
    missingFields,
    warningFields,
    dataWithDefaults
  };
}

/**
 * Processa um documento PDF para extrair dados de reserva
 * Utiliza pdf-parse para extração de texto e Mistral AI para a análise estruturada
 * @param pdfPath Caminho do arquivo PDF
 * @param apiKey Chave API do Mistral
 * @param options Opções de processamento (skipQualityCheck, useCache)
 */
export async function processPdf(
  pdfPath: string, 
  apiKey: string,
  options: { skipQualityCheck?: boolean; useCache?: boolean } = {}
): Promise<ValidationResult> {
  try {
    const { skipQualityCheck = false, useCache = false } = options;
    log(`Processando PDF: ${pdfPath} (skipQualityCheck: ${skipQualityCheck}, useCache: ${useCache})`, 'pdf-extract');
    
    // Verificar se arquivo existe
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Arquivo não encontrado: ${pdfPath}`);
    }
    
    // Ler arquivo
    const pdfBuffer = fs.readFileSync(pdfPath);
    log(`PDF carregado (${Math.round(pdfBuffer.length / 1024)} KB)`, 'pdf-extract');
    
    // Extrair texto usando pdf-parse
    const extractedText = await extractTextWithPdfParse(pdfBuffer);
    
    // Limpar e normalizar o texto
    const cleanedText = cleanExtractedText(extractedText);
    log('Texto limpo e normalizado para processamento', 'pdf-extract');
    
    // Processar o texto extraído para obter dados estruturados
    const reservationData = await parseReservationFromText(cleanedText, apiKey, undefined, { skipQualityCheck, useCache });
    
    // Validar os dados extraídos
    const validationResult = validateReservationData(reservationData);
    log(`Validação concluída: ${validationResult.status}`, 'pdf-extract');
    
    if (validationResult.missingFields.length > 0) {
      log(`Campos ausentes: ${validationResult.missingFields.join(', ')}`, 'pdf-extract');
    }
    
    return validationResult;
  } catch (error: any) {
    log('Erro ao processar PDF: ' + error.message, 'pdf-extract');
    
    // Retornar um resultado de validação com erro
    return {
      status: ValidationStatus.FAILED,
      isValid: false,
      errors: [{
        field: 'general',
        message: error.message,
        severity: 'error'
      }],
      missingFields: ['general'],
      warningFields: [],
      dataWithDefaults: {
        propertyName: '',
        guestName: '',
        checkInDate: '',
        checkOutDate: '',
        validationStatus: ValidationStatus.FAILED
      }
    };
  }
}