/**
 * Serviço para comunicação com a API do OpenRouter
 * Fornece funcionalidades para OCR e processamento de documentos
 */

import axios from 'axios';
import { rateLimiter } from './rate-limiter.service';

export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = process.env.OR_MODEL || 'mistral-ocr';
    
    if (!this.apiKey) {
      console.warn('⚠️ OPENROUTER_API_KEY não está configurada. O serviço OpenRouter não funcionará.');
    }
  }

  /**
   * Verifica se o serviço está corretamente inicializado
   * @throws Error se a chave API não estiver configurada
   */
  private checkInitialization(): void {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY não está configurada nas variáveis de ambiente');
    }
  }

  /**
   * Processa um PDF para extração de texto e dados estruturados usando o OpenRouter
   * @param pdfBuffer Buffer do arquivo PDF
   * @returns Resultado do processamento com texto extraído e caixas delimitadoras
   */
  public async ocrPdf(pdfBuffer: Buffer): Promise<{
    full_text: string;
    bounding_boxes?: Record<string, any>[];
    error?: string;
  }> {
    this.checkInitialization();
    
    // Converter buffer para base64
    const pdfBase64 = pdfBuffer.toString('base64');
    
    try {
      // Usar rate limiter para controlar chamadas à API
      const startTime = Date.now();
      
      // Criar função que faz a requisição
      const makeRequest = async () => axios.post(
        `${this.baseUrl}/vision`,
        {
          model: this.model,
          mime_type: "application/pdf",
          data: pdfBase64
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://replit.com',
            'X-Title': 'Maria Faz - Mistral OCR',
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Usar o método schedule do rate limiter com a função criada
      const response = await rateLimiter.schedule(
        makeRequest,
        'openrouter_ocr_pdf',
        60 * 1000 // Cache por 1 minuto
      );
      
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      
      // Registrar métricas de uso
      console.log(`✅ OpenRouter OCR: concluído em ${latencyMs}ms, modelo: ${this.model}`);
      
      // Verificar resposta e extrair dados
      if (response.data && response.data.text) {
        return {
          full_text: response.data.text,
          bounding_boxes: response.data.bounding_boxes || []
        };
      } else {
        throw new Error('Resposta vazia ou inválida do OpenRouter');
      }
    } catch (error: any) {
      console.error('❌ Erro na API OpenRouter:', error.response?.data || error.message);
      
      // Retornar erro formatado
      return {
        full_text: '',
        error: error.response?.data?.error?.message || error.message
      };
    }
  }
}

export default OpenRouterService;