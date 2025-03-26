/**
 * Script para testar o adaptador de serviço de IA
 * Verifica se o adaptador está configurado corretamente e
 * se está usando o serviço Gemini apropriadamente
 */

// Caminho para os módulos da aplicação
const path = require('path');
// Necessário para carregar variáveis de ambiente
require('dotenv').config();

// Diretório do servidor - com caminho direto
const serverDir = './server';

// Função auxiliar para registrar na console com timestamp
function logWithTime(message) {
  const timestamp = new Date().toISOString().slice(11, 19);
  console.log(`[${timestamp}] ${message}`);
}

async function testAIAdapter() {
  try {
    logWithTime('=== TESTE DO ADAPTADOR DE SERVIÇOS DE IA ===');
    
    logWithTime('Carregando adaptador de IA...');
    
    // Importar através de path.join para garantir que o caminho esteja correto
    const adapterModule = require(path.join(serverDir, 'services', 'ai-adapter.service'));
    const { aiService, AIServiceType } = adapterModule;
    
    // Verificar qual serviço está sendo usado atualmente
    const currentService = aiService.getCurrentService();
    logWithTime(`Serviço atual: ${currentService}`);
    
    // Verificar se temos uma chave de API configurada
    const hasGeminiKey = !!process.env.GOOGLE_GEMINI_API_KEY;
    const hasMistralKey = !!process.env.MISTRAL_API_KEY;
    
    logWithTime(`Status da chave Gemini: ${hasGeminiKey ? 'Disponível' : 'Indisponível'}`);
    logWithTime(`Status da chave Mistral: ${hasMistralKey ? 'Disponível' : 'Indisponível'}`);
    
    // Testar extração de texto simples
    try {
      logWithTime('\n1. Testando geração de texto simples...');
      const text = 'Olá, este é um teste do adaptador de IA.';
      const response = await aiService.parseReservationData(text);
      logWithTime('Resultado: ' + JSON.stringify(response, null, 2));
    } catch (error) {
      logWithTime('Erro no teste de texto: ' + error.message);
    }
    
    // Teste simples com texto de reserva
    try {
      logWithTime('\n2. Testando análise de texto de reserva...');
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
      logWithTime('Dados extraídos: ' + JSON.stringify(result, null, 2));
    } catch (error) {
      logWithTime('Erro no teste de reserva: ' + error.message);
    }
    
    // Verificar se conseguimos forçar o uso de um serviço específico
    try {
      logWithTime('\n3. Tentando alternar para Gemini explicitamente...');
      aiService.setService(AIServiceType.GEMINI);
      logWithTime(`Serviço após alteração: ${aiService.getCurrentService()}`);
    } catch (error) {
      logWithTime('Erro ao alternar serviço: ' + error.message);
    }
    
    logWithTime('\n=== TESTE CONCLUÍDO ===');
    
  } catch (error) {
    logWithTime('Erro geral no teste: ' + error);
  }
}

// Executar o teste
testAIAdapter();