/**
 * Serviço adaptador para APIs de IA
 * Fornece uma camada de abstração sobre diferentes serviços de IA
 * permitindo trocar entre Mistral e Gemini facilmente
 */

import { MistralService } from './mistral.service';
import { GeminiService } from './gemini.service';

// Enum para definir qual serviço de IA usar
export enum AIServiceType {
  MISTRAL = 'mistral',
  GEMINI = 'gemini',
  AUTO = 'auto' // Seleciona automaticamente com base nas chaves disponíveis
}

// Singleton para garantir que usamos a mesma instância em toda a aplicação
export class AIAdapter {
  private static instance: AIAdapter;
  private mistralService: MistralService;
  private geminiService: GeminiService;
  private currentService: AIServiceType = AIServiceType.AUTO;
  
  private constructor() {
    this.mistralService = new MistralService();
    this.geminiService = new GeminiService();
    
    // Detectar automaticamente qual serviço usar com base nas chaves disponíveis
    if (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      this.currentService = AIServiceType.GEMINI;
      console.log("✅ Usando Gemini como serviço de IA principal");
    } else if (process.env.MISTRAL_API_KEY) {
      this.currentService = AIServiceType.MISTRAL;
      console.log("✅ Usando Mistral como serviço de IA principal");
    } else {
      console.warn("⚠️ Nenhuma chave de API de IA configurada. Funcionalidades de IA estarão limitadas.");
      this.currentService = AIServiceType.MISTRAL; // Fallback para Mistral
    }
  }

  /**
   * Obtém a instância única do adaptador
   * @returns Instância do adaptador
   */
  public static getInstance(): AIAdapter {
    if (!AIAdapter.instance) {
      AIAdapter.instance = new AIAdapter();
    }
    return AIAdapter.instance;
  }
  
  /**
   * Define qual serviço de IA usar
   * @param serviceType Tipo de serviço de IA a ser usado
   */
  public setService(serviceType: AIServiceType): void {
    if (serviceType === AIServiceType.AUTO) {
      // Auto-detectar o melhor serviço disponível
      if (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
        this.currentService = AIServiceType.GEMINI;
      } else if (process.env.MISTRAL_API_KEY) {
        this.currentService = AIServiceType.MISTRAL;
      } else {
        throw new Error("Nenhuma chave de API de IA configurada.");
      }
    } else {
      // Verificar se o serviço requisitado tem chave API configurada
      if (serviceType === AIServiceType.GEMINI && !(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
        throw new Error("GOOGLE_GEMINI_API_KEY não configurada. Não é possível usar o Gemini.");
      } else if (serviceType === AIServiceType.MISTRAL && !process.env.MISTRAL_API_KEY) {
        throw new Error("MISTRAL_API_KEY não configurada. Não é possível usar o Mistral.");
      }
      
      this.currentService = serviceType;
    }
    
    console.log(`Serviço de IA alterado para: ${this.currentService}`);
  }
  
  /**
   * Obtém o serviço atual
   * @returns Tipo de serviço de IA em uso
   */
  public getCurrentService(): AIServiceType {
    return this.currentService;
  }
  
  // Métodos que encaminham as chamadas para o serviço apropriado
  
  /**
   * Extrai texto de um PDF em base64
   * @param pdfBase64 PDF codificado em base64
   * @returns Texto extraído do documento
   */
  public async extractTextFromPDF(pdfBase64: string): Promise<string> {
    try {
      if (this.currentService === AIServiceType.GEMINI) {
        return await this.geminiService.extractTextFromPDF(pdfBase64);
      } else {
        return await this.mistralService.extractTextFromPDF(pdfBase64);
      }
    } catch (error: any) {
      // Em caso de erro, tentar com o outro serviço se disponível
      console.warn(`Erro no serviço ${this.currentService}, tentando alternativa...`);
      
      if (this.currentService === AIServiceType.GEMINI && process.env.MISTRAL_API_KEY) {
        return await this.mistralService.extractTextFromPDF(pdfBase64);
      } else if (this.currentService === AIServiceType.MISTRAL && (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
        return await this.geminiService.extractTextFromPDF(pdfBase64);
      } else {
        throw error; // Repassar o erro se não houver alternativa
      }
    }
  }
  
  /**
   * Extrai texto de uma imagem
   * @param imageBase64 Imagem codificada em base64
   * @param mimeType Tipo MIME da imagem
   * @returns Texto extraído da imagem
   */
  public async extractTextFromImage(imageBase64: string, mimeType: string): Promise<string> {
    try {
      if (this.currentService === AIServiceType.GEMINI) {
        return await this.geminiService.extractTextFromImage(imageBase64, mimeType);
      } else {
        return await this.mistralService.extractTextFromImage(imageBase64, mimeType);
      }
    } catch (error: any) {
      // Em caso de erro, tentar com o outro serviço se disponível
      console.warn(`Erro no serviço ${this.currentService}, tentando alternativa...`);
      
      if (this.currentService === AIServiceType.GEMINI && process.env.MISTRAL_API_KEY) {
        return await this.mistralService.extractTextFromImage(imageBase64, mimeType);
      } else if (this.currentService === AIServiceType.MISTRAL && (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
        return await this.geminiService.extractTextFromImage(imageBase64, mimeType);
      } else {
        throw error; // Repassar o erro se não houver alternativa
      }
    }
  }
  
  /**
   * Analisa texto e extrai dados estruturados de reserva
   * @param text Texto a ser analisado
   * @returns Dados estruturados da reserva
   */
  public async parseReservationData(text: string): Promise<any> {
    try {
      if (this.currentService === AIServiceType.GEMINI) {
        return await this.geminiService.parseReservationData(text);
      } else {
        return await this.mistralService.parseReservationData(text);
      }
    } catch (error: any) {
      // Em caso de erro, tentar com o outro serviço se disponível
      console.warn(`Erro no serviço ${this.currentService}, tentando alternativa...`);
      
      if (this.currentService === AIServiceType.GEMINI && process.env.MISTRAL_API_KEY) {
        return await this.mistralService.parseReservationData(text);
      } else if (this.currentService === AIServiceType.MISTRAL && (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
        return await this.geminiService.parseReservationData(text);
      } else {
        throw error; // Repassar o erro se não houver alternativa
      }
    }
  }
  
  /**
   * Valida dados de reserva
   * @param data Dados a serem validados
   * @param propertyRules Regras da propriedade
   * @returns Resultado da validação
   */
  public async validateReservationData(data: any, propertyRules: any): Promise<any> {
    try {
      if (this.currentService === AIServiceType.GEMINI) {
        return await this.geminiService.validateReservationData(data, propertyRules);
      } else {
        return await this.mistralService.validateReservationData(data, propertyRules);
      }
    } catch (error: any) {
      // Em caso de erro, tentar com o outro serviço se disponível
      console.warn(`Erro no serviço ${this.currentService}, tentando alternativa...`);
      
      if (this.currentService === AIServiceType.GEMINI && process.env.MISTRAL_API_KEY) {
        return await this.mistralService.validateReservationData(data, propertyRules);
      } else if (this.currentService === AIServiceType.MISTRAL && (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
        return await this.geminiService.validateReservationData(data, propertyRules);
      } else {
        throw error; // Repassar o erro se não houver alternativa
      }
    }
  }
  
  /**
   * Classifica o tipo de documento com base no texto
   * @param text Texto do documento
   * @returns Classificação do documento
   */
  public async classifyDocument(text: string): Promise<any> {
    try {
      if (this.currentService === AIServiceType.GEMINI) {
        return await this.geminiService.classifyDocument(text);
      } else {
        return await this.mistralService.classifyDocument(text);
      }
    } catch (error: any) {
      // Em caso de erro, tentar com o outro serviço se disponível
      console.warn(`Erro no serviço ${this.currentService}, tentando alternativa...`);
      
      if (this.currentService === AIServiceType.GEMINI && process.env.MISTRAL_API_KEY) {
        return await this.mistralService.classifyDocument(text);
      } else if (this.currentService === AIServiceType.MISTRAL && (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
        return await this.geminiService.classifyDocument(text);
      } else {
        throw error; // Repassar o erro se não houver alternativa
      }
    }
  }
  
  /**
   * Analisa visualmente um documento
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @returns Análise visual do documento
   */
  public async analyzeDocumentVisually(fileBase64: string, mimeType: string): Promise<any> {
    try {
      if (this.currentService === AIServiceType.GEMINI) {
        return await this.geminiService.analyzeDocumentVisually(fileBase64, mimeType);
      } else {
        return await this.mistralService.analyzeDocumentVisually(fileBase64, mimeType);
      }
    } catch (error: any) {
      // Em caso de erro, tentar com o outro serviço se disponível
      console.warn(`Erro no serviço ${this.currentService}, tentando alternativa...`);
      
      if (this.currentService === AIServiceType.GEMINI && process.env.MISTRAL_API_KEY) {
        return await this.mistralService.analyzeDocumentVisually(fileBase64, mimeType);
      } else if (this.currentService === AIServiceType.MISTRAL && (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
        return await this.geminiService.analyzeDocumentVisually(fileBase64, mimeType);
      } else {
        throw error; // Repassar o erro se não houver alternativa
      }
    }
  }
  
  /**
   * Processa um documento completo (PDF ou imagem)
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @returns Resultado do processamento
   */
  public async processReservationDocument(fileBase64: string, mimeType: string): Promise<any> {
    try {
      console.log(`📄 Processando documento ${mimeType} usando serviço: ${this.currentService}`);
      
      // Implementação unificada para processamento de documentos
      const isPDF = mimeType.includes('pdf');
      
      // Extrair texto do documento
      let extractedText;
      try {
        console.log(`🔍 Extraindo texto do ${isPDF ? 'PDF' : 'imagem'}...`);
        
        if (isPDF) {
          // Extrair texto do PDF usando o serviço atual
          extractedText = await this.extractTextFromPDF(fileBase64);
        } else {
          // Extrair texto da imagem usando o serviço atual
          extractedText = await this.extractTextFromImage(fileBase64, mimeType);
        }
        
        console.log(`✅ Extração de texto concluída: ${extractedText.length} caracteres`);
      } catch (error: any) {
        console.error(`❌ Erro na extração de texto:`, error);
        return {
          success: false,
          error: "Falha na extração de texto",
          details: error.message || "Erro desconhecido na extração de texto"
        };
      }
      
      // Analisar o documento visualmente (em paralelo) - apenas se estiver disponível no serviço atual
      let visualAnalysisPromise;
      try {
        if (this.currentService === AIServiceType.GEMINI) {
          visualAnalysisPromise = this.geminiService.analyzeDocumentVisually(fileBase64, mimeType);
        } else {
          visualAnalysisPromise = Promise.resolve({ type: 'unknown', confidence: 0 });
        }
      } catch (error) {
        // Se falhar, continuar com análise visual padrão
        visualAnalysisPromise = Promise.resolve({ type: 'unknown', confidence: 0 });
      }
      
      // Extrair dados estruturados
      let structuredData;
      try {
        console.log(`🔍 Extraindo dados estruturados do texto...`);
        structuredData = await this.parseReservationData(extractedText);
        console.log(`✅ Dados estruturados extraídos com sucesso`);
      } catch (error: any) {
        console.error(`❌ Erro na extração de dados estruturados:`, error);
        return {
          success: false,
          error: "Falha na extração de dados estruturados",
          details: error.message || "Erro desconhecido na extração de dados estruturados",
          rawText: extractedText
        };
      }
      
      // Obter resultado da análise visual
      let visualAnalysis;
      try {
        visualAnalysis = await visualAnalysisPromise;
      } catch (error) {
        // Se falhar, usar um resultado padrão
        visualAnalysis = { type: 'unknown', confidence: 0 };
      }
      
      // Garantir que todos os campos requeridos estejam presentes
      const requiredFields = ['propertyName', 'guestName', 'checkInDate', 'checkOutDate'];
      const missingFields = requiredFields.filter(field => !structuredData[field]);
      
      if (missingFields.length > 0) {
        console.log(`⚠️ Dados estruturados incompletos. Campos ausentes: ${missingFields.join(', ')}`);
      }
      
      // Adicionar documentType se não estiver presente
      if (!structuredData.documentType) {
        structuredData.documentType = 'reserva';
      }
      
      // Combinar resultados
      return {
        success: true,
        rawText: extractedText,
        data: structuredData,
        documentInfo: {
          ...visualAnalysis,
          mimeType,
          isPDF
        }
      };
    } catch (error: any) {
      console.error(`❌ Erro no processamento do documento:`, error);
      return {
        success: false,
        error: "Falha no processamento do documento",
        details: error.message || "Erro desconhecido no processamento"
      };
    }
  }
  
  /**
   * Acesso ao cliente Mistral para casos específicos
   * (isto permite compatibilidade com código existente)
   * @returns Cliente Mistral
   */
  public getMistralClient() {
    return this.mistralService.getMistralClient();
  }
}

// Exportar singleton para uso global
export const aiService = AIAdapter.getInstance();