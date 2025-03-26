/**
 * Script para testar o processamento de PDF usando o serviço Gemini
 * Verifica a extração de texto e a análise de dados da reserva
 * Utiliza chamadas de API diretamente para evitar problemas de importação
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';
import fetch from 'node-fetch';

/**
 * Converte um arquivo para base64
 * @param {string} filePath - Caminho do arquivo
 * @returns {Promise<string>} - String base64 do arquivo
 */
async function fileToBase64(filePath) {
  try {
    const fileBuffer = await fs.readFile(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.error(`Erro ao converter arquivo para base64: ${error.message}`);
    throw error;
  }
}

/**
 * Processa um arquivo PDF para extrair informações de reserva usando as APIs
 * @param {string} pdfPath - Caminho do arquivo PDF
 */
async function processPDF(pdfPath) {
  try {
    console.log(`🔍 Processando PDF: ${pdfPath}`);
    
    // Primeiro, verificar qual serviço de IA está sendo usado
    console.log('🔍 Verificando serviço de IA atual...');
    const serviceResponse = await fetch('http://localhost:5000/api/check-ai-services');
    const serviceData = await serviceResponse.json();
    console.log(`🤖 Serviço de IA atual: ${serviceData.currentService}`);
    
    // Converter PDF para base64
    const pdfBase64 = await fileToBase64(pdfPath);
    console.log(`✅ PDF convertido para base64`);
    
    // Criar um FormData para enviar o PDF
    const formData = new FormData();
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('pdf', pdfBlob, path.basename(pdfPath));
    
    // Enviar o PDF para processamento
    console.log(`🧠 Enviando PDF para processamento...`);
    const response = await fetch('http://localhost:5000/api/upload-pdf', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(`Processamento falhou: ${result.message}`);
    }
    
    console.log(`\n📄 Processamento de PDF bem-sucedido!`);
    
    if (result.extractedText) {
      // Imprimir um trecho do texto extraído
      console.log(`\n📄 Trecho do texto extraído (primeiros 300 caracteres):`);
      console.log(result.extractedText.substring(0, 300) + '...');
    }
    
    if (result.reservationData) {
      // Imprimir os dados estruturados
      console.log(`\n📊 Dados estruturados da reserva:`);
      console.log(JSON.stringify(result.reservationData, null, 2));
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Erro ao processar PDF: ${error.message}`);
    throw error;
  }
}

/**
 * Função principal para testar o processamento de PDFs
 */
async function main() {
  try {
    console.log('=== TESTE DE PROCESSAMENTO DE PDF COM GEMINI ===');
    
    // Verificar o serviço de IA atual
    console.log('🔍 Verificando serviço de IA atual...');
    const serviceResponse = await fetch('http://localhost:5000/api/check-ai-services');
    const serviceData = await serviceResponse.json();
    console.log(`🤖 Serviço de IA atual: ${serviceData.currentService}`);
    
    // Selecionar o serviço Gemini explicitamente
    if (serviceData.currentService !== 'gemini') {
      console.log('🔄 Alterando para o serviço Gemini...');
      await fetch('http://localhost:5000/api/set-ai-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: 'gemini' })
      });
      console.log('✅ Serviço alterado para Gemini');
    }
    
    // Processar um PDF de exemplo
    const pdfPath = 'Check-in Maria faz.pdf'; // Arquivo de exemplo na raiz do projeto
    await processPDF(pdfPath);
    
    console.log('✅ Teste de processamento de PDF concluído com sucesso!');
  } catch (error) {
    console.error(`❌ Erro no teste: ${error.message}`);
    console.error(error.stack);
  }
}

// Executar o teste
main();