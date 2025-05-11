/**
 * Script para testar o endpoint OCR com a API OpenRouter
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Configuração
const PDF_FILE = './Controlo_Aroeira I.pdf'; // Arquivo de teste
const API_ENDPOINT = 'http://localhost:5000/api/ocr?provider=openrouter';

async function testOcrEndpoint() {
  console.log('🧪 Testando endpoint OCR com OpenRouter...');
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(PDF_FILE)) {
      console.error(`❌ Arquivo não encontrado: ${PDF_FILE}`);
      return { success: false };
    }
    
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(PDF_FILE);
    console.log(`📄 Arquivo lido: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
    
    // Criar Form Data
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: path.basename(PDF_FILE),
      contentType: 'application/pdf'
    });
    
    // Enviar requisição
    console.log(`🚀 Enviando requisição para: ${API_ENDPOINT}`);
    const startTime = Date.now();
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders()
      }
    });
    
    const executionTime = Date.now() - startTime;
    console.log(`⏱️ Tempo de execução: ${executionTime}ms`);
    
    if (!response.ok) {
      console.error(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Resposta de erro:', errorText);
      return { success: false };
    }
    
    // Analisar resposta
    const data = await response.json();
    console.log('✅ Resposta recebida:');
    console.log(JSON.stringify(data, null, 2));
    
    // Verificar campos essenciais
    if (data.success) {
      console.log('\n🧾 Análise da resposta:');
      
      // Verificar provider
      console.log(`🔹 Provedor usado: ${data.provider || 'desconhecido'}`);
      
      // Verificar dados extraídos
      if (data.extractedData) {
        console.log('\n📋 Dados extraídos:');
        console.log(JSON.stringify(data.extractedData, null, 2));
        
        // Verificar campos ausentes
        if (data.missing && data.missing.length > 0) {
          console.log(`\n⚠️ Campos ausentes: ${data.missing.join(', ')}`);
        } else {
          console.log('\n✅ Todos os campos foram extraídos!');
        }
      } else {
        console.log('❌ Nenhum dado extraído!');
      }
      
      return {
        success: true,
        data,
        executionTime
      };
    } else {
      console.error('❌ Erro reportado pelo servidor:', data.error || 'Desconhecido');
      return { success: false };
    }
  } catch (error) {
    console.error('❌ Erro ao testar endpoint:', error);
    return { success: false, error: error.message };
  }
}

// Executar o teste
(async () => {
  try {
    const result = await testOcrEndpoint();
    if (result.success) {
      console.log('\n✅ Teste do endpoint OCR completado com sucesso!');
    } else {
      console.log('\n❌ Teste do endpoint OCR falhou!');
    }
  } catch (error) {
    console.error('❌ Erro não tratado:', error);
  }
})();