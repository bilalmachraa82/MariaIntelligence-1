/**
 * Script para criar as tabelas no banco de dados
 * Executa a criação da tabela quotations sem interação do usuário
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

async function createQuotationsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Verificando conexão com o banco de dados...');
    await pool.query('SELECT NOW()');
    console.log('Conexão estabelecida com sucesso!');

    console.log('Verificando se a tabela quotations já existe...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quotations'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('A tabela quotations já existe. Nenhuma ação necessária.');
      await pool.end();
      return;
    }

    console.log('Criando tabela quotations...');
    
    await pool.query(`
      CREATE TABLE quotations (
        id SERIAL PRIMARY KEY,
        client_name TEXT NOT NULL,
        client_email TEXT,
        client_phone TEXT,
        property_type TEXT NOT NULL,
        property_address TEXT,
        property_area INTEGER DEFAULT 0,
        exterior_area INTEGER DEFAULT 0,
        is_duplex BOOLEAN DEFAULT FALSE,
        has_bbq BOOLEAN DEFAULT FALSE,
        has_glass_garden BOOLEAN DEFAULT FALSE,
        base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        duplex_surcharge DECIMAL(10,2) DEFAULT 0,
        bbq_surcharge DECIMAL(10,2) DEFAULT 0,
        exterior_surcharge DECIMAL(10,2) DEFAULT 0,
        glass_garden_surcharge DECIMAL(10,2) DEFAULT 0,
        additional_surcharges DECIMAL(10,2) DEFAULT 0,
        total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft',
        notes TEXT DEFAULT '',
        internal_notes TEXT DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        valid_until DATE,
        pdf_path TEXT DEFAULT ''
      );
    `);

    console.log('Tabela quotations criada com sucesso!');
    
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
  } finally {
    await pool.end();
  }
}

// Executar a função principal
createQuotationsTable();