/**
 * Serviço para processamento de manuscritos com RolmOCR
 * Utiliza o Hugging Face Inference API para processar texto manuscrito
 */

import axios from 'axios';
import { rateLimiter } from './rate-limiter.service';

export class RolmService {
  private apiKey: string;
  private baseUrl: string = 'https://api-inference.huggingface.co/models/reducto/RolmOCR';

  constructor() {
    this.apiKey = process.env.HF_TOKEN || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ HF_TOKEN não está configurado. O serviço RolmOCR não funcionará para manuscritos.');
    }
  }

  /**
   * Verifica se o serviço está corretamente inicializado
   * @throws Error se o token HF não estiver configurado
   */
  private checkInitialization(): void {
    if (!this.apiKey) {
      throw new Error('HF_TOKEN não está configurado nas variáveis de ambiente');
    }
  }

  /**
   * Processa uma imagem com texto manuscrito para extração de texto
   * @param imageBuffer Buffer da imagem com texto manuscrito
   * @returns Texto extraído da imagem
   */
  public async processHandwriting(imageBuffer: Buffer): Promise<{
    text: string;
    error?: string;
  }> {
    this.checkInitialization();
    
    try {
      // Usar rate limiter para controlar chamadas à API
      const startTime = Date.now();
      
      // Criar função que faz a requisição
      const makeRequest = async () => axios.post(
        this.baseUrl,
        imageBuffer,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/octet-stream'
          },
          timeout: 30000 // 30s timeout para processamento de manuscritos
        }
      );
      
      // Usar o método schedule do rate limiter com a função criada
      const response = await rateLimiter.schedule(
        makeRequest,
        'rolm_process_handwriting',
        5 * 60 * 1000 // Cache por 5 minutos
      );
      
      const endTime = Date.now();
      const latencyMs = endTime - startTime;
      
      // Registrar métricas de uso
      console.log(`✅ RolmOCR: concluído em ${latencyMs}ms`);
      
      if (response.data && typeof response.data === 'object') {
        // Formato da resposta varia, mas geralmente tem um campo 'text' ou 'generated_text'
        const extractedText = response.data.text || response.data.generated_text || JSON.stringify(response.data);
        return { text: extractedText };
      } else {
        return { text: String(response.data) };
      }
    } catch (error: any) {
      console.error('❌ Erro na API RolmOCR:', error.response?.data || error.message);
      
      // Retornar erro formatado
      return {
        text: '',
        error: error.response?.data?.error || error.message
      };
    }
  }
}

export default RolmService;