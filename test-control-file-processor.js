/**
 * Script para testar o processamento de arquivos de controle
 * Processa arquivos de controle como "Controlo_Aroeira I.pdf" e extrai múltiplas reservas
 */

const { processControlFile } = require('./server/services/control-file-processor');

async function testControlFileProcessor() {
  console.log('Testando processador de arquivos de controle...');
  
  // Arquivo de teste (caminho relativo ao diretório raiz)
  const filePath = './attached_assets/Controlo_Aroeira I.pdf';
  
  try {
    console.log(`Processando arquivo: ${filePath}`);
    const result = await processControlFile(filePath);
    
    if (result.success) {
      console.log('Processamento concluído com sucesso!');
      console.log(`Arquivo de controle: ${result.isControlFile ? 'Sim' : 'Não'}`);
      console.log(`Propriedade identificada: ${result.propertyName}`);
      console.log(`Reservas encontradas: ${result.reservations.length}`);
      
      if (result.reservations.length > 0) {
        console.log('\nPrimeiras reservas encontradas:');
        result.reservations.slice(0, 3).forEach((reservation, index) => {
          console.log(`\nReserva #${index + 1}:`);
          console.log(`- Hóspede: ${reservation.guestName}`);
          console.log(`- Check-in: ${reservation.checkInDate}`);
          console.log(`- Check-out: ${reservation.checkOutDate}`);
          console.log(`- Hóspedes: ${reservation.numGuests}`);
          console.log(`- Valor: ${reservation.totalAmount}`);
          console.log(`- Plataforma: ${reservation.platform}`);
        });
      }
    } else {
      console.error('Erro no processamento:', result.error);
    }
  } catch (error) {
    console.error('Erro ao executar teste:', error);
  }
}

// Executar o teste
testControlFileProcessor();