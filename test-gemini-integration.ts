/**
 * Script para testar a integração com o Gemini 2.5 Pro
 * Este teste verifica a conectividade com o Gemini e testa funções básicas
 * 
 * Execute com: npm run ts-node test-gemini-integration.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { AIAdapter, AIServiceType } from './server/services/ai-adapter.service';

// Obter a instância do adaptador
const aiAdapter = AIAdapter.getInstance();

// Testes realizados
const tests: { name: string; status: 'success' | 'failed'; result?: any; error?: any }[] = [];

/**
 * Função principal de teste
 */
async function runTests() {
  console.log('🧪 Testando integração com Gemini 2.5 Pro...');
  
  // Verificar qual serviço está em uso por padrão
  console.log(`ℹ️ Serviço atual: ${aiAdapter.getCurrentService()}`);
  
  // Forçar o uso do Gemini (se disponível)
  try {
    aiAdapter.setService(AIServiceType.GEMINI);
    console.log('✅ Gemini ativado com sucesso!');
    tests.push({ name: 'Ativação do Gemini', status: 'success' });
  } catch (error) {
    console.error('❌ Erro ao ativar Gemini:', error.message);
    console.log('ℹ️ Continuando com o serviço padrão...');
    tests.push({ name: 'Ativação do Gemini', status: 'failed', error });
  }
  
  // Testar extração de texto de PDF
  try {
    const pdfPath = path.join(__dirname, 'entrada.pdf');  // Ajuste para um PDF que exista no projeto
    const pdfExists = fs.existsSync(pdfPath);
    
    if (pdfExists) {
      console.log('🔍 Testando extração de texto de PDF...');
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfBase64 = pdfBuffer.toString('base64');
      
      const extractedText = await aiAdapter.extractTextFromPDF(pdfBase64);
      console.log('📄 Trecho do texto extraído:', extractedText.substring(0, 150) + '...');
      tests.push({ name: 'Extração de PDF', status: 'success' });
      
      // Testar análise de dados estruturados
      console.log('🔍 Testando análise de texto para extração de dados estruturados...');
      const structuredData = await aiAdapter.parseReservationData(extractedText);
      console.log('📊 Dados estruturados:', JSON.stringify(structuredData, null, 2));
      tests.push({ name: 'Extração de dados estruturados', status: 'success', result: structuredData });
    } else {
      console.warn('⚠️ Arquivo PDF de teste não encontrado. Pulando teste de PDF.');
      tests.push({ name: 'Extração de PDF', status: 'failed', error: 'Arquivo não encontrado' });
    }
  } catch (error) {
    console.error('❌ Erro no teste de PDF:', error);
    tests.push({ name: 'Extração de PDF', status: 'failed', error });
  }
  
  // Testar classificação de documento
  try {
    console.log('🔍 Testando classificação de texto...');
    const sampleText = `
      Confirmação de Reserva
      Airbnb
      
      Anfitrião: João Silva
      Hóspede: Maria Oliveira
      Propriedade: Apartamento Centro
      Check-in: 15/04/2025
      Check-out: 20/04/2025
      Valor total: €450,00
    `;
    
    const classification = await aiAdapter.classifyDocument(sampleText);
    console.log('🏷️ Classificação:', classification);
    tests.push({ name: 'Classificação de documento', status: 'success', result: classification });
  } catch (error) {
    console.error('❌ Erro no teste de classificação:', error);
    tests.push({ name: 'Classificação de documento', status: 'failed', error });
  }
  
  // Mostrar resumo dos testes
  console.log('\n📊 Resumo dos testes:');
  tests.forEach(test => {
    console.log(`${test.status === 'success' ? '✅' : '❌'} ${test.name}`);
  });
  
  // Verificar se um mínimo de testes passou (ao menos a ativação do serviço)
  const successCount = tests.filter(t => t.status === 'success').length;
  if (successCount === 0) {
    console.log('\n❌ Todos os testes falharam. Verifique a configuração da API key do Google.');
  } else if (successCount < tests.length) {
    console.log('\n⚠️ Alguns testes falharam. A integração pode precisar de ajustes.');
  } else {
    console.log('\n✅ Todos os testes passaram! A integração com Gemini está funcionando corretamente.');
  }
}

// Executar os testes
runTests().catch(error => {
  console.error('❌ Erro fatal nos testes:', error);
});