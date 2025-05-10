/**
 * Script para testar a extração de texto usando os serviços de OCR
 * Verifica se o adaptador de IA está usando o serviço correto com base na priorização
 */

import fs from 'fs';
import path from 'path';
import { aiService } from './server/services/ai-adapter.service.js';

// Função para codificar arquivo em base64
function encodeFileToBase64(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.error(`Erro ao ler arquivo ${filePath}:`, error);
    throw error;
  }
}

// Testar extração de texto de PDF
async function testPdfExtraction() {
  console.log("=== TESTE DE EXTRAÇÃO DE TEXTO DE PDF ===");
  
  // Verificar serviço atual
  const currentService = aiService.getCurrentService();
  console.log(`🔍 Serviço atual configurado: ${currentService}`);
  
  // Arquivo de teste - usando um PDF existente no repositório
  const pdfFiles = [
    'Controlo_Aroeira I.pdf',
    'file (3).pdf',
  ];
  
  // Escolher um PDF existente
  let testPdfFile = null;
  for (const pdfFile of pdfFiles) {
    if (fs.existsSync(pdfFile)) {
      testPdfFile = pdfFile;
      break;
    }
  }
  
  if (!testPdfFile) {
    console.log("❌ Nenhum arquivo PDF de teste encontrado");
    return;
  }
  
  console.log(`📄 Usando arquivo de teste: ${testPdfFile}`);
  
  try {
    // Codificar PDF em base64
    const pdfBase64 = encodeFileToBase64(testPdfFile);
    
    console.log(`🔄 Extraindo texto do PDF usando serviço principal...`);
    console.time("Extração de texto");
    
    // Extrair texto usando o método do AIAdapter
    const extractedText = await aiService.extractTextFromPDF(pdfBase64);
    
    console.timeEnd("Extração de texto");
    
    // Mostrar parte do texto extraído
    const previewLength = 500;
    const textPreview = extractedText.length > previewLength 
      ? extractedText.substring(0, previewLength) + '...' 
      : extractedText;
    
    console.log(`\n✅ Texto extraído (primeiros ${previewLength} caracteres):`);
    console.log(textPreview);
    console.log(`\nTotal de caracteres extraídos: ${extractedText.length}`);
    
    // Testar extração forçando cada serviço específico
    console.log("\n=== COMPARATIVO ENTRE SERVIÇOS ===");
    
    try {
      console.log(`\n🔄 Tentando extração com OpenRouter (Mistral-OCR)...`);
      console.time("Extração OpenRouter");
      // Tentar extração com OpenRouter
      try {
        const openRouterText = await aiService.extractTextFromPDF(pdfBase64, 'openrouter');
        console.timeEnd("Extração OpenRouter");
        console.log(`✅ Sucesso com OpenRouter - ${openRouterText.length} caracteres`);
      } catch (err) {
        console.timeEnd("Extração OpenRouter");
        console.log(`❌ Falha com OpenRouter: ${err.message}`);
      }
    } catch (err) {
      console.log(`❌ OpenRouter indisponível: ${err.message}`);
    }
    
    try {
      console.log(`\n🔄 Tentando extração com Gemini...`);
      console.time("Extração Gemini");
      // Tentar extração com Gemini
      try {
        const geminiText = await aiService.extractTextFromPDF(pdfBase64, 'gemini');
        console.timeEnd("Extração Gemini");
        console.log(`✅ Sucesso com Gemini - ${geminiText.length} caracteres`);
      } catch (err) {
        console.timeEnd("Extração Gemini");
        console.log(`❌ Falha com Gemini: ${err.message}`);
      }
    } catch (err) {
      console.log(`❌ Gemini indisponível: ${err.message}`);
    }
  } catch (error) {
    console.error("❌ Erro durante o teste de extração:", error);
  }
}

// Executar o teste
testPdfExtraction()
  .then(() => {
    console.log("\n✅ Teste de extração concluído");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Erro durante o teste:", error);
    process.exit(1);
  });