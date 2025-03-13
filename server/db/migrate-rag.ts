/**
 * Script de migração específico para as tabelas RAG
 * Este script cria as tabelas relacionadas ao sistema RAG se elas não existirem
 */
import { db } from '../db';
import { sql } from 'drizzle-orm';

export async function migrateRagTables() {
  try {
    console.log("Iniciando migração das tabelas RAG...");
    
    // Verificar e criar tabela conversation_history
    await createConversationHistoryTable();
    
    // Verificar e criar tabela knowledge_embeddings
    await createKnowledgeEmbeddingsTable();
    
    // Verificar e criar tabela query_embeddings
    await createQueryEmbeddingsTable();
    
    console.log("Migração das tabelas RAG concluída com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro durante a migração das tabelas RAG:", error);
    return false;
  }
}

async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
      );
    `);
    
    return result[0]?.exists === true;
  } catch (error) {
    console.error(`Erro ao verificar se a tabela ${tableName} existe:`, error);
    return false;
  }
}

async function createConversationHistoryTable() {
  if (await tableExists('conversation_history')) {
    console.log("Tabela conversation_history já existe, pulando criação.");
    return;
  }
  
  console.log("Criando tabela conversation_history...");
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS conversation_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL DEFAULT 1,
      message TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      metadata JSONB DEFAULT '{}'::JSONB
    );
  `);
  
  console.log("Tabela conversation_history criada com sucesso!");
}

async function createKnowledgeEmbeddingsTable() {
  if (await tableExists('knowledge_embeddings')) {
    console.log("Tabela knowledge_embeddings já existe, pulando criação.");
    return;
  }
  
  console.log("Criando tabela knowledge_embeddings...");
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS knowledge_embeddings (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      content_type TEXT NOT NULL DEFAULT 'faq',
      embedding_json JSONB DEFAULT '{}'::JSONB,
      metadata JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log("Tabela knowledge_embeddings criada com sucesso!");
}

async function createQueryEmbeddingsTable() {
  if (await tableExists('query_embeddings')) {
    console.log("Tabela query_embeddings já existe, pulando criação.");
    return;
  }
  
  console.log("Criando tabela query_embeddings...");
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS query_embeddings (
      id SERIAL PRIMARY KEY,
      query TEXT NOT NULL,
      response TEXT NOT NULL,
      embedding_json JSONB DEFAULT '{}'::JSONB,
      frequency INTEGER DEFAULT 1,
      last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log("Tabela query_embeddings criada com sucesso!");
}