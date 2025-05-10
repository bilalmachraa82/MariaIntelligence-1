/**
 * Script simples para verificar o serviço de IA atual
 */

// Carregar .env
const dotenv = require('dotenv');
dotenv.config();

// Simular o método que obtém o serviço atual
function getCurrentService() {
  // Lógica adaptada do AIAdapter
  // 1. Verificar PRIMARY_AI
  let currentService = process.env.PRIMARY_AI || 'auto';
  
  if (currentService === 'auto') {
    if (process.env.OPENROUTER_API_KEY) {
      return 'openrouter';
    } else if (process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY) {
      return 'gemini';
    } else if (process.env.HF_TOKEN) {
      return 'rolm';
    } else {
      return 'nenhum serviço disponível';
    }
  }
  
  return currentService;
}

// Mostrar os resultados
console.log('=== VERIFICAÇÃO DO SERVIÇO AI ATUAL ===');
console.log(`PRIMARY_AI está definido como: "${process.env.PRIMARY_AI || 'não definido'}"`);
console.log(`DEFAULT_NAME definido como: "${process.env.PRIMARY_AI || 'openrouter'}"`);
console.log(`O serviço atual é: "${getCurrentService()}"`);

// Mostrar status das chaves de API
console.log('\n=== CHAVES DE API CONFIGURADAS ===');
console.log(`OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? 'Configurada ✅' : 'Não configurada ❌'}`);
console.log(`GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? 'Configurada ✅' : 'Não configurada ❌'}`);
console.log(`GOOGLE_GEMINI_API_KEY: ${process.env.GOOGLE_GEMINI_API_KEY ? 'Configurada ✅' : 'Não configurada ❌'}`);
console.log(`HF_TOKEN: ${process.env.HF_TOKEN ? 'Configurado ✅' : 'Não configurado ❌'}`);

// Testar getService
function getService(name = process.env.PRIMARY_AI || 'openrouter') {
  // Simulação simplificada do getService
  if (name === 'openrouter') {
    return process.env.OPENROUTER_API_KEY ? 'OpenRouterService' : 'Não disponível';
  } else if (name === 'gemini') {
    return (process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY) ? 'GeminiService' : 'Não disponível';
  } else if (name === 'rolm') {
    return process.env.HF_TOKEN ? 'RolmService' : 'Não disponível';
  } else if (name === 'auto') {
    // Verificar disponibilidade em ordem de prioridade
    if (process.env.OPENROUTER_API_KEY) {
      return 'OpenRouterService';
    } else if (process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY) {
      return 'GeminiService';
    } else if (process.env.HF_TOKEN) {
      return 'RolmService';
    } else {
      return 'Nenhum serviço disponível';
    }
  }
  
  return 'Serviço desconhecido';
}

// Testar o método getService
console.log('\n=== TESTE DO MÉTODO getService ===');
console.log(`getService() -> "${getService()}"`);
console.log(`getService('openrouter') -> "${getService('openrouter')}"`);
console.log(`getService('gemini') -> "${getService('gemini')}"`);
console.log(`getService('rolm') -> "${getService('rolm')}"`);
console.log(`getService('auto') -> "${getService('auto')}"`);

console.log('\n=== CONCLUSÃO ===');
console.log(`O serviço de OCR primário é: ${getService()}`);