import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

// Verificar se a DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL não está definida. Usando armazenamento em memória.",
  );
}

// Flag global para controlar o uso do banco de dados
export let isDatabaseAvailable = false;

// Criar um pool de conexão PostgreSQL com configurações otimizadas para confiabilidade
export const pool = process.env.DATABASE_URL 
  ? new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 3, // reduzindo o máximo de conexões para evitar sobrecarga
      min: 0, // permite que o pool seja reduzido a zero quando não estiver em uso
      idleTimeoutMillis: 30000, // reduzindo para 30 segundos
      connectionTimeoutMillis: 5000, // reduzindo para 5 segundos para falhar mais rápido
      ssl: { rejectUnauthorized: false }, // permite SSL sem validação rigorosa
      keepAlive: true, // mantém a conexão TCP ativa
      allowExitOnIdle: true, // permite que o processo encerre mesmo com conexões inativas
    })
  : null;

// Adicionar evento para tratar erros de conexão
if (pool) {
  pool.on('error', (err) => {
    console.error('Erro inesperado no pool de conexão PostgreSQL:', err);
    isDatabaseAvailable = false;
  });
  
  // Log de verificação da conexão
  pool.query('SELECT NOW()')
    .then(res => {
      console.log('Conexão PostgreSQL estabelecida com sucesso:', res.rows[0].now);
      isDatabaseAvailable = true;
    })
    .catch(err => {
      console.error('Erro ao verificar conexão PostgreSQL:', err);
      isDatabaseAvailable = false;
    });
}

// Inicializar o cliente Drizzle
export const db = pool 
  ? drizzle(pool, { schema }) 
  : null;

// Função para verificar conexão
export async function checkDatabaseConnection(): Promise<boolean> {
  if (!pool) return false;
  
  try {
    const result = await pool.query('SELECT 1');
    isDatabaseAvailable = result.rowCount === 1;
    return isDatabaseAvailable;
  } catch (error) {
    console.error('Erro ao verificar conexão com banco de dados:', error);
    isDatabaseAvailable = false;
    return false;
  }
}
