/**
 * Controlador para automação de processos do sistema
 * Gerencia endpoints para automação de status de reservas, agendamento de limpezas e faturamento
 */

const { updateReservationStatuses, scheduleCleanings, calculateOwnerInvoice } = require('../services/workflow-automation');
const { db } = require('../db');
const { properties, owners } = require('@shared/schema');
const { eq } = require('drizzle-orm');

/**
 * Executa atualização de status de reservas e agendamento de limpezas
 * @param {Request} req 
 * @param {Response} res 
 */
async function runAutomations(req, res) {
  try {
    // Atualizar status das reservas (confirmed -> checked-in -> completed)
    const statusesUpdated = await updateReservationStatuses();
    
    // Agendar limpezas (pré check-in e pós check-out)
    const cleaningsScheduled = await scheduleCleanings();
    
    return res.json({
      success: true,
      statusesUpdated,
      cleaningsScheduled,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao executar automações:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Gera fatura para proprietário em um período específico
 * @param {Request} req 
 * @param {Response} res 
 */
async function generateOwnerInvoice(req, res) {
  try {
    const { ownerId, startDate, endDate } = req.query;
    
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: 'ID do proprietário é obrigatório'
      });
    }
    
    // Converter para números
    const ownerIdNumber = parseInt(ownerId);
    
    // Verificar se o proprietário existe
    const owner = await db.query.owners.findFirst({
      where: eq(owners.id, ownerIdNumber)
    });
    
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Proprietário não encontrado'
      });
    }
    
    // Usar mês atual se não for especificado
    const currentDate = new Date();
    const defaultStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
    const defaultEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
    
    // Calcular fatura
    const invoice = await calculateOwnerInvoice(
      ownerIdNumber,
      startDate || defaultStartDate,
      endDate || defaultEndDate
    );
    
    // Adicionar informações do proprietário à fatura
    invoice.ownerName = owner.name;
    invoice.ownerEmail = owner.email;
    
    return res.json({
      success: true,
      invoice
    });
  } catch (error) {
    console.error('❌ Erro ao gerar fatura para proprietário:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Lista todas as propriedades com reservas e limpezas agendadas
 * Visão consolidada para gerenciamento
 * @param {Request} req 
 * @param {Response} res 
 */
async function getPropertyManagementView(req, res) {
  try {
    const { startDate, endDate } = req.query;
    
    // Usar período padrão (próximos 30 dias) se não for especificado
    const today = new Date();
    const defaultStartDate = today.toISOString().split('T')[0];
    const defaultEndDate = new Date(today.setDate(today.getDate() + 30)).toISOString().split('T')[0];
    
    const periodStart = startDate || defaultStartDate;
    const periodEnd = endDate || defaultEndDate;
    
    // Buscar propriedades com reservas e limpezas no período
    const propertyView = await db.query.properties.findMany({
      with: {
        owner: true,
        reservations: {
          where: and(
            gte(reservations.checkInDate, periodStart),
            lte(reservations.checkOutDate, periodEnd)
          )
        },
        maintenanceTasks: {
          where: and(
            eq(maintenanceTasks.status, 'pending'),
            gte(maintenanceTasks.dueDate, periodStart),
            lte(maintenanceTasks.dueDate, periodEnd)
          )
        }
      },
      where: eq(properties.active, true)
    });
    
    // Transformar resultados para uma visualização gerencial
    const managementView = propertyView.map(property => {
      const upcomingReservations = property.reservations || [];
      const pendingCleanings = property.maintenanceTasks || [];
      
      return {
        id: property.id,
        name: property.name,
        owner: {
          id: property.owner.id,
          name: property.owner.name
        },
        reservations: upcomingReservations.map(r => ({
          id: r.id,
          guestName: r.guestName,
          checkInDate: r.checkInDate,
          checkOutDate: r.checkOutDate,
          status: r.status,
          numGuests: r.numGuests
        })),
        cleanings: pendingCleanings.map(c => ({
          id: c.id,
          description: c.description,
          dueDate: c.dueDate,
          status: c.status,
          priority: c.priority
        })),
        stats: {
          reservationCount: upcomingReservations.length,
          cleaningCount: pendingCleanings.length,
          hasUpcomingCheckIn: upcomingReservations.some(r => r.status === 'confirmed'),
          hasUpcomingCheckOut: upcomingReservations.some(r => r.status === 'checked-in')
        }
      };
    });
    
    return res.json({
      success: true,
      period: {
        start: periodStart,
        end: periodEnd
      },
      properties: managementView
    });
  } catch (error) {
    console.error('❌ Erro ao obter visão de gerenciamento de propriedades:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  runAutomations,
  generateOwnerInvoice,
  getPropertyManagementView
};