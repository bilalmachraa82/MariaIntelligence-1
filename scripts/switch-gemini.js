// Script para configurar o sistema para usar a API Google Gemini
import fs from 'fs';
import path from 'path';

// Caminho para o arquivo de configuração da IA
const configFilePath = path.join(process.cwd(), 'server', 'config', 'ai-config.js');

// Verifica se a variável de ambiente GOOGLE_GEMINI_API_KEY está definida
if (!process.env.GOOGLE_GEMINI_API_KEY) {
  console.error('ERRO: A variável de ambiente GOOGLE_GEMINI_API_KEY não está definida.');
  console.error('Por favor, defina a variável de ambiente antes de executar este script.');
  process.exit(1);
}

// Conteúdo do arquivo de configuração para o Google Gemini
const configContent = `// Configuração da API de IA - Google Gemini
export const AI_PROVIDER = 'gemini';
export const AI_CONFIG = {
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
  defaultModel: 'gemini-1.5-pro',
  visionModel: 'gemini-1.5-pro-vision',
};
`;

try {
  // Garante que o diretório existe
  const dir = path.dirname(configFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Escreve o arquivo de configuração
  fs.writeFileSync(configFilePath, configContent);
  console.log('✅ Sistema configurado para usar Google Gemini AI');
} catch (error) {
  console.error('❌ Erro ao configurar o sistema para usar Google Gemini AI:', error);
  process.exit(1);
}