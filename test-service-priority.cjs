/**
 * Script para testar a priorização dos serviços de OCR (versão CommonJS)
 */

// Importações necessárias
const dotenv = require('dotenv');
dotenv.config();

// Testar prioridade e chaves de serviço
function testServicePriority() {
  console.log("=== TESTE DE PRIORIZAÇÃO DE SERVIÇOS AI ===");

  console.log(`🔍 Variável de ambiente PRIMARY_AI: ${process.env.PRIMARY_AI || "não definida (default: auto)"}`);
  
  // Verificar se há chaves configuradas
  console.log("\n=== STATUS DAS CHAVES API ===");
  console.log(`OpenRouter API: ${process.env.OPENROUTER_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`Gemini API: ${process.env.GOOGLE_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`Hugging Face Token: ${process.env.HF_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`);
  
  // Recomendações
  console.log("\n=== RECOMENDAÇÕES ===");
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("⚠️ Para usar Mistral OCR, configure OPENROUTER_API_KEY no arquivo .env");
    console.log('Exemplo: OPENROUTER_API_KEY="sua-chave-aqui"');
  }
  
  if (!process.env.GOOGLE_API_KEY) {
    console.log("⚠️ Para usar Gemini, configure GOOGLE_API_KEY no arquivo .env");
    console.log('Exemplo: GOOGLE_API_KEY="sua-chave-aqui"');
  }
  
  if (!process.env.HF_TOKEN) {
    console.log("⚠️ Para processamento de manuscritos, configure HF_TOKEN no arquivo .env");
    console.log('Exemplo: HF_TOKEN="seu-token-huggingface-aqui"');
  }
  
  // Verificar a ordem de prioridade definida
  console.log("\n=== ORDEM DE PRIORIDADE ===");
  
  if (process.env.PRIMARY_AI) {
    console.log(`Serviço primário definido: ${process.env.PRIMARY_AI}`);
  } else {
    console.log("Serviço primário não definido, usando padrão: openrouter");
  }
  
  console.log("\nOrdem de fallback para AIServiceType.AUTO:");
  console.log("1. OpenRouter (Mistral OCR) - se OPENROUTER_API_KEY estiver configurada");
  console.log("2. Gemini - se GOOGLE_API_KEY estiver configurada");
  console.log("3. RolmOCR - se HF_TOKEN estiver configurado");
  
  // Qual serviço será usado?
  console.log("\n=== SERVIÇO USADO PARA OCR ===");
  if (process.env.PRIMARY_AI && process.env.PRIMARY_AI.toLowerCase() !== 'auto') {
    // Serviço específico configurado
    const serviceName = process.env.PRIMARY_AI.toLowerCase();
    
    if (serviceName === 'openrouter') {
      if (process.env.OPENROUTER_API_KEY) {
        console.log("🚀 OpenRouter (Mistral OCR) será usado como serviço primário");
      } else {
        console.log("⚠️ OpenRouter configurado, mas OPENROUTER_API_KEY não está definida");
        console.log("   Sistema fará fallback para Gemini ou RolmOCR");
      }
    } else if (serviceName === 'gemini') {
      if (process.env.GOOGLE_API_KEY) {
        console.log("🚀 Gemini será usado como serviço primário");
      } else {
        console.log("⚠️ Gemini configurado, mas GOOGLE_API_KEY não está definida");
        console.log("   Sistema fará fallback para OpenRouter ou RolmOCR");
      }
    } else if (serviceName === 'rolm') {
      if (process.env.HF_TOKEN) {
        console.log("🚀 RolmOCR será usado como serviço primário");
      } else {
        console.log("⚠️ RolmOCR configurado, mas HF_TOKEN não está definido");
        console.log("   Sistema fará fallback para OpenRouter ou Gemini");
      }
    }
  } else {
    // Modo AUTO - seguir prioridade padrão
    if (process.env.OPENROUTER_API_KEY) {
      console.log("🚀 OpenRouter (Mistral OCR) será usado como serviço primário");
    } else if (process.env.GOOGLE_API_KEY) {
      console.log("🚀 Gemini será usado como serviço primário");
    } else if (process.env.HF_TOKEN) {
      console.log("🚀 RolmOCR será usado como serviço primário");
    } else {
      console.log("⚠️ Nenhuma chave de API configurada. OCR não funcionará.");
    }
  }
}

// Executar o teste
testServicePriority();