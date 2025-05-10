/**
 * Classe mixin para adicionar funcionalidade de teste de conexão aos serviços de IA
 * Este arquivo será usado temporariamente até que os métodos sejam incorporados diretamente.
 */

import { AIAdapter } from './ai-adapter.service';
import { GeminiService } from './gemini.service';
import { OpenRouterService } from './openrouter.service';
import { RolmService } from './rolm.service';

/**
 * Adiciona o método de teste de conexão ao GeminiService
 * @param instance Instância do GeminiService
 */
export function addGeminiTestConnection(instance: GeminiService) {
  // Adiciona o método testConnection ao protótipo
  (GeminiService.prototype as any).testConnection = async function(): Promise<{success: boolean, error?: string}> {
    try {
      // Verificar se a API está configurada
      if (!process.env.GOOGLE_GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return { 
          success: false, 
          error: 'Chave API Gemini não configurada' 
        };
      }
      
      // Testar a conexão fazendo uma chamada simples
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const endpoint = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        return { 
          success: false, 
          error: `Erro na API Gemini: ${response.status} ${response.statusText}` 
        };
      }
      
      const data = await response.json();
      
      if (data && data.models && Array.isArray(data.models) && data.models.length > 0) {
        console.log(`✅ API Gemini válida - ${data.models.length} modelos disponíveis`);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Nenhum modelo disponível na API Gemini' 
        };
      }
    } catch (error: any) {
      console.error('❌ Erro ao testar conexão com Gemini:', error);
      return { 
        success: false, 
        error: error.message || 'Erro desconhecido' 
      };
    }
  };
}

/**
 * Inicializa todos os métodos de teste de conexão para os serviços de IA
 */
export function initializeTestConnectionMethods() {
  // Adicionar métodos de teste ao singleton do AIAdapter
  const aiAdapter = AIAdapter.getInstance();
  const geminiService = (aiAdapter as any).geminiService || new GeminiService();
  
  // Adicionar os métodos
  addGeminiTestConnection(geminiService);
  
  console.log('✅ Métodos de teste de conexão adicionados aos serviços de IA');
}