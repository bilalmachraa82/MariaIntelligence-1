/**
 * Serviço adaptador para múltiplas APIs de IA
 * Fornece uma camada de abstração para acessar os diferentes serviços de IA
 * Suporta OpenRouter (Mistral-OCR), Gemini e RolmOCR
 */

import { GeminiService } from './gemini.service';
import { OpenRouterService } from './openrouter.service';
import { RolmService } from './rolm.service';
import { HandwritingDetector } from './handwriting-detector';
import { ragService } from './rag-enhanced.service';

// Enum para definir qual serviço de IA usar
export enum AIServiceType {
  GEMINI = 'gemini',
  OPENROUTER = 'openrouter',
  ROLM = 'rolm',
  AUTO = 'auto'
}

// Singleton para garantir que usamos a mesma instância em toda a aplicação
export class AIAdapter {
  private static instance: AIAdapter;
  
  // Serviços disponíveis
  private static services = {
    openrouter: new OpenRouterService(),
    gemini: new GeminiService(),
    rolm: new RolmService(),
  };
  
  // Valor padrão para o serviço de IA
  private static defaultName = process.env.PRIMARY_AI ?? "openrouter";
  
  // Detector de manuscritos
  private handwritingDetector = new HandwritingDetector();
  
  // Referências para fácil acesso
  public geminiService: GeminiService;
  public openRouterService: OpenRouterService;
  public rolmService: RolmService;
  
  private currentService: AIServiceType = AIServiceType.AUTO;
  
  private constructor() {
    // Inicializar referências aos serviços
    this.geminiService = AIAdapter.services.gemini;
    this.openRouterService = AIAdapter.services.openrouter;
    this.rolmService = AIAdapter.services.rolm;
    
    // Definir serviço primário com base na variável de ambiente
    const primaryAI = process.env.PRIMARY_AI || 'openrouter';
    if (primaryAI in AIServiceType) {
      this.currentService = primaryAI as AIServiceType;
    } else {
      this.currentService = AIServiceType.AUTO;
    }
    
    // Verificar configuração dos serviços
    if (process.env.OPENROUTER_API_KEY) {
      console.log("✅ OpenRouter API configurada corretamente");
    } else {
      console.warn("⚠️ OPENROUTER_API_KEY não está configurada. OCR via OpenRouter não funcionará.");
    }
    
    if (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      console.log("✅ Gemini API configurada corretamente");
    } else {
      console.warn("⚠️ Nenhuma chave de API do Gemini configurada. Funcionalidades de IA Gemini estarão limitadas.");
    }
    
    if (process.env.HF_TOKEN) {
      console.log("✅ Hugging Face Token configurado corretamente");
    } else {
      console.warn("⚠️ HF_TOKEN não está configurado. Processamento de manuscritos via RolmOCR não funcionará.");
    }
    
    console.log(`🤖 Serviço de IA primário configurado para: ${this.currentService}`);
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
    // Verificar se o serviço está disponível
    switch (serviceType) {
      case AIServiceType.GEMINI:
        if (!(process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
          throw new Error("GOOGLE_GEMINI_API_KEY não configurada. Não é possível usar o Gemini.");
        }
        break;
      case AIServiceType.OPENROUTER:
        if (!process.env.OPENROUTER_API_KEY) {
          throw new Error("OPENROUTER_API_KEY não configurada. Não é possível usar o OpenRouter.");
        }
        break;
      case AIServiceType.ROLM:
        if (!process.env.HF_TOKEN) {
          throw new Error("HF_TOKEN não configurado. Não é possível usar o RolmOCR.");
        }
        break;
      case AIServiceType.AUTO:
        // Verificar se pelo menos um serviço está disponível
        if (!this.isServiceAvailable()) {
          throw new Error("Nenhum serviço de IA está configurado. Configure pelo menos um serviço.");
        }
        break;
    }
    
    this.currentService = serviceType;
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
   * Define uma chave de API para um serviço específico
   * @param service Nome do serviço ('openrouter', 'gemini', 'rolm')
   * @param apiKey Chave de API
   * @returns Resultado da operação
   */
  public async setApiKey(service: string, apiKey: string): Promise<{success: boolean, message: string}> {
    try {
      if (!service || !apiKey) {
        return { 
          success: false, 
          message: 'Serviço e chave de API são obrigatórios' 
        };
      }
      
      service = service.toLowerCase();
      
      // Verificar qual serviço está sendo configurado
      switch (service) {
        case 'openrouter':
        case 'mistral':
          // Verificar se a chave é válida
          try {
            process.env.OPENROUTER_API_KEY = apiKey;
            // Testar a conexão
            const openRouterService = AIAdapter.services.openrouter;
            const testResult = await openRouterService.testConnection();
            
            if (testResult.success) {
              console.log('✅ OpenRouter API configurada com sucesso');
              return { 
                success: true, 
                message: 'OpenRouter API configurada com sucesso' 
              };
            } else {
              process.env.OPENROUTER_API_KEY = '';
              return { 
                success: false, 
                message: `Erro ao configurar OpenRouter: ${testResult.error || 'Chave inválida'}` 
              };
            }
          } catch (error) {
            process.env.OPENROUTER_API_KEY = '';
            return { 
              success: false, 
              message: `Erro ao configurar OpenRouter: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
            };
          }
          
        case 'gemini':
          // Verificar se a chave é válida
          try {
            process.env.GOOGLE_API_KEY = apiKey;
            // Testar a conexão
            const geminiService = AIAdapter.services.gemini;
            const testResult = await geminiService.testConnection();
            
            if (testResult.success) {
              console.log('✅ Gemini API configurada com sucesso');
              return { 
                success: true, 
                message: 'Gemini API configurada com sucesso' 
              };
            } else {
              process.env.GOOGLE_API_KEY = '';
              return { 
                success: false, 
                message: `Erro ao configurar Gemini: ${testResult.error || 'Chave inválida'}` 
              };
            }
          } catch (error) {
            process.env.GOOGLE_API_KEY = '';
            return { 
              success: false, 
              message: `Erro ao configurar Gemini: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
            };
          }
          
        case 'rolm':
        case 'huggingface':
          // Verificar se a chave é válida
          try {
            process.env.HF_TOKEN = apiKey;
            // Testar a conexão
            const rolmService = AIAdapter.services.rolm;
            const testResult = await rolmService.testConnection();
            
            if (testResult.success) {
              console.log('✅ RolmOCR API configurada com sucesso');
              return { 
                success: true, 
                message: 'RolmOCR API configurada com sucesso' 
              };
            } else {
              process.env.HF_TOKEN = '';
              return { 
                success: false, 
                message: `Erro ao configurar RolmOCR: ${testResult.error || 'Token inválido'}` 
              };
            }
          } catch (error) {
            process.env.HF_TOKEN = '';
            return { 
              success: false, 
              message: `Erro ao configurar RolmOCR: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
            };
          }
          
        default:
          return { 
            success: false, 
            message: `Serviço desconhecido: ${service}. Serviços suportados: openrouter, gemini, rolm` 
          };
      }
    } catch (error) {
      console.error('Erro ao definir chave de API:', error);
      return { 
        success: false, 
        message: `Erro ao definir chave de API: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      };
    }
  }
  
  /**
   * Testa a conexão com OpenRouter 
   * @returns Resultado do teste de conexão
   */
  public async testOpenRouterConnection(): Promise<{success: boolean, message: string}> {
    try {
      if (!process.env.OPENROUTER_API_KEY) {
        return { 
          success: false, 
          message: 'OPENROUTER_API_KEY não está configurada' 
        };
      }
      
      const openRouterService = AIAdapter.services.openrouter;
      const testResult = await openRouterService.testConnection();
      
      return testResult.success 
        ? { success: true, message: 'Conexão com OpenRouter bem-sucedida' }
        : { success: false, message: `Erro na conexão com OpenRouter: ${testResult.error}` };
    } catch (error) {
      return { 
        success: false, 
        message: `Erro ao testar conexão com OpenRouter: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      };
    }
  }
  
  /**
   * Obtém o serviço apropriado com base no nome ou configuração atual
   * @param name Nome do serviço a ser usado (opcional, usa o serviço padrão se não informado)
   * @returns O serviço apropriado
   */
  public getService(name: string = AIAdapter.defaultName): GeminiService | OpenRouterService | RolmService {
    // Se um nome for especificado, usar esse serviço
    if (name && name in AIAdapter.services) {
      return AIAdapter.services[name as keyof typeof AIAdapter.services];
    }
    
    // Se estiver no modo AUTO, determinar o melhor serviço
    if (this.currentService === AIServiceType.AUTO || !name) {
      // Prioridade: OpenRouter > Gemini > Rolm (conforme configuração PRIMARY_AI)
      if (process.env.OPENROUTER_API_KEY) {
        return AIAdapter.services.openrouter;
      } else if (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
        return AIAdapter.services.gemini;
      } else if (process.env.HF_TOKEN) {
        return AIAdapter.services.rolm;
      }
      
      // Se nenhum serviço estiver configurado, usar Gemini como fallback
      console.warn("⚠️ Nenhum serviço de IA configurado. Tentando usar Gemini como fallback.");
      return AIAdapter.services.gemini;
    }
    
    // Usar o serviço configurado
    return AIAdapter.services[this.currentService as keyof typeof AIAdapter.services] || AIAdapter.services.gemini;
  }
  
  /**
   * Verifica se algum serviço de IA está disponível
   * @returns True se tiver ao menos um serviço disponível
   */
  public isServiceAvailable(): boolean {
    return (
      (process.env.GOOGLE_GEMINI_API_KEY !== undefined && process.env.GOOGLE_GEMINI_API_KEY !== '') ||
      (process.env.GOOGLE_API_KEY !== undefined && process.env.GOOGLE_API_KEY !== '') ||
      (process.env.OPENROUTER_API_KEY !== undefined && process.env.OPENROUTER_API_KEY !== '') ||
      (process.env.HF_TOKEN !== undefined && process.env.HF_TOKEN !== '')
    );
  }
  
  // Métodos que encaminham as chamadas para o serviço apropriado
  
  /**
   * Extrai texto de um PDF em base64
   * @param pdfBase64 PDF codificado em base64
   * @param provider Provedor específico a ser usado (opcional)
   * @returns Texto extraído do documento
   */
  public async extractTextFromPDF(pdfBase64: string, provider?: string): Promise<string> {
    try {
      // Converter base64 para buffer se necessário
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      
      // Verificar se o documento contém manuscritos
      let handwritingScore = 0;
      try {
        handwritingScore = await this.handwritingDetector.analyzePdf(pdfBuffer);
        console.log(`📝 Pontuação de manuscrito: ${handwritingScore.toFixed(2)}`);
      } catch (detectorError) {
        console.warn('⚠️ Erro no detector de manuscritos:', detectorError);
        // Continuar mesmo se o detector falhar
      }
      
      // Determinar o provedor com base no conteúdo e configuração
      let selectedProvider = provider || '';
      
      // Se não especificado, escolher o melhor provedor com base no conteúdo
      if (!selectedProvider) {
        if (handwritingScore > 0.4 && process.env.HF_TOKEN) {
          selectedProvider = 'rolm'; // Usar Rolm para manuscritos
          console.log('🔍 Detectado texto manuscrito, usando RolmOCR');
        } else if (process.env.OPENROUTER_API_KEY) {
          selectedProvider = 'openrouter'; // Usar OpenRouter para PDFs normais
          console.log('🔍 Usando OpenRouter como provedor principal para OCR');
        } else {
          selectedProvider = 'gemini'; // Fallback para Gemini
          console.log('🔍 Fallback para Gemini para extração de texto');
        }
      }
      
      // Usar o provedor selecionado
      switch (selectedProvider) {
        case 'openrouter':
          try {
            const result = await this.openRouterService.ocrPdf(pdfBuffer);
            if (result.error) {
              throw new Error(result.error);
            }
            return result.full_text;
          } catch (openRouterError: any) {
            console.error('❌ Erro com OpenRouter, tentando fallback para Gemini:', openRouterError);
            return await this.geminiService.extractTextFromPDF(pdfBase64);
          }
          
        case 'rolm':
          try {
            const result = await this.rolmService.processHandwriting(pdfBuffer);
            if (result.error) {
              throw new Error(result.error);
            }
            return result.text;
          } catch (rolmError: any) {
            console.error('❌ Erro com RolmOCR, tentando fallback para OpenRouter:', rolmError);
            
            // Tentar OpenRouter como fallback
            if (process.env.OPENROUTER_API_KEY) {
              try {
                const result = await this.openRouterService.ocrPdf(pdfBuffer);
                if (result.error) {
                  throw new Error(result.error);
                }
                return result.full_text;
              } catch (openRouterError) {
                console.error('❌ Erro com OpenRouter, tentando fallback para Gemini:', openRouterError);
              }
            }
            
            // Último recurso: Gemini
            return await this.geminiService.extractTextFromPDF(pdfBase64);
          }
          
        case 'gemini':
        default:
          return await this.geminiService.extractTextFromPDF(pdfBase64);
      }
    } catch (error: any) {
      console.error(`❌ Erro ao extrair texto do PDF:`, error);
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
   * @param skipQualityCheck Se verdadeiro, faz uma extração mais rápida mas menos precisa
   * @returns Dados estruturados da reserva
   */
  public async parseReservationData(text: string, skipQualityCheck: boolean = false): Promise<any> {
    try {
      // Ignoramos o parâmetro skipQualityCheck no adaptador, pois o Gemini sempre usa extração de alta qualidade
      // Este parâmetro existe para compatibilidade com o código legado
      console.log(`📝 AIAdapter: Extraindo dados de reserva (skipQualityCheck=${skipQualityCheck})`);
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
   * Este método foi completamente removido.
   * Todos os serviços devem usar diretamente os métodos do Gemini.
   * @returns nunca
   * @throws Erro indicando que o método foi removido
   */
  public getMistralClient(): never {
    throw new Error('Método não suportado: todas as funcionalidades agora usam exclusivamente o Gemini');
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