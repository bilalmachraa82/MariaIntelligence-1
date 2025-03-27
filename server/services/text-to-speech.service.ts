/**
 * Serviço para síntese de voz (text-to-speech)
 * Fornece métodos para converter texto em fala usando a Web Speech API do navegador
 * O processamento ocorre no cliente para evitar latência de rede
 */

export class TextToSpeechService {
  private static instance: TextToSpeechService;
  
  private constructor() {}
  
  /**
   * Obtém a instância única do serviço de síntese de voz
   * @returns Instância do serviço
   */
  public static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }
  
  /**
   * Prepara o texto para síntese de voz
   * @param text Texto para transformar em fala
   * @param language Idioma para síntese (default: pt-BR)
   * @returns Texto formatado para síntese
   */
  prepareTextForSpeech(text: string, language: string = 'pt-BR'): string {
    // Otimizar o texto para melhor síntese de voz
    // Remover markdown e formatação específica
    let preparedText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remover negrito
      .replace(/\*(.*?)\*/g, '$1') // Remover itálico
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Remover links
      .replace(/#{1,6}\s+(.*?)(?:\n|$)/g, '$1. ') // Converter cabeçalhos em frases com ponto
      .replace(/\n\n/g, '. ') // Substituir quebras de linha duplas por ponto
      .replace(/\n/g, ' ') // Substituir quebras de linha simples por espaço
      .replace(/\s+/g, ' ') // Normalizar espaços
      .replace(/\. \./g, '.') // Corrigir pontuação duplicada
      .trim();
    
    // Adicionar pausas para melhor compreensão
    preparedText = preparedText
      .replace(/(\.\s)/g, '$1<break time="0.5s"/>')
      .replace(/(\?\s)/g, '$1<break time="0.5s"/>')
      .replace(/(\!\s)/g, '$1<break time="0.5s"/>');
    
    return preparedText;
  }
  
  /**
   * Gera uma saudação personalizada com base no horário
   * @param language Idioma da saudação (default: pt-BR)
   * @returns Texto da saudação
   */
  generateGreeting(language: string = 'pt-BR'): string {
    const hour = new Date().getHours();
    
    if (language === 'pt-BR' || language === 'pt-PT' || language.startsWith('pt')) {
      if (hour >= 5 && hour < 12) {
        return "Bom dia! Sou a Maria, sua assistente virtual. Como posso ajudar você hoje?";
      } else if (hour >= 12 && hour < 18) {
        return "Boa tarde! Sou a Maria, sua assistente virtual. Como posso ajudar você hoje?";
      } else {
        return "Boa noite! Sou a Maria, sua assistente virtual. Como posso ajudar você hoje?";
      }
    } else if (language === 'es-ES' || language.startsWith('es')) {
      if (hour >= 5 && hour < 12) {
        return "¡Buenos días! Soy María, tu asistente virtual. ¿En qué puedo ayudarte hoy?";
      } else if (hour >= 12 && hour < 18) {
        return "¡Buenas tardes! Soy María, tu asistente virtual. ¿En qué puedo ayudarte hoy?";
      } else {
        return "¡Buenas noches! Soy María, tu asistente virtual. ¿En qué puedo ayudarte hoy?";
      }
    } else {
      // Default - English
      if (hour >= 5 && hour < 12) {
        return "Good morning! I'm Maria, your virtual assistant. How can I help you today?";
      } else if (hour >= 12 && hour < 18) {
        return "Good afternoon! I'm Maria, your virtual assistant. How can I help you today?";
      } else {
        return "Good evening! I'm Maria, your virtual assistant. How can I help you today?";
      }
    }
  }
}

export const textToSpeechService = TextToSpeechService.getInstance();