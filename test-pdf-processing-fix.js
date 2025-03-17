/**
 * Script de teste para verificar o processamento de PDF
 * Testa a correção do erro "inputs undefined"
 */

import fs from 'fs';
import { processPdf } from './server/services/pdf-extract.js';

async function testPdfProcessing() {
  console.log('Iniciando teste de processamento de PDF...');
  console.log('----------------------------------------');
  
  // Verificar se a API key do Mistral está configurada
  if (!process.env.MISTRAL_API_KEY) {
    console.error('ERRO: MISTRAL_API_KEY não está configurada no ambiente');
    console.log('Por favor, configure a variável de ambiente MISTRAL_API_KEY');
    return;
  }
  
  // Lista de PDFs para testar
  const pdfPaths = [
    './Check-in Maria faz.pdf',
    './Check-outs Maria faz.pdf'
  ];
  
  // Processar cada PDF
  for (const pdfPath of pdfPaths) {
    console.log(`\nProcessando: ${pdfPath}`);
    
    try {
      // Verificar se o arquivo existe
      if (!fs.existsSync(pdfPath)) {
        console.error(`Arquivo não encontrado: ${pdfPath}`);
        continue;
      }
      
      // Tentar processar o PDF
      console.time('Tempo de processamento');
      const result = await processPdf(pdfPath, process.env.MISTRAL_API_KEY);
      console.timeEnd('Tempo de processamento');
      
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
      
      // Mostrar dados extraídos
      console.log('\nDados extraídos:');
      console.log(JSON.stringify(result.dataWithDefaults, null, 2));
    } catch (error) {
      console.error(`Erro ao processar ${pdfPath}:`, error);
    }
  }
  
  console.log('\nTeste concluído');
}

// Executar o teste
testPdfProcessing()
  .catch(err => console.error('Erro no teste:', err));