/**
 * Configuração de IA Simplificada - Maria Faz
 * 
 * OTIMIZAÇÃO: De 3 APIs para 1 API única
 * 
 * ANTES (redundante):
 * - GOOGLE_API_KEY + GOOGLE_GEMINI_API_KEY (duplicadas)
 * - OPENROUTER_API_KEY 
 * - HF_TOKEN
 * 
 * DEPOIS (harmonioso):
 * - GOOGLE_API_KEY apenas (Google Gemini 2.5 Flash)
 * 
 * O Gemini 2.5 Flash oferece todas as capacidades necessárias:
 * - OCR avançado de documentos
 * - Chat/Assistente inteligente  
 * - Análise e extração de dados
 * - Processamento de imagens
 */

export interface SimplifiedAIConfig {
  apiKey: string | null;
  isConfigured: boolean;
  service: string;
  capabilities: string[];
}

export class SimplifiedAIManager {
  private static instance: SimplifiedAIManager;
  private config: SimplifiedAIConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): SimplifiedAIManager {
    if (!SimplifiedAIManager.instance) {
      SimplifiedAIManager.instance = new SimplifiedAIManager();
    }
    return SimplifiedAIManager.instance;
  }

  private loadConfig(): SimplifiedAIConfig {
    // Usar apenas GOOGLE_API_KEY - elimina redundância
    const apiKey = process.env.GOOGLE_API_KEY || null;
    
    return {
      apiKey,
      isConfigured: !!apiKey,
      service: 'Google Gemini 2.5 Flash',
      capabilities: [
        'OCR de Documentos',
        'Chat/Assistente Virtual',
        'Análise de Dados',
        'Extração de Informações',
        'Processamento de Imagens'
      ]
    };
  }

  public getConfig(): SimplifiedAIConfig {
    return { ...this.config };
  }

  public isConfigured(): boolean {
    return this.config.isConfigured;
  }

  public updateApiKey(apiKey: string): void {
    process.env.GOOGLE_API_KEY = apiKey;
    this.config = this.loadConfig();
  }

  public getRequiredSecrets(): string[] {
    return this.config.isConfigured ? [] : ['GOOGLE_API_KEY'];
  }

  public getStatusMessage(): string {
    if (this.config.isConfigured) {
      return `${this.config.service} configurado e ativo`;
    }
    return 'Configure GOOGLE_API_KEY para ativar todas as funcionalidades de IA';
  }

  /**
   * Verifica se precisa de configuração
   */
  public needsConfiguration(): boolean {
    return !this.config.isConfigured;
  }

  /**
   * Obtém apenas os secrets necessários
   */
  public getMissingSecrets(): string[] {
    return this.needsConfiguration() ? ['GOOGLE_API_KEY'] : [];
  }
}

export const simplifiedAI = SimplifiedAIManager.getInstance();