import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

async function runMigration() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL não definida');
      process.exit(1);
    }

    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client);

    console.log('Adicionando coluna aliases à tabela properties...');
    
    // Verificar se a coluna já existe
    const checkColumn = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'properties' AND column_name = 'aliases'
    `);

    if (checkColumn.length === 0) {
      // Adicionar coluna aliases como array de texto
      await db.execute(sql`
        ALTER TABLE properties 
        ADD COLUMN aliases TEXT[] DEFAULT '{}'::TEXT[]
      `);
      console.log('Coluna aliases adicionada com sucesso!');
    } else {
      console.log('Coluna aliases já existe na tabela properties.');
    }

    await client.end();
    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro ao executar migração:', error);
  }
}

runMigration();
