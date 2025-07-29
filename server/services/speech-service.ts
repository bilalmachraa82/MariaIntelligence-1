/**
 * Este serviço de processamento de fala foi desativado
 * Mantido apenas como placeholder para preservar a compatibilidade com código existente
 * A funcionalidade de voz foi removida conforme solicitado
 */

// Importação mantida para evitar erros de compilação
import { GeminiService } from './gemini.service';

export class SpeechService {
  private static instance: SpeechService;
  
  private constructor() {
    // Construtor vazio
  }
  
  /**
   * Obtém a instância única do serviço (agora desativado)
   * @returns Instância do serviço
   */
  public static getInstance(): SpeechService {
    if (!SpeechService.instance) {
      SpeechService.instance = new SpeechService();
    }
    return SpeechService.instance;
  }

  /**
   * Método placeholder para manter compatibilidade com código existente
   * @returns Mensagem informando que a funcionalidade foi removida
   */
  async processAudio(_audioBase64: string, _mimeType: string = 'audio/webm'): Promise<string> {
    console.log('🚫 Funcionalidade de voz removida do sistema');
    return "FUNCIONALIDADE_REMOVIDA: A entrada de voz foi removida do sistema. Por favor, digite sua mensagem no campo de texto.";
  }
  
  /**
   * Método placeholder para manter compatibilidade com código existente
   * @returns Objeto com intenção padrão informando que a funcionalidade foi removida
   */
  async detectIntent(_transcribedText: string): Promise<any> {
    return { 
      intent: "feature_removed",
      entities: [],
      confidence: 0.0,
      message: "Funcionalidade de voz removida do sistema"
    };
  }
}

export const speechService = SpeechService.getInstance();