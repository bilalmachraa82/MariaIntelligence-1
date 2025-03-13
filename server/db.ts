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

// Criar um pool de conexão PostgreSQL
export const pool = process.env.DATABASE_URL 
  ? new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 5, // reduzindo o máximo de conexões para evitar sobrecarga
      idleTimeoutMillis: 300000, // aumentando para 5 minutos
      connectionTimeoutMillis: 10000, // aumentando para 10 segundos
      ssl: { rejectUnauthorized: false }, // permite SSL sem validação rigorosa
      keepAlive: true, // mantém a conexão TCP ativa
    })
  : null;

// Adicionar evento para tratar erros de conexão
if (pool) {
  pool.on('error', (err) => {
    console.error('Erro inesperado no pool de conexão PostgreSQL:', err);
  });
  
  // Log de verificação da conexão
  pool.query('SELECT NOW()')
    .then(res => console.log('Conexão PostgreSQL estabelecida com sucesso:', res.rows[0].now))
    .catch(err => console.error('Erro ao verificar conexão PostgreSQL:', err));
}

// Inicializar o cliente Drizzle
export const db = pool 
  ? drizzle(pool, { schema }) 
  : null;
