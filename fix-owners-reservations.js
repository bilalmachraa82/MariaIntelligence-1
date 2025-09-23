/**
 * Fix owners and reservations tables to match Drizzle schema
 */

import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

async function fixOwnersAndReservations() {
  try {
    const sql = neon(process.env.DATABASE_URL);

    console.log('🔧 Corrigindo tabelas owners e reservations...\n');

    // 1. Fix owners table - add missing company column
    console.log('1. Verificando e corrigindo tabela owners...');

    const ownersColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'owners'
      AND column_name IN ('company', 'taxId')
    `;

    const hasCompany = ownersColumns.some(c => c.column_name === 'company');
    const hasTaxId = ownersColumns.some(c => c.column_name === 'taxId');

    if (!hasCompany) {
      console.log('   Adicionando coluna company...');
      await sql`ALTER TABLE owners ADD COLUMN IF NOT EXISTS company TEXT`;
    }

    if (!hasTaxId) {
      console.log('   Adicionando coluna taxId...');
      await sql`ALTER TABLE owners ADD COLUMN IF NOT EXISTS "taxId" TEXT`;
      await sql`UPDATE owners SET "taxId" = tax_id WHERE "taxId" IS NULL AND tax_id IS NOT NULL`;
    }

    // 2. Test owners
    console.log('2. Testando owners...');
    const testOwners = await sql`SELECT id, name, email, "taxId", company FROM owners LIMIT 3`;
    console.log(`   ✅ Encontrados ${testOwners.length} owners:`);
    testOwners.forEach(o => console.log(`      - ${o.name} (${o.email})`));

    // 3. Fix reservations - check why they're empty
    console.log('\n3. Investigando reservations...');

    // Check if reservations exist with original column names
    const reservationsCheck = await sql`
      SELECT COUNT(*) as total FROM reservations
    `;
    console.log(`   Total de reservations na BD: ${reservationsCheck[0].total}`);

    if (reservationsCheck[0].total > 0) {
      // Check what columns have data
      const sampleReservation = await sql`
        SELECT * FROM reservations LIMIT 1
      `;

      console.log('   Amostra de reservation (primeiras colunas):');
      const reservation = sampleReservation[0];

      // Check key fields
      console.log(`      - id: ${reservation.id}`);
      console.log(`      - guestName: ${reservation.guestName}`);
      console.log(`      - guest_name: ${reservation.guest_name}`);
      console.log(`      - propertyId: ${reservation.propertyId}`);
      console.log(`      - property_id: ${reservation.property_id}`);
      console.log(`      - checkInDate: ${reservation.checkInDate}`);
      console.log(`      - check_in_date: ${reservation.check_in_date}`);

      // Update missing data from old columns to new columns
      console.log('\n4. Atualizando dados de reservations...');

      // Ensure all camelCase columns have data
      await sql`UPDATE reservations SET "guestName" = guest_name WHERE "guestName" IS NULL AND guest_name IS NOT NULL`;
      await sql`UPDATE reservations SET "propertyId" = property_id WHERE "propertyId" IS NULL AND property_id IS NOT NULL`;
      await sql`UPDATE reservations SET "checkInDate" = check_in_date WHERE "checkInDate" IS NULL AND check_in_date IS NOT NULL`;
      await sql`UPDATE reservations SET "checkOutDate" = check_out_date WHERE "checkOutDate" IS NULL AND check_out_date IS NOT NULL`;
      await sql`UPDATE reservations SET "totalAmount" = total_amount WHERE "totalAmount" IS NULL AND total_amount IS NOT NULL`;
      await sql`UPDATE reservations SET "guestEmail" = guest_email WHERE "guestEmail" IS NULL AND guest_email IS NOT NULL`;
      await sql`UPDATE reservations SET "guestPhone" = guest_phone WHERE "guestPhone" IS NULL AND guest_phone IS NOT NULL`;
      await sql`UPDATE reservations SET "numGuests" = num_guests WHERE "numGuests" IS NULL AND num_guests IS NOT NULL`;
      await sql`UPDATE reservations SET "createdAt" = created_at WHERE "createdAt" IS NULL AND created_at IS NOT NULL`;
      await sql`UPDATE reservations SET "updatedAt" = updated_at WHERE "updatedAt" IS NULL AND updated_at IS NOT NULL`;

      // Fill in dates from original date columns if needed
      await sql`UPDATE reservations SET "checkInDate" = check_in::TEXT WHERE "checkInDate" IS NULL AND check_in IS NOT NULL`;
      await sql`UPDATE reservations SET "checkOutDate" = check_out::TEXT WHERE "checkOutDate" IS NULL AND check_out IS NOT NULL`;
      await sql`UPDATE reservations SET "totalAmount" = total_price::TEXT WHERE "totalAmount" IS NULL AND total_price IS NOT NULL`;
      await sql`UPDATE reservations SET "numGuests" = total_guests WHERE "numGuests" IS NULL AND total_guests IS NOT NULL`;

      console.log('   ✅ Dados de reservations atualizados');
    }

    // 5. Final test
    console.log('\n5. Teste final...');

    const finalTestReservations = await sql`
      SELECT id, "guestName", "propertyId", "checkInDate", "checkOutDate", "totalAmount", "numGuests"
      FROM reservations
      WHERE "guestName" IS NOT NULL
      LIMIT 3
    `;

    console.log(`   ✅ Reservations com dados corretos: ${finalTestReservations.length}`);
    finalTestReservations.forEach(r => {
      console.log(`      - ${r.guestName} na propriedade ${r.propertyId} (${r.checkInDate} a ${r.checkOutDate}) - €${r.totalAmount}`);
    });

    console.log('\n✅ Correção concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  }
}

fixOwnersAndReservations().catch(console.error);