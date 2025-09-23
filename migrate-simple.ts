import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
  try {
    console.log('🔄 Executando migrações simples...');
    
    // Adicionar coluna aliases à tabela properties se não existir
    await sql`
      ALTER TABLE properties 
      ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';
    `;
    
    console.log('✅ Coluna aliases adicionada com sucesso!');
    
    // Verificar se a coluna foi criada
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'properties' AND column_name = 'aliases';
    `;
    
    if (result.length > 0) {
      console.log('✅ Coluna aliases verificada:', result[0]);
    }
    
    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

runMigration();