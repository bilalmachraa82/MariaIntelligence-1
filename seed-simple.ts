import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './shared/schema';

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:K8x0QdHL9P3w@ep-young-recipe-a4h2n0h8-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require";

console.log('🌱 Iniciando seed do banco de dados...\n');

async function seed() {
  try {
    // Conectar ao banco
    const sql = neon(DATABASE_URL);
    const db = drizzle(sql, { schema });

    // 1. Criar proprietários
    console.log('🏠 Criando proprietários...');
    const ownersData = [
      {
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '+351 912 345 678',
        tax_id: '123456789',
        address: 'Rua das Flores, 123, Lisboa',
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '+351 913 456 789',
        tax_id: '987654321',
        address: 'Av. da Liberdade, 456, Porto',
      },
    ];

    const insertedOwners = await sql`
      INSERT INTO owners (name, email, phone, tax_id, address)
      VALUES 
        (${ownersData[0].name}, ${ownersData[0].email}, ${ownersData[0].phone}, ${ownersData[0].tax_id}, ${ownersData[0].address}),
        (${ownersData[1].name}, ${ownersData[1].email}, ${ownersData[1].phone}, ${ownersData[1].tax_id}, ${ownersData[1].address})
      RETURNING *
    `;
    console.log(`✅ ${insertedOwners.length} proprietários criados`);

    // 2. Criar propriedades
    console.log('\n🏡 Criando propriedades...');
    const propertiesData = [
      {
        name: 'Apartamento Vista Mar',
        aliases: ['Vista Mar', 'Apartamento Cascais'],
        ownerId: insertedOwners[0].id,
        cleaningCost: '45',
        checkInFee: '20',
        commission: '15',
        teamPayment: '40',
        cleaningTeam: 'Clean Pro Lisboa',
        monthlyFixedCost: '100',
        active: true,
      },
      {
        name: 'Casa do Centro Histórico',
        aliases: ['Centro Histórico', 'Casa Lisboa'],
        ownerId: insertedOwners[0].id,
        cleaningCost: '60',
        checkInFee: '25',
        commission: '18',
        teamPayment: '55',
        cleaningTeam: 'Clean Pro Lisboa',
        monthlyFixedCost: '150',
        active: true,
      },
      {
        name: 'Studio Moderno Porto',
        aliases: ['Studio Porto', 'Moderno Porto'],
        ownerId: insertedOwners[1].id,
        cleaningCost: '35',
        checkInFee: '15',
        commission: '12',
        teamPayment: '30',
        cleaningTeam: 'Limpeza Rápida Porto',
        monthlyFixedCost: '80',
        active: true,
      },
    ];

    const insertedProperties = await sql`
      INSERT INTO properties (name, owner_id, address, type, bedrooms, bathrooms, capacity, price_per_night, amenities, images, status)
      VALUES 
        (${propertiesData[0].name}, ${insertedOwners[0].id}, ${propertiesData[0].address || 'Rua Exemplo, 123'}, ${propertiesData[0].type || 'apartment'}, ${propertiesData[0].bedrooms || 2}, ${propertiesData[0].bathrooms || 1}, ${propertiesData[0].capacity || 4}, ${propertiesData[0].price_per_night || 100}, ${JSON.stringify(propertiesData[0].amenities || [])}, ${JSON.stringify(propertiesData[0].images || [])}, ${propertiesData[0].status || 'active'}),
        (${propertiesData[1].name}, ${insertedOwners[0].id}, ${propertiesData[1].address || 'Rua Centro, 456'}, ${propertiesData[1].type || 'house'}, ${propertiesData[1].bedrooms || 3}, ${propertiesData[1].bathrooms || 2}, ${propertiesData[1].capacity || 6}, ${propertiesData[1].price_per_night || 150}, ${JSON.stringify(propertiesData[1].amenities || [])}, ${JSON.stringify(propertiesData[1].images || [])}, ${propertiesData[1].status || 'active'}),
        (${propertiesData[2].name}, ${insertedOwners[1].id}, ${propertiesData[2].address || 'Av. Porto, 789'}, ${propertiesData[2].type || 'studio'}, ${propertiesData[2].bedrooms || 1}, ${propertiesData[2].bathrooms || 1}, ${propertiesData[2].capacity || 2}, ${propertiesData[2].price_per_night || 80}, ${JSON.stringify(propertiesData[2].amenities || [])}, ${JSON.stringify(propertiesData[2].images || [])}, ${propertiesData[2].status || 'active'})
      RETURNING *
    `;
    console.log(`✅ ${insertedProperties.length} propriedades criadas`);

    // 3. Criar equipes de limpeza
    console.log('\n🧹 Criando equipes de limpeza...');
    const cleaningTeamsData = [
      {
        name: 'Clean Pro Lisboa',
        email: 'cleanpro@email.com',
        phone: '+351 914 567 890',
        rate: '45',
        status: 'active',
      },
      {
        name: 'Limpeza Rápida Porto',
        email: 'limpezarapida@email.com',
        phone: '+351 915 678 901',
        rate: '40',
        status: 'active',
      },
    ];

    const insertedTeams = await db.insert(schema.cleaningTeams).values(cleaningTeamsData).returning();
    console.log(`✅ ${insertedTeams.length} equipes de limpeza criadas`);

    // 4. Criar algumas reservas de exemplo
    console.log('\n📅 Criando reservas de exemplo...');
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const reservationsData = [
      {
        propertyId: insertedProperties[0].id,
        guestName: 'Pedro Oliveira',
        guestEmail: 'pedro@email.com',
        guestPhone: '+351 916 789 012',
        checkInDate: nextWeek.toISOString().split('T')[0],
        checkOutDate: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalAmount: '500',
        checkInFee: '20',
        teamPayment: '40',
        platformFee: '50',
        cleaningFee: '45',
        commission: '75',
        netAmount: '320',
        numGuests: 2,
        status: 'confirmed',
        notes: 'Chegada por volta das 16h',
        source: 'airbnb',
      },
      {
        propertyId: insertedProperties[1].id,
        guestName: 'Sophie Martin',
        guestEmail: 'sophie@email.fr',
        guestPhone: '+33 6 12 34 56 78',
        checkInDate: nextMonth.toISOString().split('T')[0],
        checkOutDate: new Date(nextMonth.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalAmount: '800',
        checkInFee: '25',
        teamPayment: '55',
        platformFee: '80',
        cleaningFee: '60',
        commission: '144',
        netAmount: '511',
        numGuests: 4,
        status: 'confirmed',
        notes: 'Família com 2 crianças',
        source: 'booking',
      },
      {
        propertyId: insertedProperties[2].id,
        guestName: 'Carlos Mendes',
        guestEmail: 'carlos@email.com',
        guestPhone: '+351 917 890 123',
        checkInDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkOutDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalAmount: '200',
        checkInFee: '15',
        teamPayment: '30',
        platformFee: '20',
        cleaningFee: '35',
        commission: '24',
        netAmount: '131',
        numGuests: 2,
        status: 'confirmed',
        notes: 'Check-in tardio',
        source: 'direct',
      },
    ];

    const insertedReservations = await db.insert(schema.reservations).values(reservationsData).returning();
    console.log(`✅ ${insertedReservations.length} reservas criadas`);

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   - ${insertedOwners.length} proprietários`);
    console.log(`   - ${insertedProperties.length} propriedades`);
    console.log(`   - ${insertedTeams.length} equipes de limpeza`);
    console.log(`   - ${insertedReservations.length} reservas`);

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