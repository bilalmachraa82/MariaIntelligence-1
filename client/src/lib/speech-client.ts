/**
 * Cliente para lidar com a entrada e saída de voz
 * Permite capturar áudio do microfone e comunicar com o servidor para
 * processamento de voz usando o Gemini 2.5 Pro
 */

// Interface para as opções de gravação
interface RecordingOptions {
  onStart?: () => void;
  onDataAvailable?: (blob: Blob) => void;
  onStop?: (blob: Blob) => void;
  onError?: (error: Error) => void;
  maxDuration?: number; // em ms, padrão 30s
  mimeType?: string; // padrão audio/webm
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
  // Campos adicionais para tratamento de erros
  message?: string;
  alternativeText?: string;
}

/**
 * Classe para gerenciar entrada e saída de voz
 */
export class SpeechClient {
  private static instance: SpeechClient;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording: boolean = false;
  private startTime: number = 0;
  private recordingTimeout: NodeJS.Timeout | null = null;
  
  // Opções padrão
  private defaultOptions: RecordingOptions = {
    maxDuration: 30000, // 30 segundos
    mimeType: 'audio/webm'
  };
  
  /**
   * Construtor privado para Singleton
   */
  private constructor() {}
  
  /**
   * Obtém a instância única do cliente
   */
  public static getInstance(): SpeechClient {
    if (!SpeechClient.instance) {
      SpeechClient.instance = new SpeechClient();
    }
    return SpeechClient.instance;
  }
  
  /**
   * Verifica se o navegador suporta captura de áudio
   */
  public isSpeechSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  
  /**
   * Inicia gravação de áudio
   * @param options Opções de gravação
   */
  public async startRecording(options: RecordingOptions = {}): Promise<void> {
    if (this.isRecording) {
      throw new Error('Já está gravando');
    }
    
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    try {
      // Limpar chunks anteriores
      this.audioChunks = [];
      
      // Obter acesso ao microfone com configurações de qualidade reduzida para menor tamanho
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1, // Mono para reduzir tamanho
          sampleRate: 16000 // 16kHz é suficiente para fala e reduz o tamanho
        } 
      });
      
      // Determinar o tipo MIME suportado - preferir opus para melhor compressão
      const supportedMimeTypes = [
        'audio/webm;codecs=opus', // Melhor compressão
        'audio/webm', 
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg'
      ];
      
      let selectedMimeType = 'audio/webm';
      for (const type of supportedMimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      
      // Criar o gravador com configurações para menor tamanho
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType,
        audioBitsPerSecond: 16000 // Taxa de bits reduzida para menor tamanho
      });
      
      // Configurar manipuladores de eventos
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          
          if (mergedOptions.onDataAvailable) {
            mergedOptions.onDataAvailable(event.data);
          }
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || selectedMimeType });
        
        // Parar os tracks para liberar o microfone
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        this.isRecording = false;
        
        if (this.recordingTimeout) {
          clearTimeout(this.recordingTimeout);
          this.recordingTimeout = null;
        }
        
        if (mergedOptions.onStop) {
          mergedOptions.onStop(audioBlob);
        }
      };
      
      // Iniciar gravação
      this.mediaRecorder.start(100); // Captura a cada 100ms
      this.isRecording = true;
      this.startTime = Date.now();
      
      // Configurar tempo máximo de gravação
      if (mergedOptions.maxDuration) {
        this.recordingTimeout = setTimeout(() => {
          this.stopRecording();
        }, mergedOptions.maxDuration);
      }
      
      if (mergedOptions.onStart) {
        mergedOptions.onStart();
      }
    } catch (error: any) {
      this.isRecording = false;
      
      if (mergedOptions.onError) {
        mergedOptions.onError(error);
      } else {
        console.error('Erro ao iniciar gravação:', error.message);
        throw error;
      }
    }
  }
  
  /**
   * Para a gravação de áudio em andamento
   */
  public stopRecording(): void {
    if (this.isRecording && this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
  }
  
  /**
   * Retorna se está gravando atualmente
   */
  public getIsRecording(): boolean {
    return this.isRecording;
  }
  
  /**
   * Converte o áudio gravado para Base64
   * @param audioBlob Blob de áudio
   * @returns Promise com a string base64
   */
  public async blobToBase64(audioBlob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }
  
  /**
   * Comprime o tamanho do áudio para reduzir o payload
   * @param audioBlob Blob original de áudio
   * @returns Blob comprimido
   */
  private async compressAudioBlob(audioBlob: Blob): Promise<Blob> {
    // Aqui podemos reduzir o tempo de áudio para garantir tamanho menor
    // Verificar se o áudio é muito grande (mais de 5MB)
    if (audioBlob.size > 5 * 1024 * 1024) {
      console.log("Áudio muito grande, reduzindo duração máxima");
      // Neste caso, manteremos apenas os primeiros 10 segundos
      return audioBlob.slice(0, 5 * 1024 * 1024);
    }
    return audioBlob;
  }
  
  /**
   * Envia o áudio para transcrição no servidor
   * @param audioBlob Blob de áudio para transcrever
   * @returns Resultado da transcrição
   */
  public async transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
    try {
      console.log(`Tamanho original do áudio: ${(audioBlob.size / 1024).toFixed(2)}KB`);
      
      // Comprimir o áudio antes de converter para base64
      const compressedAudioBlob = await this.compressAudioBlob(audioBlob);
      console.log(`Tamanho após compressão: ${(compressedAudioBlob.size / 1024).toFixed(2)}KB`);
      
      // Converter para base64 para envio
      const audioBase64 = await this.blobToBase64(compressedAudioBlob);
      console.log(`Tamanho base64: ${(audioBase64.length / 1024).toFixed(2)}KB`);
      
      // Verificar se o payload não está muito grande ainda
      if (audioBase64.length > 40 * 1024 * 1024) {
        throw new Error('Áudio muito grande para processamento. Tente uma mensagem mais curta.');
      }
      
      // Fazer a solicitação ao servidor
      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audioData: audioBase64,
          mimeType: compressedAudioBlob.type
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na transcrição: ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('Erro ao transcrever áudio:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido na transcrição'
      };
    }
  }
  
  /**
   * Obtém resposta para uma mensagem transcrita
   * @param message Mensagem transcrita
   * @returns Resposta gerada
   */
  public async getVoiceResponse(message: string): Promise<string> {
    try {
      const response = await fetch('/api/speech/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao obter resposta: ${response.status}`);
      }
      
      const result = await response.json();
      return result.reply;
    } catch (error: any) {
      console.error('Erro ao obter resposta de voz:', error);
      return `Desculpe, não consegui processar sua solicitação. ${error.message}`;
    }
  }
}

// Exportar a instância para uso em toda a aplicação
export const speechClient = SpeechClient.getInstance();