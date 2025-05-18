/**
 * Script para testar a automação de status de reservas
 * Atualiza automaticamente:
 * - "confirmed" -> "checked-in" (quando data de check-in já passou, mas check-out ainda não)
 * - "checked-in" -> "completed" (quando data de check-out já passou)
 */

const { db } = require('./server/db');
const { reservations } = require('./shared/schema');
const { eq, and, gte, lte } = require('drizzle-orm');

async function updateReservationStatuses() {
  const today = new Date();
  
  try {
    console.log(`Atualizando status de reservas em ${today.toISOString()}`);
    
    // 1. Buscar todas as reservas para verificar status
    const allReservations = await db.select().from(reservations);
    console.log(`Total de reservas no sistema: ${allReservations.length}`);
    
    // 2. Identificar reservas que precisam ser atualizadas para "checked-in"
    const toCheckIn = allReservations.filter(r => 
      r.status === 'confirmed' && 
      new Date(r.checkInDate) <= today && 
      new Date(r.checkOutDate) >= today
    );
    
    console.log(`Reservas para atualizar para "checked-in": ${toCheckIn.length}`);
    for (const r of toCheckIn) {
      console.log(`  - ID: ${r.id}, Hóspede: ${r.guestName}, Check-in: ${r.checkInDate}, Check-out: ${r.checkOutDate}`);
    }
    
    // 3. Identificar reservas que precisam ser atualizadas para "completed"
    const toComplete = allReservations.filter(r => 
      r.status === 'checked-in' && 
      new Date(r.checkOutDate) < today
    );
    
    console.log(`Reservas para atualizar para "completed": ${toComplete.length}`);
    for (const r of toComplete) {
      console.log(`  - ID: ${r.id}, Hóspede: ${r.guestName}, Check-in: ${r.checkInDate}, Check-out: ${r.checkOutDate}`);
    }
    
    // 4. Atualizar reservas para "checked-in"
    if (toCheckIn.length > 0) {
      for (const reservation of toCheckIn) {
        await db
          .update(reservations)
          .set({ status: 'checked-in' })
          .where(eq(reservations.id, reservation.id));
          
        console.log(`✅ Reserva #${reservation.id} atualizada para "checked-in"`);
      }
    }
    
    // 5. Atualizar reservas para "completed"
    if (toComplete.length > 0) {
      for (const reservation of toComplete) {
        await db
          .update(reservations)
          .set({ status: 'completed' })
          .where(eq(reservations.id, reservation.id));
          
        console.log(`✅ Reserva #${reservation.id} atualizada para "completed"`);
      }
    }
    
    console.log('Atualização de status de reservas concluída com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar status das reservas:', error);
    return false;
  }
}

// Executar a função de atualização
updateReservationStatuses()
  .then(() => {
    console.log('Processo finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro no processo:', error);
    process.exit(1);
  });