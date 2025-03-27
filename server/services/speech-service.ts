/**
 * Serviço para processamento de fala e voz (speech)
 * Utiliza o Gemini 2.5 Pro Experimental para receber e processar
 * entrada de áudio de usuário e converter para texto
 */

import { GeminiService, GeminiModel } from './gemini.service';

export class SpeechService {
  private static instance: SpeechService;
  private geminiService: GeminiService;
  
  private constructor() {
    this.geminiService = new GeminiService();
  }
  
  /**
   * Obtém a instância única do serviço de fala
   * @returns Instância do serviço
   */
  public static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }

  /**
   * Processa áudio e converte para texto
   * @param audioBase64 Áudio em formato base64
   * @param mimeType Tipo MIME do áudio (default: audio/webm)
   * @returns Texto transcrito
   */
  async processAudio(audioBase64: string, mimeType: string = 'audio/webm'): Promise<string> {
    // FUNCIONALIDADE TEMPORARIAMENTE DESATIVADA
    console.log('🚫 Funcionalidade de transcrição de áudio temporariamente desativada');
    return "RECURSO_DESATIVADO: A entrada de voz está temporariamente indisponível devido a limitações técnicas. Por favor, digite sua mensagem no campo de texto.";
    
    /* Código original comentado
    try {
      console.log(`Processando áudio de tipo: ${mimeType}`);
      // Implementar método alternativo em vez de usar o modelo experimental diretamente
      
      // Verificar se temos acesso ao modelo audioModel
      if (!this.geminiService['audioModel']) {
        console.log('Modelo de áudio não disponível, usando método alternativo');
        return "Transcrição não disponível no momento. Por favor, digite seu texto.";
      }
      
      try {
        // Tentar utilizar o modelo experimental para áudio
        const result = await this.geminiService['audioModel'].generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                { 
                  text: `Escute este áudio e transcreva exatamente o que está sendo dito. 
                  Se ouvir informações sobre reservas, propriedades ou datas, preste atenção 
                  especial para capturar esses detalhes com precisão.`
                },
                { 
                  inlineData: { 
                    mimeType: mimeType, 
                    data: audioBase64 
                  } 
                }
              ]
            }
          ]
        });
        
        return result.response.text();
      } catch (modelError) {
        console.error("Erro com modelo de áudio experimental:", modelError);
        
        // Fallback para texto se falhar
        // Enviar mensagem genérica ao usuário
        return "Não foi possível transcrever o áudio. Por favor, digite seu texto ou tente novamente mais tarde.";
      }
    } catch (error: any) {
      console.error("Erro ao processar áudio:", error);
      // Retornar mensagem amigável em vez de lançar erro
      return "Ocorreu um erro ao processar o áudio. Por favor, digite sua mensagem.";
    }
    */
  }
  
  /**
   * Detecta intenções no texto transcrito
   * @param transcribedText Texto transcrito do áudio
   * @returns Objeto com intenções detectadas
   */
  async detectIntent(transcribedText: string): Promise<any> {
    try {
      const result = await this.geminiService['defaultModel'].generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ 
              text: `Identifique as intenções do usuário nesta mensagem e extraia 
              informações estruturadas. Se houver menção a reservas, check-in, check-out, 
              propriedades, datas ou informações de contato, extraia esses dados.
              
              Retorne um objeto JSON com:
              - intent: a intenção principal (reservation, query, information, etc)
              - entities: entidades extraídas (datas, locais, pessoas, valores)
              - confidence: nível de confiança na detecção (0.0 a 1.0)
              
              Texto: ${transcribedText}`
            }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
        }
      });
      
      const content = result.response.text();
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        return JSON.parse(jsonString);
      } catch (jsonError) {
        console.error("Erro ao analisar JSON da resposta de intenção:", jsonError);
        return { 
          intent: "unknown",
          entities: [],
          confidence: 0.0,
          rawText: transcribedText
        };
      }
    } catch (error: any) {
      console.error("Erro ao detectar intenção:", error);
      return { 
        intent: "error",
        entities: [],
        confidence: 0.0,
        error: error.message,
        rawText: transcribedText
      };
    }
  }
}

export const speechService = SpeechService.getInstance();