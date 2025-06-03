/**
 * Serviço de IA Unificado - Maria Faz
 * 
 * Configuração simplificada que usa apenas o Google Gemini 2.5 Flash
 * para todas as funcionalidades: OCR, Chat, Análise de Documentos
 * 
 * Elimina redundâncias e simplifica a configuração para uma única API key
 */

import { GeminiService } from './gemini.service';

export class UnifiedAIService {
  private static instance: UnifiedAIService;
  private geminiService: GeminiService;
  private isConfigured: boolean = false;

  private constructor() {
    this.geminiService = new GeminiService();
    this.checkConfiguration();
  }

  public static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService();
    }
    return UnifiedAIService.instance;
  }

  /**
   * Verifica se o serviço está configurado
   */
  private checkConfiguration(): void {
    // Verifica se temos uma chave da API do Gemini (suporta ambas as variáveis)
    const hasGeminiKey = !!(
      process.env.GOOGLE_API_KEY || 
      process.env.GOOGLE_GEMINI_API_KEY
    );

    if (hasGeminiKey) {
      this.isConfigured = true;
      console.log("✅ Google Gemini API configurada - Serviço IA unificado ativo");
    } else {
      this.isConfigured = false;
      console.warn("⚠️ Google Gemini API não configurada - Configure GOOGLE_API_KEY");
    }
  }

  /**
   * Configura a chave da API
   */
  public async configureApiKey(apiKey: string): Promise<{success: boolean, message: string}> {
    try {
      if (!apiKey || apiKey.trim() === '') {
        return {
          success: false,
          message: 'Chave de API é obrigatória'
        };
      }

      // Configurar a chave no ambiente
      process.env.GOOGLE_API_KEY = apiKey.trim();
      
      // Reinicializar o serviço Gemini
      this.geminiService.initializeWithKey(apiKey.trim());

      // Testar a conexão
      const testResult = await this.geminiService.testConnection();
      
      if (testResult.success) {
        this.isConfigured = true;
        return {
          success: true,
          message: 'Google Gemini API configurada com sucesso'
        };
      } else {
        this.isConfigured = false;
        process.env.GOOGLE_API_KEY = '';
        return {
          success: false,
          message: 'Chave de API inválida'
        };
      }
    } catch (error) {
      this.isConfigured = false;
      return {
        success: false,
        message: `Erro ao configurar API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  /**
   * Verifica se o serviço está disponível
   */
  public isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Testa a conexão
   */
  public async testConnection(): Promise<{success: boolean, message: string}> {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Serviço não configurado - Configure GOOGLE_API_KEY'
      };
    }

    return await this.geminiService.testConnection();
  }

  /**
   * Processa OCR de documentos
   */
  public async processOCR(base64Data: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Serviço não configurado - Configure GOOGLE_API_KEY');
    }

    return await this.geminiService.processOCR(base64Data);
  }

  /**
   * Processa chat/conversação
   */
  public async processChat(message: string, context?: string): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Serviço não configurado - Configure GOOGLE_API_KEY');
    }

    return await this.geminiService.generateText(message, context);
  }

  /**
   * Extrai dados estruturados de texto
   */
  public async extractData(text: string, dataType: 'reservation' | 'property' | 'general' = 'general'): Promise<any> {
    if (!this.isConfigured) {
      throw new Error('Serviço não configurado - Configure GOOGLE_API_KEY');
    }

    const prompts = {
      reservation: `Extraia informações de reserva do seguinte texto em formato JSON:
Nome do hóspede, datas de check-in/check-out, propriedade, valor, plataforma.
Texto: ${text}`,
      
      property: `Extraia informações de propriedade do seguinte texto em formato JSON:
Nome, endereço, tipo, características.
Texto: ${text}`,
      
      general: `Analise e extraia informações relevantes do seguinte texto:
${text}`
    };

    return await this.geminiService.generateText(prompts[dataType]);
  }

  /**
   * Obtém status do serviço
   */
  public getStatus(): {
    configured: boolean;
    service: string;
    capabilities: string[];
  } {
    return {
      configured: this.isConfigured,
      service: 'Google Gemini 2.5 Flash',
      capabilities: [
        'OCR de Documentos',
        'Chat/Assistente Virtual', 
        'Análise de Dados',
        'Extração de Informações'
      ]
    };
  }
}

// Exportar instância singleton
export const unifiedAI = UnifiedAIService.getInstance();