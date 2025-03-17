/**
 * Script para testar o processamento de múltiplos PDFs
 * Simula o upload e processamento de múltiplos documentos de uma vez
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PDFs de exemplo disponíveis no sistema
const pdfFiles = [
  'Check-in Maria faz.pdf',
  'Check-outs Maria faz.pdf',
  'entrada.pdf',
  'saida.pdf'
];

/**
 * Processa um par de PDFs como um conjunto
 */
async function processPdfPair(file1, file2) {
  console.log(`\n\nProcessando par de PDFs: ${file1} e ${file2}`);
  
  const formData = new FormData();
  formData.append('pdfs', fs.createReadStream(file1), { filename: path.basename(file1) });
  formData.append('pdfs', fs.createReadStream(file2), { filename: path.basename(file2) });
  
  try {
    const response = await fetch('http://localhost:5000/api/upload-pdf-pair', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('\nResultado do processamento do par:');
    console.log('Status:', response.status);
    
    if (result.success) {
      console.log('✅ Processamento com sucesso!');
      console.log('Tipo de check-in:', result.data.checkIn?.type);
      console.log('Tipo de check-out:', result.data.checkOut?.type);
      console.log('Par completo:', result.data.isPairComplete ? 'Sim' : 'Não');
      
      if (result.data.reservationData) {
        console.log('\nDados da reserva:');
        console.log('- Propriedade:', result.data.reservationData.propertyName);
        console.log('- Hóspede:', result.data.reservationData.guestName);
        console.log('- Check-in:', result.data.reservationData.checkInDate);
        console.log('- Check-out:', result.data.reservationData.checkOutDate);
        console.log('- Valor Total:', result.data.reservationData.totalAmount || 'Não disponível');
      }
      
      if (result.data.validationResult) {
        console.log('\nValidação:');
        console.log('- Status:', result.data.validationResult.status);
        console.log('- Campos ausentes:', result.data.validationResult.missingFields.length ? result.data.validationResult.missingFields.join(', ') : 'Nenhum');
      }
    } else {
      console.log('❌ Erro no processamento:');
      console.log(result.message || 'Erro desconhecido');
      if (result.errors && result.errors.length) {
        console.log('Erros:', result.errors);
      }
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

/**
 * Processa um único PDF
 */
async function processSinglePdf(file) {
  console.log(`\n\nProcessando PDF individual: ${file}`);
  
  const formData = new FormData();
  formData.append('pdf', fs.createReadStream(file), { filename: path.basename(file) });
  
  try {
    const response = await fetch('http://localhost:5000/api/upload-pdf', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('\nResultado do processamento individual:');
    console.log('Status:', response.status);
    
    if (result.success) {
      console.log('✅ Processamento com sucesso!');
      
      if (result.data) {
        console.log('\nDados extraídos:');
        console.log('- Propriedade:', result.data.propertyName || 'Não disponível');
        console.log('- Hóspede:', result.data.guestName || 'Não disponível');
        console.log('- Check-in:', result.data.checkInDate || 'Não disponível');
        console.log('- Check-out:', result.data.checkOutDate || 'Não disponível');
        console.log('- Valor Total:', result.data.totalAmount || 'Não disponível');
        console.log('- Plataforma:', result.data.platform || 'Não disponível');
      }
      
      if (result.validationResult) {
        console.log('\nValidação:');
        console.log('- Status:', result.validationResult.status);
        console.log('- Campos ausentes:', result.validationResult.missingFields?.length ? result.validationResult.missingFields.join(', ') : 'Nenhum');
      }
    } else {
      console.log('❌ Erro no processamento:');
      console.log(result.message || 'Erro desconhecido');
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

/**
 * Função principal para executar os testes
 */
async function main() {
  console.log('🔍 Simulando processamento dos PDFs disponíveis no sistema');
  console.log('PDFs encontrados:', pdfFiles.join(', '));
  
  // Teste 1: Processar os dois primeiros PDFs como um par (Check-in + Check-out)
  await processPdfPair(pdfFiles[0], pdfFiles[1]);
  
  // Teste 2: Processar o segundo par de PDFs (entrada + saída)
  await processPdfPair(pdfFiles[2], pdfFiles[3]);
  
  // Teste 3: Processar um PDF individual
  await processSinglePdf(pdfFiles[0]);
  
  // Teste 4: Processar outro PDF individual
  await processSinglePdf(pdfFiles[2]);
  
  console.log('\n✅ Testes de processamento concluídos!');
}

// Executar os testes
main().catch(err => {
  console.error('❌ Erro ao executar os testes:', err);
});