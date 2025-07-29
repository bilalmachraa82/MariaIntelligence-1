/**
 * Biblioteca de síntese de voz desativada
 * Mantida apenas como placeholder para preservar a compatibilidade com código existente
 * A funcionalidade de voz foi removida conforme solicitado
 */

export interface SpeechSynthesisOptions {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

export class SpeechSynthesis {
  private static instance: SpeechSynthesis;
  private isSupported: boolean = false;
  
  private constructor() {
    // Não inicializa nada, funcionalidade removida
  }
  
  /**
   * Obtém a instância única (agora desativada)
   * @returns A instância do serviço
   */
  public static getInstance(): SpeechSynthesis {
    if (!SpeechSynthesis.instance) {
      SpeechSynthesis.instance = new SpeechSynthesis();
    }
    return SpeechSynthesis.instance;
  }
  
  /**
   * Verifica se a síntese de voz é suportada - agora sempre retorna false
   * @returns false, pois a funcionalidade foi removida
   */
  public isVoiceSupported(): boolean {
    return false;
  }
  
  /**
   * Método stub para manter compatibilidade com código existente
   */
  public speak(options: SpeechSynthesisOptions): void {
    console.warn('Funcionalidade de voz removida do sistema');
    if (options.onError) {
      options.onError(new Error('Funcionalidade de voz removida'));
    }
  }
  
  /**
   * Método stub para manter compatibilidade com código existente
   */
  public stop(): void {
    // Método vazio - funcionalidade removida
  }
  
  /**
   * Método stub para manter compatibilidade com código existente
   */
  public pause(): void {
    // Método vazio - funcionalidade removida
  }
  
  /**
   * Método stub para manter compatibilidade com código existente
   */
  public resume(): void {
    // Método vazio - funcionalidade removida
  }
}

// Exportar a instância singleton para uso em toda a aplicação
export const speechSynthesis = SpeechSynthesis.getInstance();