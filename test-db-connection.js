import pg from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const { Client } = pg;

async function testConnection() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    
    console.log('✅ Conexão bem-sucedida!\n');
    
    // Testar query simples
    const result = await client.query('SELECT NOW()');
    console.log('⏰ Hora no servidor:', result.rows[0].now);
    
    // Verificar tabelas existentes
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tabelas existentes:', tables.rows.length);
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    await client.end();
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Verifique:');
    console.log('   1. A connection string está correta');
    console.log('   2. O banco está ativo no Neon');
  }
}

testConnection();