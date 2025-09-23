import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:K8x0QdHL9P3w@ep-young-recipe-a4h2n0h8-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

console.log('🌱 Iniciando seed do banco de dados...');

async function seed() {
  try {
    // Conectar ao banco
    const sql = neon(DATABASE_URL);

    // 1. Criar proprietários
    console.log('🏠 Criando proprietários...');
    const owners = await sql`
      INSERT INTO owners (name, email, phone, tax_id, address)
      VALUES 
        ('João Silva', 'joao.silva@email.com', '+351 912 345 678', '123456789', 'Rua das Flores, 123, Lisboa'),
        ('Maria Santos', 'maria.santos@email.com', '+351 913 456 789', '987654321', 'Av. da Liberdade, 456, Porto')
      RETURNING *
    `;
    console.log(`✅ ${owners.length} proprietários criados`);

    // 2. Criar propriedades
    console.log('\n🏡 Criando propriedades...');
    const properties = await sql`
      INSERT INTO properties (name, owner_id, address, type, bedrooms, bathrooms, capacity, price_per_night, amenities, images, status)
      VALUES 
        ('Apartamento Vista Mar', ${owners[0].id}, 'Rua da Praia, 123, Cascais', 'apartment', 2, 1, 4, 120, ${JSON.stringify(['Wi-Fi', 'Cozinha', 'Ar Condicionado', 'Vista Mar'])}, ${JSON.stringify(['https://example.com/vista-mar1.jpg', 'https://example.com/vista-mar2.jpg'])}, 'active'),
        ('Casa do Centro Histórico', ${owners[0].id}, 'Rua da Alfândega, 45, Lisboa', 'house', 3, 2, 6, 180, ${JSON.stringify(['Wi-Fi', 'Cozinha', 'Máquina de Lavar', 'Terraço'])}, ${JSON.stringify(['https://example.com/centro1.jpg', 'https://example.com/centro2.jpg'])}, 'active'),
        ('Studio Moderno Porto', ${owners[1].id}, 'Rua de Santa Catarina, 789, Porto', 'studio', 1, 1, 2, 80, ${JSON.stringify(['Wi-Fi', 'Cozinha', 'TV'])}, ${JSON.stringify(['https://example.com/porto1.jpg'])}, 'active')
      RETURNING *
    `;
    console.log(`✅ ${properties.length} propriedades criadas`);

    // 3. Criar equipes de limpeza
    console.log('\n🧹 Criando equipes de limpeza...');
    const teams = await sql`
      INSERT INTO cleaning_teams (name, email, phone, status)
      VALUES 
        ('Clean Pro Lisboa', 'cleanpro@email.com', '+351 914 567 890', 'active'),
        ('Limpeza Rápida Porto', 'limpezarapida@email.com', '+351 915 678 901', 'active')
      RETURNING *
    `;
    console.log(`✅ ${teams.length} equipes de limpeza criadas`);

    // 4. Criar algumas reservas de exemplo
    console.log('\n📅 Criando reservas de exemplo...');
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const reservations = await sql`
      INSERT INTO reservations (property_id, guest_name, guest_email, guest_phone, check_in, check_out, total_guests, total_price, status, notes)
      VALUES 
        (${properties[0].id}, 'Pedro Oliveira', 'pedro@email.com', '+351 916 789 012', ${nextWeek.toISOString().split('T')[0]}, ${new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}, 2, 500, 'confirmed', 'Chegada por volta das 16h'),
        (${properties[1].id}, 'Sophie Martin', 'sophie@email.fr', '+33 6 12 34 56 78', ${nextMonth.toISOString().split('T')[0]}, ${new Date(nextMonth.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}, 4, 800, 'confirmed', 'Família com 2 crianças'),
        (${properties[2].id}, 'Carlos Mendes', 'carlos@email.com', '+351 917 890 123', ${new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}, ${new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}, 2, 200, 'confirmed', 'Check-in tardio')
      RETURNING *
    `;
    console.log(`✅ ${reservations.length} reservas criadas`);

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   - ${owners.length} proprietários`);
    console.log(`   - ${properties.length} propriedades`);
    console.log(`   - ${teams.length} equipes de limpeza`);
    console.log(`   - ${reservations.length} reservas`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

// Executar o seed
seed()
  .then(() => {
    console.log('\n✅ Seed finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed falhou:', error);
    process.exit(1);
  });

export default seed;