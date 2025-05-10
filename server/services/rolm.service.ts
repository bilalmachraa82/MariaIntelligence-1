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
   * Testa a conexão com o Hugging Face / RolmOCR
   * @returns Resultado do teste de conexão
   */
  public async testConnection(): Promise<{success: boolean, message: string}> {
    try {
      if (!this.apiKey) {
        return { success: false, message: 'HF_TOKEN não configurado' };
      }
      
      // Para testar a conexão, fazemos uma requisição simples para verificar o status do modelo
      const response = await axios.get('https://api-inference.huggingface.co/status', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (response.status === 200) {
        // Verificar disponibilidade específica do modelo RolmOCR
        try {
          const modelResponse = await axios.post(
            this.baseUrl,
            { inputs: 'test' },
            {
              headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
              },
              // Timeout curto apenas para testar a conexão
              timeout: 5000
            }
          );
          
          if (modelResponse.status === 200) {
            console.log('✅ RolmOCR conectado com sucesso');
            return { success: true, message: 'RolmOCR conectado com sucesso' };
          } else {
            return { 
              success: false, 
              message: `Erro na resposta do modelo: ${modelResponse.status} - ${modelResponse.statusText}` 
            };
          }
        } catch (modelError: any) {
          // Se o erro for de timeout ou o modelo estiver sendo carregado, ainda consideramos um sucesso
          // pois o token é válido e o serviço está acessível
          if (modelError.response?.status === 503 || 
              modelError.message.includes('timeout') || 
              modelError.response?.data?.error?.includes('loading')) {
            console.log('⚠️ RolmOCR está sendo carregado ou em fila - conexão bem-sucedida, modelo disponível');
            return { success: true, message: 'RolmOCR está sendo carregado - conexão bem-sucedida' };
          }
          
          return { 
            success: false, 
            message: modelError.response?.data?.error || modelError.message || 'Erro ao acessar modelo' 
          };
        }
      } else {
        return { 
          success: false, 
          message: `Erro na resposta da API: ${response.status} - ${response.statusText}` 
        };
      }
    } catch (error: any) {
      console.error('❌ Erro ao testar conexão com RolmOCR:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || error.message || 'Erro desconhecido' 
      };
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