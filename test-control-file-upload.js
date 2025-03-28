/**
 * Script para testar o processamento de arquivos de controle via API
 * Este script envia uma solicitação para processar um arquivo de controle
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/upload-control-file';
const filePath = path.join(__dirname, 'attached_assets', 'Controlo_Aroeira I.pdf');

async function testControlFileUpload() {
  try {
    console.log(`Enviando arquivo ${filePath} para processamento...`);
    
    // Criar um FormData para enviar o arquivo
    const form = new FormData();
    form.append('pdf', fs.createReadStream(filePath));
    
    // Configurar cabeçalhos da requisição
    const headers = {
      ...form.getHeaders(),
      'Content-Length': fs.statSync(filePath).size
    };
    
    // Enviar a solicitação
    console.log('Iniciando a requisição...');
    const response = await axios.post(API_URL, form, { 
      headers,
      timeout: 60000,  // 60 segundos de timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    // Exibir a resposta
    console.log('Resposta recebida:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verificar se processsou corretamente
    if (response.data.success) {
      console.log(`✅ Sucesso! Processadas ${response.data.reservations?.length || 0} reservas.`);
    } else {
      console.log(`❌ Falha: ${response.data.error || 'Erro desconhecido'}`);
    }
  } catch (error) {
    console.error('Erro ao fazer a requisição:', error);
    
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com um código de status
      // que não está na faixa de 2xx
      console.error('Resposta do servidor:');
      console.error('Código de status:', error.response.status);
      console.error('Dados:', error.response.data);
    } else if (error.request) {
      // A requisição foi feita mas nenhuma resposta foi recebida
      console.error('Sem resposta do servidor:', error.request);
    } else {
      // Algo aconteceu ao configurar a requisição que acionou um erro
      console.error('Erro de configuração:', error.message);
    }
  }
}

// Executar o teste
testControlFileUpload();