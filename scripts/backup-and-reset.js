/**
 * Script para Backup e Reset da Base de Dados - Maria Faz
 * 
 * Funcionalidades:
 * 1. Criar backup completo da base de dados
 * 2. Apagar todos os dados para entrega ao cliente
 * 3. Manter apenas a estrutura das tabelas
 * 
 * @autor: Maria Faz Team
 * @versao: 1.0.0
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs/promises';
import path from 'path';

// Configuração da base de dados
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL não configurada');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

/**
 * Criar backup completo da base de dados
 */
async function createBackup() {
  console.log('📦 Iniciando backup da base de dados...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFile = path.join(backupDir, `maria-faz-backup-${timestamp}.sql`);
  
  try {
    // Criar diretório de backups se não existir
    await fs.mkdir(backupDir, { recursive: true });
    
    // Lista de todas as tabelas
    const tables = [
      'owners',
      'properties', 
      'reservations',
      'activities',
      'financial_documents',
      'financial_document_items',
      'payment_records',
      'maintenance_tasks',
      'quotations',
      'quotation_items',
      'demo_data_markers',
      'knowledge_embeddings',
      'query_embeddings',
      'conversation_history'
    ];
    
    let backupContent = '';
    backupContent += `-- Maria Faz Database Backup\n`;
    backupContent += `-- Data: ${new Date().toISOString()}\n\n`;
    
    // Backup de cada tabela
    for (const table of tables) {
      console.log(`   Fazendo backup da tabela: ${table}`);
      
      try {
        // Obter estrutura da tabela
        const structure = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = ${table}
          ORDER BY ordinal_position
        `;
        
        // Obter dados da tabela
        const data = await sql`SELECT * FROM ${sql(table)}`;
        
        backupContent += `-- Tabela: ${table}\n`;
        backupContent += `-- Registros: ${data.length}\n\n`;
        
        if (data.length > 0) {
          // Gerar INSERT statements
          const columns = Object.keys(data[0]);
          backupContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n`;
          
          const values = data.map(row => {
            const vals = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (val instanceof Date) return `'${val.toISOString()}'`;
              return val;
            });
            return `(${vals.join(', ')})`;
          });
          
          backupContent += values.join(',\n') + ';\n\n';
        }
      } catch (error) {
        console.log(`   ⚠️  Tabela ${table} não encontrada ou erro: ${error.message}`);
        backupContent += `-- Erro ao fazer backup da tabela ${table}: ${error.message}\n\n`;
      }
    }
    
    // Salvar backup
    await fs.writeFile(backupFile, backupContent, 'utf-8');
    
    console.log(`✅ Backup criado com sucesso: ${backupFile}`);
    console.log(`📊 Tamanho do backup: ${(await fs.stat(backupFile)).size} bytes`);
    
    return backupFile;
    
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    throw error;
  }
}

/**
 * Apagar todos os dados da base de dados (mantendo estrutura)
 */
async function resetDatabase() {
  console.log('🗑️  Iniciando limpeza completa da base de dados...');
  
  try {
    // Lista de tabelas para limpar (ordem importante devido a foreign keys)
    const tablesToClear = [
      'conversation_history',
      'query_embeddings', 
      'knowledge_embeddings',
      'demo_data_markers',
      'quotation_items',
      'quotations',
      'payment_records',
      'financial_document_items',
      'financial_documents',
      'maintenance_tasks',
      'activities',
      'reservations',
      'properties',
      'owners'
    ];
    
    // Desabilitar verificações de foreign key temporariamente
    await sql`SET session_replication_role = replica`;
    
    let totalDeleted = 0;
    
    for (const table of tablesToClear) {
      try {
        const result = await sql`DELETE FROM ${sql(table)}`;
        console.log(`   ✅ Tabela ${table}: ${result.count || 0} registros apagados`);
        totalDeleted += result.count || 0;
      } catch (error) {
        console.log(`   ⚠️  Erro ao limpar tabela ${table}: ${error.message}`);
      }
    }
    
    // Reativar verificações de foreign key
    await sql`SET session_replication_role = DEFAULT`;
    
    // Reset das sequences (auto-increment)
    console.log('🔄 Reiniciando sequences...');
    try {
      const sequences = await sql`
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
      `;
      
      for (const seq of sequences) {
        await sql`ALTER SEQUENCE ${sql(seq.sequencename)} RESTART WITH 1`;
        console.log(`   ✅ Sequence ${seq.sequencename} reiniciada`);
      }
    } catch (error) {
      console.log(`   ⚠️  Erro ao reiniciar sequences: ${error.message}`);
    }
    
    console.log(`✅ Limpeza completa concluída. Total de registros apagados: ${totalDeleted}`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  }
}

/**
 * Verificar integridade da base de dados
 */
async function checkDatabaseIntegrity() {
  console.log('🔍 Verificando integridade da base de dados...');
  
  try {
    // Verificar se as tabelas principais existem
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log(`📋 Tabelas encontradas: ${tables.length}`);
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    
    // Contar registros em tabelas principais
    const mainTables = ['owners', 'properties', 'reservations', 'activities'];
    for (const table of mainTables) {
      try {
        const count = await sql`SELECT COUNT(*) as count FROM ${sql(table)}`;
        console.log(`📊 ${table}: ${count[0].count} registros`);
      } catch (error) {
        console.log(`   ⚠️  Tabela ${table} não acessível`);
      }
    }
    
    console.log('✅ Verificação de integridade concluída');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

/**
 * Função principal
 */
async function main() {
  const action = process.argv[2];
  
  try {
    switch (action) {
      case 'backup':
        await createBackup();
        break;
        
      case 'reset':
        console.log('⚠️  ATENÇÃO: Esta operação vai apagar TODOS os dados!');
        console.log('⚠️  Certifique-se de que fez backup antes de continuar.');
        console.log('⚠️  Pressione Ctrl+C para cancelar ou aguarde 10 segundos...\n');
        
        // Aguardar 10 segundos para cancelamento
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        await resetDatabase();
        break;
        
      case 'backup-and-reset':
        console.log('🔄 Executando backup e reset...\n');
        await createBackup();
        console.log('\n');
        await resetDatabase();
        break;
        
      case 'check':
        await checkDatabaseIntegrity();
        break;
        
      default:
        console.log(`
📚 Maria Faz - Script de Backup e Reset da Base de Dados

Uso: node scripts/backup-and-reset.js [comando]

Comandos disponíveis:
  backup           - Criar backup completo da base de dados
  reset            - Apagar todos os dados (CUIDADO!)
  backup-and-reset - Fazer backup e depois reset
  check            - Verificar integridade da base de dados

Exemplos:
  node scripts/backup-and-reset.js backup
  node scripts/backup-and-reset.js check
  node scripts/backup-and-reset.js backup-and-reset
        `);
        break;
    }
    
  } catch (error) {
    console.error('❌ Erro durante execução:', error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('🔌 Conexão com base de dados fechada');
  }
}

// Executar script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createBackup, resetDatabase, checkDatabaseIntegrity };