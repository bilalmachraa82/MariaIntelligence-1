import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

async function testPdfParse() {
  try {
    console.log('🔍 Testando extração de texto de PDF com pdf-parse...');
    
    // Caminho para o arquivo PDF de teste
    const pdfPath = path.join(process.cwd(), 'Check-in Maria faz.pdf');
    
    console.log(`📄 Usando arquivo: ${pdfPath}`);
    console.log('⏳ Carregando PDF...');
    
    // Ler o arquivo como buffer
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    console.log(`📦 PDF carregado: ${Math.round(pdfBuffer.length / 1024)} KB`);
    console.log('⏳ Extraindo texto...');
    
    // Extrair texto do PDF
    const data = await pdfParse(pdfBuffer);
    
    console.log('✅ Texto extraído com sucesso!');
    console.log(`📊 ${data.text.length} caracteres extraídos.`);
    console.log('📝 Primeiros 300 caracteres:');
    console.log(data.text.substring(0, 300));
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testPdfParse();