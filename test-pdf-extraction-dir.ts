import fs from 'fs';
import path from 'path';
import { processPdf } from './server/services/pdf-extract';

// Verificar se a variável de ambiente MISTRAL_API_KEY está definida
const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
  console.error('⚠️ MISTRAL_API_KEY não está definida no ambiente. Use export MISTRAL_API_KEY=your_key ou defina no .env');
  process.exit(1);
}

async function testPdfExtraction() {
  try {
    console.log('🔍 Testando extração de PDF diretamente...');
    
    // Caminho para o arquivo PDF de teste
    const pdfPath = path.join(process.cwd(), 'Check-in Maria faz.pdf');
    
    console.log(`📄 Usando arquivo: ${pdfPath}`);
    console.log('⏳ Processando PDF...');
    
    // Executar o processamento
    const extractedData = await processPdf(pdfPath, apiKey);
    
    console.log('✅ PDF processado com sucesso!');
    console.log('📊 Dados extraídos:');
    console.log(JSON.stringify(extractedData, null, 2));
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testPdfExtraction();