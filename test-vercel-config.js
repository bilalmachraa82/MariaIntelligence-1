#!/usr/bin/env node

/**
 * Script para verificar configuração do Vercel e testar conexões
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import Mistral from '@mistralai/mistralai';
import axios from 'axios';

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}=== 🔍 Verificação de Configuração do Vercel ===${colors.reset}\n`);

// 1. Verificar variáveis de ambiente
console.log(`${colors.blue}📋 Verificando Variáveis de Ambiente:${colors.reset}`);

const requiredEnvVars = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'SESSION_SECRET': process.env.SESSION_SECRET,
  'MISTRAL_API_KEY': process.env.MISTRAL_API_KEY,
  'OPENROUTER_API_KEY': process.env.OPENROUTER_API_KEY,
  'GOOGLE_GEMINI_API_KEY': process.env.GOOGLE_GEMINI_API_KEY,
  'NODE_ENV': process.env.NODE_ENV,
  'VITE_API_URL': process.env.VITE_API_URL,
};

const missingVars = [];
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    console.log(`${colors.red}❌ ${key}: NÃO CONFIGURADA${colors.reset}`);
    missingVars.push(key);
  } else {
    const displayValue = key.includes('KEY') || key.includes('SECRET') || key.includes('URL') 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`${colors.green}✅ ${key}: ${displayValue}${colors.reset}`);
  }
});

if (missingVars.length > 0) {
  console.log(`\n${colors.yellow}⚠️  Variáveis faltantes no Vercel:${colors.reset}`);
  console.log(`${colors.yellow}Configure em: https://vercel.com/[seu-usuario]/mariafaz/settings/environment-variables${colors.reset}\n`);
}

// 2. Testar conexão com Neon Database
console.log(`\n${colors.blue}🗄️  Testando Conexão com Neon Database:${colors.reset}`);

if (process.env.DATABASE_URL) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT version(), current_database(), current_user`;
    
    console.log(`${colors.green}✅ Conexão com Neon bem-sucedida!${colors.reset}`);
    console.log(`   Database: ${result[0].current_database}`);
    console.log(`   User: ${result[0].current_user}`);
    console.log(`   Version: ${result[0].version.substring(0, 50)}...`);
    
    // Verificar tabelas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`\n${colors.cyan}📊 Tabelas encontradas:${colors.reset}`);
    tables.forEach(table => console.log(`   - ${table.table_name}`));
    
  } catch (error) {
    console.log(`${colors.red}❌ Erro ao conectar com Neon:${colors.reset}`);
    console.log(`   ${error.message}`);
    console.log(`\n${colors.yellow}💡 Dicas:${colors.reset}`);
    console.log(`   1. Verifique se DATABASE_URL está correta`);
    console.log(`   2. Certifique-se que inclui ?sslmode=require`);
    console.log(`   3. Verifique se o projeto Neon está ativo`);
  }
} else {
  console.log(`${colors.red}❌ DATABASE_URL não configurada${colors.reset}`);
}

// 3. Testar Mistral API
console.log(`\n${colors.blue}🤖 Testando Mistral API:${colors.reset}`);

if (process.env.MISTRAL_API_KEY) {
  try {
    const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
    const response = await client.models.list();
    
    console.log(`${colors.green}✅ Conexão com Mistral bem-sucedida!${colors.reset}`);
    console.log(`   Modelos disponíveis: ${response.data.length}`);
    
    // Verificar se tem modelo de visão
    const visionModels = response.data.filter(m => 
      m.id.includes('vision') || m.id.includes('pixtral')
    );
    if (visionModels.length > 0) {
      console.log(`   ${colors.green}✅ Modelo de visão disponível: ${visionModels[0].id}${colors.reset}`);
    }
    
  } catch (error) {
    console.log(`${colors.red}❌ Erro ao conectar com Mistral:${colors.reset}`);
    console.log(`   ${error.message}`);
  }
} else {
  console.log(`${colors.red}❌ MISTRAL_API_KEY não configurada${colors.reset}`);
}

// 4. Testar OpenRouter API
console.log(`\n${colors.blue}🌐 Testando OpenRouter API:${colors.reset}`);

if (process.env.OPENROUTER_API_KEY) {
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://mariafaz.vercel.app',
        'X-Title': 'MariaFaz Property Management'
      }
    });
    
    console.log(`${colors.green}✅ Conexão com OpenRouter bem-sucedida!${colors.reset}`);
    console.log(`   Modelos disponíveis: ${response.data.data.length}`);
    
  } catch (error) {
    console.log(`${colors.red}❌ Erro ao conectar com OpenRouter:${colors.reset}`);
    console.log(`   ${error.response?.data?.error || error.message}`);
  }
} else {
  console.log(`${colors.red}❌ OPENROUTER_API_KEY não configurada${colors.reset}`);
}

// 5. Resumo e próximos passos
console.log(`\n${colors.magenta}=== 📊 Resumo da Verificação ===${colors.reset}\n`);

const totalVars = Object.keys(requiredEnvVars).length;
const configuredVars = totalVars - missingVars.length;
const percentage = Math.round((configuredVars / totalVars) * 100);

console.log(`Variáveis configuradas: ${configuredVars}/${totalVars} (${percentage}%)`);

if (percentage === 100) {
  console.log(`\n${colors.green}🎉 Todas as variáveis estão configuradas!${colors.reset}`);
} else {
  console.log(`\n${colors.yellow}⚠️  Configure as variáveis faltantes no Vercel:${colors.reset}`);
  console.log(`\n1. Acesse: https://vercel.com/dashboard`);
  console.log(`2. Selecione o projeto 'mariafaz'`);
  console.log(`3. Vá em Settings > Environment Variables`);
  console.log(`4. Adicione as variáveis faltantes`);
  console.log(`5. Faça redeploy após adicionar as variáveis`);
}

console.log(`\n${colors.cyan}🚀 Comandos úteis:${colors.reset}`);
console.log(`   vercel env pull     - Baixar variáveis do Vercel`);
console.log(`   vercel env add      - Adicionar nova variável`);
console.log(`   vercel --prod       - Deploy em produção`);
console.log(`   vercel logs         - Ver logs do deploy`);

process.exit(missingVars.length > 0 ? 1 : 0);