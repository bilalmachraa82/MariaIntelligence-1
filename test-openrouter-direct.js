/**
 * Teste direto da API OpenRouter
 * Verifica se a chave API está configurada e funcionando
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Obter dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usar a chave API fornecida pelo usuário (hardcoded temporariamente apenas para teste)
const apiKey = process.env.OPENROUTER_API_KEY || "sk-or-v1-..." // Coloque a chave real aqui para teste
const baseUrl = 'https://openrouter.ai/api/v1';

// Verificar configuração
if (!apiKey) {
  console.error('❌ OPENROUTER_API_KEY não está configurada. Configure a chave API primeiro.');
  process.exit(1);
}

async function testOpenRouterConnection() {
  try {
    console.log('🧪 Testando conexão com OpenRouter...');
    
    const response = await axios.get(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data) {
      const models = response.data.data || [];
      
      console.log(`✅ Conexão bem-sucedida! ${models.length} modelos disponíveis.`);
      
      // Verificar modelos com OCR
      const ocrModels = models.filter((m) => 
        m.id?.toLowerCase().includes('ocr') || 
        (m.id?.toLowerCase().includes('mistral') && m.capabilities?.includes('vision'))
      );
      
      if (ocrModels.length > 0) {
        console.log('🔍 Modelos OCR disponíveis:');
        ocrModels.forEach((model) => {
          console.log(`  - ${model.id} (${model.context_length} tokens de contexto)`);
        });
      } else {
        console.warn('⚠️ Nenhum modelo OCR específico encontrado. Usando modelo alternativo com vision.');
      }
      
      return true;
    } else {
      console.error(`❌ Erro na resposta: ${response.status} - ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error.response?.data || error.message);
    return false;
  }
}

async function processOCR() {
  try {
    console.log('📄 Testando OCR com arquivo PDF...');
    
    // Carregar PDF de teste
    const filePath = path.join(__dirname, 'entrada.pdf');
    if (!fs.existsSync(filePath)) {
      console.error('❌ Arquivo de teste não encontrado:', filePath);
      return false;
    }
    
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📄 PDF carregado: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    
    // Usar modelo padrão ou específico
    const model = 'mistral-vision';
    
    console.log(`🔄 Processando com modelo: ${model}`);
    console.log('Aguarde, isso pode demorar até 30 segundos...');
    
    const startTime = Date.now();
    
    const response = await axios.post(
      `${baseUrl}/vision`,
      {
        model: model,
        mime_type: "application/pdf",
        data: pdfBase64
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://replit.com',
          'X-Title': 'Maria Faz - Mistral OCR Test',
          'Content-Type': 'application/json'
        }
      }
    );
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (response.data && response.data.text) {
      console.log(`✅ OCR concluído em ${elapsedTime}s!`);
      console.log('\n--- Texto extraído (primeiras 500 caracteres) ---');
      console.log(response.data.text.substring(0, 500));
      console.log(`\n(Total: ${response.data.text.length} caracteres)`);
      
      return true;
    } else {
      console.error('❌ Resposta sem texto:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no processamento OCR:', error.response?.data || error.message);
    
    // Verificar se é um erro específico
    if (error.response?.status === 429) {
      console.error('⚠️ Limite de taxa excedido. Tente novamente mais tarde.');
    } else if (error.response?.status === 401) {
      console.error('⚠️ Problema de autenticação. Verifique sua chave API.');
    }
    
    return false;
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes de OpenRouter...');
  console.log('========================================');
  
  const connectionOk = await testOpenRouterConnection();
  
  if (connectionOk) {
    console.log('\n--- Testando OCR ---');
    const ocrOk = await processOCR();
    
    if (ocrOk) {
      console.log('\n✅ Todos os testes foram concluídos com sucesso!');
    } else {
      console.log('\n⚠️ Teste de OCR falhou. Verifique os erros acima.');
    }
  } else {
    console.log('\n❌ Não foi possível se conectar ao OpenRouter. Testes interrompidos.');
  }
}

runTests();