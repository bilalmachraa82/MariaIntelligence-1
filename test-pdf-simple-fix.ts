/**
 * Script simplificado para testar o processamento de PDF
 * Processa apenas um arquivo para evitar timeout
 */

import fs from 'fs';
import { processPdf } from './server/services/pdf-extract';

async function testSinglePdfProcessing() {
  console.log('Iniciando teste simplificado de processamento de PDF...');
  console.log('------------------------------------------------');
  
  // Verificar se a API key do Mistral está configurada
  if (!process.env.MISTRAL_API_KEY) {
    console.error('ERRO: MISTRAL_API_KEY não está configurada no ambiente');
    console.log('Por favor, configure a variável de ambiente MISTRAL_API_KEY');
    return;
  }
  
  // Usar apenas um PDF para teste
  const pdfPath = './Check-in Maria faz.pdf';
  
  console.log(`\nProcessando: ${pdfPath}`);
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(pdfPath)) {
      console.error(`Arquivo não encontrado: ${pdfPath}`);
      return;
    }
    
    // Definir timeout para evitar espera infinita
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: Processamento excedeu o limite de tempo de 15s')), 15000);
    });
    
    // Tentar processar o PDF com timeout
    console.time('Tempo de processamento');
    const processingPromise = processPdf(pdfPath, process.env.MISTRAL_API_KEY || '');
    const result = await Promise.race([processingPromise, timeout])
      .catch(error => {
        console.error('Erro no processamento:', error.message);
        return null;
      });
    console.timeEnd('Tempo de processamento');
    
    if (!result) {
      console.log('Processamento não concluído devido a timeout ou erro');
      return;
    }
    
    // Exibir o resultado
    console.log('Status de validação:', result.status);
    console.log('Validação bem-sucedida:', result.isValid);
    
    if (result.missingFields.length > 0) {
      console.log('Campos ausentes:', result.missingFields.join(', '));
    }
    
    if (result.warningFields.length > 0) {
      console.log('Campos com avisos:', result.warningFields.join(', '));
    }
    
    if (result.errors.length > 0) {
      console.log('Erros encontrados:');
      result.errors.forEach(err => {
        console.log(`  - ${err.field}: ${err.message} (${err.severity})`);
      });
    }
    
    // Mostrar dados extraídos (forma resumida)
    console.log('\nDados extraídos (resumo):');
    const { dataWithDefaults } = result;
    console.log(`Propriedade: ${dataWithDefaults.propertyName}`);
    console.log(`Hóspede: ${dataWithDefaults.guestName}`);
    console.log(`Check-in: ${dataWithDefaults.checkInDate}`);
    console.log(`Check-out: ${dataWithDefaults.checkOutDate}`);
    console.log(`Plataforma: ${dataWithDefaults.platform}`);
    console.log(`Hóspedes: ${dataWithDefaults.numGuests}`);
    console.log(`Valor: ${dataWithDefaults.totalAmount}`);
  } catch (error: any) {
    console.error(`Erro ao processar ${pdfPath}:`, error.message);
  }
  
  console.log('\nTeste concluído');
}

// Executar o teste
testSinglePdfProcessing()
  .catch(err => console.error('Erro no teste:', err instanceof Error ? err.message : String(err)));