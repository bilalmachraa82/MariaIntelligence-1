/**
 * Teste para verificar modelos Gemini disponíveis e testar 2.5 Flash
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGeminiModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('❌ GEMINI_API_KEY não encontrada');
      return;
    }
    
    console.log('🔑 Chave API encontrada:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Testar modelos disponíveis
    const models = [
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ];
    
    for (const modelName of models) {
      console.log(`\n🧪 Testando modelo: ${modelName}`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Responde apenas "OK" para confirmar que funciona.');
        console.log(`✅ ${modelName}: ${result.response.text()}`);
      } catch (error) {
        console.log(`❌ ${modelName}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testGeminiModels();