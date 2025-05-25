/**
 * Serviço adaptador para múltiplas APIs de IA
 * Fornece uma camada de abstração para acessar os diferentes serviços de IA
 * Nova estrutura de prioridade para OCR:
 * 1. OpenRouter (Mistral-OCR) - serviço primário para OCR
 * 2. RolmOCR - especialista em conteúdo manuscrito
 * 3. Extrator nativo (pdf-parse) - fallback quando nenhum serviço de IA disponível
 * 
 * Gemini é mantido apenas para análise de BD, removido do pipeline OCR
 */

import { GeminiService } from './gemini.service';
import { OpenRouterService } from './openrouter.service';
import { RolmService } from './rolm.service';
import { HandwritingDetector } from './handwriting-detector';
import { ragService } from './rag-enhanced.service';
import pdfParse from 'pdf-parse';

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
  private static defaultName = process.env.PRIMARY_AI ?? "auto";
  
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
                message: `Erro ao configurar OpenRouter: ${testResult.message || 'Chave inválida'}` 
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
                message: `Erro ao configurar Gemini: ${testResult.message}` 
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
                message: `Erro ao configurar RolmOCR: ${testResult.message || 'Token inválido'}` 
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
        : { success: false, message: `Erro na conexão com OpenRouter: ${testResult.message}` };
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
      // Prioridade específica para OCR:
      // 1. OpenRouter (Mistral) para OCR principal
      // 2. RolmOCR para manuscritos 
      // 3. Gemini apenas como fallback para análise (removido do pipeline OCR)
      
      if (process.env.OPENROUTER_API_KEY) {
        console.log("🔄 Usando OpenRouter (Mistral) como serviço primário de OCR");
        return AIAdapter.services.openrouter;
      } else if (process.env.HF_TOKEN) {
        console.log("🔄 Usando RolmOCR como serviço primário de OCR");
        return AIAdapter.services.rolm;
      } else if (process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
        // Gemini é mantido apenas para análise de BD
        console.warn("⚠️ OpenRouter e RolmOCR não configurados. Gemini disponível apenas para análise de BD");
        return AIAdapter.services.gemini;
      }
      
      // Se nenhum serviço estiver configurado, usar extração nativa
      console.warn("⚠️ Nenhum serviço de IA configurado. Usando extrator nativo de PDF");
      // Fallback para Gemini como última opção
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
          selectedProvider = 'native'; // Usar extrator nativo como fallback (sem IA)
          console.log('🔍 Usando extrator nativo de PDF como fallback (sem IA)');
        }
      }
      
      // Criar uma função para extrair texto usando pdf-parse
      const extractWithPdfParse = async (): Promise<string> => {
        console.log('📝 Extraindo texto com pdf-parse (método nativo)');
        try {
          // Usar biblioteca pdf-parse importada no topo do arquivo
          const data = await pdfParse(pdfBuffer);
          return data.text || '';
        } catch (pdfParseError: any) {
          console.error('❌ Erro ao extrair texto com pdf-parse:', pdfParseError);
          throw new Error(`Falha na extração básica de texto: ${pdfParseError.message || 'Erro desconhecido'}`);
        }
      };
      
      // Armazenar falhas para relatório completo
      const failures: string[] = [];
      
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
            console.error('❌ Erro com OpenRouter:', openRouterError);
            failures.push(`OpenRouter: ${openRouterError.message}`);
            
            // Tentar Rolm se disponível
            if (process.env.HF_TOKEN) {
              try {
                const result = await this.rolmService.processHandwriting(pdfBuffer);
                if (result.error) {
                  throw new Error(result.error);
                }
                return result.text;
              } catch (rolmError: any) {
                console.error('❌ Erro com RolmOCR:', rolmError);
                failures.push(`RolmOCR: ${rolmError.message}`);
              }
            }
            
            // Último recurso: pdf-parse nativo
            console.log('📄 Usando extrator nativo como último recurso após falhas em outros serviços');
            return await extractWithPdfParse();
          }
          
        case 'rolm':
          try {
            const result = await this.rolmService.processHandwriting(pdfBuffer);
            if (result.error) {
              throw new Error(result.error);
            }
            return result.text;
          } catch (rolmError: any) {
            console.error('❌ Erro com RolmOCR:', rolmError);
            failures.push(`RolmOCR: ${rolmError.message}`);
            
            // Tentar OpenRouter como fallback
            if (process.env.OPENROUTER_API_KEY) {
              try {
                const result = await this.openRouterService.ocrPdf(pdfBuffer);
                if (result.error) {
                  throw new Error(result.error);
                }
                return result.full_text;
              } catch (openRouterError: any) {
                console.error('❌ Erro com OpenRouter:', openRouterError);
                failures.push(`OpenRouter: ${openRouterError.message}`);
              }
            }
            
            // Último recurso: pdf-parse nativo
            console.log('📄 Usando extrator nativo como último recurso após falhas em outros serviços');
            return await extractWithPdfParse();
          }
          
        case 'native':
          // Extração direta com pdf-parse (sem OCR)
          return await extractWithPdfParse();
          
        default:
          // Tentar todos os serviços em ordem de prioridade
          
          // 1. Tentar OpenRouter se disponível
          if (process.env.OPENROUTER_API_KEY) {
            try {
              const result = await this.openRouterService.ocrPdf(pdfBuffer);
              if (!result.error) {
                return result.full_text;
              }
              failures.push(`OpenRouter: ${result.error}`);
            } catch (error: any) {
              failures.push(`OpenRouter: ${error.message}`);
            }
          }
          
          // 2. Tentar RolmOCR se disponível
          if (process.env.HF_TOKEN) {
            try {
              const result = await this.rolmService.processHandwriting(pdfBuffer);
              if (!result.error) {
                return result.text;
              }
              failures.push(`RolmOCR: ${result.error}`);
            } catch (error: any) {
              failures.push(`RolmOCR: ${error.message}`);
            }
          }
          
          // 3. Último recurso: pdf-parse nativo
          console.log('📄 Todos os serviços OCR falharam, usando extrator nativo');
          return await extractWithPdfParse();
      }
    } catch (error: any) {
      console.error(`❌ Erro ao extrair texto do PDF:`, error);
      throw new Error(`Falha na extração de texto: ${error.message || 'Erro desconhecido'}`);
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
      const failures: string[] = [];
      
      // Converter base64 para buffer
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      
      // Determinar o serviço a ser usado com base na configuração atual
      switch (this.getCurrentService()) {
        case AIServiceType.OPENROUTER:
          if (!process.env.OPENROUTER_API_KEY) {
            throw new Error("OpenRouter API Key não configurada");
          }
          
          try {
            const result = await this.openRouterService.ocrImage(imageBuffer, mimeType);
            if (result.error) {
              throw new Error(result.error);
            }
            return result.full_text;
          } catch (error: any) {
            console.error('❌ Erro com OpenRouter:', error);
            failures.push(`OpenRouter: ${error.message}`);
            
            // Falhar para processamento nativo (não temos nativo para imagens)
            throw new Error(`OpenRouter falhou: ${error.message}`);
          }
          
        case AIServiceType.ROLM:
          if (!process.env.HF_TOKEN) {
            throw new Error("Hugging Face Token não configurado");
          }
          
          try {
            const result = await this.rolmService.processHandwritingImage(imageBuffer, mimeType);
            if (result.error) {
              throw new Error(result.error);
            }
            return result.text;
          } catch (error: any) {
            console.error('❌ Erro com RolmOCR:', error);
            failures.push(`RolmOCR: ${error.message}`);
            
            // Tentar OpenRouter como fallback
            if (process.env.OPENROUTER_API_KEY) {
              try {
                const result = await this.openRouterService.ocrImage(imageBuffer, mimeType);
                if (result.error) {
                  throw new Error(result.error);
                }
                return result.full_text;
              } catch (openRouterError: any) {
                console.error('❌ Erro com OpenRouter:', openRouterError);
                failures.push(`OpenRouter: ${openRouterError.message}`);
              }
            }
            
            // Não temos extrator nativo para imagens, falhar com erro
            throw new Error(`Todos os serviços OCR falharam: ${failures.join(', ')}`);
          }
        
        case AIServiceType.AUTO:
        default:
          // Tentar todos os serviços em ordem de prioridade
          
          // 1. Tentar OpenRouter se disponível
          if (process.env.OPENROUTER_API_KEY) {
            try {
              const result = await this.openRouterService.ocrImage(imageBuffer, mimeType);
              if (!result.error) {
                return result.full_text;
              }
              failures.push(`OpenRouter: ${result.error}`);
            } catch (error: any) {
              failures.push(`OpenRouter: ${error.message}`);
            }
          }
          
          // 2. Tentar RolmOCR se disponível
          if (process.env.HF_TOKEN) {
            try {
              const result = await this.rolmService.processHandwritingImage(imageBuffer, mimeType);
              if (!result.error) {
                return result.text;
              }
              failures.push(`RolmOCR: ${result.error}`);
            } catch (error: any) {
              failures.push(`RolmOCR: ${error.message}`);
            }
          }
          
          // Não temos extrator nativo para imagens, falhar com erro
          throw new Error(`Todos os serviços OCR falharam: ${failures.join(', ')}`);
      }
    } catch (error: any) {
      console.error(`❌ Erro ao extrair texto da imagem:`, error);
      throw new Error(`Falha na extração de texto da imagem: ${error.message || 'Erro desconhecido'}`);
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
      const serviceName = this.getCurrentService() === AIServiceType.AUTO ? 'automático' : this.getCurrentService();
      console.log(`📄 Processando documento ${mimeType} usando serviço: ${serviceName}`);
      
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
  /**
   * Retorna o cliente Gemini para uso em análise de dados
   * NOTA: Este método NÃO deve ser usado para OCR, apenas para análise de dados e interação com a IA
   * @returns Instância do serviço Gemini
   */
  public getGeminiClient(): GeminiService {
    return this.geminiService;
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

  /**
   * Processa múltiplas reservas usando Gemini 2.5 Flash como primário
   */
  async processMultipleReservations(filePath: string, textContent: string): Promise<{
    success: boolean;
    reservations: any[];
    documentType: string;
    missingData?: string[];
    requiresConfirmation: boolean;
  }> {
    try {
      console.log('🤖 Processando múltiplas reservas com Gemini 2.5 Flash...');
      
      // Detectar tipo de documento
      const documentType = this.detectDocumentType(textContent);
      console.log(`📋 Tipo detectado: ${documentType}`);
      
      // Extrair texto se necessário
      let extractedText = textContent;
      if (!extractedText || extractedText.length < 100) {
        const fs = require('fs');
        const pdf = require('pdf-parse');
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(pdfBuffer);
        extractedText = pdfData.text;
      }
      
      // Usar Gemini 2.5 Flash para análise
      const prompt = this.buildMultiReservationPrompt(documentType, extractedText);
      const result = await this.geminiService.generateText(prompt);
      
      // Parse da resposta JSON com tratamento de erro
      const cleanedResponse = this.cleanJsonResponse(result);
      console.log('🔍 Resposta limpa do Gemini:', cleanedResponse.substring(0, 500));
      
      let analysisResult;
      try {
        analysisResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do JSON:', parseError);
        console.log('📄 Resposta original:', result.substring(0, 500));
        
        // Tentar extrair JSON de forma mais robusta
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            analysisResult = JSON.parse(jsonMatch[0]);
          } catch (secondError) {
            console.error('❌ Falha no segundo parse:', secondError);
            throw new Error('Resposta do Gemini não é JSON válido');
          }
        } else {
          throw new Error('Nenhum JSON encontrado na resposta do Gemini');
        }
      }
      
      if (!analysisResult.reservations || analysisResult.reservations.length === 0) {
        return {
          success: false,
          reservations: [],
          documentType,
          requiresConfirmation: false
        };
      }
      
      // Processar e validar reservas
      const processedReservations = await this.processReservations(analysisResult.reservations);
      const missingData = this.identifyMissingData(processedReservations);
      
      return {
        success: true,
        reservations: processedReservations,
        documentType,
        missingData: missingData.length > 0 ? missingData : undefined,
        requiresConfirmation: missingData.length > 0
      };
      
    } catch (error) {
      console.error('❌ Erro no processamento Gemini:', error);
      return {
        success: false,
        reservations: [],
        documentType: 'unknown',
        requiresConfirmation: false
      };
    }
  }

  /**
   * Detecta tipo de documento baseado no conteúdo
   */
  private detectDocumentType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('entradas') && !lowerText.includes('saídas')) {
      return 'checkin';
    } else if (lowerText.includes('saídas') && !lowerText.includes('entradas')) {
      return 'checkout';
    } else if (lowerText.includes('entradas') && lowerText.includes('saídas')) {
      return 'mixed';
    } else if (lowerText.includes('controlo') || lowerText.includes('aroeira')) {
      return 'control';
    }
    
    return 'unknown';
  }

  /**
   * Constrói prompt especializado para múltiplas reservas
   */
  private buildMultiReservationPrompt(documentType: string, extractedText: string): string {
    const basePrompt = `
Você é um especialista em análise de documentos de hospedagem. Analise o texto fornecido e extraia TODAS as reservas encontradas.

INSTRUÇÕES ESPECÍFICAS:
1. Identifique TODAS as reservas no documento (normalmente 5-15 reservas)
2. Para cada reserva, extraia:
   - reference: Código de referência (ex: A169-4421916, A203-HM88FZ2EDE)
   - propertyName: Nome da propriedade/alojamento
   - guestName: Nome do hóspede principal
   - guestPhone: Telefone (se disponível)
   - guestEmail: Email (se disponível)
   - checkInDate: Data de check-in (formato YYYY-MM-DD)
   - checkOutDate: Data de check-out (formato YYYY-MM-DD)
   - adults: Número de adultos
   - children: Número de crianças
   - country: País de origem (se disponível)
   - status: Estado da reserva
   - platform: Plataforma (booking, airbnb, etc.)

FORMATO ESPECÍFICO PARA ${documentType.toUpperCase()}:`;

    let specificInstructions = '';
    switch (documentType) {
      case 'checkin':
        specificInstructions = `
3. Este é um documento de CHECK-IN (Entradas)
4. Procure por tabelas com colunas: Referência, Alojamento, Check in, Adultos, Crianças, Cliente, Hóspede, Telefone
5. Ignore linhas de cabeçalho e filtros`;
        break;
      case 'checkout':
        specificInstructions = `
3. Este é um documento de CHECK-OUT (Saídas)
4. Procure por tabelas com colunas: Referência, Alojamento, Check out, Adultos, Crianças, Cliente, Hóspede, Telefone
5. Ignore linhas de cabeçalho e filtros`;
        break;
      case 'control':
        specificInstructions = `
3. Este é um arquivo de CONTROLE por propriedade
4. Procure por listas de hóspedes com datas de entrada e saída
5. Formato pode ser menos tabular`;
        break;
      default:
        specificInstructions = `
3. Analise cuidadosamente a estrutura do documento
4. Procure por padrões de dados de reserva`;
    }

    return `${basePrompt}${specificInstructions}

FORMATO DE RESPOSTA JSON:
{
  "success": true,
  "totalReservations": 7,
  "reservations": [
    {
      "reference": "A169-4421916",
      "propertyName": "Almada 1 Bernardo T3",
      "guestName": "Adozinda Fortes",
      "guestPhone": "+44 7951 998541",
      "guestEmail": "zezafortes80@gmail.com",
      "checkInDate": "2025-05-22",
      "checkOutDate": "2025-05-25",
      "adults": 4,
      "children": 0,
      "country": "Reino Unido",
      "status": "confirmed",
      "platform": "booking"
    }
  ]
}

IMPORTANTE: 
- Responda APENAS com JSON válido
- Não adicione texto antes ou depois do JSON
- Se não encontrar dados, use string vazia ""
- Para números, use 0 se não encontrar

TEXTO DO DOCUMENTO:
${extractedText}`;
  }

  /**
   * Limpa resposta JSON
   */
  private cleanJsonResponse(response: string): string {
    let cleaned = response.replace(/```json/g, '').replace(/```/g, '');
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}') + 1;
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd);
    }
    
    return cleaned.trim();
  }

  /**
   * Processa reservas extraídas
   */
  private async processReservations(reservations: any[]): Promise<any[]> {
    const processed = [];
    
    for (const reservation of reservations) {
      const processedReservation = {
        reference: reservation.reference || '',
        propertyName: reservation.propertyName || '',
        guestName: reservation.guestName || '',
        guestPhone: reservation.guestPhone || '',
        guestEmail: reservation.guestEmail || '',
        checkInDate: this.formatDate(reservation.checkInDate),
        checkOutDate: this.formatDate(reservation.checkOutDate),
        numGuests: (reservation.adults || 0) + (reservation.children || 0),
        adults: reservation.adults || 0,
        children: reservation.children || 0,
        totalAmount: 0,
        platform: reservation.platform || 'manual',
        status: reservation.status || 'confirmed',
        notes: `Extraído via Gemini 2.5 Flash (${new Date().toLocaleDateString()})`,
        country: reservation.country || ''
      };
      
      processed.push(processedReservation);
    }
    
    return processed;
  }

  /**
   * Identifica dados em falta
   */
  private identifyMissingData(reservations: any[]): string[] {
    const missingData = new Set<string>();
    
    for (const reservation of reservations) {
      if (!reservation.guestPhone) missingData.add('Telefone');
      if (!reservation.guestEmail) missingData.add('Email');
      if (!reservation.totalAmount || reservation.totalAmount === 0) missingData.add('Valor da reserva');
    }
    
    return Array.from(missingData);
  }

  /**
   * Formata data para YYYY-MM-DD
   */
  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = dateStr.split('-');
      return `${year}-${month}-${day}`;
    }
    
    return dateStr;
  }
}

// Exportar singleton para uso global
export const aiService = AIAdapter.getInstance();