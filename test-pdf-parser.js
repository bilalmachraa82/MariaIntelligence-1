// Script para testar a extração de texto do PDF diretamente
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPdfParsing() {
  try {
    // Caminho do arquivo PDF
    const pdfPath = path.join(process.cwd(), 'Check-in Maria faz.pdf');
    
    // Ler o arquivo PDF
    console.log(`Lendo arquivo: ${pdfPath}`);
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`Arquivo PDF lido: ${Math.round(pdfBuffer.length / 1024)} KB`);
    
    // Extrair texto do PDF
    console.log('Extraindo texto do PDF com pdf-parse...');
    const data = await pdfParse(pdfBuffer);
    
    // Verificar os resultados
    console.log(`Texto extraído com sucesso (${data.text.length} caracteres)`);
    console.log('Primeiros 300 caracteres do texto extraído:');
    console.log(data.text.substring(0, 300));
    
    // Salvar texto extraído em um arquivo para análise
    const outputPath = path.join(process.cwd(), 'extracted-text.txt');
    fs.writeFileSync(outputPath, data.text);
    console.log(`Texto completo salvo em: ${outputPath}`);
    
    return {
      success: true,
      textLength: data.text.length,
      numPages: data.numpages
    };
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar o teste
testPdfParsing().then(result => {
  console.log('Resultado do teste:', result);
});