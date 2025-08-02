import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgresql://mariafaz2025_owner:CM7v0BQbRiTF@ep-dark-waterfall-a28ar6lp-pooler.eu-central-1.aws.neon.tech/mariafaz2025?sslmode=require';

async function setupDatabase() {
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔗 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!\n');

    // Criar tabelas
    console.log('📊 Criando tabelas...');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Tabela users criada');

    // Owners table
    await client.query(`
      CREATE TABLE IF NOT EXISTS owners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        tax_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Tabela owners criada');

    // Properties table
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER REFERENCES owners(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        type VARCHAR(50),
        bedrooms INTEGER,
        bathrooms INTEGER,
        capacity INTEGER,
        price_per_night DECIMAL(10,2),
        amenities JSONB,
        images JSONB,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Tabela properties criada');

    // Reservations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
        guest_name VARCHAR(255) NOT NULL,
        guest_email VARCHAR(255),
        guest_phone VARCHAR(50),
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        total_guests INTEGER,
        total_price DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'confirmed',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Tabela reservations criada');

    // Cleaning teams table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cleaning_teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Tabela cleaning_teams criada\n');

    // Inserir dados iniciais
    console.log('🌱 Inserindo dados de teste...');

    // Admin user (senha: admin123)
    await client.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ('Admin', 'admin@mariafaz.com', '$2b$10$8KJpAjbJ3Jp9uGJvDp5wGOhKvyFqBhWFKMpTmR8WhHKB8kKvLWV5C', 'admin')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('   ✅ Usuário admin criado');

    // Proprietários
    const owner1 = await client.query(`
      INSERT INTO owners (name, email, phone, address, tax_id)
      VALUES ('João Silva', 'joao.silva@email.com', '+351 912 345 678', 'Rua das Flores, 123, Porto', '123456789')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    
    const owner2 = await client.query(`
      INSERT INTO owners (name, email, phone, address, tax_id)
      VALUES ('Maria Santos', 'maria.santos@email.com', '+351 913 456 789', 'Av. da Liberdade, 456, Lisboa', '987654321')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    console.log('   ✅ 2 proprietários criados');

    // Propriedades
    if (owner1.rows.length > 0) {
      await client.query(`
        INSERT INTO properties (owner_id, name, address, type, bedrooms, bathrooms, capacity, price_per_night, amenities, status)
        VALUES 
          ($1, 'Casa da Praia', 'Av. Beira Mar, 100, Cascais', 'casa', 3, 2, 6, 150.00, '{"wifi": true, "piscina": true, "ar_condicionado": true}'::jsonb, 'active'),
          ($1, 'Apartamento Centro', 'Rua Augusta, 50, Lisboa', 'apartamento', 2, 1, 4, 80.00, '{"wifi": true, "elevador": true}'::jsonb, 'active')
        ON CONFLICT DO NOTHING
      `, [owner1.rows[0].id]);
    }

    if (owner2.rows.length > 0) {
      await client.query(`
        INSERT INTO properties (owner_id, name, address, type, bedrooms, bathrooms, capacity, price_per_night, amenities, status)
        VALUES 
          ($1, 'Villa Douro', 'Quinta do Vale, Porto', 'villa', 5, 4, 10, 300.00, '{"wifi": true, "piscina": true, "jardim": true, "churrasqueira": true}'::jsonb, 'active')
        ON CONFLICT DO NOTHING
      `, [owner2.rows[0].id]);
    }
    console.log('   ✅ 3 propriedades criadas');

    // Equipe de limpeza
    await client.query(`
      INSERT INTO cleaning_teams (name, phone, email)
      VALUES 
        ('Equipe Alpha', '+351 914 567 890', 'alpha@limpeza.com'),
        ('Equipe Beta', '+351 915 678 901', 'beta@limpeza.com')
      ON CONFLICT DO NOTHING
    `);
    console.log('   ✅ 2 equipes de limpeza criadas\n');

    console.log('🎉 Setup completo!');
    console.log('\n📋 Resumo:');
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM owners) as owners,
        (SELECT COUNT(*) FROM properties) as properties,
        (SELECT COUNT(*) FROM cleaning_teams) as teams
    `);
    const s = stats.rows[0];
    console.log(`   - Usuários: ${s.users}`);
    console.log(`   - Proprietários: ${s.owners}`);
    console.log(`   - Propriedades: ${s.properties}`);
    console.log(`   - Equipes: ${s.teams}`);
    
    console.log('\n🔐 Acesso:');
    console.log('   URL: https://mariafaz.vercel.app');
    console.log('   Email: admin@mariafaz.com');
    console.log('   Senha: admin123');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.detail) console.error('   Detalhes:', error.detail);
  } finally {
    await client.end();
    console.log('\n✅ Conexão encerrada');
  }
}

setupDatabase();