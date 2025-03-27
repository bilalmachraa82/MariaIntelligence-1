/**
 * Biblioteca para síntese de voz no navegador
 * Utiliza a API Web Speech do navegador para converter texto em voz
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
  private isSpeaking: boolean = false;
  private queue: SpeechSynthesisOptions[] = [];
  private isSupported: boolean;
  
  private constructor() {
    this.isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    
    // Inicialização e configuração
    if (this.isSupported) {
      // Carregar vozes disponíveis quando estiverem prontas
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = this.cacheVoices.bind(this);
      }
      
      this.cacheVoices();
    }
  }
  
  /**
   * Obtém a instância única da síntese de voz
   * @returns A instância da síntese de voz
   */
  public static getInstance(): SpeechSynthesis {
    if (!SpeechSynthesis.instance) {
      SpeechSynthesis.instance = new SpeechSynthesis();
    }
    return SpeechSynthesis.instance;
  }
  
  /**
   * Cria cache das vozes disponíveis
   */
  private cacheVoices(): void {
    if (!this.isSupported) return;
    
    // Não é necessário armazenar as vozes em uma variável,
    // pois elas são sempre acessadas através de window.speechSynthesis.getVoices()
    console.log(`Vozes disponíveis: ${window.speechSynthesis.getVoices().length}`);
  }
  
  /**
   * Seleciona a melhor voz para o idioma especificado
   * @param lang Código do idioma (ex: pt-BR, en-US)
   * @returns A voz mais adequada para o idioma
   */
  private selectVoice(lang: string): SpeechSynthesisVoice | null {
    if (!this.isSupported) return null;
    
    const voices = window.speechSynthesis.getVoices();
    
    // Primeiro, tenta encontrar uma voz que corresponda exatamente ao idioma
    let matchedVoice = voices.find(voice => voice.lang === lang);
    
    // Se não encontrar uma correspondência exata, tenta encontrar uma que comece com o mesmo código de idioma
    if (!matchedVoice) {
      const langPrefix = lang.split('-')[0];
      matchedVoice = voices.find(voice => voice.lang.startsWith(langPrefix));
    }
    
    // Se ainda não encontrar, tenta usar qualquer voz disponível
    if (!matchedVoice && voices.length > 0) {
      // Tenta encontrar uma voz neutra ou feminina como padrão
      matchedVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('maria') ||
        voice.name.toLowerCase().includes('google'));
      
      // Se não encontrar uma voz específica, use a primeira disponível
      if (!matchedVoice) {
        matchedVoice = voices[0];
      }
    }
    
    return matchedVoice || null;
  }
  
  /**
   * Verifica se a síntese de voz é suportada pelo navegador
   * @returns true se for suportada, false caso contrário
   */
  public isVoiceSupported(): boolean {
    return this.isSupported;
  }
  
  /**
   * Fala o texto fornecido
   * @param options Opções para síntese de voz
   */
  public speak(options: SpeechSynthesisOptions): void {
    if (!this.isSupported) {
      console.warn('Síntese de voz não é suportada neste navegador');
      if (options.onError) {
        options.onError(new Error('Síntese de voz não suportada'));
      }
      return;
    }
    
    // Adicionar à fila se já estiver falando
    if (this.isSpeaking) {
      this.queue.push(options);
      return;
    }
    
    this.isSpeaking = true;
    
    try {
      const utterance = new SpeechSynthesisUtterance(options.text);
      
      // Configurar idioma e voz
      utterance.lang = options.lang || 'pt-BR';
      const voice = this.selectVoice(utterance.lang);
      if (voice) {
        utterance.voice = voice;
      }
      
      // Configurar parâmetros de voz
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      
      // Configurar eventos
      utterance.onstart = () => {
        if (options.onStart) options.onStart();
      };
      
      utterance.onend = () => {
        this.isSpeaking = false;
        
        if (options.onEnd) options.onEnd();
        
        // Verificar a fila
        if (this.queue.length > 0) {
          const nextOptions = this.queue.shift();
          if (nextOptions) {
            this.speak(nextOptions);
          }
        }
      };
      
      utterance.onerror = (event) => {
        this.isSpeaking = false;
        console.error('Erro na síntese de voz:', event);
        
        if (options.onError) options.onError(event);
        
        // Continuar a fila mesmo em caso de erro
        if (this.queue.length > 0) {
          const nextOptions = this.queue.shift();
          if (nextOptions) {
            this.speak(nextOptions);
          }
        }
      };
      
      // Falar o texto
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      this.isSpeaking = false;
      console.error('Erro ao iniciar síntese de voz:', error);
      
      if (options.onError) options.onError(error);
    }
  }
  
  /**
   * Para a síntese de voz atual e limpa a fila
   */
  public stop(): void {
    if (!this.isSupported) return;
    
    window.speechSynthesis.cancel();
    this.queue = [];
    this.isSpeaking = false;
  }
  
  /**
   * Pausa a síntese de voz atual
   */
  public pause(): void {
    if (!this.isSupported) return;
    
    window.speechSynthesis.pause();
  }
  
  /**
   * Retoma a síntese de voz pausada
   */
  public resume(): void {
    if (!this.isSupported) return;
    
    window.speechSynthesis.resume();
  }
}

// Exportar a instância singleton para uso em toda a aplicação
export const speechSynthesis = SpeechSynthesis.getInstance();