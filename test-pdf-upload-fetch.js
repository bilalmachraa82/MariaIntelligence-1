// Script para testar o upload de PDF usando fetch
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPdfUpload() {
  try {
    // Carregar o arquivo PDF
    const pdfPath = path.join(process.cwd(), 'Check-in Maria faz.pdf');
    const pdfFile = fs.readFileSync(pdfPath);
    
    console.log(`Arquivo PDF lido: ${pdfPath} (${Math.round(pdfFile.length / 1024)} KB)`);
    
    // Criar o FormData e adicionar o arquivo
    const formData = new FormData();
    formData.append('pdf', pdfFile, 'Check-in Maria faz.pdf');
    
    // Fazer a requisição para o endpoint
    console.log('Enviando requisição para o servidor...');
    const response = await fetch('http://localhost:5000/api/upload-pdf', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} ${response.statusText}`);
    }
    
    // Processar a resposta
    const result = await response.json();
    console.log('Resposta recebida do servidor:');
    console.log(JSON.stringify(result, null, 2));
    
    // Verificar se a resposta contém os dados extraídos
    if (result.success && result.extractedData) {
      console.log('Dados extraídos com sucesso!');
      console.log(`Propriedade: ${result.extractedData.propertyName}`);
      console.log(`Hóspede: ${result.extractedData.guestName}`);
      console.log(`Check-in: ${result.extractedData.checkInDate}`);
      console.log(`Check-out: ${result.extractedData.checkOutDate}`);
    } else {
      console.log('Falha ao extrair dados do PDF.');
      if (result.error) {
        console.error('Erro:', result.error);
      }
    }
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
  }
}

// Executar o teste
testPdfUpload();