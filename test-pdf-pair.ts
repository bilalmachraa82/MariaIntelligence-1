/**
 * Script para testar o processamento de pares de PDFs de check-in e check-out
 * Identifica o tipo de cada documento e extrai as informações de reserva
 */

import { processPdfPair, DocumentType } from './server/services/pdf-pair-processor';

async function testPdfPairProcessing() {
  console.log('Iniciando teste de processamento de pares de PDFs...');
  console.log('--------------------------------------------------');
  
  // Verificar se a API key do Mistral está configurada
  if (!process.env.MISTRAL_API_KEY) {
    console.error('ERRO: MISTRAL_API_KEY não está configurada no ambiente');
    console.log('Por favor, configure a variável de ambiente MISTRAL_API_KEY');
    return;
  }
  
  // Lista de PDFs para processar
  const pdfPaths = [
    './Check-in Maria faz.pdf',
    './Check-outs Maria faz.pdf'
  ];
  
  try {
    // Processar o par de PDFs
    console.time('Tempo de processamento');
    const result = await processPdfPair(pdfPaths, process.env.MISTRAL_API_KEY || '');
    console.timeEnd('Tempo de processamento');
    
    // Exibir resultados
    console.log('\nResultados do processamento:');
    console.log('---------------------------');
    console.log(`Par completo: ${result.isPairComplete ? 'Sim' : 'Não'}`);
    console.log(`Check-in encontrado: ${result.checkIn ? 'Sim' : 'Não'}`);
    console.log(`Check-out encontrado: ${result.checkOut ? 'Sim' : 'Não'}`);
    
    if (result.checkIn) {
      console.log(`\nArquivo de check-in: ${result.checkIn.filename}`);
    }
    
    if (result.checkOut) {
      console.log(`Arquivo de check-out: ${result.checkOut.filename}`);
    }
    
    // Verificar se há erros
    if (result.errors.length > 0) {
      console.log('\nErros encontrados:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Exibir dados da reserva
    if (result.reservationData) {
      console.log('\nDados da reserva extraídos:');
      console.log(`Propriedade: ${result.reservationData.propertyName}`);
      console.log(`Hóspede: ${result.reservationData.guestName}`);
      console.log(`Check-in: ${result.reservationData.checkInDate}`);
      console.log(`Check-out: ${result.reservationData.checkOutDate}`);
      console.log(`Plataforma: ${result.reservationData.platform || 'Não especificada'}`);
      console.log(`Quantidade de hóspedes: ${result.reservationData.numGuests || 'Não especificada'}`);
      console.log(`Valor total: ${result.reservationData.totalAmount || 'Não especificado'}`);
      
      // Exibir informações de contato
      if (result.reservationData.guestEmail || result.reservationData.guestPhone) {
        console.log('\nInformações de contato:');
        if (result.reservationData.guestEmail) {
          console.log(`Email: ${result.reservationData.guestEmail}`);
        }
        if (result.reservationData.guestPhone) {
          console.log(`Telefone: ${result.reservationData.guestPhone}`);
        }
      }
    }
    
    // Exibir resultados da validação
    if (result.validationResult) {
      console.log('\nResultados da validação:');
      console.log(`Status: ${result.validationResult.status}`);
      console.log(`Validação bem-sucedida: ${result.validationResult.isValid}`);
      
      if (result.validationResult.missingFields.length > 0) {
        console.log(`Campos ausentes: ${result.validationResult.missingFields.join(', ')}`);
      }
      
      if (result.validationResult.warningFields.length > 0) {
        console.log(`Campos com avisos: ${result.validationResult.warningFields.join(', ')}`);
      }
      
      if (result.validationResult.errors.length > 0) {
        console.log('\nErros de validação:');
        result.validationResult.errors.forEach(err => {
          console.log(`- ${err.field}: ${err.message} (${err.severity})`);
        });
      }
    }
    
  } catch (error: any) {
    console.error('Erro durante o teste:', error.message);
  }
  
  console.log('\nTeste concluído!');
}

// Executar o teste
testPdfPairProcessing()
  .catch(err => console.error('Erro fatal:', err instanceof Error ? err.message : String(err)));