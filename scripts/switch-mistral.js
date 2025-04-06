// Script para configurar o sistema para usar a API Mistral AI
import fs from 'fs';
import path from 'path';

// Caminho para o arquivo de configuração da IA
const configFilePath = path.join(process.cwd(), 'server', 'config', 'ai-config.js');

// Verifica se a variável de ambiente MISTRAL_API_KEY está definida
if (!process.env.MISTRAL_API_KEY) {
  console.error('ERRO: A variável de ambiente MISTRAL_API_KEY não está definida.');
  console.error('Por favor, defina a variável de ambiente antes de executar este script.');
  process.exit(1);
}

// Conteúdo do arquivo de configuração para o Mistral AI
const configContent = `// Configuração da API de IA - Mistral AI
export const AI_PROVIDER = 'mistral';
export const AI_CONFIG = {
  apiKey: process.env.MISTRAL_API_KEY,
  defaultModel: 'mistral-medium',
  visionModel: 'mistral-large-latest',
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
  console.log('✅ Sistema configurado para usar Mistral AI');
} catch (error) {
  console.error('❌ Erro ao configurar o sistema para usar Mistral AI:', error);
  process.exit(1);
}