/**
 * Script para testar a priorização dos serviços de OCR
 * Verifica se o adaptador de IA está respeitando a configuração PRIMARY_AI
 * e se o serviço está sendo selecionado corretamente.
 */

// Importar o adaptador de IA
import { aiService } from './server/services/ai-adapter.service.js';

// Testar a priorização de serviços
async function testServicePriority() {
  console.log("=== TESTE DE PRIORIZAÇÃO DE SERVIÇOS AI ===");
  
  // Verificar configuração atual
  const currentService = aiService.getCurrentService();
  console.log(`🔍 Serviço atual configurado: ${currentService}`);
  
  // Testar auto-detecção (baseada em PRIMARY_AI)
  const defaultService = aiService.getService();
  console.log(`🔍 Serviço padrão selecionado: ${defaultService.constructor.name}`);
  
  // Testar serviço específico (Gemini)
  const geminiService = aiService.getService('gemini');
  console.log(`🔍 Serviço Gemini requisitado: ${geminiService.constructor.name}`);
  
  // Testar serviço específico (OpenRouter)
  const openRouterService = aiService.getService('openrouter');
  console.log(`🔍 Serviço OpenRouter requisitado: ${openRouterService.constructor.name}`);
  
  // Testar prioridade baseada em .env
  const envVarPrimary = process.env.PRIMARY_AI || "auto";
  console.log(`🔍 Variável de ambiente PRIMARY_AI: ${envVarPrimary}`);
  
  // Verificar se há chaves configuradas para cada serviço
  console.log("\n=== STATUS DAS CHAVES API ===");
  console.log(`OpenRouter API: ${process.env.OPENROUTER_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`Gemini API: ${process.env.GOOGLE_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`Hugging Face Token: ${process.env.HF_TOKEN ? '✅ Configurado' : '❌ Não configurado'}`);
  
  // Testar a disponibilidade dos serviços
  console.log("\n=== TESTE DE DISPONIBILIDADE DE SERVIÇOS ===");
  try {
    const openRouterResult = await aiService.openRouterService.testConnection();
    console.log(`OpenRouter: ${openRouterResult.success ? '✅ Disponível' : '❌ Indisponível'} - ${openRouterResult.message}`);
  } catch (error) {
    console.log(`OpenRouter: ❌ Erro ao testar - ${error.message}`);
  }
  
  try {
    const geminiResult = await aiService.geminiService.testConnection();
    console.log(`Gemini: ${geminiResult.success ? '✅ Disponível' : '❌ Indisponível'} - ${geminiResult.message}`);
  } catch (error) {
    console.log(`Gemini: ❌ Erro ao testar - ${error.message}`);
  }
  
  try {
    const rolmResult = await aiService.rolmService.testConnection();
    console.log(`RolmOCR: ${rolmResult.success ? '✅ Disponível' : '❌ Indisponível'} - ${rolmResult.message}`);
  } catch (error) {
    console.log(`RolmOCR: ❌ Erro ao testar - ${error.message}`);
  }
  
  // Resultado final
  console.log("\n=== RECOMENDAÇÕES ===");
  if (!process.env.OPENROUTER_API_KEY) {
    console.log("⚠️ Configure OPENROUTER_API_KEY para utilizar o serviço Mistral OCR");
  }
  
  if (!process.env.GOOGLE_API_KEY && !process.env.GOOGLE_GEMINI_API_KEY) {
    console.log("⚠️ Configure GOOGLE_API_KEY para utilizar o serviço Gemini");
  }
  
  if (!process.env.HF_TOKEN) {
    console.log("⚠️ Configure HF_TOKEN para processamento de manuscritos via RolmOCR");
  }
  
  // Indicar qual serviço será usado para OCR
  console.log("\n=== SERVIÇO PRIMÁRIO ===");
  const primaryService = aiService.getService();
  console.log(`🚀 O serviço primário para OCR é: ${primaryService.constructor.name}`);
}

// Executar o teste
testServicePriority()
  .then(() => {
    console.log("\n✅ Teste concluído");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Erro durante o teste:", error);
    process.exit(1);
  });