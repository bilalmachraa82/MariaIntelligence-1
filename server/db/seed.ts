import { db } from './index';
import { owners, properties, reservations, cleaningTeams, users } from './schema';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

console.log('🌱 Iniciando seed do banco de dados...\n');

async function seed() {
  try {
    // 1. Criar usuário admin
    console.log('👤 Criando usuário admin...');
    const adminPassword = await hash('admin123', 10);
    const [adminUser] = await db.insert(users).values({
      id: uuidv4(),
      email: 'admin@mariafaz.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'admin',
      isActive: true,
    }).returning();
    console.log('✅ Usuário admin criado: admin@mariafaz.com (senha: admin123)');

    // 2. Criar proprietários
    console.log('\n🏠 Criando proprietários...');
    const ownersData = [
      {
        id: uuidv4(),
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '+351 912 345 678',
        nif: '123456789',
        address: 'Rua das Flores, 123, Lisboa',
        iban: 'PT50 0000 0000 0000 0000 0000 0',
        commission: 15,
        paymentPreference: 'transfer' as const,
        notes: 'Proprietário desde 2020',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '+351 913 456 789',
        nif: '987654321',
        address: 'Av. da Liberdade, 456, Porto',
        iban: 'PT50 1111 1111 1111 1111 1111 1',
        commission: 18,
        paymentPreference: 'transfer' as const,
        notes: 'Prefere comunicação por email',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const insertedOwners = await db.insert(owners).values(ownersData).returning();
    console.log(`✅ ${insertedOwners.length} proprietários criados`);

    // 3. Criar propriedades
    console.log('\n🏡 Criando propriedades...');
    const propertiesData = [
      {
        id: uuidv4(),
        name: 'Apartamento Vista Mar',
        address: 'Rua da Praia, 100, Cascais',
        type: 'apartment' as const,
        typology: 'T2',
        area: 85,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        registrationNumber: 'AL-12345',
        ownerId: insertedOwners[0].id,
        status: 'active' as const,
        amenities: ['wifi', 'ar-condicionado', 'piscina', 'estacionamento'],
        description: 'Apartamento moderno com vista para o mar',
        rules: 'Não fumadores, sem animais',
        checkInTime: '15:00',
        checkOutTime: '11:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Casa do Centro Histórico',
        address: 'Rua Augusta, 50, Lisboa',
        type: 'house' as const,
        typology: 'T3',
        area: 120,
        bedrooms: 3,
        bathrooms: 2,
        maxGuests: 6,
        registrationNumber: 'AL-67890',
        ownerId: insertedOwners[0].id,
        status: 'active' as const,
        amenities: ['wifi', 'cozinha-equipada', 'varanda'],
        description: 'Casa tradicional no coração de Lisboa',
        rules: 'Respeitar o sossego dos vizinhos',
        checkInTime: '14:00',
        checkOutTime: '12:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Studio Moderno Porto',
        address: 'Rua de Santa Catarina, 200, Porto',
        type: 'studio' as const,
        typology: 'T0',
        area: 45,
        bedrooms: 0,
        bathrooms: 1,
        maxGuests: 2,
        registrationNumber: 'AL-11111',
        ownerId: insertedOwners[1].id,
        status: 'active' as const,
        amenities: ['wifi', 'kitchenette', 'ar-condicionado'],
        description: 'Studio compacto e moderno',
        rules: 'Não fumadores',
        checkInTime: '15:00',
        checkOutTime: '11:00',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const insertedProperties = await db.insert(properties).values(propertiesData).returning();
    console.log(`✅ ${insertedProperties.length} propriedades criadas`);

    // 4. Criar equipes de limpeza
    console.log('\n🧹 Criando equipes de limpeza...');
    const cleaningTeamsData = [
      {
        id: uuidv4(),
        name: 'Clean Pro Lisboa',
        contactPerson: 'Ana Costa',
        phone: '+351 914 567 890',
        email: 'cleanpro@email.com',
        pricePerCleaning: 45,
        notes: 'Disponível todos os dias',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Limpeza Rápida',
        contactPerson: 'Carlos Mendes',
        phone: '+351 915 678 901',
        email: 'limpezarapida@email.com',
        pricePerCleaning: 40,
        notes: 'Especialistas em check-out',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
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
        id: uuidv4(),
        propertyId: insertedProperties[0].id,
        checkIn: nextWeek,
        checkOut: new Date(nextWeek.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 dias
        guestName: 'Pedro Oliveira',
        guestEmail: 'pedro@email.com',
        guestPhone: '+351 916 789 012',
        guestCount: 2,
        adultsCount: 2,
        childrenCount: 0,
        totalAmount: 500,
        cleaningFee: 45,
        platform: 'booking' as const,
        status: 'confirmed' as const,
        notes: 'Chegada por volta das 16h',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        propertyId: insertedProperties[1].id,
        checkIn: nextMonth,
        checkOut: new Date(nextMonth.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        guestName: 'Sophie Martin',
        guestEmail: 'sophie@email.fr',
        guestPhone: '+33 6 12 34 56 78',
        guestCount: 4,
        adultsCount: 2,
        childrenCount: 2,
        totalAmount: 840,
        cleaningFee: 45,
        platform: 'airbnb' as const,
        status: 'confirmed' as const,
        notes: 'Família francesa, crianças de 6 e 8 anos',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const insertedReservations = await db.insert(reservations).values(reservationsData).returning();
    console.log(`✅ ${insertedReservations.length} reservas criadas`);

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`   • 1 usuário admin`);
    console.log(`   • ${insertedOwners.length} proprietários`);
    console.log(`   • ${insertedProperties.length} propriedades`);
    console.log(`   • ${insertedTeams.length} equipes de limpeza`);
    console.log(`   • ${insertedReservations.length} reservas`);
    
    console.log('\n🔐 Credenciais de acesso:');
    console.log('   Email: admin@mariafaz.com');
    console.log('   Senha: admin123');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

// Executar seed
seed()
  .then(() => {
    console.log('\n✅ Processo de seed finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Falha no seed:', error);
    process.exit(1);
  });