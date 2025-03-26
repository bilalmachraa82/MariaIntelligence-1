
/**
 * Serviço para interação com o Google Gemini 2.5 Pro
 * Fornece funcionalidades para processamento de documentos, extração de dados e análises avançadas
 * 
 * Este serviço é projetado como substituto para o MistralService
 * mantendo compatibilidade de interfaces para facilitar a migração
 */

// Importações necessárias - comentadas para evitar erros até o pacote ser instalado
// import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Interface para tipos de modelos disponíveis
export enum GeminiModel {
  TEXT = 'gemini-1.5-pro',          // Para processamento de texto
  VISION = 'gemini-1.5-pro-vision', // Para processamento de imagens
  FLASH = 'gemini-1.5-flash',       // Versão mais rápida e mais barata
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
  private isInitialized: boolean = false;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.warn("GOOGLE_API_KEY não configurada. Algumas funcionalidades estarão indisponíveis.");
      // Criar mock para evitar erros
      this.mockInitialization();
    } else {
      this.initialize(apiKey);
      this.isInitialized = true;
    }
  }

  /**
   * Inicializa os modelos com a API key
   * @param apiKey Chave API do Google
   */
  private initialize(apiKey: string): void {
    try {
      // Comentado até a biblioteca ser instalada
      /*
      this.genAI = new GoogleGenerativeAI(apiKey);
      
      // Modelo padrão para processamento de texto
      this.defaultModel = this.genAI.getGenerativeModel({ 
        model: GeminiModel.TEXT,
        generationConfig: this.getGenerationConfig()
      });
      
      // Modelo para processamento de imagens
      this.visionModel = this.genAI.getGenerativeModel({ 
        model: GeminiModel.VISION,
        generationConfig: this.getGenerationConfig()
      });
      
      // Modelo mais rápido para tarefas simples
      this.flashModel = this.genAI.getGenerativeModel({ 
        model: GeminiModel.FLASH,
        generationConfig: this.getGenerationConfig(0.3)
      });
      */
      
      // Mock temporário até a biblioteca ser instalada
      this.mockInitialization();
    } catch (error) {
      console.error("Erro ao inicializar Gemini:", error);
      this.mockInitialization();
    }
  }
  
  /**
   * Cria implementações mock para desenvolvimento sem a biblioteca
   */
  private mockInitialization(): void {
    // Criar implementações mock para desenvolvimento
    this.genAI = {
      getGenerativeModel: () => ({
        generateContent: async () => ({
          response: { text: () => "Modelo mock - biblioteca não instalada" }
        }),
        startChat: () => ({})
      })
    } as GoogleGenerativeAIMock;
    
    this.defaultModel = this.genAI.getGenerativeModel({});
    this.visionModel = this.genAI.getGenerativeModel({});
    this.flashModel = this.genAI.getGenerativeModel({});
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
   * Verifica se o serviço está inicializado com uma chave API válida
   */
  private checkInitialization(): void {
    if (!this.isInitialized) {
      throw new Error('GOOGLE_API_KEY não configurada. Configure a chave API nas configurações.');
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
    
    try {
      // Truncar o PDF se for muito grande para evitar limites de token
      const truncatedPdfBase64 = pdfBase64.length > 500000 
        ? pdfBase64.substring(0, 500000) + "..." 
        : pdfBase64;
      
      // Use o modelo padrão para documentos extensos
      const result = await this.defaultModel.generateContent({
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
    
    try {
      // Verificar tamanho da imagem para evitar problemas com limites da API
      if (imageBase64.length > 1000000) {
        console.warn("Imagem muito grande, truncando para evitar limites de token");
        imageBase64 = imageBase64.substring(0, 1000000);
      }
      
      // Usar o modelo de visão para extrair texto da imagem
      const result = await this.visionModel.generateContent({
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
  }

  /**
   * Extrai dados estruturados de um texto de reserva
   * Compatível com a interface do MistralService
   * @param text Texto da reserva
   * @returns Objeto com os dados extraídos
   */
  async parseReservationData(text: string): Promise<any> {
    this.checkInitialization();
    
    try {
      const result = await this.defaultModel.generateContent({
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
    
    try {
      const result = await this.defaultModel.generateContent({
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
  }
  
  /**
   * Classifica o tipo de documento
   * Compatível com a interface do MistralService
   * @param text Texto extraído do documento
   * @returns Classificação do tipo de documento
   */
  async classifyDocument(text: string): Promise<any> {
    this.checkInitialization();
    
    try {
      // Usar o modelo mais rápido para classificação
      const result = await this.flashModel.generateContent({
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
    
    try {
      // Truncar dados se muito grandes
      const truncatedBase64 = fileBase64.length > 500000 
        ? fileBase64.substring(0, 500000) 
        : fileBase64;
      
      const result = await this.visionModel.generateContent({
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
  }
  
  /**
   * Processa um documento (PDF ou imagem) para extrair informações de reserva
   * Compatível com a interface do MistralService
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @returns Objeto com todos os dados extraídos
   */
  async processReservationDocument(fileBase64: string, mimeType: string): Promise<any> {
    // Determinar o tipo de arquivo
    const isPDF = mimeType.includes('pdf');
    
    // Extrair texto do documento
    let extractedText;
    try {
      if (isPDF) {
        extractedText = await this.extractTextFromPDF(fileBase64);
      } else {
        extractedText = await this.extractTextFromImage(fileBase64, mimeType);
      }
    } catch (error) {
      console.error("Erro na extração de texto:", error);
      return {
        success: false,
        error: "Falha na extração de texto",
        details: error.message
      };
    }
    
    // Analisar o documento visualmente (em paralelo)
    const visualAnalysisPromise = this.analyzeDocumentVisually(fileBase64, mimeType);
    
    // Extrair dados estruturados
    let structuredData;
    try {
      structuredData = await this.parseReservationData(extractedText);
    } catch (error) {
      console.error("Erro na extração de dados estruturados:", error);
      return {
        success: false,
        error: "Falha na extração de dados estruturados",
        details: error.message,
        rawText: extractedText
      };
    }
    
    // Obter resultado da análise visual
    const visualAnalysis = await visualAnalysisPromise;
    
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
  }
}
