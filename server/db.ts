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
      max: 10, // máximo de conexões
      idleTimeoutMillis: 30000, // tempo máximo que uma conexão pode ficar ociosa
      connectionTimeoutMillis: 2000 // tempo máximo para estabelecer uma conexão
    })
  : null;

// Inicializar o cliente Drizzle
export const db = pool 
  ? drizzle(pool, { schema }) 
  : null;
