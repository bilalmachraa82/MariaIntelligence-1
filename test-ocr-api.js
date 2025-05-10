/**
 * Teste para API de OCR
 * Este script testa a API de OCR para garantir que está funcionando corretamente
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Arquivo PDF para teste
const pdfPath = './Controlo_Aroeira I (6).pdf';

// Função para testar a API OCR
async function testOcrApi() {
  try {
    console.log('Iniciando teste de API OCR...');
    
    // Verificar existência do arquivo
    if (!fs.existsSync(pdfPath)) {
      console.error(`Erro: Arquivo não encontrado: ${pdfPath}`);
      return;
    }
    
    console.log(`Usando arquivo: ${pdfPath}`);
    
    // Criar FormData
    const formData = new FormData();
    formData.append('pdf', fs.createReadStream(pdfPath));
    
    // Enviar requisição
    console.log('Enviando requisição para API OCR...');
    const response = await fetch('http://localhost:5000/api/ocr?provider=auto', {
      method: 'POST',
      body: formData
    });
    
    // Verificar status
    console.log(`Status da resposta: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta:', errorText);
      return;
    }
    
    // Processar resposta
    const result = await response.json();
    
    // Exibir resultado
    console.log('Resposta da API OCR:');
    console.log('Success:', result.success);
    console.log('Provider:', result.provider);
    
    if (result.reservations) {
      console.log(`Reservations: ${result.reservations.length}`);
      if (result.reservations.length > 0) {
        console.log('Primeira Reserva:');
        console.log('- Property:', result.reservations[0].propertyName);
        console.log('- Guest:', result.reservations[0].guestName);
        console.log('- Check-in:', result.reservations[0].checkInDate);
        console.log('- Check-out:', result.reservations[0].checkOutDate);
      }
    }
    
    if (result.extractedData) {
      console.log('Dados Extraídos:');
      console.log('- Property:', result.extractedData.propertyName);
      console.log('- Guest:', result.extractedData.guestName);
      console.log('- Check-in:', result.extractedData.checkInDate);
      console.log('- Check-out:', result.extractedData.checkOutDate);
    }
    
    console.log('Campos Ausentes:', result.missing || []);
    
    // Verificar apenas o início do texto para não sobrecarregar o console
    if (result.rawText) {
      const previewLength = Math.min(200, result.rawText.length);
      console.log(`Texto Extraído (${result.rawText.length} caracteres):`);
      console.log(result.rawText.substring(0, previewLength) + '...');
    }
    
    console.log('Teste concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executar teste
testOcrApi();