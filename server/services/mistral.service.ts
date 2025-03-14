
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
}
