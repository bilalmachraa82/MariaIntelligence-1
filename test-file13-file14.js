/**
 * Teste rápido para file(13) e file(14) - check-in e check-out
 */
const { SimpleOCRService } = require('./server/services/simple-ocr.service.ts');
const fs = require('fs');

async function testFiles() {
  try {
    const ocrService = new SimpleOCRService();
    
    // Testar file(13).pdf
    console.log('🔍 Testando file(13).pdf...');
    if (fs.existsSync('file (13).pdf')) {
      const buffer13 = fs.readFileSync('file (13).pdf');
      const mockFile13 = {
        originalname: 'file (13).pdf',
        mimetype: 'application/pdf',
        buffer: buffer13
      };
      
      const result13 = await ocrService.processFile(mockFile13);
      console.log(`📊 file(13).pdf: ${result13.reservations?.length || 0} reservas encontradas`);
      console.log(`🏷️ Tipo: ${result13.type}`);
    }
    
    // Testar file(14).pdf
    console.log('\n🔍 Testando file(14).pdf...');
    if (fs.existsSync('file (14).pdf')) {
      const buffer14 = fs.readFileSync('file (14).pdf');
      const mockFile14 = {
        originalname: 'file (14).pdf',
        mimetype: 'application/pdf',
        buffer: buffer14
      };
      
      const result14 = await ocrService.processFile(mockFile14);
      console.log(`📊 file(14).pdf: ${result14.reservations?.length || 0} reservas encontradas`);
      console.log(`🏷️ Tipo: ${result14.type}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testFiles();