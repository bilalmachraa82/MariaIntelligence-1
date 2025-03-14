
import { Mistral } from "@mistralai/mistralai";

/**
 * Serviço para interação com a Mistral AI
 * Fornece funcionalidades para OCR, extração de dados estruturados e validação
 */
export class MistralService {
  private client: Mistral;
  private isInitialized: boolean = false;

  constructor() {
    const apiKey = process.env.MISTRAL_API_KEY;
    
    if (!apiKey) {
      console.warn("MISTRAL_API_KEY não configurada. Algumas funcionalidades estarão indisponíveis.");
      this.client = new Mistral({ apiKey: "" }); // Cliente inválido, será verificado antes do uso
    } else {
      this.client = new Mistral({ apiKey });
      this.isInitialized = true;
    }
  }

  /**
   * Verifica se o cliente Mistral está inicializado com uma chave API válida
   */
  private checkInitialization(): void {
    if (!this.isInitialized) {
      throw new Error('MISTRAL_API_KEY não configurada. Configure a chave API nas configurações.');
    }
  }

  /**
   * Extrai texto de um PDF em base64
   * @param pdfBase64 PDF codificado em base64
   * @returns Texto extraído do documento
   */
  async extractTextFromPDF(pdfBase64: string): Promise<string> {
    this.checkInitialization();
    
    try {
      // Truncar o PDF se for muito grande (para evitar limites de token)
      const truncatedPdfBase64 = pdfBase64.length > 500000 
        ? pdfBase64.substring(0, 500000) + "..." 
        : pdfBase64;
        
      const response = await this.client.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em OCR. Extraia todo o texto visível deste documento PDF em base64 sem interpretações adicionais.
            Organize o texto por seções conforme o layout do documento original.
            Preserva tabelas e formatação estruturada quando possível.
            Preste atenção especial em datas, valores monetários e informações de contato.`
          },
          {
            role: "user",
            content: `Extraia o texto completo deste PDF:\n\n${truncatedPdfBase64}`
          }
        ],
        temperature: 0.1,
        maxTokens: 4000
      });

      // Lidar corretamente com o tipo de retorno
      const content = response.choices && response.choices[0]?.message?.content;
      return typeof content === 'string' ? content : "Não foi possível extrair o texto.";
    } catch (error: any) {
      console.error("Erro ao extrair texto do PDF:", error);
      
      // Tentar novamente com um modelo mais leve se for problema de capacidade
      if (error.message?.includes("maximum context") || error.message?.includes("token limit")) {
        console.log("Tentando extração com modelo menor...");
        const response = await this.client.chat.complete({
          model: "mistral-small-latest",
          messages: [
            {
              role: "system",
              content: "Extraia todo o texto visível deste documento PDF."
            },
            {
              role: "user",
              content: `Extraia o texto das primeiras páginas deste PDF:\n\n${pdfBase64.substring(0, 100000)}...`
            }
          ],
          temperature: 0.1,
          maxTokens: 2000
        });
        
        // Lidar corretamente com o tipo de retorno
        const fallbackContent = response.choices && response.choices[0]?.message?.content;
        const extractedText = typeof fallbackContent === 'string' ? fallbackContent : "Texto não extraído";
        return extractedText + "\n[NOTA: Documento truncado devido ao tamanho]";
      }
      
      throw new Error(`Falha na extração de texto: ${error.message}`);
    }
  }

  /**
   * Extrai dados estruturados de um texto de reserva
   * @param text Texto da reserva
   * @returns Objeto com os dados extraídos
   */
  async parseReservationData(text: string): Promise<any> {
    this.checkInitialization();
    
    try {
      const response = await this.client.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em extrair dados estruturados de textos de reservas.
            Use o formato de data ISO (YYYY-MM-DD) para todas as datas.
            Converta valores monetários para números decimais sem símbolos de moeda.
            Se algum campo estiver ausente no texto, deixe-o como null ou string vazia.
            Atribua a plataforma correta (airbnb/booking/direct/expedia/other) com base no contexto.`
          },
          {
            role: "user",
            content: `Analise este texto de reserva e extraia as informações em formato JSON com os campos: 
            propertyName, guestName, guestEmail, guestPhone, checkInDate (YYYY-MM-DD), checkOutDate (YYYY-MM-DD), 
            numGuests, totalAmount, platform (airbnb/booking/direct/expedia/other), platformFee, cleaningFee, 
            checkInFee, commissionFee, teamPayment.
            
            Se o texto contiver informação sobre várias propriedades, identifique corretamente qual é a propriedade 
            que está sendo reservada.
            
            Texto da reserva:
            ${text}`
          }
        ],
        temperature: 0.1,
        responseFormat: { type: "json_object" }
      });

      // Extrair e verificar o conteúdo da resposta
      const content = response.choices && response.choices[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        console.warn("Aviso: Resposta vazia ou inválida do modelo Mistral");
        return {}; // Retornar objeto vazio se não houver resposta válida
      }
      
      // Analisar o JSON com tratamento de erros
      let parsedData;
      try {
        parsedData = JSON.parse(content);
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
      console.error("Erro ao extrair dados da reserva:", error);
      throw new Error(`Falha na extração de dados: ${error.message}`);
    }
  }

  /**
   * Valida dados de reserva contra regras de propriedade
   * @param data Dados da reserva
   * @param propertyRules Regras da propriedade
   * @returns Objeto com dados validados e possíveis correções
   */
  async validateReservationData(data: any, propertyRules: any): Promise<any> {
    this.checkInitialization();
    
    try {
      const response = await this.client.chat.complete({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em validação de dados de reservas.
            Verifique inconsistências, valores faltantes e problemas potenciais.
            Sugira correções quando necessário, mantendo os dados originais quando possível.
            Verifique especialmente as datas (formato YYYY-MM-DD) e valores monetários.`
          },
          {
            role: "user",
            content: `Valide estes dados de reserva contra as regras da propriedade e sugira correções se necessário:
            
            Dados: ${JSON.stringify(data)}
            
            Regras: ${JSON.stringify(propertyRules)}
            
            Retorne um objeto JSON com:
            - valid: booleano indicando se os dados são válidos
            - data: objeto com os dados corrigidos
            - issues: array de strings descrevendo problemas encontrados
            - corrections: array de strings descrevendo correções aplicadas`
          }
        ],
        temperature: 0.1,
        responseFormat: { type: "json_object" }
      });

      const content = response.choices && response.choices[0]?.message?.content;
      return typeof content === 'string' ? JSON.parse(content || "{}") : {};
    } catch (error: any) {
      console.error("Erro ao validar dados da reserva:", error);
      throw new Error(`Falha na validação: ${error.message}`);
    }
  }
  
  /**
   * Classifica o tipo de documento
   * @param text Texto extraído do documento
   * @returns Classificação do tipo de documento
   */
  async classifyDocument(text: string): Promise<any> {
    this.checkInitialization();
    
    try {
      const response = await this.client.chat.complete({
        model: "mistral-small-latest", // Modelo mais leve é suficiente para classificação
        messages: [
          {
            role: "system",
            content: "Você é um especialista em classificação de documentos."
          },
          {
            role: "user",
            content: `Classifique o tipo deste documento com base no texto extraído. 
            Possíveis categorias: reserva_airbnb, reserva_booking, reserva_expedia, reserva_direta, 
            contrato_aluguel, fatura, recibo, documento_identificacao, outro.
            
            Retorne apenas um objeto JSON com: 
            - type: string (o tipo de documento)
            - confidence: number (confiança de 0 a 1)
            - details: string (detalhes adicionais sobre o documento)
            
            Texto do documento:
            ${text.substring(0, 3000)}` // Limitar tamanho para classificação
          }
        ],
        temperature: 0.1,
        responseFormat: { type: "json_object" }
      });

      const content = response.choices && response.choices[0]?.message?.content;
      return typeof content === 'string' ? JSON.parse(content || "{}") : {};
    } catch (error: any) {
      console.error("Erro na classificação do documento:", error);
      return { 
        type: "desconhecido", 
        confidence: 0, 
        details: `Erro na classificação: ${error.message}` 
      };
    }
  }

  /**
   * Extrai texto de uma imagem usando Mistral Vision
   * @param imageBase64 Imagem codificada em base64
   * @param mimeType Tipo MIME da imagem (ex: image/jpeg, image/png)
   * @returns Texto extraído da imagem
   */
  async extractTextFromImage(imageBase64: string, mimeType: string = "image/jpeg"): Promise<string> {
    this.checkInitialization();
    
    try {
      // Verificar tamanho da imagem para evitar problemas com limites da API
      if (imageBase64.length > 1000000) { // Aproximadamente 1MB
        console.warn("Imagem muito grande, truncando para evitar limites de token");
        imageBase64 = imageBase64.substring(0, 1000000); // Truncar para evitar erros
      }
      
      // Usar o modelo multimodal para extrair texto da imagem
      const response = await this.client.chat.complete({
        model: "mistral-large-latest", // Modelo com capacidades multimodais
        messages: [
          { 
            role: "system", 
            content: "Você é um especialista em OCR (Reconhecimento Óptico de Caracteres) para documentos de reservas de alojamento." 
          },
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: "Extraia todo o texto visível nesta imagem, incluindo números, datas, nomes e valores monetários. Preste atenção especial a detalhes como informações de check-in/check-out, valor total e nome do hóspede. Preserve a estrutura do documento na sua resposta."
              },
              {
                type: "image_url",
                imageUrl: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: "high" // Usar alta qualidade para melhor OCR
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        maxTokens: 2000
      });
      
      // Extrair e verificar o texto
      const content = response.choices?.[0]?.message?.content;
      return typeof content === 'string' ? content : "Não foi possível extrair texto da imagem.";
      
    } catch (error: any) {
      console.error("Erro ao extrair texto da imagem:", error);
      
      // Tentar com configurações reduzidas em caso de erro
      try {
        const fallbackResponse = await this.client.chat.complete({
          model: "mistral-large-latest",
          messages: [
            { 
              role: "system", 
              content: "Extraia texto de imagens." 
            },
            { 
              role: "user", 
              content: [
                {
                  type: "text",
                  text: "Extraia o texto desta imagem."
                },
                {
                  type: "image_url",
                  imageUrl: {
                    url: `data:${mimeType};base64,${imageBase64.substring(0, 500000)}`,
                    detail: "low" // Usar menor qualidade para reduzir uso de tokens
                  }
                }
              ]
            }
          ],
          temperature: 0.1,
          maxTokens: 1000
        });
        
        const fallbackContent = fallbackResponse.choices?.[0]?.message?.content;
        return typeof fallbackContent === 'string' 
          ? fallbackContent + "\n[NOTA: Processamento com qualidade reduzida]" 
          : "Não foi possível extrair texto da imagem.";
          
      } catch (fallbackError) {
        console.error("Erro também no processamento de fallback:", fallbackError);
        throw new Error(`Falha na extração de texto da imagem: ${error.message}`);
      }
    }
  }
  
  /**
   * Analisa visualmente um documento para detectar a plataforma e formato
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
        
      const response = await this.client.chat.complete({
        model: "mistral-large-latest",
        messages: [
          { 
            role: "system", 
            content: "Você é um especialista em análise visual de documentos de reserva e alojamento." 
          },
          { 
            role: "user", 
            content: [
              {
                type: "text",
                text: `Analise visualmente este documento e identifique:
                1. Qual plataforma emitiu este documento? (Airbnb, Booking.com, Expedia, outro?)
                2. Existe algum logo ou marca d'água identificável?
                3. Qual é o formato/layout geral do documento?
                4. É uma reserva, fatura, recibo ou outro tipo de documento?
                
                Responda em formato JSON com: platform, hasLogo, documentType, layout, confidence (de 0 a 1).`
              },
              {
                type: "image_url",
                imageUrl: {
                  url: `data:${mimeType};base64,${truncatedBase64}`,
                  detail: mimeType.includes('image') ? "high" : "auto"
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        maxTokens: 600,
        responseFormat: { type: "json_object" }
      });

      const content = response.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        return { 
          platform: "unknown", 
          documentType: "unknown",
          hasLogo: false,
          layout: "indeterminado",
          confidence: 0
        };
      }
      
      try {
        return JSON.parse(content);
      } catch (jsonError) {
        console.warn("Erro ao analisar JSON da resposta visual:", jsonError);
        
        // Extrair informações básicas do texto se o parsing falhar
        const airbnbMatch = content.match(/airbnb/i);
        const bookingMatch = content.match(/booking/i);
        const expediaMatch = content.match(/expedia/i);
        
        let platform = "unknown";
        if (airbnbMatch) platform = "airbnb";
        else if (bookingMatch) platform = "booking";
        else if (expediaMatch) platform = "expedia";
        
        return {
          platform: platform,
          documentType: content.includes("reserva") ? "reserva" : "documento",
          hasLogo: content.includes("logo") || content.includes("marca"),
          layout: "indeterminado",
          confidence: 0.5,
          rawResponse: content
        };
      }
    } catch (error: any) {
      console.error("Erro na análise visual do documento:", error);
      return { 
        platform: "unknown", 
        documentType: "unknown",
        hasLogo: false,
        layout: "indeterminado",
        confidence: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Processa um documento (PDF ou imagem) para extrair informações de reserva
   * Combina OCR, análise visual e extração estruturada em um único fluxo
   * 
   * @param fileBase64 Arquivo em base64
   * @param mimeType Tipo MIME do arquivo
   * @returns Objeto com todos os dados extraídos
   */
  async processReservationDocument(fileBase64: string, mimeType: string): Promise<any> {
    this.checkInitialization();
    
    try {
      let extractedText = "";
      
      // Etapa 1: Extrair texto do documento
      console.log(`Extraindo texto de documento do tipo: ${mimeType}`);
      if (mimeType.includes('pdf')) {
        extractedText = await this.extractTextFromPDF(fileBase64);
      } else if (mimeType.includes('image')) {
        extractedText = await this.extractTextFromImage(fileBase64, mimeType);
      } else {
        throw new Error("Tipo de arquivo não suportado. Envie um PDF ou imagem.");
      }
      
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error("Não foi possível extrair texto suficiente do documento. Verifique a qualidade do arquivo.");
      }
      
      // Etapa 2: Classificar o documento
      console.log("Classificando tipo de documento");
      const documentClass = await this.classifyDocument(extractedText);
      
      // Etapa 3: Análise visual para detectar a plataforma (se houver capacidade)
      console.log("Realizando análise visual do documento");
      const visualAnalysis = await this.analyzeDocumentVisually(fileBase64, mimeType);
      
      // Etapa 4: Fundir informações de classificação de texto e visual para melhorar precisão
      const documentInfo = {
        type: documentClass.type || visualAnalysis.documentType || "unknown",
        platform: documentClass.type?.includes('airbnb') ? 'airbnb' : 
                 documentClass.type?.includes('booking') ? 'booking' :
                 documentClass.type?.includes('expedia') ? 'expedia' :
                 visualAnalysis.platform || 'unknown',
        confidence: Math.max(documentClass.confidence || 0, visualAnalysis.confidence || 0)
      };
      
      // Etapa 5: Extrair dados estruturados
      console.log("Extraindo dados estruturados do documento");
      const extractedData = await this.parseReservationData(extractedText);
      
      // Pós-processamento: Garantir que a plataforma esteja consistente entre a análise visual e os dados extraídos
      if (extractedData && typeof extractedData === 'object') {
        // Usar a plataforma da análise visual se for mais confiável e os dados extraídos não tiverem plataforma
        if (documentInfo.platform !== 'unknown' && (!extractedData.platform || extractedData.platform === 'unknown')) {
          extractedData.platform = documentInfo.platform;
        }
      }
      
      // Etapa 6: Compilar resultados completos
      return {
        success: true,
        extractedText: extractedText,
        classification: documentInfo,
        visualAnalysis: visualAnalysis,
        extractedData: extractedData,
        mimeType: mimeType
      };
      
    } catch (error: any) {
      console.error("Erro ao processar documento com Mistral:", error);
      
      return {
        success: false,
        error: error.message || "Erro desconhecido no processamento do documento",
        mimeType: mimeType
      };
    }
  }
  
  /**
   * Processa múltiplos documentos em lote
   * @param files Array de objetos com {base64, mimeType, name}
   * @returns Resultados do processamento para cada arquivo
   */
  async processBatchDocuments(files: Array<{base64: string, mimeType: string, name: string}>): Promise<any[]> {
    this.checkInitialization();
    
    const results = [];
    
    // Processar cada arquivo em série para evitar throttling da API
    for (const file of files) {
      try {
        console.log(`Processando arquivo: ${file.name} (${file.mimeType})`);
        
        // Processar o documento
        const processingResult = await this.processReservationDocument(file.base64, file.mimeType);
        
        // Adicionar nome do arquivo ao resultado
        results.push({
          ...processingResult,
          fileName: file.name
        });
        
      } catch (error: any) {
        console.error(`Erro ao processar ${file.name}:`, error);
        
        // Adicionar resultado de erro
        results.push({
          success: false,
          fileName: file.name,
          error: error.message || "Erro desconhecido no processamento",
          mimeType: file.mimeType
        });
      }
      
      // Pequeno delay entre chamadas para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }
}
