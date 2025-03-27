/**
 * Serviço adaptador para APIs de IA
 * Fornece uma camada de abstração para acessar o serviço Gemini
 */

import { GeminiService } from './gemini.service';
import { ragService } from './rag-enhanced.service';

// Enum para definir qual serviço de IA usar (apenas Gemini é suportado agora)
export enum AIServiceType {
  GEMINI = 'gemini',
  AUTO = 'auto' // Mantido por compatibilidade
}

// Singleton para garantir que usamos a mesma instância em toda a aplicação
export class AIAdapter {
  private static instance: AIAdapter;
  public geminiService: GeminiService;
  private currentService: AIServiceType = AIServiceType.GEMINI;
  
  private constructor() {
    this.geminiService = new GeminiService();
    
    // Verificar se temos chave do Gemini configurada
    if (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      console.log("✅ Gemini API configurada corretamente");
    } else {
      console.warn("⚠️ Nenhuma chave de API do Gemini configurada. Funcionalidades de IA estarão limitadas.");
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
    // Apenas Gemini é suportado agora
    if (serviceType !== AIServiceType.GEMINI && serviceType !== AIServiceType.AUTO) {
      console.warn("Apenas o serviço Gemini é suportado. Usando Gemini automaticamente.");
    }
    
    // Verificar se temos chave API configurada
    if (!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
      throw new Error("GOOGLE_GEMINI_API_KEY não configurada. Não é possível usar o Gemini.");
    }
    
    this.currentService = AIServiceType.GEMINI;
    console.log(`Serviço de IA configurado para: ${this.currentService}`);
  }
  
  /**
   * Obtém o serviço atual
   * @returns Tipo de serviço de IA em uso
   */
  public getCurrentService(): AIServiceType {
    return this.currentService;
  }
  
  /**
   * Verifica se algum serviço de IA está disponível
   * @returns True se tiver ao menos um serviço disponível
   */
  public isServiceAvailable(): boolean {
    return (
      (process.env.GOOGLE_GEMINI_API_KEY !== undefined && process.env.GOOGLE_GEMINI_API_KEY !== '') ||
      (process.env.GOOGLE_API_KEY !== undefined && process.env.GOOGLE_API_KEY !== '')
    );
  }
  
  // Métodos que encaminham as chamadas para o serviço apropriado
  
  /**
   * Extrai texto de um PDF em base64
   * @param pdfBase64 PDF codificado em base64
   * @returns Texto extraído do documento
   */
  public async extractTextFromPDF(pdfBase64: string): Promise<string> {
    try {
      return await this.geminiService.extractTextFromPDF(pdfBase64);
    } catch (error: any) {
      console.error(`Erro ao extrair texto do PDF com Gemini:`, error);
      throw new Error(`Falha ao extrair texto do PDF: ${error.message || 'Erro desconhecido'}`);
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
      return await this.geminiService.extractTextFromImage(imageBase64, mimeType);
    } catch (error: any) {
      console.error(`Erro ao extrair texto da imagem com Gemini:`, error);
      throw new Error(`Falha ao extrair texto da imagem: ${error.message || 'Erro desconhecido'}`);
    }
  }
  
  /**
   * Analisa texto e extrai dados estruturados de reserva
   * @param text Texto a ser analisado
   * @returns Dados estruturados da reserva
   */
  public async parseReservationData(text: string): Promise<any> {
    try {
      return await this.geminiService.parseReservationData(text);
    } catch (error: any) {
      console.error(`Erro ao extrair dados de reserva com Gemini:`, error);
      throw new Error(`Falha ao extrair dados de reserva: ${error.message || 'Erro desconhecido'}`);
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
      return await this.geminiService.validateReservationData(data, propertyRules);
    } catch (error: any) {
      console.error(`Erro ao validar dados de reserva com Gemini:`, error);
      throw new Error(`Falha ao validar dados de reserva: ${error.message || 'Erro desconhecido'}`);
    }
  }
  
  /**
   * Classifica o tipo de documento com base no texto
   * @param text Texto do documento
   * @returns Classificação do documento
   */
  public async classifyDocument(text: string): Promise<any> {
    try {
      return await this.geminiService.classifyDocument(text);
    } catch (error: any) {
      console.error(`Erro ao classificar documento com Gemini:`, error);
      throw new Error(`Falha ao classificar documento: ${error.message || 'Erro desconhecido'}`);
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
      return await this.geminiService.analyzeDocumentVisually(fileBase64, mimeType);
    } catch (error: any) {
      console.error(`Erro ao analisar documento visualmente com Gemini:`, error);
      throw new Error(`Falha na análise visual do documento: ${error.message || 'Erro desconhecido'}`);
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
      console.log(`📄 Processando documento ${mimeType} usando serviço: Gemini`);
      
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
      
      // Analisar o documento visualmente (em paralelo)
      let visualAnalysisPromise;
      try {
        visualAnalysisPromise = this.geminiService.analyzeDocumentVisually(fileBase64, mimeType);
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
      
      // Armazenar o documento processado no RAG para aprendizado contínuo
      try {
        await ragService.integrateProcessedDocument(
          extractedText,
          structuredData,
          structuredData.documentType || 'reservation',
          {
            mimeType,
            isPDF,
            visualAnalysis,
            processingDate: new Date().toISOString()
          }
        );
        console.log('✅ Documento integrado ao RAG para aprendizado contínuo');
      } catch (ragError) {
        console.error('⚠️ Erro ao integrar documento ao RAG:', ragError);
        // Continuar mesmo em caso de erro no RAG
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
   * Extrai dados estruturados a partir de texto
   * @param text Texto para análise
   * @param options Opções de configuração (prompt do sistema, formato de resposta, etc.)
   * @returns Dados extraídos no formato solicitado
   */
  /**
   * Gera texto com base em um prompt usando o serviço Gemini
   * @param options Opções para a geração de texto
   * @returns Texto gerado
   */
  public async generateText(options: {
    prompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    try {
      // Passar para o serviço Gemini
      return await this.geminiService.generateText(
        options.prompt,
        options.temperature || 0.7,
        options.maxTokens
      );
    } catch (error: any) {
      console.error("Erro ao gerar texto com Gemini:", error);
      throw new Error(`Falha ao gerar texto: ${error.message || 'Erro desconhecido'}`);
    }
  }

  public async extractDataFromText(text: string, options: {
    systemPrompt?: string;
    responseFormat?: { type: string };
    temperature?: number;
    maxTokens?: number;
    extractFields?: string[]; // Campos específicos a serem extraídos
    documentType?: string; // Tipo de documento para contextualização
  }): Promise<any> {
    try {
      // Construir um prompt mais específico baseado nos campos solicitados e tipo de documento
      let enhancedPrompt = options.systemPrompt || 'Extraia dados do seguinte texto';
      
      // Se houver campos específicos, adicionar ao prompt
      if (options.extractFields && options.extractFields.length > 0) {
        enhancedPrompt += `\n\nExtraia especificamente os seguintes campos: ${options.extractFields.join(', ')}`;
      }
      
      // Se houver tipo de documento, adicionar contexto
      if (options.documentType) {
        enhancedPrompt += `\n\nO texto é proveniente de um documento do tipo: ${options.documentType}`;
      }
      
      // Usar Gemini para extrair dados do texto
      // Usar o método apropriado do GeminiService com suporte a maxTokens
      const result = await this.geminiService.generateText(
        enhancedPrompt + "\n\n" + text, 
        options.temperature || 0.2,
        options.maxTokens
      );
      
      return result;
    } catch (error: any) {
      console.error(`Erro ao extrair dados com Gemini:`, error);
      throw new Error(`Falha ao extrair dados: ${error.message || 'Erro desconhecido'}`);
    }
  }
  
  /**
   * Acesso ao cliente Mistral para casos específicos
   * (isto permite compatibilidade com código existente)
   * @returns Cliente Mistral
   * @deprecated Substituído pelo Gemini
   */
  public getMistralClient() {
    console.warn('getMistralClient foi descontinuado - usando Gemini em vez disso');
    throw new Error('Método não suportado: getMistralClient foi deprecado e removido');
  }
  
  /**
   * Reconhece e aprende um novo formato de documento
   * Esta função usa o Gemini para analisar documentos em formatos desconhecidos
   * e extrair informações relevantes mesmo quando o layout não é familiar
   * 
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @param fields Lista de campos a serem extraídos
   * @returns Dados extraídos do documento
   */
  public async learnNewDocumentFormat(
    fileBase64: string, 
    mimeType: string, 
    fields: string[]
  ): Promise<any> {
    // Esta funcionalidade usa recursos avançados disponíveis apenas no Gemini
    if (!this.geminiService.isConfigured()) {
      throw new Error("Aprendizado de novos formatos de documento requer o serviço Gemini");
    }
    
    console.log(`🧠 Iniciando análise e aprendizado de novo formato de documento...`);
    
    try {
      // Primeiro extrair texto do documento
      let extractedText = "";
      
      if (mimeType.includes('pdf')) {
        extractedText = await this.extractTextFromPDF(fileBase64);
      } else if (mimeType.includes('image')) {
        extractedText = await this.extractTextFromImage(fileBase64, mimeType);
      } else {
        throw new Error(`Tipo de documento não suportado: ${mimeType}`);
      }
      
      // Construir um prompt especializado para extração inteligente de dados
      const systemPrompt = `
        Você é um especialista em reconhecimento de documentos e extração de dados.
        Este é um novo formato de documento que você precisa analisar e extrair informações.
        
        Por favor, examine cuidadosamente o documento e extraia os seguintes campos:
        ${fields.map(field => `- ${field}`).join('\n')}
        
        Retorne o resultado como um JSON válido onde cada campo acima é uma chave.
        Se um campo não puder ser encontrado, use null como valor.
        
        Além disso, inclua uma seção "formatInfo" com:
        - Uma descrição do tipo de documento
        - Qualquer elemento distintivo que permita identificar este formato
        - Um nível de confiança (0-100) para cada campo extraído
      `;
      
      // Usar o Gemini para análise inteligente do documento
      const result = await this.extractDataFromText(extractedText, {
        systemPrompt,
        responseFormat: { type: "json_object" },
        temperature: 0.2,
        extractFields: fields,
        documentType: "unknown_format",
        maxTokens: 4096 // Usar um valor maior para extrações complexas
      });
      
      console.log(`✅ Novo formato de documento analisado com sucesso`);
      
      const extractedData = result.data || result;
      
      // Armazenar o conhecimento sobre este formato no RAG
      try {
        const formatInfo = extractedData.formatInfo || {
          type: "unknown_format",
          confidence: 70
        };
        
        await ragService.learnDocumentFormat(
          fileBase64,
          mimeType,
          extractedData,
          formatInfo
        );
        
        console.log('✅ Novo formato de documento armazenado no RAG');
      } catch (ragError) {
        console.error('⚠️ Erro ao armazenar formato no RAG:', ragError);
        // Continuar mesmo em caso de erro no RAG
      }
      
      // Retornar os dados extraídos e metadados sobre o formato do documento
      return {
        success: true,
        extractedData: extractedData,
        rawText: extractedText,
        fields: fields
      };
    } catch (error: any) {
      console.error(`❌ Erro no aprendizado de novo formato:`, error);
      return {
        success: false,
        error: "Falha na análise do novo formato de documento",
        details: error.message || "Erro desconhecido"
      };
    }
  }
}

// Exportar singleton para uso global
export const aiService = AIAdapter.getInstance();