/**
 * Este serviço de síntese de voz foi desativado
 * Mantido apenas como placeholder para preservar a compatibilidade com código existente
 * A funcionalidade de voz foi removida conforme solicitado
 */

export class TextToSpeechService {
  private static instance: TextToSpeechService;
  
  private constructor() {}
  
  /**
   * Obtém a instância única do serviço (agora vazio)
   * @returns Instância do serviço
   */
  public static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }
  
  /**
   * Método placeholder para manter compatibilidade com código existente
   * @returns Mensagem informando que a funcionalidade foi removida
   */
  prepareTextForSpeech(_text: string, _language: string = 'pt-BR'): string {
    return "Funcionalidade de voz removida";
  }
  
  /**
   * Método placeholder para manter compatibilidade com código existente
   * @returns Mensagem informando que a funcionalidade foi removida
   */
  generateGreeting(_language: string = 'pt-BR'): string {
    return "Funcionalidade de voz removida";
  }
}

export const textToSpeechService = TextToSpeechService.getInstance();