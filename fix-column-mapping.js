/**
 * Fix column mapping between database and Drizzle schema
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

async function fixColumnMapping() {
  try {
    const sql = neon(process.env.DATABASE_URL);

    console.log('🔧 Corrigindo mapeamento de colunas...\n');

    // 1. Verificar se já temos as colunas camelCase
    console.log('1. Verificando estrutura atual das tabelas...');

    const propertiesColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'properties'
      AND column_name IN ('ownerId', 'owner_id')
    `;

    console.log('Colunas properties encontradas:', propertiesColumns.map(c => c.column_name));

    // 2. Se não temos ownerId, vamos adicionar e copiar dados
    const hasOwnerId = propertiesColumns.some(c => c.column_name === 'ownerId');
    if (!hasOwnerId) {
      console.log('2. Adicionando coluna ownerId na tabela properties...');
      await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS "ownerId" INTEGER`;

      console.log('3. Copiando dados de owner_id para ownerId...');
      await sql`UPDATE properties SET "ownerId" = owner_id WHERE "ownerId" IS NULL`;
    } else {
      console.log('2. Coluna ownerId já existe, atualizando dados...');
      await sql`UPDATE properties SET "ownerId" = owner_id WHERE "ownerId" IS NULL`;
    }

    // 3. Verificar reservations
    const reservationsColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'reservations'
      AND column_name IN ('propertyId', 'guestName', 'guestEmail', 'guestPhone')
    `;

    console.log('Colunas reservations encontradas:', reservationsColumns.map(c => c.column_name));

    // 4. Adicionar colunas camelCase para reservations se necessário
    const needsPropertyId = !reservationsColumns.some(c => c.column_name === 'propertyId');
    const needsGuestName = !reservationsColumns.some(c => c.column_name === 'guestName');
    const needsGuestEmail = !reservationsColumns.some(c => c.column_name === 'guestEmail');
    const needsGuestPhone = !reservationsColumns.some(c => c.column_name === 'guestPhone');

    if (needsPropertyId) {
      console.log('4. Adicionando coluna propertyId...');
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "propertyId" INTEGER`;
      await sql`UPDATE reservations SET "propertyId" = property_id WHERE "propertyId" IS NULL`;
    }

    if (needsGuestName) {
      console.log('5. Adicionando coluna guestName...');
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "guestName" TEXT`;
      await sql`UPDATE reservations SET "guestName" = guest_name WHERE "guestName" IS NULL`;
    }

    if (needsGuestEmail) {
      console.log('6. Adicionando coluna guestEmail...');
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "guestEmail" TEXT`;
      await sql`UPDATE reservations SET "guestEmail" = guest_email WHERE "guestEmail" IS NULL`;
    }

    if (needsGuestPhone) {
      console.log('7. Adicionando coluna guestPhone...');
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "guestPhone" TEXT`;
      await sql`UPDATE reservations SET "guestPhone" = guest_phone WHERE "guestPhone" IS NULL`;
    }

    // 5. Adicionar colunas em falta no schema Drizzle para reservations
    console.log('8. Verificando colunas específicas do Drizzle...');

    const drizzleColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'reservations'
      AND column_name IN ('checkInDate', 'checkOutDate', 'totalAmount', 'numGuests', 'createdAt', 'updatedAt')
    `;

    const hasCheckInDate = drizzleColumns.some(c => c.column_name === 'checkInDate');
    const hasCheckOutDate = drizzleColumns.some(c => c.column_name === 'checkOutDate');
    const hasTotalAmount = drizzleColumns.some(c => c.column_name === 'totalAmount');
    const hasNumGuests = drizzleColumns.some(c => c.column_name === 'numGuests');
    const hasCreatedAt = drizzleColumns.some(c => c.column_name === 'createdAt');
    const hasUpdatedAt = drizzleColumns.some(c => c.column_name === 'updatedAt');

    if (!hasCheckInDate) {
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "checkInDate" TEXT`;
      await sql`UPDATE reservations SET "checkInDate" = check_in_date WHERE "checkInDate" IS NULL AND check_in_date IS NOT NULL`;
      await sql`UPDATE reservations SET "checkInDate" = check_in::TEXT WHERE "checkInDate" IS NULL AND check_in IS NOT NULL`;
    }

    if (!hasCheckOutDate) {
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "checkOutDate" TEXT`;
      await sql`UPDATE reservations SET "checkOutDate" = check_out_date WHERE "checkOutDate" IS NULL AND check_out_date IS NOT NULL`;
      await sql`UPDATE reservations SET "checkOutDate" = check_out::TEXT WHERE "checkOutDate" IS NULL AND check_out IS NOT NULL`;
    }

    if (!hasTotalAmount) {
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "totalAmount" TEXT`;
      await sql`UPDATE reservations SET "totalAmount" = total_amount WHERE "totalAmount" IS NULL AND total_amount IS NOT NULL`;
      await sql`UPDATE reservations SET "totalAmount" = total_price::TEXT WHERE "totalAmount" IS NULL AND total_price IS NOT NULL`;
    }

    if (!hasNumGuests) {
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "numGuests" INTEGER`;
      await sql`UPDATE reservations SET "numGuests" = num_guests WHERE "numGuests" IS NULL AND num_guests IS NOT NULL`;
      await sql`UPDATE reservations SET "numGuests" = total_guests WHERE "numGuests" IS NULL AND total_guests IS NOT NULL`;
    }

    if (!hasCreatedAt) {
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP`;
      await sql`UPDATE reservations SET "createdAt" = created_at WHERE "createdAt" IS NULL AND created_at IS NOT NULL`;
    }

    if (!hasUpdatedAt) {
      await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP`;
      await sql`UPDATE reservations SET "updatedAt" = updated_at WHERE "updatedAt" IS NULL AND updated_at IS NOT NULL`;
    }

    // 6. Testar se agora conseguimos aceder aos dados com o Drizzle
    console.log('\n9. Testando acesso aos dados com novos mapeamentos...');

    const testProperties = await sql`
      SELECT id, name, "ownerId", active
      FROM properties
      WHERE "ownerId" IS NOT NULL
      LIMIT 3
    `;

    console.log('✅ Propriedades com ownerId:', testProperties.length);
    testProperties.forEach(p => console.log(`   - ${p.name} (Owner: ${p.ownerId})`));

    const testReservations = await sql`
      SELECT id, "guestName", "propertyId", "checkInDate", "checkOutDate", "totalAmount"
      FROM reservations
      WHERE "guestName" IS NOT NULL
      LIMIT 3
    `;

    console.log('✅ Reservas com colunas camelCase:', testReservations.length);
    testReservations.forEach(r => console.log(`   - ${r.guestName} (Property: ${r.propertyId}, ${r.checkInDate} - ${r.checkOutDate})`));

    console.log('\n✅ Mapeamento de colunas corrigido com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao corrigir mapeamento:', error.message);
  }
}

fixColumnMapping().catch(console.error);