
/**
 * Serviço para interação com o Google Gemini 2.5 Pro
 * Fornece funcionalidades para processamento de documentos, extração de dados e análises avançadas
 * 
 * Este serviço é projetado como substituto para o MistralService
 * mantendo compatibilidade de interfaces para facilitar a migração
 */

// Importações necessárias
// Nota: Estamos usando implementação direta com fetch em vez da biblioteca oficial
// pois a implementação atual é mais robusta e inclui recursos de fallback/retry
import { rateLimiter } from './rate-limiter.service';
import crypto from 'crypto';

// Interface para tipos de modelos disponíveis
export enum GeminiModel {
  TEXT = 'gemini-1.5-pro',          // Para processamento de texto
  VISION = 'gemini-1.5-pro-vision', // Para processamento de imagens
  FLASH = 'gemini-1.5-flash',       // Versão mais rápida e mais barata
  AUDIO = 'gemini-2.5-pro-exp-03-25' // Experimental - Para processamento de áudio (inclui voz)
}

// Interface para configuração de geração
interface GenerationConfig {
  temperature: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  candidateCount?: number;
}

// Interface para geração de texto
interface TextGenerationParams {
  systemPrompt?: string;
  userPrompt: string;
  model?: GeminiModel;
  temperature?: number;
  maxOutputTokens?: number;
}

// Interface para processamento de imagem
interface ImageProcessingParams {
  textPrompt: string;
  imageBase64: string;
  mimeType: string;
  model?: GeminiModel;
  temperature?: number;
  maxOutputTokens?: number;
  responseFormat?: 'text' | 'json';
}

// Simulação de tipos para desenvolvimento sem a biblioteca instalada
interface GenerativeModelMock {
  generateContent(params: any): Promise<any>;
  startChat(params?: any): any;
}

interface GoogleGenerativeAIMock {
  getGenerativeModel(params: any): GenerativeModelMock;
}

export class GeminiService {
  private genAI: any; // GoogleGenerativeAI quando o pacote estiver disponível
  private defaultModel: any; // GenerativeModel
  private visionModel: any; // GenerativeModel
  private flashModel: any; // GenerativeModel
  private audioModel: any; // GenerativeModel para processamento de áudio
  private isInitialized: boolean = false;
  private apiKey: string = '';
  private isApiConnected: boolean = false;
  private maxRetries: number = 5; // Número máximo de tentativas para chamadas à API
  
  /**
   * Implementa um sistema de retry para chamadas à API
   * @param fn Função a ser executada com retry
   * @param maxRetries Número máximo de tentativas
   * @param delay Delay entre tentativas em ms
   * @returns Promise com o resultado da função
   */
  /**
   * Método para executar uma função com retry automático em caso de falha
   * Inclui suporte para fallback para modelos alternativos após esgotar as tentativas
   * @param fn Função assíncrona a ser executada
   * @param maxRetries Número máximo de tentativas (default: 5)
   * @param delay Atraso inicial entre tentativas em ms (default: 1000)
   * @param useFallbackModels Se deve tentar modelos alternativos após esgotar tentativas
   * @returns Resultado da função
   */
  private async withRetry<T>(
    fn: () => Promise<T>, 
    maxRetries: number = 5, 
    delay: number = 1000,
    useFallbackModels: boolean = true
  ): Promise<T> {
    let lastError: any;
    // Primeira fase: tentar com o modelo original
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt}/${maxRetries}`);
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Erros de autorização não devem ser retentados
        if (error.message && (
          error.message.includes('API key not valid') || 
          error.message.includes('invalid authentication') ||
          error.message.includes('permission denied')
        )) {
          console.error(`Erro de autorização na API Gemini:`, error.message);
          throw error; // Não retentar em caso de erro de autorização
        }
        
        console.warn(`Tentativa ${attempt}/${maxRetries} falhou: ${error.message}`);
        
        if (attempt < maxRetries) {
          // Delay exponencial com jitter
          const jitter = Math.random() * 500;
          const waitTime = (delay * Math.pow(1.5, attempt - 1)) + jitter;
          console.log(`Aguardando ${Math.round(waitTime)}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // Segunda fase: se configurado, tentar com modelo alternativo (Flash)
    if (useFallbackModels && this.flashModel) {
      console.log("⚠️ Tentando com modelo alternativo (Gemini Flash) após esgotar tentativas...");
      
      try {
        // Capturar o texto da função
        const fnText = fn.toString();
        
        // Criar uma nova função que usa o modelo alternativo
        let alternativeFn: () => Promise<T>;
        
        if (fnText.includes('this.defaultModel')) {
          // Substituir defaultModel por flashModel
          alternativeFn = new Function('return ' + fnText
            .replace(/this\.defaultModel/g, 'this.flashModel'))() as () => Promise<T>;
          
          // Vincular o 'this' corretamente
          alternativeFn = alternativeFn.bind(this);
          
          console.log("📊 Substituindo Gemini Pro por Gemini Flash");
          return await alternativeFn();
        } 
        else if (fnText.includes('this.visionModel')) {
          // Casos onde precisamos do modelo visual - tentar com o modelo padrão
          console.log("🖼️ Tarefa visual: Tentando com modelo padrão em vez do modelo de visão");
          alternativeFn = new Function('return ' + fnText
            .replace(/this\.visionModel/g, 'this.defaultModel'))() as () => Promise<T>;
          
          // Vincular o 'this' corretamente
          alternativeFn = alternativeFn.bind(this);
          
          return await alternativeFn();
        }
      } catch (fallbackError: any) {
        console.error("❌ Modelo alternativo também falhou:", fallbackError.message);
        // Atualizar lastError para incluir a falha do modelo alternativo
        lastError = new Error(`Falha em todos os modelos disponíveis. Original: ${lastError.message}, Alternativo: ${fallbackError.message}`);
      }
    }
    
    throw lastError || new Error("Falha em todas as tentativas");
  }
  
  /**
   * Valida a chave da API Gemini tentando obter a lista de modelos disponíveis
   * @param apiKey Chave API do Google Gemini
   * @returns Promise<boolean> indicando se a chave é válida
   */
  private async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      return await this.withRetry(async () => {
        console.log("Validando chave API Gemini...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        if (!response.ok) {
          console.error(`Erro na API Gemini: ${response.status} - ${response.statusText}`);
          throw new Error(`API retornou status ${response.status}`);
        }
        const data = await response.json();
        console.log(`✅ API Gemini válida - ${data.models?.length || 0} modelos disponíveis`);
        return true;
      }, this.maxRetries, 1000);
    } catch (error: any) {
      console.error("❌ Erro ao validar chave API do Gemini após várias tentativas:", error);
      return false;
    }
  }

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.warn("Nenhuma chave Gemini configurada (GOOGLE_GEMINI_API_KEY ou GOOGLE_API_KEY). Algumas funcionalidades estarão indisponíveis.");
      // Criar mock para evitar erros
      this.mockInitialization();
    } else {
      // Initialização inicial - a conexão real será testada assincronamente
      this.initialize(apiKey);
      // Não definimos isInitialized=true aqui, isso será feito após a validação da API
      // em validateApiKey callback (linha ~215)
    }
  }
  
  /**
   * Inicializa os modelos com uma chave API fornecida externamente
   * @param apiKey Chave API do Google Gemini
   */
  public initializeWithKey(apiKey: string): void {
    if (!apiKey) {
      throw new Error("Chave API inválida");
    }
    
    this.initialize(apiKey);
    // Não definimos isInitialized=true aqui, isso será feito após validação no método initialize
    console.log("Gemini Service: Inicializando com chave API fornecida, validação em andamento...");
  }

  /**
   * Inicializa os modelos com a API key
   * @param apiKey Chave API do Google
   */
  private initialize(apiKey: string): void {
    try {
      // Tentar integração direta com a API Gemini usando fetch
      // Em vez de usar a biblioteca @google/generative-ai, vamos usar fetch diretamente
      this.apiKey = apiKey;
      
      // Verificar se a chave API é válida de forma assíncrona
      this.validateApiKey(apiKey)
        .then(isValid => {
          this.isApiConnected = isValid;
          this.isInitialized = isValid;
          if (isValid) {
            console.log("✅ API Gemini conectada com sucesso");
            console.log("🚀 Usando implementação direta da API Gemini via fetch");
            
            // Inicializar modelos reais para API Gemini
            this.genAI = {
              getGenerativeModel: (params: any) => {
                return {
                  generateContent: async (requestParams: any) => {
                    const apiUrl = 'https://generativelanguage.googleapis.com/v1/models/' + 
                      (params.model || 'gemini-1.5-pro') + ':generateContent' + 
                      '?key=' + this.apiKey;
                    
                    const response = await fetch(apiUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(requestParams)
                    });
                    
                    if (!response.ok) {
                      const errorText = await response.text();
                      throw new Error(`API Gemini erro ${response.status}: ${errorText}`);
                    }
                    
                    const result = await response.json();
                    
                    return {
                      response: {
                        text: () => {
                          const candidates = result.candidates || [];
                          if (candidates.length === 0) {
                            throw new Error('Sem resposta da API Gemini');
                          }
                          
                          const content = candidates[0].content || {};
                          const parts = content.parts || [];
                          
                          // Extrair texto das partes
                          return parts.map((part: any) => part.text || '').join('');
                        }
                      }
                    };
                  }
                };
              }
            };
            
            // Inicializar os diferentes modelos
            this.defaultModel = this.genAI.getGenerativeModel({ model: GeminiModel.TEXT });
            this.visionModel = this.genAI.getGenerativeModel({ model: GeminiModel.VISION });
            this.flashModel = this.genAI.getGenerativeModel({ model: GeminiModel.FLASH });
            this.audioModel = this.genAI.getGenerativeModel({ model: GeminiModel.AUDIO });
          } else {
            console.error("❌ Chave API do Gemini inválida ou API indisponível");
            // Usar mock em caso de API inválida
            this.mockInitialization();
          }
        })
        .catch(error => {
          console.error("❌ Erro ao verificar Gemini API:", error);
          console.log("⚠️ Usando modo de simulação (mock) como fallback");
          this.mockInitialization();
        });
      
      // Configurar o serviço sem mock - será automaticamente conectado quando
      // a verificação da API for concluída com sucesso
      console.log("✅ Gemini API configurada corretamente");
    } catch (error) {
      console.error("Erro ao inicializar Gemini:", error);
      this.mockInitialization();
    }
  }
  
  /**
   * Cria implementações mock para desenvolvimento sem a biblioteca
   * Implementa mocks mais avançados que podem retornar dados úteis
   */
  private mockInitialization(): void {
    console.log("🔧 Inicializando GeminiService em modo mock (implementação direta da API em desenvolvimento)");
    
    // Criar implementações mock mais avançadas para desenvolvimento
    this.genAI = {
      getGenerativeModel: () => ({
        generateContent: async (params: any) => {
          // Examinar a entrada para determinar o tipo de resposta
          const inputContent = params?.contents?.[0]?.parts;
          const userPrompt = inputContent?.find((part: any) => part.text)?.text || "";
          // Verificar se userPrompt é realmente uma string antes de usar includes
          const userPromptStr = typeof userPrompt === 'string' ? userPrompt : "";
          
          // Verificar se há áudio na mensagem
          const hasAudio = inputContent?.some((part: any) => part.inlineData?.mimeType?.startsWith('audio/'));
          
          if (hasAudio) {
            // Mock para processamento de áudio
            return {
              response: { 
                text: () => "Transcrição de áudio (modo mock): Olá, gostaria de marcar uma reserva no apartamento Graça para o próximo fim de semana. Somos duas pessoas e ficaríamos de sexta a domingo. Meu nome é Carlos Silva e meu telefone é 919 876 543."
              }
            };
          } else if (userPromptStr.includes("Extraia todo o texto visível deste documento PDF")) {
            // Mock para extração de texto de PDF
            return {
              response: { 
                text: () => `
                  DOCUMENTO PROCESSADO POR GEMINI MOCK
                  
                  EXCITING LISBON SETE RIOS
                  Data entrada: 21/03/2025
                  Data saída: 23/03/2025
                  N.º noites: 2
                  Nome: Camila
                  N.º hóspedes: 4
                  País: Portugal
                  Site: Airbnb
                  Telefone: 351 925 073 494
                  
                  Data entrada: 16/04/2025
                  Data saída: 18/04/2025
                  N.º noites: 2
                  Nome: Laura
                  N.º hóspedes: 3
                  País: Espanha
                  Site: Airbnb
                  Telefone: +34 676 74 26 81
                  
                  Data entrada: 22/05/2025
                  Data saída: 25/05/2025
                  N.º noites: 3
                  Nome: Sarina
                  N.º hóspedes: 3
                  País: Suiça
                  Site: Airbnb
                  Telefone: +41 76 324 01 02
                `
              }
            };
          } else if (userPromptStr.includes("Extraia todo o texto visível nesta imagem")) {
            // Mock para extração de texto de imagem
            return {
              response: { 
                text: () => `
                  DOCUMENTO PROCESSADO POR GEMINI MOCK (IMAGEM)
                  
                  Reserva Confirmada
                  Propriedade: Apartamento Graça
                  Hóspede: João Silva
                  Check-in: 15/04/2025
                  Check-out: 20/04/2025
                  Valor: €450,00
                `
              }
            };
          } else if (userPromptStr.includes("Classifique o tipo deste documento")) {
            // Mock para classificação de documento
            return {
              response: { 
                text: () => JSON.stringify({
                  type: "reserva_airbnb",
                  confidence: 0.95,
                  details: "Documento de reserva do Airbnb com detalhes de hospedagem"
                })
              }
            };
          } else if (userPromptStr.includes("Analise este texto de reserva e extraia as informações")) {
            // Mock para extração de dados estruturados
            return {
              response: { 
                text: () => JSON.stringify({
                  propertyName: "Sete Rios",
                  guestName: "Camila",
                  guestEmail: "camila@example.com",
                  guestPhone: "351 925 073 494",
                  checkInDate: "2025-03-21",
                  checkOutDate: "2025-03-23",
                  numGuests: 4,
                  totalAmount: 250,
                  platform: "airbnb",
                  platformFee: 25,
                  cleaningFee: 30,
                  checkInFee: 15,
                  commissionFee: 20,
                  teamPayment: 50,
                  documentType: "reserva"
                })
              }
            };
          } else if (userPromptStr.includes("Verifique inconsistências")) {
            // Mock para validação de dados
            return {
              response: { 
                text: () => JSON.stringify({
                  valid: true,
                  data: params.contents[0].parts.find((p: any) => p.text?.includes('Dados:'))?.text || {},
                  issues: [],
                  corrections: []
                })
              }
            };
          } else {
            // Mock padrão para outras solicitações
            return {
              response: { 
                text: () => "Resposta simulada do Gemini (modo mock ativado)"
              }
            };
          }
        },
        startChat: () => ({
          sendMessage: async () => ({
            response: { text: () => "Resposta de chat simulada do Gemini (modo mock)" }
          })
        })
      })
    } as GoogleGenerativeAIMock;
    
    this.defaultModel = this.genAI.getGenerativeModel({});
    this.visionModel = this.genAI.getGenerativeModel({});
    this.flashModel = this.genAI.getGenerativeModel({});
    this.audioModel = this.genAI.getGenerativeModel({});
  }
  
  /**
   * Obtém configuração padrão para geração de conteúdo
   * @param temperature Temperatura para geração (0.0 a 1.0)
   * @returns Configuração de geração
   */
  private getGenerationConfig(temperature: number = 0.2): GenerationConfig {
    return {
      temperature: temperature,
      topK: 1,
      topP: 0.8,
      maxOutputTokens: 8192,
    };
  }

  /**
   * Verifica se o serviço está configurado com uma chave API válida
   * @returns Verdadeiro se o serviço estiver configurado
   */
  /**
   * Verifica se o serviço está configurado e conectado à API
   * Esta verificação é síncrona e retorna o estado atual
   * @returns Verdadeiro se o serviço estiver configurado e conectado
   */
  public isConfigured(): boolean {
    return this.isInitialized && this.isApiConnected;
  }
  
  /**
   * Verifica assincronamente se a API está conectada
   * Tenta estabelecer conexão se não estiver conectada
   * @returns Promise<boolean> indicando se a API está conectada
   */
  public async checkApiConnection(): Promise<boolean> {
    try {
      // Verificar no início - pode já estar conectado
      if (this.isApiConnected) {
        return true;
      }
      
      // Tentar validar a chave API
      if (this.apiKey) {
        const isValid = await this.validateApiKey(this.apiKey);
        this.isApiConnected = isValid;
        this.isInitialized = isValid;
        return isValid;
      }
      
      return false;
    } catch (error) {
      console.error("Erro ao verificar conexão da API Gemini:", error);
      return false;
    }
  }

  /**
   * Verifica se o serviço está inicializado com uma chave API válida
   */
  private checkInitialization(): void {
    if (!this.isInitialized) {
      throw new Error('Chave Gemini não configurada. Configure GOOGLE_GEMINI_API_KEY ou GOOGLE_API_KEY nas configurações.');
    }
  }

  /**
   * Gera um embedding para um texto usando o modelo Gemini
   * @param text Texto para gerar embedding
   * @returns Array de números representando o embedding
   */
  public async generateEmbeddings(text: string): Promise<any> {
    // Simplificada: em produção usaria uma API específica de embeddings
    const embeddingDimension = 768;
    const embedding: number[] = [];
    
    try {
      this.checkInitialization();
      
      // Criar um embedding simplificado baseado no texto
      const normalizedText = text.toLowerCase();
      
      // Preencher o vetor de embedding com valores baseados em características do texto
      for (let i = 0; i < embeddingDimension; i++) {
        const charCode = i < normalizedText.length ? normalizedText.charCodeAt(i % normalizedText.length) : 0;
        embedding.push((charCode / 255.0) * 2 - 1); // Normalizar para [-1, 1]
      }
      
      return {
        data: [
          {
            embedding: embedding
          }
        ]
      };
    } catch (error) {
      console.error('Erro ao gerar embedding:', error);
      throw error;
    }
  }

  /**
   * Extrai texto de um PDF em base64
   * Compatível com a interface do MistralService
   * @param pdfBase64 PDF codificado em base64
   * @returns Texto extraído do documento
   */
  async extractTextFromPDF(pdfBase64: string): Promise<string> {
    this.checkInitialization();
    
    // Criar a função que fará a chamada à API
    const extractTextFn = async (): Promise<string> => {
      try {
        // Truncar o PDF se for muito grande para evitar limites de token
        const truncatedPdfBase64 = pdfBase64.length > 500000 
          ? pdfBase64.substring(0, 500000) + "..." 
          : pdfBase64;
        
        // Use o modelo padrão para documentos extensos com retry
        const result = await this.withRetry(async () => {
          return await this.defaultModel.generateContent({
            contents: [
              {
                role: 'user',
                parts: [
                  { 
                    text: `Você é um especialista em OCR. Extraia todo o texto visível deste documento PDF em base64, 
                    organizando o texto por seções. Preserve tabelas e formatação estruturada.
                    Preste atenção especial em datas, valores monetários e informações de contato.`
                  },
                  { 
                    inlineData: { 
                      mimeType: 'application/pdf', 
                      data: truncatedPdfBase64 
                    } 
                  }
                ]
              }
            ]
          });
        });
        
        return result.response.text();
      } catch (error: any) {
        console.error("Erro ao extrair texto do PDF com Gemini:", error);
        
        // Tentar extrair parte do PDF se o erro for relacionado ao tamanho
        if (error.message?.includes("content too long")) {
          try {
            const result = await this.flashModel.generateContent({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: 'Extraia o texto das primeiras páginas deste PDF:' },
                    { 
                      inlineData: { 
                        mimeType: 'application/pdf', 
                        data: pdfBase64.substring(0, 100000) 
                      } 
                    }
                  ]
                }
              ]
            });
            
            return result.response.text() + "\n[NOTA: Documento truncado devido ao tamanho]";
          } catch (fallbackError) {
            console.error("Erro também na extração reduzida:", fallbackError);
          }
        }
        
        throw new Error(`Falha na extração de texto: ${error.message}`);
      }
    };
    
    // Calcular hash MD5 do PDF para usar como parte da chave de cache
    // Isso permite identificar PDFs idênticos mesmo se o nome for diferente
    const pdfHash = crypto
      .createHash('md5')
      .update(pdfBase64.substring(0, 10000)) // Usar apenas os primeiros 10KB para o hash
      .digest('hex');
    
    // Usar o rate limiter para controlar as chamadas à API
    // Usar um TTL de cache mais longo para PDFs (30 minutos) já que o conteúdo não muda
    const rateLimitedExtract = rateLimiter.rateLimitedFunction(
      extractTextFn,
      `extractTextFromPDF-${pdfHash}`,
      30 * 60 * 1000 // 30 minutos de TTL no cache
    );
    
    // Executar a função com controle de taxa
    return rateLimitedExtract();
  }

  /**
   * Extrai texto de uma imagem 
   * Compatível com a interface do MistralService
   * @param imageBase64 Imagem codificada em base64
   * @param mimeType Tipo MIME da imagem (ex: image/jpeg, image/png)
   * @returns Texto extraído da imagem
   */
  async extractTextFromImage(imageBase64: string, mimeType: string = "image/jpeg"): Promise<string> {
    this.checkInitialization();
    
    // Criar a função que fará a chamada à API
    const extractImageTextFn = async (): Promise<string> => {
      try {
        // Verificar tamanho da imagem para evitar problemas com limites da API
        if (imageBase64.length > 1000000) {
          console.warn("Imagem muito grande, truncando para evitar limites de token");
          imageBase64 = imageBase64.substring(0, 1000000);
        }
        
        // Usar o modelo de visão para extrair texto da imagem com retry
        const result = await this.withRetry(async () => {
          return await this.visionModel.generateContent({
            contents: [
              {
                role: 'user',
                parts: [
                  { 
                    text: `Extraia todo o texto visível nesta imagem, incluindo números, datas, nomes e valores monetários. 
                    Preste atenção especial a detalhes como informações de check-in/check-out, valor total e nome do hóspede. 
                    Preserve a estrutura do documento na sua resposta.` 
                  },
                  { 
                    inlineData: { 
                      mimeType: mimeType, 
                      data: imageBase64 
                    } 
                  }
                ]
              }
            ]
          });
        });
        
        return result.response.text();
      } catch (error: any) {
        console.error("Erro ao extrair texto da imagem com Gemini:", error);
        
        // Tentar com configurações reduzidas em caso de erro
        try {
          const result = await this.visionModel.generateContent({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: 'Extraia o texto principal desta imagem.' },
                  { 
                    inlineData: { 
                      mimeType: mimeType, 
                      data: imageBase64.substring(0, 500000)
                    } 
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1000
            }
          });
          
          return result.response.text() + "\n[NOTA: Processamento com qualidade reduzida]";
        } catch (fallbackError) {
          console.error("Erro também no processamento de fallback:", fallbackError);
          throw new Error(`Falha na extração de texto da imagem: ${error.message}`);
        }
      }
    };
    
    // Calcular hash MD5 da imagem para usar como parte da chave de cache
    // Isso permite identificar imagens idênticas mesmo se o nome for diferente
    const imageHash = crypto
      .createHash('md5')
      .update(imageBase64.substring(0, 5000)) // Usar apenas os primeiros 5KB para o hash
      .digest('hex');
    
    // Usar o rate limiter para controlar as chamadas à API
    // Usar um TTL de cache mais longo para imagens (20 minutos) já que o conteúdo não muda
    const rateLimitedExtract = rateLimiter.rateLimitedFunction(
      extractImageTextFn,
      `extractTextFromImage-${imageHash}`,
      20 * 60 * 1000 // 20 minutos de TTL no cache
    );
    
    // Executar a função com controle de taxa
    return rateLimitedExtract();
  }

  /**
   * Extrai dados estruturados de um texto de reserva
   * Compatível com a interface do MistralService
   * @param text Texto da reserva
   * @returns Objeto com os dados extraídos
   */
  async parseReservationData(text: string): Promise<any> {
    this.checkInitialization();
    
    // Criar a função que fará a chamada à API
    const parseDataFn = async (): Promise<any> => {
      try {
        const result = await this.withRetry(async () => {
          const response = await this.defaultModel.generateContent({
            contents: [
              {
                role: 'user',
                parts: [{ 
                  text: `Você é um especialista em extrair dados estruturados de textos de reservas.
                  Use o formato de data ISO (YYYY-MM-DD) para todas as datas.
                  Converta valores monetários para números decimais sem símbolos de moeda.
                  Se algum campo estiver ausente no texto, deixe-o como null ou string vazia.
                  Atribua a plataforma correta (airbnb/booking/direct/expedia/other) com base no contexto.
                  
                  Analise este texto de reserva e extraia as informações em formato JSON com os campos: 
                  propertyName, guestName, guestEmail, guestPhone, checkInDate (YYYY-MM-DD), checkOutDate (YYYY-MM-DD), 
                  numGuests, totalAmount, platform (airbnb/booking/direct/expedia/other), platformFee, cleaningFee, 
                  checkInFee, commissionFee, teamPayment.
                  
                  Se o texto contiver informação sobre várias propriedades, identifique corretamente qual é a propriedade 
                  que está sendo reservada.
                  
                  Texto da reserva:
                  ${text}`
                }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
            }
          });
          return response;
        });
        
        const content = result.response.text();
        
        // Tentar analisar o JSON com tratamento de erros
        let parsedData;
        try {
          // Extrair apenas a parte JSON da resposta
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : content;
          parsedData = JSON.parse(jsonString);
        } catch (jsonError) {
          console.error("Erro ao analisar JSON da resposta:", jsonError);
          return {}; // Retornar objeto vazio em caso de erro no parsing
        }
        
        // Garantir que os campos numéricos sejam processados corretamente
        const numericFields = ['totalAmount', 'platformFee', 'cleaningFee', 'checkInFee', 'commissionFee', 'teamPayment', 'numGuests'];
        numericFields.forEach(field => {
          if (parsedData[field]) {
            // Remover símbolos de moeda e converter para string
            const value = String(parsedData[field]).replace(/[€$£,]/g, '');
            parsedData[field] = value;
          }
        });
        
        return parsedData;
      } catch (error: any) {
        console.error("Erro ao extrair dados da reserva com Gemini:", error);
        throw new Error(`Falha na extração de dados: ${error.message}`);
      }
    };
    
    // Calcular hash MD5 do texto para usar como parte da chave de cache
    // Usar uma versão mais curta do texto para o hash, pois o texto completo pode ser muito longo
    // Isso permite identificar textos semelhantes para o cache
    const textHash = crypto
      .createHash('md5')
      .update(text.substring(0, 2000)) // Usar apenas os primeiros 2000 caracteres para o hash
      .digest('hex');
    
    // Usar o rate limiter para controlar as chamadas à API
    const rateLimitedParse = rateLimiter.rateLimitedFunction(
      parseDataFn,
      `parseReservationData-${textHash}`,
      15 * 60 * 1000 // 15 minutos de TTL no cache
    );
    
    // Executar a função com controle de taxa
    return rateLimitedParse();
  }

  /**
   * Valida dados de reserva contra regras de propriedade
   * Compatível com a interface do MistralService
   * @param data Dados da reserva
   * @param propertyRules Regras da propriedade
   * @returns Objeto com dados validados e possíveis correções
   */
  async validateReservationData(data: any, propertyRules: any): Promise<any> {
    this.checkInitialization();
    
    // Criar a função que fará a chamada à API
    const validateDataFn = async (): Promise<any> => {
      try {
        const result = await this.withRetry(async () => {
          return await this.defaultModel.generateContent({
            contents: [
              {
                role: 'user',
                parts: [{ 
                  text: `Você é um especialista em validação de dados de reservas.
                  Verifique inconsistências, valores faltantes e problemas potenciais.
                  Sugira correções quando necessário, mantendo os dados originais quando possível.
                  Verifique especialmente as datas (formato YYYY-MM-DD) e valores monetários.
                  
                  Valide estes dados de reserva contra as regras da propriedade e sugira correções se necessário:
                  
                  Dados: ${JSON.stringify(data)}
                  
                  Regras: ${JSON.stringify(propertyRules)}
                  
                  Retorne um objeto JSON com:
                  - valid: booleano indicando se os dados são válidos
                  - data: objeto com os dados corrigidos
                  - issues: array de strings descrevendo problemas encontrados
                  - corrections: array de strings descrevendo correções aplicadas`
                }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
            }
          });
        });
        
        const content = result.response.text();
        
        // Tentar analisar o JSON com tratamento de erros
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : content;
          return JSON.parse(jsonString);
        } catch (jsonError) {
          console.error("Erro ao analisar JSON da validação:", jsonError);
          return {
            valid: false,
            data: data,
            issues: ["Erro ao analisar resposta de validação"],
            corrections: []
          };
        }
      } catch (error: any) {
        console.error("Erro ao validar dados da reserva com Gemini:", error);
        throw new Error(`Falha na validação: ${error.message}`);
      }
    };
    
    // Calcular hash para usar como parte da chave de cache
    // Usando tanto os dados quanto as regras para garantir unicidade
    const dataHash = crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
      
    const rulesHash = crypto
      .createHash('md5')
      .update(JSON.stringify(propertyRules))
      .digest('hex');
    
    // Usar o rate limiter para controlar as chamadas à API
    const rateLimitedValidate = rateLimiter.rateLimitedFunction(
      validateDataFn,
      `validateReservationData-${dataHash.substring(0, 8)}-${rulesHash.substring(0, 8)}`,
      10 * 60 * 1000 // 10 minutos de TTL no cache
    );
    
    // Executar a função com controle de taxa
    return rateLimitedValidate();
  }
  
  /**
   * Classifica o tipo de documento
   * Compatível com a interface do MistralService
   * @param text Texto extraído do documento
   * @returns Classificação do tipo de documento
   */
  async classifyDocument(text: string): Promise<any> {
    this.checkInitialization();
    
    // Criar a função que fará a chamada à API
    const classifyDocumentFn = async (): Promise<any> => {
      try {
        // Usar o modelo mais rápido para classificação
        const result = await this.withRetry(async () => {
          return await this.flashModel.generateContent({
            contents: [
              {
                role: 'user',
                parts: [{ 
                  text: `Classifique o tipo deste documento com base no texto extraído. 
                  Possíveis categorias: reserva_airbnb, reserva_booking, reserva_expedia, reserva_direta, 
                  contrato_aluguel, fatura, recibo, documento_identificacao, outro.
                  
                  Retorne apenas um objeto JSON com: 
                  - type: string (o tipo de documento)
                  - confidence: number (confiança de 0 a 1)
                  - details: string (detalhes adicionais sobre o documento)
                  
                  Texto do documento:
                  ${text.substring(0, 3000)}` // Limitar tamanho para classificação
                }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
            }
          });
        });
        
        const content = result.response.text();
        
        // Tentar analisar o JSON com tratamento de erros
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : content;
          return JSON.parse(jsonString);
        } catch (jsonError) {
          console.error("Erro ao analisar JSON da classificação:", jsonError);
          return { 
            type: "desconhecido", 
            confidence: 0, 
            details: "Erro ao analisar resposta de classificação" 
          };
        }
      } catch (error: any) {
        console.error("Erro na classificação do documento com Gemini:", error);
        return { 
          type: "desconhecido", 
          confidence: 0, 
          details: `Erro na classificação: ${error.message}` 
        };
      }
    };
    
    // Calcular hash MD5 do texto para usar como parte da chave de cache
    // Isso permite identificar textos semelhantes para o cache
    const textHash = crypto
      .createHash('md5')
      .update(text.substring(0, 1000)) // Usar apenas os primeiros 1000 caracteres para o hash
      .digest('hex');
    
    // Usar o rate limiter para controlar as chamadas à API
    const rateLimitedClassify = rateLimiter.rateLimitedFunction(
      classifyDocumentFn,
      `classifyDocument-${textHash}`,
      10 * 60 * 1000 // 10 minutos de TTL no cache
    );
    
    // Executar a função com controle de taxa
    return rateLimitedClassify();
  }
  
  /**
   * Analisa visualmente um documento para detectar a plataforma e formato
   * Compatível com a interface do MistralService
   * @param fileBase64 Arquivo codificado em base64
   * @param mimeType Tipo MIME do arquivo (ex: application/pdf, image/jpeg)
   * @returns Análise visual do documento
   */
  async analyzeDocumentVisually(fileBase64: string, mimeType: string): Promise<any> {
    this.checkInitialization();
    
    // Criar a função que fará a chamada à API
    const analyzeVisuallyFn = async (): Promise<any> => {
      try {
        // Truncar dados se muito grandes
        const truncatedBase64 = fileBase64.length > 500000 
          ? fileBase64.substring(0, 500000) 
          : fileBase64;
        
        const result = await this.withRetry(async () => {
          return await this.visionModel.generateContent({
            contents: [
              { 
                role: 'user', 
                parts: [
                  { 
                    text: `Analise visualmente este documento e identifique:
                    1. Qual plataforma emitiu este documento? (Airbnb, Booking.com, Expedia, outro?)
                    2. Existe algum logo ou marca d'água identificável?
                    3. Qual é o formato/layout geral do documento?
                    4. É uma reserva, fatura, recibo ou outro tipo de documento?
                    
                    Responda em formato JSON com: platform, hasLogo, documentType, layout, confidence (de 0 a 1).`
                  },
                  { 
                    inlineData: { 
                      mimeType: mimeType, 
                      data: truncatedBase64
                    } 
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 600,
            }
          });
        });
        
        const content = result.response.text();
        
        // Tentar analisar o JSON com tratamento de erros
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : content;
          return JSON.parse(jsonString);
        } catch (jsonError) {
          console.error("Erro ao analisar JSON da análise visual:", jsonError);
          return { 
            platform: "unknown", 
            hasLogo: false, 
            documentType: "unknown",
            layout: "unknown",
            confidence: 0
          };
        }
      } catch (error: any) {
        console.error("Erro na análise visual com Gemini:", error);
        return { 
          platform: "error", 
          hasLogo: false, 
          documentType: "error",
          layout: "error",
          confidence: 0,
          error: error.message
        };
      }
    };
    
    // Calcular hash MD5 do documento para usar como parte da chave de cache
    const docHash = crypto
      .createHash('md5')
      .update(fileBase64.substring(0, 5000)) // Usar apenas os primeiros 5KB para o hash
      .digest('hex');
    
    // Usar o rate limiter para controlar as chamadas à API
    const rateLimitedAnalyze = rateLimiter.rateLimitedFunction(
      analyzeVisuallyFn,
      `analyzeDocumentVisually-${docHash}`,
      15 * 60 * 1000 // 15 minutos de TTL no cache
    );
    
    // Executar a função com controle de taxa
    return rateLimitedAnalyze();
  }
  
  /**
   * Processa um documento (PDF ou imagem) para extrair informações de reserva
   * Versão melhorada compatível com a interface do AIAdapter
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @returns Objeto com todos os dados extraídos
   */
  async processReservationDocument(fileBase64: string, mimeType: string): Promise<any> {
    this.checkInitialization();
    
    console.log(`🔍 GeminiService: Processando documento ${mimeType}`);
    
    // Determinar o tipo de arquivo
    const isPDF = mimeType.includes('pdf');
    
    // Extrair texto do documento
    let extractedText;
    try {
      console.log(`📄 Extraindo texto do ${isPDF ? 'PDF' : 'imagem'}...`);
      
      if (isPDF) {
        extractedText = await this.extractTextFromPDF(fileBase64);
      } else {
        extractedText = await this.extractTextFromImage(fileBase64, mimeType);
      }
      
      console.log(`✅ Texto extraído: ${extractedText.length} caracteres`);
      
      if (extractedText.length < 50) {
        console.warn("⚠️ Texto extraído muito curto, possível falha na extração");
        // Fallback quando o texto extraído é muito curto
        if (isPDF) {
          // Criar mensagem de erro mais detalhada para o usuário
          return {
            success: false,
            error: "Texto extraído do PDF muito curto ou vazio",
            details: "Verifique se o PDF contém texto selecionável ou use uma imagem do documento",
            extractedLength: extractedText.length
          };
        }
      }
    } catch (error: any) {
      console.error("❌ Erro na extração de texto:", error);
      return {
        success: false,
        error: "Falha na extração de texto",
        details: error.message || "Erro desconhecido na extração",
        service: "gemini"
      };
    }
    
    try {
      // Analisar o documento visualmente (em paralelo)
      console.log(`🔍 Analisando documento visualmente...`);
      const visualAnalysisPromise = this.analyzeDocumentVisually(fileBase64, mimeType);
      
      // Extrair dados estruturados
      console.log(`🔍 Extraindo dados estruturados do texto...`);
      let structuredData;
      try {
        structuredData = await this.parseReservationData(extractedText);
        console.log(`✅ Dados estruturados extraídos com sucesso`);
      } catch (structuredError: any) {
        console.error("❌ Erro na extração de dados estruturados:", structuredError);
        return {
          success: false,
          error: "Falha na extração de dados estruturados",
          details: structuredError.message || "Erro desconhecido",
          rawText: extractedText,
          service: "gemini"
        };
      }
      
      // Obter resultado da análise visual
      let visualAnalysis;
      try {
        visualAnalysis = await visualAnalysisPromise;
      } catch (visualError) {
        console.warn("⚠️ Erro na análise visual, usando resultado padrão");
        visualAnalysis = { 
          type: isPDF ? "reserva_pdf" : "reserva_imagem", 
          confidence: 0.5,
          details: "Análise visual falhou, usando tipo padrão"
        };
      }
      
      // Garantir que todos os campos requeridos estejam presentes
      const requiredFields = ['propertyName', 'guestName', 'checkInDate', 'checkOutDate'];
      const missingFields = requiredFields.filter(field => !structuredData[field]);
      
      if (missingFields.length > 0) {
        console.warn(`⚠️ Dados incompletos. Campos ausentes: ${missingFields.join(', ')}`);
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
          isPDF,
          service: "gemini"
        }
      };
    } catch (error: any) {
      console.error("❌ Erro geral no processamento:", error);
      return {
        success: false,
        error: "Falha no processamento do documento",
        details: error.message || "Erro desconhecido",
        rawText: extractedText,
        service: "gemini"
      };
    }
  }
  
  /**
   * Gera texto a partir de um prompt simples
   * @param prompt Texto do prompt 
   * @param temperature Temperatura para controlar aleatoriedade (0.0 a 1.0)
   * @param maxTokens Número máximo de tokens de saída
   * @returns Texto gerado
   */
  async generateText(prompt: string | TextGenerationParams, temperature: number = 0.3, maxTokens?: number): Promise<string> {
    this.checkInitialization();
    
    // Verificar se o parâmetro é um objeto ou uma string
    let systemPrompt: string | undefined;
    let userPrompt: string;
    let modelType: GeminiModel = GeminiModel.TEXT;
    let tempValue = temperature;
    let maxOutputTokens = maxTokens || 1024;
    
    if (typeof prompt === 'object') {
      systemPrompt = prompt.systemPrompt;
      userPrompt = prompt.userPrompt;
      modelType = prompt.model || GeminiModel.TEXT;
      tempValue = prompt.temperature || temperature;
      maxOutputTokens = prompt.maxOutputTokens || maxTokens || 1024;
    } else {
      userPrompt = prompt;
    }
    
    // Criar a função que fará a chamada à API
    const generateTextFn = async (): Promise<string> => {
      try {
        // Remover qualquer timestamp existente para evitar conflitos
        const cleanPrompt = userPrompt.replace(/\nTimestamp: \d+$/g, '');
        
        const result = await this.withRetry(async () => {
          return await this.defaultModel.generateContent({
            contents: [
              {
                role: 'user',
                parts: [{ text: cleanPrompt }]
              }
            ],
            generationConfig: { 
              temperature,
              maxOutputTokens: maxTokens || 2048
            }
          });
        });
        
        return result.response.text();
      } catch (error: any) {
        console.error("Erro ao gerar texto com Gemini:", error);
        throw new Error(`Falha na geração de texto: ${error.message}`);
      }
    };
    
    // Gerar um identificador único baseado nos detalhes da solicitação, mas com o prompt limpo de timestamps
    // Este identificador será usado como parte da chave de cache
    const promptString = typeof prompt === 'string' ? prompt : prompt.userPrompt;
    const querySignature = crypto
      .createHash('md5')
      .update(promptString.replace(/\nTimestamp: \d+$/g, '') + temperature + (maxTokens || 2048))
      .digest('hex')
      .substring(0, 8);
    
    // Usar o rate limiter para controlar as chamadas à API
    // O Gemini permite 5 chamadas por minuto para contas gratuitas
    const rateLimitedGenerate = rateLimiter.rateLimitedFunction(
      generateTextFn,
      `generateText-${querySignature}`,
      5 * 60 * 1000 // 5 minutos de TTL no cache
    );
    
    // Executar a função com controle de taxa
    return rateLimitedGenerate();
  }
  
  /**
   * Processa conteúdo de imagem usando o modelo de visão
   * @param params Parâmetros para processamento de imagem
   * @returns Texto ou JSON extraído da imagem
   */
  async processImageContent(params: ImageProcessingParams): Promise<any> {
    this.checkInitialization();
    
    const {
      textPrompt,
      imageBase64,
      mimeType,
      model = GeminiModel.VISION,
      temperature = 0.2,
      maxOutputTokens = 1024,
      responseFormat = 'text'
    } = params;
    
    // Truncar a imagem se for muito grande
    const truncatedImage = imageBase64.length > 1000000 ? imageBase64.substring(0, 1000000) : imageBase64;
    
    // Criar a função que fará a chamada à API
    const processImageFn = async (): Promise<string> => {
      try {
        const generationConfig = {
          temperature,
          maxOutputTokens: maxOutputTokens || 1024,
          ...(responseFormat === 'json' ? { responseFormat: { type: "json_object" } } : {})
        };
        
        const targetModel = model === GeminiModel.VISION ? this.visionModel : this.defaultModel;
        
        const result = await this.withRetry(async () => {
          return await targetModel.generateContent({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: textPrompt },
                  { 
                    inlineData: { 
                      mimeType: mimeType, 
                      data: truncatedImage
                    } 
                  }
                ]
              }
            ],
            generationConfig
          });
        });
        
        const responseText = result.response.text();
        
        // Se o formato de resposta for JSON, tentar fazer o parse
        if (responseFormat === 'json') {
          try {
            // Tentar extrair apenas a parte JSON da resposta
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : responseText;
            return JSON.parse(jsonString);
          } catch (jsonError) {
            console.error("Erro ao analisar JSON de resposta de imagem:", jsonError);
            // Retornar o texto original se falhar
            return responseText;
          }
        }
        
        return responseText;
      } catch (error: any) {
        console.error("Erro ao processar imagem com Gemini:", error);
        throw new Error(`Falha no processamento de imagem: ${error.message}`);
      }
    };
    
    // Calcular hash MD5 da imagem para usar como parte da chave de cache
    const imageHash = crypto
      .createHash('md5')
      .update(truncatedImage.substring(0, 5000)) // Usar apenas os primeiros 5KB para o hash
      .digest('hex')
      .substring(0, 8);
    
    // Calcular hash do prompt para diferenciar diferentes prompts na mesma imagem
    const promptHash = crypto
      .createHash('md5')
      .update(textPrompt)
      .digest('hex')
      .substring(0, 8);
    
    // Usar o rate limiter para controlar as chamadas à API
    const rateLimitedProcess = rateLimiter.rateLimitedFunction(
      processImageFn,
      `processImage-${imageHash}-${promptHash}`,
      10 * 60 * 1000 // 10 minutos de TTL no cache
    );
    
    // Executar a função com controle de taxa
    return rateLimitedProcess();
  }
  
  /**
   * Gera saída estruturada a partir de um prompt
   * @param params Parâmetros para geração de texto estruturado
   * @returns Objeto estruturado extraído do texto
   */
  async generateStructuredOutput(params: TextGenerationParams): Promise<any> {
    this.checkInitialization();
    
    const {
      systemPrompt,
      userPrompt,
      model = GeminiModel.FLASH,
      temperature = 0.1,
      maxOutputTokens = 1024
    } = params;
    
    // Criar a função que fará a chamada à API
    const generateStructuredFn = async (): Promise<any> => {
      try {
        let contents = [];
        
        // Adicionar prompt do sistema se fornecido
        if (systemPrompt) {
          contents.push({
            role: 'system',
            parts: [{ text: systemPrompt }]
          });
        }
        
        // Adicionar prompt do usuário
        contents.push({
          role: 'user',
          parts: [{ text: userPrompt }]
        });
        
        const targetModel = model === GeminiModel.VISION ? this.visionModel : 
                           model === GeminiModel.FLASH ? this.flashModel : 
                           this.defaultModel;
        
        const result = await this.withRetry(async () => {
          return await targetModel.generateContent({
            contents,
            generationConfig: {
              temperature,
              maxOutputTokens,
              responseFormat: { type: "json_object" }
            }
          });
        });
        
        const responseText = result.response.text();
        
        try {
          // Tentar extrair apenas a parte JSON da resposta
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : responseText;
          return JSON.parse(jsonString);
        } catch (jsonError) {
          console.error("Erro ao analisar JSON de resposta estruturada:", jsonError);
          // Retornar um objeto vazio com a resposta em texto
          return { 
            error: "Falha ao analisar resposta JSON", 
            rawResponse: responseText 
          };
        }
      } catch (error: any) {
        console.error("Erro ao gerar saída estruturada com Gemini:", error);
        throw new Error(`Falha na geração de saída estruturada: ${error.message}`);
      }
    };
    
    // Calcular hash do prompt para usar como parte da chave de cache
    const promptHash = crypto
      .createHash('md5')
      .update(userPrompt + (systemPrompt || ''))
      .digest('hex')
      .substring(0, 12);
    
    // Usar o rate limiter para controlar as chamadas à API
    const rateLimitedGenerate = rateLimiter.rateLimitedFunction(
      generateStructuredFn,
      `generateStructured-${promptHash}`,
      5 * 60 * 1000 // 5 minutos de TTL no cache
    );
    
    // Executar a função com controle de taxa
    return rateLimitedGenerate();
  }
  
  /**
   * Analisa um documento em formato desconhecido e aprende seu layout
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @param fields Campos a serem extraídos
   * @returns Dados extraídos e informações sobre o formato
   */
  async learnDocumentFormat(
    fileBase64: string,
    mimeType: string,
    fields: string[]
  ): Promise<any> {
    this.checkInitialization();
    
    // Criar a função que fará a chamada à API
    const learnFormatFn = async (): Promise<any> => {
      try {
        console.log(`🧠 GeminiService: Aprendendo formato de documento...`);
        
        // Determinar o tipo de arquivo e técnica de extração apropriada
        const isPDF = mimeType.includes('pdf');
        
        // Extrair texto do documento
        let extractedText = '';
        try {
          if (isPDF) {
            extractedText = await this.extractTextFromPDF(fileBase64);
          } else if (mimeType.includes('image')) {
            extractedText = await this.extractTextFromImage(fileBase64, mimeType);
          } else {
            throw new Error(`Tipo de documento não suportado: ${mimeType}`);
          }
        } catch (extractionError) {
          console.warn(`Aviso: Erro na extração de texto, usando análise visual apenas`, extractionError);
        }
        
        // Construir prompt especializado para reconhecimento de documentos
        const prompt = `
          Você é um especialista em reconhecimento de documentos.
          Este é um novo formato de documento que precisamos aprender a interpretar.
          
          Analise cuidadosamente o documento e extraia os seguintes campos:
          ${fields.map(field => `- ${field}`).join('\n')}
          
          Além de extrair os dados, forneça:
          1. Uma descrição do tipo/formato do documento
          2. Identificadores visuais e textuais que permitem reconhecer este formato no futuro
          3. Um nível de confiança para cada campo extraído (0-100%)
          
          Responda em formato JSON com as propriedades:
          - data: objeto com os campos extraídos
          - formatInfo: objeto com detalhes do formato (type, identifiers, description)
          - confidence: número de 0 a 1 indicando a confiança geral da extração
        `;
        
        // Usar o modelo de visão para análise completa (visual + texto)
        const result = await this.withRetry(async () => {
          return await this.visionModel.generateContent({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  { 
                    inlineData: { 
                      mimeType: mimeType, 
                      data: fileBase64.length > 1000000 ? fileBase64.substring(0, 1000000) : fileBase64 
                    } 
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 4096,
            }
          });
        });
        
        const content = result.response.text();
        
        // Processar a resposta JSON
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : content;
          const parsedResult = JSON.parse(jsonString);
          
          console.log(`✅ GeminiService: Formato de documento aprendido com sucesso`);
          
          // Adicionar o texto extraído ao resultado
          return {
            ...parsedResult,
            rawText: extractedText
          };
        } catch (jsonError) {
          console.error("Erro ao analisar resposta JSON:", jsonError);
          return {
            data: {},
            formatInfo: {
              type: "unknown",
              description: "Formato desconhecido - erro na análise",
              identifiers: []
            },
            confidence: 0,
            rawText: extractedText,
            error: "Falha ao analisar resposta"
          };
        }
      } catch (error: any) {
        console.error("Erro ao aprender formato de documento:", error);
        throw new Error(`Falha ao aprender formato: ${error.message}`);
      }
    };
    
    // Calcular hash MD5 dos campos e do documento para usar como parte da chave de cache
    const fieldsHash = crypto
      .createHash('md5')
      .update(fields.join(','))
      .digest('hex');
      
    const docHash = crypto
      .createHash('md5')
      .update(fileBase64.substring(0, 5000)) // Usar apenas os primeiros 5KB para o hash
      .digest('hex');
    
    // Usar o rate limiter para controlar as chamadas à API
    // Os dados de aprendizado são importantes e menos frequentes, então usamos um TTL mais longo
    const rateLimitedLearn = rateLimiter.rateLimitedFunction(
      learnFormatFn,
      `learnDocumentFormat-${fieldsHash}-${docHash}`,
      60 * 60 * 1000 // 60 minutos de TTL no cache
    );
    
    // Executar a função com controle de taxa
    return rateLimitedLearn();
  }
}
