/**
 * Script para testar o adaptador de IA (Mistral ou Gemini)
 * Este teste verifica se o adaptador está selecionando corretamente o serviço disponível
 * 
 * Execute com: node test-ai-adapter.js
 */

// Importar o adaptador IA
const { aiService, AIServiceType } = require('./server/services/ai-adapter.service');

async function testAIAdapter() {
  console.log('🧪 Testando o adaptador de IA...');
  
  try {
    // Verificar qual serviço está sendo usado atualmente
    const currentService = aiService.getCurrentService();
    console.log(`✅ Serviço atual: ${currentService}`);
    
    // Testar a capacidade de análise de texto simples
    const sampleText = `
      Confirmação de Reserva - Booking.com
      
      Propriedade: Apartamento Graça
      Hóspede: João Silva
      Email: joao.silva@email.com
      Check-in: 15-04-2025
      Check-out: 20-04-2025
      Número de hóspedes: 2
      Valor total: 450,00 €
    `;
    
    console.log('🔍 Analisando texto de amostra...');
    const result = await aiService.parseReservationData(sampleText);
    
    console.log('📊 Resultado da análise:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result && result.propertyName) {
      console.log('✅ Adaptador funcionando corretamente!');
    } else {
      console.log('⚠️ Resultado inesperado. Verificar implementação do adaptador.');
    }
    
    // Testar alternância entre serviços (se ambos disponíveis)
    const hasMistralKey = process.env.MISTRAL_API_KEY !== undefined && process.env.MISTRAL_API_KEY !== '';
    const hasGeminiKey = process.env.GOOGLE_API_KEY !== undefined && process.env.GOOGLE_API_KEY !== '';
    
    if (hasMistralKey && hasGeminiKey) {
      console.log('🔄 Ambas as chaves de API estão disponíveis. Testando alternância entre serviços...');
      
      // Forçar uso do Mistral
      aiService.setService(AIServiceType.MISTRAL);
      console.log(`✅ Serviço alterado para: ${aiService.getCurrentService()}`);
      
      // Forçar uso do Gemini
      aiService.setService(AIServiceType.GEMINI);
      console.log(`✅ Serviço alterado para: ${aiService.getCurrentService()}`);
      
      // Voltar para auto-detecção
      aiService.setService(AIServiceType.AUTO);
      console.log(`✅ Serviço voltou para auto-detecção: ${aiService.getCurrentService()}`);
    } else {
      if (hasMistralKey) {
        console.log('ℹ️ Apenas a chave do Mistral está disponível.');
      } else if (hasGeminiKey) {
        console.log('ℹ️ Apenas a chave do Gemini está disponível.');
      } else {
        console.log('⚠️ Nenhuma chave de API configurada. O adaptador está usando mocks.');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar o adaptador:', error);
  }
}

// Executar o teste
testAIAdapter().then(() => {
  console.log('🏁 Teste concluído');
}).catch((error) => {
  console.error('❌ Falha no teste:', error);
});