/**
 * Serviço adaptador para migração de Mistral para Gemini
 * 
 * Este serviço implementa a mesma interface que o MistralService original,
 * mas utiliza o GeminiService internamente, permitindo uma migração gradual
 * sem quebrar compatibilidade com o código existente.
 */

import { GeminiService, GeminiModel } from './gemini.service';

export class MistralService {
  private gemini: GeminiService;
  private isInitialized: boolean = false;

  constructor() {
    // Inicializar o serviço Gemini
    this.gemini = new GeminiService();
    
    // A inicialização real é feita de forma assíncrona no GeminiService
    // Vamos considerar inicializado por enquanto, mas os métodos farão verificações adicionais
    this.isInitialized = true;
  }

  /**
   * Verifica se o serviço está inicializado
   */
  private checkInitialization(): void {
    if (!this.isInitialized) {
      throw new Error('Serviço não inicializado. Verifique as configurações de API.');
    }
  }
  
  /**
   * Obtém acesso ao cliente (mantido para compatibilidade)
   * @returns Um objeto proxy para manter compatibilidade
   */
  getMistralClient(): any {
    this.checkInitialization();
    console.log("⚠️ getMistralClient chamado - usando GeminiService internamente");
    
    // Retornar um proxy que registra as chamadas (para depuração durante migração)
    return new Proxy({}, {
      get: (target, prop) => {
        console.log(`Tentativa de acessar ${String(prop)} no cliente Mistral (agora usando Gemini)`);
        // Retornar um método que registra chamadas para diagnóstico de migração
        return (...args: any[]) => {
          console.warn(`Chamada direta a Mistral não suportada: ${String(prop)}`, args);
          throw new Error(`Método ${String(prop)} do Mistral não implementado no adaptador Gemini`);
        };
      }
    });
  }

  /**
   * Extrai texto de um PDF em base64
   * @param pdfBase64 PDF codificado em base64
   * @returns Texto extraído do documento
   */
  async extractTextFromPDF(pdfBase64: string): Promise<string> {
    this.checkInitialization();
    
    try {
      // Usar o serviço Gemini para extrair texto do PDF
      const systemPrompt = `Você é um especialista em OCR. Extraia todo o texto visível deste documento PDF em base64 sem interpretações adicionais.
      Organize o texto por seções conforme o layout do documento original.
      Preserva tabelas e formatação estruturada quando possível.
      Preste atenção especial em datas, valores monetários e informações de contato.`;
      
      const userPrompt = `Extraia o texto completo deste PDF:\n\n${pdfBase64.length > 500000 ? pdfBase64.substring(0, 500000) + "..." : pdfBase64}`;
      
      // Chamar o método de geração de texto do Gemini
      const extractedText = await this.gemini.generateText({
        systemPrompt,
        userPrompt,
        model: GeminiModel.TEXT,  // Usar modelo de texto padrão
        temperature: 0.1,
        maxOutputTokens: 4000
      });
      
      return extractedText || "Não foi possível extrair o texto.";
    } catch (error: any) {
      console.error("Erro ao extrair texto do PDF:", error);
      
      // Tentar novamente com um modelo mais leve e menos texto
      try {
        console.log("Tentando extração com modelo mais leve (Flash)...");
        const extractedText = await this.gemini.generateText({
          systemPrompt: "Extraia todo o texto visível deste documento PDF.",
          userPrompt: `Extraia o texto das primeiras páginas deste PDF:\n\n${pdfBase64.substring(0, 100000)}...`,
          model: GeminiModel.FLASH,  // Usar modelo FLASH (mais rápido e leve)
          temperature: 0.1,
          maxOutputTokens: 2000
        });
        
        return extractedText + "\n[NOTA: Documento truncado devido ao tamanho]";
      } catch (fallbackError) {
        console.error("Erro também no processamento de fallback:", fallbackError);
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
      const systemPrompt = `Você é um especialista em extrair dados estruturados de textos de reservas.
      Use o formato de data ISO (YYYY-MM-DD) para todas as datas.
      Converta valores monetários para números decimais sem símbolos de moeda.
      Se algum campo estiver ausente no texto, deixe-o como null ou string vazia.
      Atribua a plataforma correta (airbnb/booking/direct/expedia/other) com base no contexto.`;
      
      const userPrompt = `Analise este texto de reserva e extraia as informações em formato JSON com os campos: 
      propertyName, guestName, guestEmail, guestPhone, checkInDate (YYYY-MM-DD), checkOutDate (YYYY-MM-DD), 
      numGuests, totalAmount, platform (airbnb/booking/direct/expedia/other), platformFee, cleaningFee, 
      checkInFee, commissionFee, teamPayment.
      
      Se o texto contiver informação sobre várias propriedades, identifique corretamente qual é a propriedade 
      que está sendo reservada.
      
      Texto da reserva:
      ${text}`;
      
      // Usar modelo FLASH para análise de texto simples
      const jsonResponse = await this.gemini.generateStructuredOutput({
        systemPrompt,
        userPrompt,
        model: GeminiModel.FLASH,
        temperature: 0.1
      });
      
      // Processar os campos numéricos
      const numericFields = ['totalAmount', 'platformFee', 'cleaningFee', 'checkInFee', 'commissionFee', 'teamPayment', 'numGuests'];
      numericFields.forEach(field => {
        if (jsonResponse[field]) {
          // Remover símbolos de moeda e converter para string
          const value = String(jsonResponse[field]).replace(/[€$£,]/g, '');
          jsonResponse[field] = value;
        }
      });
      
      return jsonResponse;
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
      const systemPrompt = `Você é um especialista em validação de dados de reservas.
      Verifique inconsistências, valores faltantes e problemas potenciais.
      Sugira correções quando necessário, mantendo os dados originais quando possível.
      Verifique especialmente as datas (formato YYYY-MM-DD) e valores monetários.`;
      
      const userPrompt = `Valide estes dados de reserva contra as regras da propriedade e sugira correções se necessário:
      
      Dados: ${JSON.stringify(data)}
      
      Regras: ${JSON.stringify(propertyRules)}
      
      Retorne um objeto JSON com:
      - valid: booleano indicando se os dados são válidos
      - data: objeto com os dados corrigidos
      - issues: array de strings descrevendo problemas encontrados
      - corrections: array de strings descrevendo correções aplicadas`;
      
      // Usar modelo FLASH para validação
      return await this.gemini.generateStructuredOutput({
        systemPrompt,
        userPrompt,
        model: GeminiModel.FLASH,
        temperature: 0.1
      });
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
      const systemPrompt = "Você é um especialista em classificação de documentos.";
      
      const userPrompt = `Classifique o tipo deste documento com base no texto extraído. 
      Possíveis categorias: reserva_airbnb, reserva_booking, reserva_expedia, reserva_direta, 
      contrato_aluguel, fatura, recibo, documento_identificacao, outro.
      
      Retorne apenas um objeto JSON com: 
      - type: string (o tipo de documento)
      - confidence: number (confiança de 0 a 1)
      - details: string (detalhes adicionais sobre o documento)
      
      Texto do documento:
      ${text.substring(0, 3000)}`; // Limitar tamanho para classificação
      
      // Usar modelo FLASH para classificação
      return await this.gemini.generateStructuredOutput({
        systemPrompt,
        userPrompt,
        model: GeminiModel.FLASH,
        temperature: 0.1
      });
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
   * Extrai texto de uma imagem
   * @param imageBase64 Imagem codificada em base64
   * @param mimeType Tipo MIME da imagem (ex: image/jpeg, image/png)
   * @returns Texto extraído da imagem
   */
  async extractTextFromImage(imageBase64: string, mimeType: string = "image/jpeg"): Promise<string> {
    this.checkInitialization();
    
    try {
      // Verificar tamanho da imagem para evitar problemas com limites da API
      const truncatedImage = imageBase64.length > 1000000 ? imageBase64.substring(0, 1000000) : imageBase64;
      
      // Usar o modelo Vision do Gemini para extrair texto da imagem
      const extractedText = await this.gemini.processImageContent({
        textPrompt: "Extraia todo o texto visível nesta imagem, incluindo números, datas, nomes e valores monetários. Preste atenção especial a detalhes como informações de check-in/check-out, valor total e nome do hóspede. Preserve a estrutura do documento na sua resposta.",
        imageBase64: truncatedImage,
        mimeType: mimeType,
        model: GeminiModel.VISION,
        temperature: 0.1,
        maxOutputTokens: 2000
      });
      
      return extractedText || "Não foi possível extrair texto da imagem.";
    } catch (error: any) {
      console.error("Erro ao extrair texto da imagem:", error);
      
      // Tentar com configurações reduzidas em caso de erro
      try {
        const fallbackText = await this.gemini.processImageContent({
          textPrompt: "Extraia o texto desta imagem.",
          imageBase64: imageBase64.substring(0, 500000),
          mimeType: mimeType,
          model: GeminiModel.VISION,
          temperature: 0.1,
          maxOutputTokens: 1000
        });
        
        return fallbackText + "\n[NOTA: Processamento com qualidade reduzida]";
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
      const truncatedBase64 = fileBase64.length > 500000 ? fileBase64.substring(0, 500000) : fileBase64;
      
      const textPrompt = `Analise visualmente este documento e identifique:
      1. Qual plataforma emitiu este documento? (Airbnb, Booking.com, Expedia, outro?)
      2. Existe algum logo ou marca d'água identificável?
      3. Qual é o formato/layout geral do documento?
      4. É uma reserva, fatura, recibo ou outro tipo de documento?
      
      Responda em formato JSON com: platform, hasLogo, documentType, layout, confidence (de 0 a 1).`;
      
      // Determinar se é uma imagem ou PDF e processar adequadamente
      if (mimeType.includes('image')) {
        return await this.gemini.processImageContent({
          textPrompt,
          imageBase64: truncatedBase64,
          mimeType,
          model: GeminiModel.VISION,
          temperature: 0.1,
          maxOutputTokens: 600,
          responseFormat: 'json'
        });
      } else {
        // Para PDFs, extrair texto primeiro e depois analisar
        const extractedText = await this.extractTextFromPDF(truncatedBase64);
        const systemPrompt = "Você é um especialista em análise de documentos.";
        const userPrompt = `${textPrompt}\n\nTexto extraído do documento:\n${extractedText.substring(0, 5000)}`;
        
        return await this.gemini.generateStructuredOutput({
          systemPrompt,
          userPrompt,
          model: GeminiModel.FLASH,
          temperature: 0.1
        });
      }
    } catch (error: any) {
      console.error("Erro na análise visual do documento:", error);
      return {
        platform: "desconhecido",
        hasLogo: false,
        documentType: "desconhecido",
        layout: "não identificado",
        confidence: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Extrai múltiplas reservas de um documento de controle
   * @param text Texto do documento de controle
   * @returns Array de objetos de reserva
   */
  async extractMultipleReservations(text: string): Promise<any[]> {
    this.checkInitialization();
    
    try {
      const systemPrompt = `Você é um especialista em extrair múltiplas reservas de documentos de controle de propriedades.
      Os documentos de controle geralmente contêm várias reservas para uma única propriedade.
      Extraia todas as reservas encontradas no texto com seus detalhes completos.
      Use o formato de data ISO (YYYY-MM-DD) para todas as datas.`;
      
      const userPrompt = `Analise este documento de controle e extraia todas as reservas encontradas.
      Para cada reserva, forneça um objeto JSON com os campos:
      - guestName: nome do hóspede
      - checkInDate: data de entrada (YYYY-MM-DD)
      - checkOutDate: data de saída (YYYY-MM-DD)
      - numGuests: número de hóspedes (numérico)
      - platform: plataforma de reserva (airbnb/booking/direct/expedia/other)
      - guestPhone: telefone do hóspede (quando disponível)
      - guestEmail: email do hóspede (quando disponível)
      - guestCountry: país de origem do hóspede (quando disponível)
      - status: status da reserva (confirmed/pending/cancelled)
      
      Retorne um array JSON com todas as reservas encontradas.
      
      Texto do documento de controle:
      ${text}`;
      
      // Usar modelo principal para extração complexa de múltiplas reservas
      const result = await this.gemini.generateStructuredOutput({
        systemPrompt,
        userPrompt,
        model: GeminiModel.TEXT,  // Usar modelo completo para análise mais profunda
        temperature: 0.1
      });
      
      // Garantir que o resultado seja um array
      if (Array.isArray(result)) {
        return result;
      } else if (result && typeof result === 'object' && result.reservations && Array.isArray(result.reservations)) {
        return result.reservations;
      } else {
        console.warn("Formato de resposta inesperado na extração de múltiplas reservas:", result);
        return [];
      }
    } catch (error: any) {
      console.error("Erro ao extrair múltiplas reservas:", error);
      throw new Error(`Falha na extração de múltiplas reservas: ${error.message}`);
    }
  }
}