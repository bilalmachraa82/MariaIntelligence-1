/**
 * Script para limpeza total de dados de demonstração
 * Este script remove todas as entidades de demonstração do banco de dados
 * e desabilita a geração de novos dados demo
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;
dotenv.config();

// Conexão com o banco de dados
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function cleanAllDemoData() {
  try {
    console.log('Conectando ao banco de dados...');
    await client.connect();
    
    console.log('Iniciando limpeza de dados de demonstração...');
    
    // Iniciar uma transação
    await client.query('BEGIN');
    
    try {
      // 1. Remover todas as tarefas de manutenção de demonstração
      console.log('Removendo tarefas de manutenção de demonstração...');
      const maintenanceResult = await client.query(`
        DELETE FROM maintenance_tasks 
        WHERE description ILIKE '%[DEMO]%' 
           OR description ILIKE '%exemplo%'
           OR description ILIKE '%example%'
           OR description ILIKE '%demo%'
           OR description ILIKE '%test%'
           OR description ILIKE '%fictício%'
           OR description ILIKE '%ficticio%'
           OR notes ILIKE '%[DEMO]%'
           OR notes ILIKE '%exemplo%'
           OR notes ILIKE '%example%'
           OR notes ILIKE '%demo%'
           OR notes ILIKE '%test%'
           OR description ILIKE '%verificar aquecedor%'
           OR description ILIKE '%reparar chuveiro%'
           OR description ILIKE '%problema na torneira%'
           OR description ILIKE '%ar condicionado%'
           OR description ILIKE '%fechadura%'
           OR description ILIKE '%problema com internet%'
      `);
      
      console.log(`Removidas ${maintenanceResult.rowCount} tarefas de manutenção demo`);
      
      // 2. Remover todas as reservas de demonstração
      console.log('Removendo reservas de demonstração...');
      const reservationsResult = await client.query(`
        DELETE FROM reservations 
        WHERE guest_name ILIKE '%[DEMO]%' 
           OR guest_name ILIKE '%exemplo%'
           OR guest_name ILIKE '%example%'
           OR guest_name ILIKE '%demo%'
           OR guest_name ILIKE '%test%'
           OR guest_name ILIKE '%John Smith%'
           OR guest_name ILIKE '%Emma Johnson%'
           OR guest_name ILIKE '%David Brown%'
           OR guest_name ILIKE '%Michael Davis%'
           OR guest_name ILIKE '%Sophie Miller%'
           OR notes ILIKE '%[DEMO]%'
           OR notes ILIKE '%exemplo%'
           OR notes ILIKE '%example%'
           OR notes ILIKE '%demo%'
           OR notes ILIKE '%test%'
           OR guest_email ILIKE '%example.com%'
           OR guest_email ILIKE '%exemplo.com%'
           OR guest_email ILIKE '%test.com%'
           OR guest_email ILIKE '%teste.com%'
      `);
      
      console.log(`Removidas ${reservationsResult.rowCount} reservas demo`);
      
      // 3. Remover todas as atividades demo
      console.log('Removendo atividades de demonstração...');
      const activitiesResult = await client.query(`
        DELETE FROM activities 
        WHERE description ILIKE '%[DEMO]%' 
           OR description ILIKE '%exemplo%'
           OR description ILIKE '%example%'
           OR description ILIKE '%demo%'
           OR description ILIKE '%test%'
           OR type = 'demo_data_added'
           OR type = 'demo_data_removed'
           OR type = 'demo_data_reset'
      `);
      
      console.log(`Removidas ${activitiesResult.rowCount} atividades demo`);
      
      // 4. Remover todas as propriedades demo
      console.log('Removendo propriedades de demonstração...');
      const propertiesResult = await client.query(`
        DELETE FROM properties 
        WHERE name ILIKE '%[DEMO]%' 
           OR name ILIKE '%exemplo%'
           OR name ILIKE '%example%'
           OR name ILIKE '%demo%'
           OR name ILIKE '%test%'
           OR name ILIKE '%fictício%'
           OR name ILIKE '%ficticio%'
           OR name ILIKE '%Apartamento Floresta%'
           OR name ILIKE '%Vila Mar Azul%'
      `);
      
      console.log(`Removidas ${propertiesResult.rowCount} propriedades demo`);
      
      // 5. Remover todos os proprietários demo
      console.log('Removendo proprietários de demonstração...');
      const ownersResult = await client.query(`
        DELETE FROM owners 
        WHERE name ILIKE '%[DEMO]%' 
           OR name ILIKE '%exemplo%'
           OR name ILIKE '%example%'
           OR name ILIKE '%demo%'
           OR name ILIKE '%test%'
           OR name ILIKE '%fictício%'
           OR name ILIKE '%ficticio%'
           OR notes ILIKE '%[DEMO]%'
           OR notes ILIKE '%exemplo%'
           OR notes ILIKE '%example%'
           OR notes ILIKE '%demo%'
           OR notes ILIKE '%test%'
           OR email ILIKE '%example.com%'
           OR email ILIKE '%exemplo.com%'
           OR email ILIKE '%test.com%'
           OR email ILIKE '%teste.com%'
      `);
      
      console.log(`Removidos ${ownersResult.rowCount} proprietários demo`);
      
      // 6. Guardar registro da limpeza
      await client.query(`
        INSERT INTO activities (type, description, created_at)
        VALUES ('system_cleanup', 'Limpeza total do sistema: removidos dados de demonstração', NOW())
      `);
      
      // Commit da transação
      await client.query('COMMIT');
      
      const totalRemoved = 
        maintenanceResult.rowCount + 
        reservationsResult.rowCount + 
        activitiesResult.rowCount + 
        propertiesResult.rowCount + 
        ownersResult.rowCount;
      
      console.log(`LIMPEZA CONCLUÍDA COM SUCESSO! Total de ${totalRemoved} entidades removidas.`);
      console.log('Você pode agora reiniciar a aplicação para ver as mudanças.');
      
    } catch (error) {
      // Rollback em caso de erro
      await client.query('ROLLBACK');
      console.error('Erro durante a limpeza de dados:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Erro ao conectar ou executar script de limpeza:', error);
  } finally {
    // Fechar conexão
    await client.end();
  }
}

// Executar o script
cleanAllDemoData();