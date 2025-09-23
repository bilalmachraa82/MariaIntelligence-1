import { db } from './server/db/index';
import { properties, owners, reservations, cleaningTeams } from './shared/schema';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

console.log('🌱 Iniciando seed do banco de dados...\n');

async function seed() {
  try {
    // 1. Criar proprietários
    console.log('\n🏠 Criando proprietários...');
    const ownersData = [
      {
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '+351 912 345 678',
        taxId: '123456789',
        address: 'Rua das Flores, 123, Lisboa',
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '+351 913 456 789',
        taxId: '987654321',
        address: 'Av. da Liberdade, 456, Porto',
      },
    ];

    const insertedOwners = await db.insert(owners).values(ownersData).returning();
    console.log(`✅ ${insertedOwners.length} proprietários criados`);

    // 3. Criar propriedades
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

    const insertedProperties = await db.insert(properties).values(propertiesData).returning();
    console.log(`✅ ${insertedProperties.length} propriedades criadas`);

    // 4. Criar equipes de limpeza
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

    const insertedTeams = await db.insert(cleaningTeams).values(cleaningTeamsData).returning();
    console.log(`✅ ${insertedTeams.length} equipes de limpeza criadas`);

    // 5. Criar algumas reservas de exemplo
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

    const insertedReservations = await db.insert(reservations).values(reservationsData).returning();
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