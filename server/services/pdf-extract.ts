/**
 * Serviço de extração de texto de PDF
 * Fornece funcionalidades para processar PDFs e extrair texto
 * Implementa estratégias alternativas quando a visão do Mistral não está disponível
 */

import fs from 'fs';
import { Mistral } from '@mistralai/mistralai';
import { log } from '../vite';
import pdfParse from 'pdf-parse';

// Interface para dados extraídos
export interface ExtractedReservationData {
  propertyId?: number;
  propertyName: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests?: number;
  totalAmount?: number;
  platform?: string;
  platformFee?: number;
  cleaningFee?: number;
  checkInFee?: number;
  commissionFee?: number;
  teamPayment?: number;
  rawText?: string;
}

/**
 * Tenta extrair texto de um PDF usando o cliente Mistral AI
 * Se o modelo vision não estiver disponível, retorna um erro para tratamento alternativo
 * @param pdfBase64 PDF em base64
 * @param apiKey Chave API do Mistral
 */
export async function extractTextFromPdfWithMistral(pdfBase64: string, apiKey: string): Promise<string> {
  try {
    log('Tentando extrair texto do PDF via Mistral Vision...', 'pdf-extract');
    
    // Inicializar cliente Mistral
    const client = new Mistral({ apiKey });
    
    // Tentar usar o modelo de visão, se disponível
    const response = await client.chat.complete({
      model: 'mistral-vision-preview', // Modelo com suporte a visão (pode não estar disponível em todas as chaves)
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extraia todo o texto visível deste documento. Retorne apenas o texto, sem comentários adicionais.'
            },
            {
              type: 'image_url',
              imageUrl: {
                url: `data:application/pdf;base64,${pdfBase64}`,
                detail: 'high'
              }
            }
          ]
        }
      ]
    });
    
    // Garantir retorno de string
    const content = response.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content : '';
  } catch (error: any) {
    // Se o erro for devido ao modelo não estar disponível, lançar erro específico
    if (error.message && (error.message.includes('Invalid model') || error.message.includes('Input validation failed'))) {
      throw new Error('VISION_MODEL_UNAVAILABLE');
    }
    
    // Outros erros são repassados
    throw error;
  }
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
          content: `Extraia todas as informações de reserva do seguinte texto. O texto foi extraído de um documento de reserva/check-in. Use a função disponível para estruturar os dados:\n\n${text}`
        }
      ],
      tools: tools
    });
    
    // Verificar se há ferramenta chamada
    const toolCalls = response.choices?.[0]?.message?.toolCalls || [];
    if (toolCalls.length === 0) {
      throw new Error('Não foi possível extrair dados estruturados do texto');
    }
    
    // Obter os argumentos da chamada da ferramenta
    const args = toolCalls[0].function.arguments;
    // Tratando como string para compatibilidade com a tipagem
    const argsString = typeof args === 'string' ? args : JSON.stringify(args);
    const extractedData = JSON.parse(argsString);
    
    // Adicionar o texto original para referência
    return {
      ...extractedData,
      rawText: text
    };
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
 * Processa um documento PDF para extrair dados de reserva
 * Utiliza pdf-parse para extração de texto e Mistral AI para a análise estruturada
 * @param pdfPath Caminho do arquivo PDF
 * @param apiKey Chave API do Mistral
 */
export async function processPdf(pdfPath: string, apiKey: string): Promise<ExtractedReservationData> {
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
    
    return reservationData;
  } catch (error: any) {
    log('Erro ao processar PDF: ' + error.message, 'pdf-extract');
    throw error;
  }
}