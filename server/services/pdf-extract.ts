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
  log('Pulando extração via API Vision (não disponível nesta versão)...', 'pdf-extract');
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
    
    const data = await pdfParse(pdfBuffer);
    
    // Verificar se o texto foi extraído com sucesso
    if (!data || !data.text || data.text.trim().length === 0) {
      throw new Error('Não foi possível extrair texto do PDF');
    }
    
    log(`Texto extraído com sucesso (${data.text.length} caracteres)`, 'pdf-extract');
    return data.text;
  } catch (error: any) {
    log('Erro ao extrair texto com pdf-parse: ' + error.message, 'pdf-extract');
    throw error;
  }
}

/**
 * Processa texto já extraído para obter informações estruturadas de reserva
 * @param text Texto extraído do documento
 * @param apiKey Chave API do Mistral
 */
export async function parseReservationFromText(text: string, apiKey: string): Promise<ExtractedReservationData> {
  try {
    log('Analisando texto para extrair dados de reserva...', 'pdf-extract');
    
    // Limitar o texto para evitar problemas com tokens muito longos
    const limitedText = text.slice(0, 5000);
    
    // Inicializar cliente Mistral
    const client = new Mistral({ apiKey });
    
    // Definir ferramentas para extração de dados
    const tools = [
      {
        type: "function" as const,
        function: {
          name: "extract_reservation_data",
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
              observations: {
                type: "string",
                description: "Observações ou informações adicionais importantes"
              }
            },
            required: ["propertyName", "guestName", "checkInDate", "checkOutDate"]
          }
        }
      }
    ];
    
    // Enviar texto para análise
    const response = await client.chat.complete({
      model: 'mistral-large-latest', // Usar modelo large para melhor precisão
      messages: [
        {
          role: 'user',
          content: `Extraia todas as informações de reserva do seguinte texto. O texto foi extraído de um documento de reserva/check-in. Use a função disponível para estruturar os dados. Se não conseguir determinar um campo com certeza, omita-o completamente (não invente dados):

${limitedText}`
        }
      ],
      tools: tools,
      temperature: 0.2
    });
    
    // Verificar se há ferramenta chamada
    const toolCalls = response.choices?.[0]?.message?.toolCalls || [];
    if (toolCalls.length === 0) {
      throw new Error('Não foi possível extrair dados estruturados do texto');
    }
    
    // Obter os argumentos da chamada da ferramenta com tratamento de erro aprimorado
    try {
      const toolCall = toolCalls[0];
      
      // Verificar se temos uma função válida com argumentos
      if (!toolCall || !toolCall.function) {
        throw new Error('Resposta da API inválida: toolCall ou function ausente');
      }
      
      // Extrair argumentos com verificação de tipo e existência
      const args = toolCall.function.arguments;
      
      if (!args) {
        throw new Error('Argumentos ausentes na chamada da função');
      }
      
      // Tratando como string para compatibilidade com a tipagem
      const argsString = typeof args === 'string' ? args : JSON.stringify(args);
      
      if (!argsString || argsString.trim() === '') {
        throw new Error('String de argumentos vazia ou inválida');
      }
      
      // Parse dos argumentos com tratamento de erro
      let extractedData;
      try {
        extractedData = JSON.parse(argsString);
      } catch (error: unknown) {
        const parseError = error instanceof Error ? error : new Error(String(error));
        log('Erro ao fazer parse de JSON: ' + parseError.message, 'pdf-extract');
        throw new Error('Falha ao analisar dados JSON: ' + parseError.message);
      }
      
      // Verificar se obtivemos um objeto de dados válido
      if (!extractedData || typeof extractedData !== 'object') {
        throw new Error('Dados extraídos inválidos: não é um objeto');
      }
      
      // Adicionar o texto original para referência
      return {
        ...extractedData,
        rawText: text
      };
    } catch (error: unknown) {
      const argError = error instanceof Error ? error : new Error(String(error));
      log('Erro ao extrair argumentos da chamada: ' + argError.message, 'pdf-extract');
      // Retornar um objeto mínimo para evitar erros de tipo
      return {
        propertyName: '',
        guestName: '', 
        checkInDate: '', 
        checkOutDate: '',
        rawText: text,
        observations: 'Falha ao extrair dados estruturados: ' + argError.message
      };
    }
  } catch (error: any) {
    log('Erro ao analisar dados da reserva: ' + error.message, 'pdf-extract');
    throw error;
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
  
  // Validar formato de data
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (data.checkInDate && !dateRegex.test(data.checkInDate)) {
    errors.push({
      field: 'checkInDate',
      message: 'Formato de data de check-in inválido. Deve ser YYYY-MM-DD',
      severity: 'error'
    });
    missingFields.push('checkInDate');
  }
  
  if (data.checkOutDate && !dateRegex.test(data.checkOutDate)) {
    errors.push({
      field: 'checkOutDate',
      message: 'Formato de data de check-out inválido. Deve ser YYYY-MM-DD',
      severity: 'error'
    });
    missingFields.push('checkOutDate');
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
 */
export async function processPdf(pdfPath: string, apiKey: string): Promise<ValidationResult> {
  try {
    log(`Processando PDF: ${pdfPath}`, 'pdf-extract');
    
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
    const reservationData = await parseReservationFromText(cleanedText, apiKey);
    
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