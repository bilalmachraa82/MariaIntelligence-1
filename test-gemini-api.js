/**
 * Script para testar a integração com a API Gemini
 * Verifica se a chave da API está configurada e funcionando corretamente
 */

import { aiService } from './server/services/ai-adapter.service.js';

async function testGeminiAPI() {
  console.log("🚀 Iniciando teste da API Gemini...");
  
  try {
    // Verificar se a chave da API está configurada
    const isServiceAvailable = aiService.isServiceAvailable();
    console.log(`🔑 Serviço de IA disponível: ${isServiceAvailable ? 'Sim' : 'Não'}`);
    
    if (!isServiceAvailable) {
      console.error("❌ Nenhuma chave API do Gemini configurada (GOOGLE_GEMINI_API_KEY ou GOOGLE_API_KEY)");
      console.log("Por favor, configure a chave da API adicionando a variável de ambiente GOOGLE_GEMINI_API_KEY");
      return;
    }
    
    // Testar geração de texto simples
    console.log("📝 Testando geração de texto simples...");
    const text = await aiService.generateText({
      prompt: "Responda com uma frase curta: O que é o Google Gemini?",
      temperature: 0.2,
      maxTokens: 100
    });
    
    console.log("✅ Resposta do Gemini:", text);
    console.log("✅ Teste concluído com sucesso!");
    
    return {
      success: true,
      text
    };
  } catch (error) {
    console.error("❌ Erro no teste da API Gemini:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar o teste
testGeminiAPI()
  .then(result => {
    if (result.success) {
      console.log("✅ API Gemini está funcionando corretamente!");
    } else {
      console.error("❌ Falha no teste da API Gemini:", result.error);
    }
  })
  .catch(error => {
    console.error("❌ Erro ao executar o teste:", error);
  });