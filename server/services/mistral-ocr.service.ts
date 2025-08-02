/**
 * Serviço para comunicação com a API Mistral OCR
 * API dedicada de OCR com melhor performance e precisão
 * Documentação: https://mistral.ai/news/mistral-ocr
 */

import axios from 'axios';
import { rateLimiter } from './rate-limiter.service';

export interface MistralOCRResponse {
  text: string;
  images?: Array<{
    data: string;
    caption?: string;
  }>;
  metadata?: {
    pageCount: number;
    language?: string;
    confidence?: number;
  };
}

export class MistralOCRService {
  private apiKey: string;
  private baseUrl: string = 'https://api.mistral.ai/v1';
  private model: string = 'mistral-ocr-latest';

  constructor() {
    // Usar a chave da Mistral diretamente se disponível
    this.apiKey = process.env.MISTRAL_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ MISTRAL_API_KEY não está configurada. O serviço Mistral OCR não funcionará.');
    }
  }
  
  /**
   * Testa a conexão com a API Mistral OCR
   * @returns Resultado do teste de conexão
   */
  public async testConnection(): Promise<{success: boolean, message: string}> {
    try {
      if (!this.apiKey) {
        return { success: false, message: 'Chave API Mistral não configurada' };
      }
      
      // Testar a conexão com um request simples
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200 && response.data) {
        const models = response.data.models || [];
        
        // Verificar se o modelo OCR está disponível
        const ocrModel = models.find((m: any) => 
          m.id === 'mistral-ocr-latest' || 
          m.id?.includes('ocr')
        );
        
        if (ocrModel) {
          console.log(`✅ Mistral OCR API conectada - Modelo disponível: ${ocrModel.id}`);
          return { 
            success: true,
            message: `Mistral OCR API conectada - Modelo disponível: ${ocrModel.id}`
          };
        } else {
          console.log('⚠️ Conectado à Mistral, mas modelo OCR não encontrado');
          return { 
            success: true,
            message: 'Conectado à Mistral, mas modelo OCR específico não encontrado'
          };
        }
      } else {
        return { success: false, message: `Erro na resposta: ${response.status}` };
      }
    } catch (error: any) {
      console.error('❌ Erro ao testar conexão com Mistral OCR:', error);
      
      // Se for erro 401, a chave é inválida
      if (error.response?.status === 401) {
        return { 
          success: false, 
          message: 'Chave API inválida ou expirada'
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.error?.message || error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Verifica se o serviço está corretamente inicializado
   * @throws Error se a chave API não estiver configurada
   */
  private checkInitialization(): void {
    if (!this.apiKey) {
      throw new Error('MISTRAL_API_KEY não está configurada nas variáveis de ambiente');
    }
  }

  /**
   * Processa um PDF usando a API Mistral OCR
   * @param pdfBuffer Buffer do arquivo PDF
   * @returns Resultado do processamento OCR
   */
  public async processPdf(pdfBuffer: Buffer): Promise<MistralOCRResponse> {
    this.checkInitialization();
    
    // Converter buffer para base64
    const pdfBase64 = pdfBuffer.toString('base64');
    
    try {
      // Usar rate limiter para controlar chamadas à API
      const startTime = Date.now();
      
      // Criar função que faz a requisição
      // Nota: A API Mistral OCR dedicada pode usar um endpoint diferente
      // Por enquanto, usar o endpoint de chat com vision capabilities
      const makeRequest = async () => axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'pixtral-12b-2024-09-04', // Modelo com capacidades de visão
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text from this PDF document. Return the complete text content with preserved formatting.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:application/pdf;base64,${pdfBase64}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 4096
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Request-Source': 'MariaFaz-OCR'
          },
          timeout: 120000 // 2 minutos de timeout para PDFs grandes
        }
      );
      
      // Usar o método schedule do rate limiter com a função criada
      const response = await rateLimiter.schedule(
        makeRequest,
        'mistral_ocr_pdf',
        5 * 60 * 1000 // Cache por 5 minutos
      );
      
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      
      // Registrar métricas de uso
      console.log(`✅ Mistral OCR: processado em ${latencyMs}ms`);
      
      // Verificar resposta e extrair dados do formato chat/completions
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const extractedText = response.data.choices[0].message?.content || '';
        
        const result: MistralOCRResponse = {
          text: extractedText,
          images: [], // Chat completions não retorna imagens separadas
          metadata: {
            pageCount: 1, // Será estimado baseado no conteúdo
            language: undefined,
            confidence: undefined
          }
        };
        
        console.log(`📄 Texto extraído: ${result.text.length} caracteres`);
        
        return result;
      } else {
        throw new Error('Resposta vazia ou inválida da API Mistral');
      }
    } catch (error: any) {
      console.error('❌ Erro na API Mistral OCR:', error.response?.data || error.message);
      
      // Se for erro de rate limit (429)
      if (error.response?.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      }
      
      // Se for erro de autenticação (401)
      if (error.response?.status === 401) {
        throw new Error('Chave API inválida ou expirada');
      }
      
      // Se for erro de payload muito grande (413)
      if (error.response?.status === 413) {
        throw new Error('PDF muito grande. O tamanho máximo é 10MB.');
      }
      
      // Erro genérico
      throw new Error(
        error.response?.data?.error?.message || 
        error.message || 
        'Erro desconhecido ao processar PDF'
      );
    }
  }
  
  /**
   * Processa uma imagem usando a API Mistral OCR
   * @param imageBuffer Buffer da imagem
   * @param mimeType Tipo MIME da imagem
   * @returns Resultado do processamento OCR
   */
  public async processImage(imageBuffer: Buffer, mimeType: string): Promise<MistralOCRResponse> {
    this.checkInitialization();
    
    // Converter buffer para base64
    const imageBase64 = imageBuffer.toString('base64');
    
    try {
      const startTime = Date.now();
      
      // Criar função que faz a requisição
      const makeRequest = async () => axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'pixtral-12b-2024-09-04', // Modelo com capacidades de visão
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text from this image. Return the complete text content with preserved formatting.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          max_tokens: 2048
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'X-Request-Source': 'MariaFaz-OCR'
          },
          timeout: 60000 // 1 minuto de timeout para imagens
        }
      );
      
      // Usar o método schedule do rate limiter com a função criada
      const response = await rateLimiter.schedule(
        makeRequest,
        'mistral_ocr_image',
        5 * 60 * 1000 // Cache por 5 minutos
      );
      
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      
      console.log(`✅ Mistral OCR (imagem): processado em ${latencyMs}ms`);
      
      // Verificar resposta e extrair dados do formato chat/completions
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        const extractedText = response.data.choices[0].message?.content || '';
        
        const result: MistralOCRResponse = {
          text: extractedText,
          metadata: {
            pageCount: 1,
            language: undefined,
            confidence: undefined
          }
        };
        
        return result;
      } else {
        throw new Error('Resposta vazia ou inválida da API Mistral');
      }
    } catch (error: any) {
      console.error('❌ Erro na API Mistral OCR (imagem):', error.response?.data || error.message);
      
      // Tratamento de erros similar ao processPdf
      if (error.response?.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Chave API inválida ou expirada');
      }
      
      throw new Error(
        error.response?.data?.error?.message || 
        error.message || 
        'Erro desconhecido ao processar imagem'
      );
    }
  }

  /**
   * Processa um lote de documentos usando a API Mistral OCR
   * @param documents Array de documentos para processar
   * @returns Array de resultados processados
   */
  public async processBatch(documents: Array<{
    data: Buffer;
    mimeType: string;
    filename?: string;
  }>): Promise<Array<MistralOCRResponse & { filename?: string; error?: string }>> {
    this.checkInitialization();
    
    console.log(`🔄 Processando lote de ${documents.length} documentos...`);
    
    // Processar documentos em paralelo com limite de concorrência
    const BATCH_SIZE = 3; // Processar 3 documentos por vez
    const results: Array<MistralOCRResponse & { filename?: string; error?: string }> = [];
    
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (doc) => {
        try {
          let result: MistralOCRResponse;
          
          if (doc.mimeType === 'application/pdf') {
            result = await this.processPdf(doc.data);
          } else if (doc.mimeType.startsWith('image/')) {
            result = await this.processImage(doc.data, doc.mimeType);
          } else {
            throw new Error(`Tipo de documento não suportado: ${doc.mimeType}`);
          }
          
          return {
            ...result,
            filename: doc.filename
          };
        } catch (error: any) {
          console.error(`❌ Erro ao processar ${doc.filename || 'documento'}:`, error.message);
          return {
            text: '',
            filename: doc.filename,
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    const successful = results.filter(r => !r.error).length;
    console.log(`✅ Lote processado: ${successful}/${documents.length} documentos com sucesso`);
    
    return results;
  }

  /**
   * Estima o custo de processamento para um conjunto de documentos
   * @param documents Array de documentos
   * @returns Estimativa de custo em USD
   */
  public estimateCost(documents: Array<{ sizeInBytes: number }>): {
    estimatedPages: number;
    costInUSD: number;
    costInEUR: number;
  } {
    // Estimar número de páginas (assumindo ~50KB por página em média)
    const BYTES_PER_PAGE = 50 * 1024; // 50KB
    const COST_PER_1000_PAGES = 1.0; // $1 por 1000 páginas
    const USD_TO_EUR = 0.92; // Taxa de conversão aproximada
    
    const totalBytes = documents.reduce((sum, doc) => sum + doc.sizeInBytes, 0);
    const estimatedPages = Math.ceil(totalBytes / BYTES_PER_PAGE);
    const costInUSD = (estimatedPages / 1000) * COST_PER_1000_PAGES;
    const costInEUR = costInUSD * USD_TO_EUR;
    
    return {
      estimatedPages,
      costInUSD: Math.round(costInUSD * 100) / 100,
      costInEUR: Math.round(costInEUR * 100) / 100
    };
  }
}

// Exportar uma instância singleton
export const mistralOCRService = new MistralOCRService();