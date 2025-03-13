import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Verificar se a DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL não está definida. Usando armazenamento em memória.",
  );
}

// Criar um pool de conexão PostgreSQL
export const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

// Inicializar o cliente Drizzle
export const db = pool 
  ? drizzle(pool, { schema }) 
  : null;
