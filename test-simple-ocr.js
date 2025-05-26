/**
 * Script para testar o novo sistema OCR simplificado
 * Testa com um arquivo de controle real
 */

import { SimpleOCRService } from './server/services/simple-ocr.service.js';
import fs from 'fs';

async function testSimpleOCR() {
  try {
    console.log('🔍 Testando novo sistema OCR simplificado...');
    
    // Verificar se temos arquivos de controle disponíveis
    const testFiles = [
      'Controlo_Aroeira I.pdf',
      'Controlo_Aroeira I (6).pdf', 
      'Controlo_Aroeira II (6).pdf',
      'Controlo_5 de Outubro (9).pdf'
    ];
    
    let testFile = null;
    for (const file of testFiles) {
      if (fs.existsSync(file)) {
        testFile = file;
        break;
      }
    }
    
    if (!testFile) {
      console.log('❌ Nenhum arquivo de controle encontrado para teste');
      console.log('📂 Arquivos procurados:', testFiles);
      return;
    }
    
    console.log(`📄 Testando com arquivo: ${testFile}`);
    
    // Criar instância do serviço OCR
    const ocrService = new SimpleOCRService();
    
    // Processar o arquivo
    const result = await ocrService.processPDF(testFile);
    
    console.log('\n📊 RESULTADO DO TESTE:');
    console.log('✅ Sucesso:', result.success);
    console.log('📋 Tipo:', result.type);
    console.log('📝 Reservas encontradas:', result.reservations.length);
    
    if (result.success && result.reservations.length > 0) {
      console.log('\n🏆 RESERVAS EXTRAÍDAS:');
      result.reservations.forEach((reservation, index) => {
        console.log(`\n--- Reserva ${index + 1} ---`);
        console.log('👤 Hóspede:', reservation.guestName);
        console.log('🏠 Propriedade:', reservation.propertyName);
        console.log('📅 Check-in:', reservation.checkInDate);
        console.log('📅 Check-out:', reservation.checkOutDate);
        console.log('💰 Valor:', reservation.totalAmount ? `€${reservation.totalAmount}` : 'N/A');
        console.log('👥 Hóspedes:', reservation.guestCount);
        if (reservation.notes) console.log('📝 Notas:', reservation.notes);
      });
    }
    
    if (result.error) {
      console.log('❌ Erro:', result.error);
    }
    
    console.log('\n🎯 TESTE CONCLUÍDO');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testSimpleOCR();