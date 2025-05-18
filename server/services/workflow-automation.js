/**
 * Serviço de automação de fluxo de trabalho para reservas
 * Gerencia a automação de status, agendamento de limpezas e cálculos de faturamento
 */

import { db } from '../db.js';
import { reservations, maintenanceTasks } from '@shared/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';

/**
 * Atualiza automaticamente o status das reservas com base nas datas
 * - Reservas com data de check-in no passado e check-out no futuro => 'checked-in'
 * - Reservas com data de check-out no passado => 'completed'
 */
async function updateReservationStatuses() {
  const today = new Date();
  
  try {
    // Atualizar para 'checked-in' reservas que já começaram mas não terminaram
    await db
      .update(reservations)
      .set({ status: 'checked-in' })
      .where(
        and(
          eq(reservations.status, 'confirmed'),
          lte(reservations.checkInDate, today),
          gte(reservations.checkOutDate, today)
        )
      );
    
    // Atualizar para 'completed' reservas que já terminaram
    await db
      .update(reservations)
      .set({ status: 'completed' })
      .where(
        and(
          eq(reservations.status, 'checked-in'),
          lte(reservations.checkOutDate, today)
        )
      );
      
    console.log('✅ Status das reservas atualizado automaticamente');
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar status das reservas:', error);
    return false;
  }
}

/**
 * Agenda tarefas de limpeza automaticamente para reservas
 * - Antes de check-in (preparação)
 * - Após check-out (limpeza final)
 */
async function scheduleCleanings() {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  try {
    // Buscar reservas com check-in na próxima semana que não tem limpeza agendada
    const upcomingReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          gte(reservations.checkInDate, today),
          lte(reservations.checkInDate, nextWeek),
          eq(reservations.status, 'confirmed')
        )
      );
      
    // Verificar se já existe tarefa de limpeza para cada reserva
    for (const reservation of upcomingReservations) {
      // Verificar se já existe tarefa para essa reserva
      const existingTasks = await db
        .select()
        .from(maintenanceTasks)
        .where(
          and(
            eq(maintenanceTasks.propertyId, reservation.propertyId),
            eq(maintenanceTasks.description, `Limpeza pré check-in: ${reservation.guestName}`)
          )
        );
        
      if (existingTasks.length === 0) {
        // Criar uma data para limpeza (dia anterior ao check-in)
        const cleaningDate = new Date(reservation.checkInDate);
        cleaningDate.setDate(cleaningDate.getDate() - 1);
        
        // Criar tarefa de limpeza pré check-in
        await db
          .insert(maintenanceTasks)
          .values({
            propertyId: reservation.propertyId,
            description: `Limpeza pré check-in: ${reservation.guestName}`,
            priority: 'high',
            dueDate: cleaningDate.toISOString().split('T')[0],
            status: 'pending',
            assignedTo: 'Equipe de Limpeza',
            reportedAt: today.toISOString().split('T')[0],
            notes: `Preparar propriedade para o hóspede ${reservation.guestName} que chega em ${reservation.checkInDate}. Reserva #${reservation.id}`
          });
          
        console.log(`✅ Agendada limpeza pré check-in para reserva #${reservation.id}`);
      }
    }
    
    // Buscar reservas com check-out na próxima semana que não tem limpeza pós-checkout agendada
    const completingReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          gte(reservations.checkOutDate, today),
          lte(reservations.checkOutDate, nextWeek),
          eq(reservations.status, 'checked-in')
        )
      );
      
    // Agendar limpezas pós-checkout
    for (const reservation of completingReservations) {
      // Verificar se já existe tarefa para essa reserva
      const existingTasks = await db
        .select()
        .from(maintenanceTasks)
        .where(
          and(
            eq(maintenanceTasks.propertyId, reservation.propertyId),
            eq(maintenanceTasks.description, `Limpeza pós check-out: ${reservation.guestName}`)
          )
        );
        
      if (existingTasks.length === 0) {
        // Criar tarefa de limpeza pós check-out
        await db
          .insert(maintenanceTasks)
          .values({
            propertyId: reservation.propertyId,
            description: `Limpeza pós check-out: ${reservation.guestName}`,
            priority: 'high',
            dueDate: reservation.checkOutDate,
            status: 'pending',
            assignedTo: 'Equipe de Limpeza',
            reportedAt: today.toISOString().split('T')[0],
            notes: `Limpar propriedade após saída do hóspede ${reservation.guestName}. Reserva #${reservation.id}`
          });
          
        console.log(`✅ Agendada limpeza pós check-out para reserva #${reservation.id}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao agendar limpezas:', error);
    return false;
  }
}

/**
 * Calcula os valores a serem faturados aos proprietários por período
 * @param {number} ownerId - ID do proprietário
 * @param {string} startDate - Data inicial (YYYY-MM-DD)
 * @param {string} endDate - Data final (YYYY-MM-DD)
 * @returns {object} - Detalhes do faturamento
 */
async function calculateOwnerInvoice(ownerId, startDate, endDate) {
  try {
    // Buscar propriedades do proprietário
    const properties = await db.query.properties.findMany({
      where: eq(properties.ownerId, ownerId)
    });
    
    const propertyIds = properties.map(p => p.id);
    
    // Buscar reservas completadas no período
    const completedReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.status, 'completed'),
          gte(reservations.checkOutDate, startDate),
          lte(reservations.checkOutDate, endDate),
          // Filtrar por propriedades do proprietário
          // Using 'in' operator
          reservations.propertyId.in(propertyIds)
        )
      );
      
    // Calcular valores totais
    let totalRevenue = 0;
    let totalCleaningFees = 0;
    let totalCheckInFees = 0;
    let totalCommissions = 0;
    
    const reservationDetails = [];
    
    for (const reservation of completedReservations) {
      // Converter valores string para número
      const revenue = parseFloat(reservation.totalAmount) || 0;
      const cleaningFee = parseFloat(reservation.cleaningFee) || 0;
      const checkInFee = parseFloat(reservation.checkInFee) || 0;
      const commission = parseFloat(reservation.commission) || 0;
      
      totalRevenue += revenue;
      totalCleaningFees += cleaningFee;
      totalCheckInFees += checkInFee;
      totalCommissions += commission;
      
      // Propriedade correspondente
      const property = properties.find(p => p.id === reservation.propertyId);
      
      reservationDetails.push({
        reservationId: reservation.id,
        propertyId: reservation.propertyId,
        propertyName: property?.name || 'Desconhecida',
        guestName: reservation.guestName,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        revenue,
        cleaningFee,
        checkInFee,
        commission
      });
    }
    
    // Calcular valor total a ser faturado
    const totalInvoiceAmount = totalCleaningFees + totalCheckInFees + totalCommissions;
    
    return {
      ownerId,
      startDate,
      endDate,
      totalRevenue,
      totalCleaningFees,
      totalCheckInFees,
      totalCommissions,
      totalInvoiceAmount,
      reservationDetails,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Erro ao calcular faturamento do proprietário:', error);
    throw error;
  }
}

module.exports = {
  updateReservationStatuses,
  scheduleCleanings,
  calculateOwnerInvoice
};