/**
 * Script simplificado para testar o processamento de PDF
 * Processa apenas um arquivo para evitar timeout
 */

import fs from 'fs';
import { processPdf, ValidationStatus } from './server/services/pdf-extract';

async function testSinglePdfProcessing() {
  console.log('Iniciando teste simplificado de processamento de PDF...');
  
  // Verificar se a API key do Mistral está configurada
  if (!process.env.MISTRAL_API_KEY) {
    console.error('ERRO: MISTRAL_API_KEY não está configurada no ambiente');
    console.log('Por favor, configure a variável de ambiente MISTRAL_API_KEY');
    return;
  }
  
  // Definir arquivo de teste
  const testFile = './Check-in Maria faz.pdf';
  
  // Verificar se o arquivo existe
  if (!fs.existsSync(testFile)) {
    console.error(`Arquivo de teste não encontrado: ${testFile}`);
    return;
  }
  
  try {
    console.log(`Processando arquivo: ${testFile}`);
    console.time('Tempo de processamento');
    
    // Processar o PDF com timeout
    const result = await processPdf(testFile, process.env.MISTRAL_API_KEY);
    
    console.timeEnd('Tempo de processamento');
    
    // Exibir resultados
    console.log('\nResultados da validação:');
    console.log(`Status: ${result.status}`);
    console.log(`Válido: ${result.isValid}`);
    
    if (result.missingFields.length > 0) {
      console.log(`Campos ausentes: ${result.missingFields.join(', ')}`);
    }
    
    if (result.warningFields.length > 0) {
      console.log(`Campos com avisos: ${result.warningFields.join(', ')}`);
    }
    
    if (result.errors.length > 0) {
      console.log('\nErros:');
      result.errors.forEach(err => {
        console.log(`- ${err.field}: ${err.message} (${err.severity})`);
      });
    }
    
    // Exibir dados extraídos se disponíveis
    if (result.status !== ValidationStatus.FAILED) {
      console.log('\nDados extraídos:');
      console.log(`Propriedade: ${result.dataWithDefaults.propertyName}`);
      console.log(`Hóspede: ${result.dataWithDefaults.guestName}`);
      console.log(`Check-in: ${result.dataWithDefaults.checkInDate}`);
      console.log(`Check-out: ${result.dataWithDefaults.checkOutDate}`);
      console.log(`Plataforma: ${result.dataWithDefaults.platform}`);
      console.log(`Valor total: ${result.dataWithDefaults.totalAmount}`);
      console.log(`Taxa de plataforma: ${result.dataWithDefaults.platformFee}`);
      console.log(`Taxa de limpeza: ${result.dataWithDefaults.cleaningFee}`);
      console.log(`Taxa de check-in: ${result.dataWithDefaults.checkInFee}`);
      console.log(`Comissão: ${result.dataWithDefaults.commissionFee}`);
      console.log(`Pagamento da equipe: ${result.dataWithDefaults.teamPayment}`);
      
      // Mostrar observações se existirem
      if (result.dataWithDefaults.observations) {
        console.log(`Observações: ${result.dataWithDefaults.observations}`);
      }
    }
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
  
  console.log('\nTeste concluído!');
}

// Executar teste
testSinglePdfProcessing()
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  });