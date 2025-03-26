/**
 * Script para testar a integração com o Gemini 2.5 Pro
 * Este teste verifica a conectividade com o Gemini e testa funções básicas
 * 
 * Execute com: npm run ts-node test-gemini-integration.ts
 */

// Importações
import { GeminiService, GeminiModel } from './server/services/gemini.service';
import dotenv from 'dotenv';

// Configurar variáveis de ambiente
dotenv.config();

/**
 * Função para imprimir resultados formatados
 */
function printResult(title: string, result: any, success = true) {
  console.log('\n' + '='.repeat(50));
  console.log(`${success ? '✅' : '❌'} ${title}`);
  console.log('-'.repeat(50));
  console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
  console.log('='.repeat(50) + '\n');
}

/**
 * Verificar se temos a chave API configurada
 */
function checkApiKey() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('❌ Chave API GOOGLE_API_KEY não encontrada!');
    console.error('Defina GOOGLE_API_KEY nas variáveis de ambiente para continuar.');
    process.exit(1);
  }
  return apiKey;
}

/**
 * Testar geração de texto simples
 */
async function testTextGeneration(service: GeminiService) {
  try {
    console.log('🧪 Testando geração de texto...');
    
    const prompt = `
      Escreva uma descrição curta (3-4 frases) sobre gestão de propriedades em Portugal.
      Use português europeu e mantenha um tom profissional.
    `;
    
    const result = await service.generateText(prompt);
    printResult('Geração de Texto', result);
    return true;
  } catch (error: any) {
    printResult('Geração de Texto Falhou', error.message, false);
    return false;
  }
}

/**
 * Testar extração de reserva de texto
 */
async function testReservationExtraction(service: GeminiService) {
  try {
    console.log('🧪 Testando extração de dados de reserva...');
    
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
    
    const result = await service.parseReservationData(sampleText);
    printResult('Extração de Dados de Reserva', result);
    return true;
  } catch (error: any) {
    printResult('Extração de Reserva Falhou', error.message, false);
    return false;
  }
}

/**
 * Função principal de teste
 */
async function runTests() {
  console.log('🚀 Iniciando testes de integração com o Gemini 2.5 Pro...');
  
  // Verificar chave API
  const apiKey = checkApiKey();
  console.log('✅ Chave API encontrada');
  
  // Criar instância do serviço
  const geminiService = new GeminiService();
  
  // Inicializar (passa a chave API diretamente para não depender de variável de ambiente)
  console.log('🔄 Inicializando serviço Gemini...');
  geminiService.initializeWithKey(apiKey);
  console.log('✅ Serviço Gemini inicializado');
  
  // Testar funcionalidades
  const testResults = [];
  
  // Teste 1: Geração de texto simples
  testResults.push(await testTextGeneration(geminiService));
  
  // Teste 2: Extração de dados de reserva
  testResults.push(await testReservationExtraction(geminiService));
  
  // Exibir resumo
  console.log('\n📊 Resumo dos testes:');
  console.log(`Total de testes: ${testResults.length}`);
  console.log(`Testes bem-sucedidos: ${testResults.filter(result => result).length}`);
  console.log(`Testes falhos: ${testResults.filter(result => !result).length}`);
  
  if (testResults.every(result => result)) {
    console.log('\n✅ Todos os testes foram bem-sucedidos!');
    console.log('🎉 A integração com o Gemini 2.5 Pro está funcionando corretamente.');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique os erros acima.');
  }
}

// Executar os testes
runTests().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});