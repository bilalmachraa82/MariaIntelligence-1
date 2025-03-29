/**
 * Script para reset completo do banco de dados
 * Limpa as tabelas relacionadas a reservas, orçamentos e tarefas de manutenção
 * Mantém apenas proprietários, propriedades e equipas de limpeza
 * Também mantém dados de IA (knowledge_embeddings, query_embeddings, conversation_history)
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function resetDatabaseData() {
  console.log('Iniciando reset do banco de dados...');
  
  // Configuração da conexão com o PostgreSQL
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Conectar ao banco de dados
    await client.connect();
    console.log('Conectado ao banco de dados PostgreSQL');
    
    // Limpar tabelas em ordem correta para evitar problemas de chaves estrangeiras
    // A ordem é importante por causa das restrições de chave estrangeira
    const tablesToClear = [
      'financial_document_items',  // Tem referências para financial_documents e reservations
      'payment_records',           // Tem referências para financial_documents
      'financial_documents',       // Não tem dependências diretas para as tabelas que estamos mantendo
      'activities',                // Pode ter referências para reservations através de entity_id/entity_type
      'reservations',              // Tem referência para properties, mas properties não será deletada
      'quotations'                 // Orçamentos - solicitada limpeza adicional
    ];
    
    // Log das contagens antes da limpeza
    console.log('Contagem de registros antes da limpeza:');
    for (const tableName of tablesToClear) {
      const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
      console.log(`- ${tableName}: ${countResult.rows[0].count} registros`);
    }
    
    // Limpar cada tabela na ordem correta para respeitar as dependências
    for (const tableName of tablesToClear) {
      console.log(`Limpando tabela: ${tableName}`);
      try {
        await client.query(`DELETE FROM ${tableName}`);
        console.log(`✅ Tabela ${tableName} limpa com sucesso`);
        
        // Resetar sequência de autoincremento
        try {
          await client.query(`ALTER SEQUENCE ${tableName}_id_seq RESTART WITH 1`);
          console.log(`✅ Resetada sequência para ${tableName}_id_seq`);
        } catch (seqError) {
          console.log(`Nota: Não foi possível resetar sequência para ${tableName}: ${seqError.message}`);
        }
      } catch (deleteError) {
        console.error(`❌ Erro ao limpar tabela ${tableName}: ${deleteError.message}`);
        console.error('Detalhes:', deleteError);
        // Continuar mesmo se houver erro, tentando as próximas tabelas
      }
    }
    
    // Log das tabelas mantidas
    const tablesKept = [
      'owners',
      'properties',
      'cleaning_teams',
      'knowledge_embeddings',
      'query_embeddings',
      'conversation_history'
    ];
    
    console.log('\nTabelas mantidas (não afetadas pelo reset):');
    for (const tableName of tablesKept) {
      const countResult = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
      console.log(`- ${tableName}: ${countResult.rows[0].count} registros`);
    }
    
    console.log('\nReset concluído!');
    
  } catch (error) {
    console.error('Erro durante o reset do banco de dados:', error);
  } finally {
    // Fechar conexão com o banco de dados
    await client.end();
    console.log('Conexão com o banco de dados fechada');
  }
}

// Executar o reset
resetDatabaseData();