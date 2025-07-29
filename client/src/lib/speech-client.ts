/**
 * Cliente de entrada e saída de voz desativado
 * Mantido apenas como placeholder para preservar a compatibilidade com código existente
 * A funcionalidade de voz foi removida conforme solicitado
 */

// Interface para as opções de gravação
interface RecordingOptions {
  onStart?: () => void;
  onDataAvailable?: (blob: Blob) => void;
  onStop?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  maxDuration?: number;
  mimeType?: string;
}

// Interface para resultados de transcrição
export interface TranscriptionResult {
  success: boolean;
  transcription?: string;
  intent?: {
    intent: string;
    entities: any[];
    confidence: number;
  };
  error?: string;
  timestamp?: Date;
  message?: string;
  alternativeText?: string;
}

/**
 * Classe desativada para compatibilidade com código existente
 */
export class SpeechClient {
  private static instance: SpeechClient;
  private isRecording: boolean = false;
  
  private constructor() {
    // Nada a inicializar
  }
  
  /**
   * Obtém a instância única (agora desativada)
   */
  public static getInstance(): SpeechClient {
    if (!SpeechClient.instance) {
      SpeechClient.instance = new SpeechClient();
    }
    return SpeechClient.instance;
  }
  
  /**
   * Verifica se o navegador suporta captura de áudio - agora sempre retorna false
   */
  public isSpeechSupported(): boolean {
    return false;
  }
  
  /**
   * Método stub para manter compatibilidade com código existente
   */
  public async startRecording(options: RecordingOptions = {}): Promise<void> {
    console.warn('Funcionalidade de voz removida do sistema');
    
    if (options.onError) {
      options.onError(new Error('Funcionalidade de voz removida'));
    } else {
      throw new Error('Funcionalidade de voz removida');
    }
  }
  
  /**
   * Método stub para manter compatibilidade com código existente
   */
  public stopRecording(): void {
    // Nada a fazer
  }
  
  /**
   * Método stub para manter compatibilidade com código existente
   */
  public getIsRecording(): boolean {
    return false;
  }
  
  /**
   * Método stub para manter compatibilidade com código existente
   */
  public async blobToBase64(_audioBlob: Blob): Promise<string> {
    return '';
  }
  
  /**
   * Método stub para manter compatibilidade com código existente
   */
  public async transcribeAudio(_audioBlob: Blob): Promise<TranscriptionResult> {
    return {
      success: false,
      error: 'Funcionalidade de voz removida',
      message: 'A funcionalidade de entrada por voz foi removida do sistema.',
      alternativeText: 'Por favor, digite sua mensagem no campo de texto.'
    };
  }
  
  /**
   * Método stub para manter compatibilidade com código existente
   */
  public async getVoiceResponse(_message: string): Promise<string> {
    return 'A funcionalidade de voz foi removida do sistema.';
  }
}

// Exportar a instância para uso em toda a aplicação
export const speechClient = SpeechClient.getInstance();