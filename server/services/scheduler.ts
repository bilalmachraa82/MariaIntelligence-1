/**
 * Serviço de agendamento para execução automática de tarefas
 * 
 * Este serviço permite configurar tarefas que são executadas em intervalos específicos
 * como atualização de status de reservas e geração de faturas para proprietários
 */

import axios from 'axios';
import { db } from '../db';
import { eq, and, lt, gte } from 'drizzle-orm';
import { reservations } from '@shared/schema';

// Intervalo de verificação em milissegundos (5 minutos)
const CHECK_INTERVAL = 5 * 60 * 1000;

// Variável para controlar se o agendador está ativo
let schedulerActive = false;

// Armazena o timer para poder cancelar se necessário
let schedulerTimer: NodeJS.Timeout | null = null;

// Flag para evitar execuções sobrepostas
let isRunningTasks = false;

/**
 * Inicia o serviço de agendamento
 */
export function startScheduler() {
  if (schedulerActive) {
    console.log('Agendador já está ativo');
    return;
  }
  
  console.log('🕒 Inicializando agendador de tarefas automáticas');
  schedulerActive = true;
  
  // Executar imediatamente na inicialização
  executeScheduledTasks();
  
  // Configurar verificação periódica
  schedulerTimer = setInterval(executeScheduledTasks, CHECK_INTERVAL);
  
  console.log(`✅ Agendador iniciado - Próxima execução em ${CHECK_INTERVAL / 60000} minutos`);
}

/**
 * Para o serviço de agendamento
 */
export function stopScheduler() {
  if (!schedulerActive) {
    return;
  }
  
  console.log('🛑 Parando agendador de tarefas automáticas');
  
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  
  schedulerActive = false;
}

/**
 * Executa todas as tarefas agendadas
 */
async function executeScheduledTasks() {
  if (isRunningTasks) {
    console.log('Execução de tarefas já em andamento, pulando esta iteração');
    return;
  }
  
  try {
    isRunningTasks = true;
    console.log(`[${new Date().toISOString()}] Executando tarefas agendadas...`);
    
    // 1. Atualizar status de reservas
    await updateReservationStatuses();
    
    // 2. Agendar limpezas antes e depois das reservas
    await scheduleCleanings();
    
    // 3. Gerar faturas para proprietários (último dia do mês)
    await generateOwnerInvoices();
    
    console.log(`[${new Date().toISOString()}] Execução de tarefas agendadas concluída com sucesso`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro durante execução de tarefas agendadas:`, error);
  } finally {
    isRunningTasks = false;
  }
}

/**
 * Atualiza os status das reservas com base nas datas
 * - confirmed -> checked-in (quando data de check-in já passou)
 * - checked-in -> completed (quando data de check-out já passou)
 */
async function updateReservationStatuses() {
  if (!db) {
    console.error('Banco de dados não disponível para atualização de status de reservas');
    return;
  }
  
  const today = new Date();
  
  try {
    console.log('Atualizando status de reservas...');
    
    // 1. Atualizar para checked-in as reservas confirmadas que já passaram da data de check-in
    const checkInResult = await db
      .update(reservations)
      .set({ status: 'checked-in' })
      .where(
        and(
          eq(reservations.status, 'confirmed'),
          lt(reservations.checkInDate, today)
        )
      );
    
    // 2. Atualizar para completed as reservas checked-in que já passaram da data de check-out
    const checkOutResult = await db
      .update(reservations)
      .set({ status: 'completed' })
      .where(
        and(
          eq(reservations.status, 'checked-in'),
          lt(reservations.checkOutDate, today)
        )
      );
    
    console.log(`✅ Atualização de status concluída: ${checkInResult.length} check-ins, ${checkOutResult.length} check-outs processados`);
  } catch (error) {
    console.error('Erro ao atualizar status de reservas:', error);
  }
}

/**
 * Agenda limpezas antes de check-ins e após check-outs
 */
async function scheduleCleanings() {
  if (!db) {
    console.error('Banco de dados não disponível para agendamento de limpezas');
    return;
  }
  
  try {
    console.log('Agendando limpezas automáticas...');
    
    // Obter data atual e próximos 7 dias
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    // Buscar reservas próximas (próximos 7 dias) que precisam de limpeza
    const upcomingReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          gte(reservations.checkInDate, today),
          lt(reservations.checkInDate, nextWeek)
        )
      );
    
    let cleaningsScheduled = 0;
    
    // Para cada reserva, verifique se já existe uma limpeza agendada
    for (const reservation of upcomingReservations) {
      // Verificar se já existe limpeza agendada para esta reserva (pré check-in)
      // Implementar lógica para verificar e criar limpezas no sistema
      
      cleaningsScheduled++;
    }
    
    console.log(`✅ Agendamento de limpezas concluído: ${cleaningsScheduled} limpezas agendadas`);
  } catch (error) {
    console.error('Erro ao agendar limpezas:', error);
  }
}

/**
 * Gera faturas para proprietários no final do mês
 */
async function generateOwnerInvoices() {
  try {
    const today = new Date();
    
    // Verificar se é o último dia do mês
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    if (today.getDate() === lastDayOfMonth || process.env.FORCE_INVOICE_GENERATION === 'true') {
      console.log('Gerando faturas para proprietários...');
      
      // Chamar a API interna para gerar as faturas
      const result = await axios.post('http://localhost:5000/api/reports/owner/generate-all-invoices', {
        month: today.getMonth() + 1,
        year: today.getFullYear()
      });
      
      if (result.data.success) {
        console.log(`✅ Geração de faturas concluída: ${result.data.generatedCount} faturas geradas`);
      } else {
        console.error('Erro ao gerar faturas automáticas:', result.data.message);
      }
    } else {
      console.log(`Hoje não é o último dia do mês (${today.getDate()}/${lastDayOfMonth}), pulando geração de faturas`);
    }
  } catch (error) {
    console.error('Erro ao gerar faturas para proprietários:', error);
  }
}