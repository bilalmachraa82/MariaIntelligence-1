/**
 * Script para testar o adaptador de serviço de IA
 * Verifica se o adaptador está configurado corretamente e
 * se está usando o serviço Gemini apropriadamente
 */

import { aiService, AIServiceType } from './server/services/ai-adapter.service.js';

async function testAIAdapter() {
  try {
    console.log('=== TESTE DO ADAPTADOR DE SERVIÇOS DE IA ===');
    
    // Verificar qual serviço está sendo usado atualmente
    const currentService = aiService.getCurrentService();
    console.log(`Serviço atual: ${currentService}`);
    
    // Testar extração de texto simples
    try {
      console.log('\n1. Testando geração de texto simples...');
      const text = 'Olá, este é um teste do adaptador de IA.';
      const response = await aiService.parseReservationData(text);
      console.log('Resultado:', response);
    } catch (error) {
      console.error('Erro no teste de texto:', error.message);
    }
    
    // Teste simples com texto de reserva
    try {
      console.log('\n2. Testando análise de texto de reserva...');
      const reservationText = `
        EXCITING LISBON SETE RIOS
        Data entrada: 21/03/2025
        Data saída: 23/03/2025
        N.º noites: 2
        Nome: Camila Silva
        N.º hóspedes: 4
        País: Portugal
        Site: Airbnb
        Telefone: 351 925 073 494
      `;
      
      const result = await aiService.parseReservationData(reservationText);
      console.log('Dados extraídos:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Erro no teste de reserva:', error.message);
    }
    
    // Verificar se conseguimos forçar o uso de um serviço específico
    try {
      console.log('\n3. Tentando alternar para Gemini explicitamente...');
      aiService.setService(AIServiceType.GEMINI);
      console.log(`Serviço após alteração: ${aiService.getCurrentService()}`);
    } catch (error) {
      console.error('Erro ao alternar serviço:', error.message);
    }
    
    console.log('\n=== TESTE CONCLUÍDO ===');
    
  } catch (error) {
    console.error('Erro geral no teste:', error);
  }
}

// Executar o teste
testAIAdapter();