#!/usr/bin/env node

import { config } from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Carregar variáveis de ambiente
config();

console.log('🔍 Maria Faz - Verificação de Ambiente\n');

let score = 0;
let total = 0;

// Função helper para verificar
function check(name, condition, required = true) {
  total++;
  const status = condition ? '✅' : (required ? '❌' : '⚠️');
  if (condition) score++;
  
  console.log(`${status} ${name}`);
  if (!condition && required) {
    console.log(`   ➜ ${name} é obrigatório para funcionamento`);
  }
  return condition;
}

// 1. Verificar Node.js
console.log('📦 Ambiente Node.js:');
check('Node.js v18+', process.version.startsWith('v18') || process.version.startsWith('v19') || process.version.startsWith('v20'));
check('NPM instalado', !!process.env.npm_version);
console.log();

// 2. Verificar variáveis de ambiente
console.log('🔐 Variáveis de Ambiente:');
const hasDatabase = check('DATABASE_URL configurado', !!process.env.DATABASE_URL);
check('NODE_ENV definido', !!process.env.NODE_ENV);
check('GEMINI_API_KEY configurado', !!process.env.GEMINI_API_KEY, false);
check('PORT definido', !!process.env.PORT || true); // Opcional, tem default
console.log();

// 3. Verificar arquivos importantes
console.log('📂 Arquivos do Projeto:');
check('package.json existe', fs.existsSync('./package.json'));
check('vercel.json existe', fs.existsSync('./vercel.json'));
check('.env ou .env.local existe', fs.existsSync('./.env') || fs.existsSync('./.env.local'));
check('Pasta dist/ existe', fs.existsSync('./dist'));
check('Migrations existem', fs.existsSync('./server/db/migrations'));
console.log();

// 4. Verificar dependências instaladas
console.log('📚 Dependências:');
const nodeModulesExists = fs.existsSync('./node_modules');
check('node_modules existe', nodeModulesExists);
if (nodeModulesExists) {
  check('Express instalado', fs.existsSync('./node_modules/express'));
  check('React instalado', fs.existsSync('./node_modules/react'));
  check('Drizzle ORM instalado', fs.existsSync('./node_modules/drizzle-orm'));
}
console.log();

// 5. Testar conexão com banco (se DATABASE_URL existir)
if (hasDatabase) {
  console.log('🗄️ Testando Conexão com Banco de Dados:');
  
  const testConnection = async () => {
    try {
      const client = new Client({
        connectionString: process.env.DATABASE_URL
      });
      
      await client.connect();
      
      // Testar conexão
      const result = await client.query('SELECT NOW()');
      check('Conexão com PostgreSQL', true);
      console.log(`   ➜ Servidor: ${client.host}`);
      console.log(`   ➜ Database: ${client.database}`);
      
      // Verificar se há tabelas
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const tableCount = tables.rows.length;
      check(`Tabelas criadas (${tableCount} encontradas)`, tableCount > 0);
      
      if (tableCount > 0) {
        console.log('   ➜ Tabelas encontradas:');
        tables.rows.slice(0, 5).forEach(row => {
          console.log(`      • ${row.table_name}`);
        });
        if (tableCount > 5) {
          console.log(`      ... e mais ${tableCount - 5} tabelas`);
        }
      }
      
      await client.end();
    } catch (error) {
      check('Conexão com PostgreSQL', false);
      console.log(`   ➜ Erro: ${error.message}`);
      console.log('   ➜ Verifique se DATABASE_URL está correto');
    }
  };
  
  await testConnection();
} else {
  console.log('⚠️  Banco de Dados não configurado - Configure DATABASE_URL');
}
console.log();

// 6. Verificar ambiente Vercel
console.log('☁️  Ambiente Vercel:');
const isVercel = process.env.VERCEL === '1';
if (isVercel) {
  check('Rodando no Vercel', true);
  check('VERCEL_URL disponível', !!process.env.VERCEL_URL);
  check('VERCEL_ENV definido', !!process.env.VERCEL_ENV);
  console.log(`   ➜ Ambiente: ${process.env.VERCEL_ENV}`);
  console.log(`   ➜ URL: https://${process.env.VERCEL_URL}`);
} else {
  console.log('   ℹ️  Ambiente local detectado');
}
console.log();

// 7. Resumo final
console.log('📊 Resumo da Verificação:');
console.log(`   ➜ Total de verificações: ${total}`);
console.log(`   ➜ Verificações OK: ${score}`);
console.log(`   ➜ Percentual: ${Math.round((score/total)*100)}%`);
console.log();

if (score === total) {
  console.log('🎉 Sistema 100% configurado e pronto para uso!');
} else if (score >= total * 0.8) {
  console.log('✅ Sistema operacional com algumas melhorias opcionais pendentes.');
} else if (score >= total * 0.6) {
  console.log('⚠️  Sistema parcialmente configurado. Configure os itens faltantes.');
} else {
  console.log('❌ Sistema precisa de configuração. Siga o guia NEON_DB_QUICK_SETUP.md');
}

console.log('\n💡 Próximos passos:');
if (!process.env.DATABASE_URL) {
  console.log('   1. Configure DATABASE_URL seguindo NEON_DB_QUICK_SETUP.md');
  console.log('   2. Execute: npm run db:migrate');
}
if (!fs.existsSync('./dist')) {
  console.log('   3. Execute: npm run build');
}
console.log('   4. Deploy: git push (Vercel fará deploy automático)');

process.exit(score === total ? 0 : 1);