// Teste do serviço de extração de PDF
import { processPdf, parseReservationFromText } from './server/services/pdf-extract';

async function testPdfProcessing() {
  try {
    console.log('🧪 Testando processamento de PDF...');
    
    // Verificar se a chave API está configurada
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY não está configurada nas variáveis de ambiente');
    }
    
    // Processar o PDF de check-in (irá falhar se modelo de visão não estiver disponível)
    try {
      console.log('\n🔍 Tentando processamento completo do PDF...');
      const result = await processPdf('./Check-in Maria faz.pdf', apiKey);
      
      console.log('✅ Processamento completo bem-sucedido!');
      console.log('📋 Dados extraídos:');
      console.log('-'.repeat(50));
      console.log(JSON.stringify(result, null, 2));
      console.log('-'.repeat(50));
    } catch (processingError: any) {
      console.error('❌ Erro no processamento completo:', processingError.message);
      
      // Testar apenas a parte de análise de texto
      console.log('\n🔍 Testando apenas a análise de texto...');
      
      // Texto de amostra para testar
      const sampleText = `
      Documento de Check-in
      
      Propriedade: Casa do Mar
      Endereço: Rua da Praia, 123, Lisboa
      
      Hóspede: Maria Silva
      Email: maria.silva@email.com
      Telefone: +351 912 345 678
      
      Check-in: 15 de março de 2025
      Check-out: 20 de março de 2025
      Número de hóspedes: 3
      
      Valor total: €1500,00
      Plataforma: Airbnb
      Taxa de limpeza: €75,00
      Taxa de check-in: €25,00
      `;
      
      const textAnalysisResult = await parseReservationFromText(sampleText, apiKey);
      
      console.log('✅ Análise de texto bem-sucedida!');
      console.log('📋 Dados extraídos do texto:');
      console.log('-'.repeat(50));
      console.log(JSON.stringify(textAnalysisResult, null, 2));
      console.log('-'.repeat(50));
    }
    
    console.log('\n✅ Testes concluídos!');
  } catch (error: any) {
    console.error('\n❌ Falha nos testes:', error.message);
    throw error;
  }
}

// Executar o teste
testPdfProcessing().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});