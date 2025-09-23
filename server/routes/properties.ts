import { Router } from 'express';
import { db } from '../db/index.js';
import { properties, owners, reservations } from '../../shared/schema.js';
import { eq, desc, and, gte, lte, count } from 'drizzle-orm';

const router = Router();

// GET /api/properties - Listar todas as propriedades
router.get('/', async (req, res) => {
  try {
    const propertiesList = await db
      .select({
        id: properties.id,
        name: properties.name,
        cleaningCost: properties.cleaningCost,
        checkInFee: properties.checkInFee,
        commission: properties.commission,
        teamPayment: properties.teamPayment,
        active: properties.active,
        ownerName: owners.name
      })
      .from(properties)
      .leftJoin(owners, eq(properties.ownerId, owners.id))
      .orderBy(properties.name);

    res.json(propertiesList);
  } catch (error) {
    console.error('Erro ao buscar propriedades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/properties/:id - Obter propriedade específica
router.get('/:id', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);

    const [property] = await db
      .select({
        id: properties.id,
        name: properties.name,
        cleaningCost: properties.cleaningCost,
        checkInFee: properties.checkInFee,
        commission: properties.commission,
        teamPayment: properties.teamPayment,
        cleaningTeam: properties.cleaningTeam,
        monthlyFixedCost: properties.monthlyFixedCost,
        active: properties.active,
        ownerId: properties.ownerId,
        ownerName: owners.name,
        ownerEmail: owners.email
      })
      .from(properties)
      .leftJoin(owners, eq(properties.ownerId, owners.id))
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!property) {
      return res.status(404).json({ error: 'Propriedade não encontrada' });
    }

    res.json(property);
  } catch (error) {
    console.error('Erro ao buscar propriedade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/properties/:id/stats - Estatísticas da propriedade
router.get('/:id/stats', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { year = new Date().getFullYear() } = req.query;

    // Estatísticas básicas
    const [totalReservations] = await db
      .select({ count: count() })
      .from(reservations)
      .where(eq(reservations.propertyId, propertyId));

    // Reservas do ano atual
    const [yearReservations] = await db
      .select({ count: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.propertyId, propertyId),
          gte(reservations.checkInDate, `${year}-01-01`),
          lte(reservations.checkInDate, `${year}-12-31`)
        )
      );

    // Últimas reservas
    const recentReservations = await db
      .select({
        id: reservations.id,
        guestName: reservations.guestName,
        checkInDate: reservations.checkInDate,
        checkOutDate: reservations.checkOutDate,
        totalAmount: reservations.totalAmount,
        status: reservations.status
      })
      .from(reservations)
      .where(eq(reservations.propertyId, propertyId))
      .orderBy(desc(reservations.checkInDate))
      .limit(5);

    const stats = {
      totalReservations: totalReservations.count,
      yearReservations: yearReservations.count,
      recentReservations
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/properties - Criar nova propriedade
router.post('/', async (req, res) => {
  try {
    const {
      name,
      ownerId,
      cleaningCost = "0",
      checkInFee = "0",
      commission = "0",
      teamPayment = "0",
      cleaningTeam,
      monthlyFixedCost = "0"
    } = req.body;

    // Validações básicas
    if (!name || !ownerId) {
      return res.status(400).json({
        error: 'Nome e proprietário são obrigatórios'
      });
    }

    // Verificar se o proprietário existe
    const [owner] = await db
      .select()
      .from(owners)
      .where(eq(owners.id, ownerId))
      .limit(1);

    if (!owner) {
      return res.status(400).json({
        error: 'Proprietário não encontrado'
      });
    }

    // Criar propriedade
    const [newProperty] = await db
      .insert(properties)
      .values({
        name,
        ownerId,
        cleaningCost: cleaningCost.toString(),
        checkInFee: checkInFee.toString(),
        commission: commission.toString(),
        teamPayment: teamPayment.toString(),
        cleaningTeam,
        monthlyFixedCost: monthlyFixedCost.toString(),
        active: true
      })
      .returning();

    res.status(201).json({
      message: 'Propriedade criada com sucesso',
      property: newProperty
    });

  } catch (error) {
    console.error('Erro ao criar propriedade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/properties/:id - Atualizar propriedade
router.put('/:id', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const {
      name,
      ownerId,
      cleaningCost,
      checkInFee,
      commission,
      teamPayment,
      cleaningTeam,
      monthlyFixedCost,
      active
    } = req.body;

    // Verificar se a propriedade existe
    const [existingProperty] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    if (!existingProperty) {
      return res.status(404).json({ error: 'Propriedade não encontrada' });
    }

    // Atualizar propriedade
    const [updatedProperty] = await db
      .update(properties)
      .set({
        name,
        ownerId,
        cleaningCost: cleaningCost?.toString(),
        checkInFee: checkInFee?.toString(),
        commission: commission?.toString(),
        teamPayment: teamPayment?.toString(),
        cleaningTeam,
        monthlyFixedCost: monthlyFixedCost?.toString(),
        active
      })
      .where(eq(properties.id, propertyId))
      .returning();

    res.json({
      message: 'Propriedade atualizada com sucesso',
      property: updatedProperty
    });

  } catch (error) {
    console.error('Erro ao atualizar propriedade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/properties/:id - Eliminar propriedade (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);

    // Verificar se há reservas ativas
    const [activeReservations] = await db
      .select({ count: count() })
      .from(reservations)
      .where(
        and(
          eq(reservations.propertyId, propertyId),
          eq(reservations.status, 'confirmed')
        )
      );

    if (activeReservations.count > 0) {
      return res.status(400).json({
        error: 'Não é possível eliminar propriedade com reservas ativas'
      });
    }

    // Desativar propriedade (soft delete)
    const [deactivatedProperty] = await db
      .update(properties)
      .set({ active: false })
      .where(eq(properties.id, propertyId))
      .returning();

    if (!deactivatedProperty) {
      return res.status(404).json({ error: 'Propriedade não encontrada' });
    }

    res.json({
      message: 'Propriedade desativada com sucesso',
      property: deactivatedProperty
    });

  } catch (error) {
    console.error('Erro ao eliminar propriedade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/properties/:id/cleaning-schedule - Agenda de limpezas
router.get('/:id/cleaning-schedule', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

    // Buscar reservas do mês para determinar limpezas
    const monthReservations = await db
      .select({
        id: reservations.id,
        guestName: reservations.guestName,
        checkInDate: reservations.checkInDate,
        checkOutDate: reservations.checkOutDate,
        cleaningFee: reservations.cleaningFee,
        status: reservations.status
      })
      .from(reservations)
      .where(
        and(
          eq(reservations.propertyId, propertyId),
          gte(reservations.checkOutDate, `${year}-${month.toString().padStart(2, '0')}-01`),
          lte(reservations.checkOutDate, `${year}-${month.toString().padStart(2, '0')}-31`)
        )
      )
      .orderBy(reservations.checkOutDate);

    // Obter dados da propriedade
    const [property] = await db
      .select({
        name: properties.name,
        cleaningCost: properties.cleaningCost,
        cleaningTeam: properties.cleaningTeam
      })
      .from(properties)
      .where(eq(properties.id, propertyId))
      .limit(1);

    const cleaningSchedule = monthReservations.map(reservation => ({
      reservationId: reservation.id,
      date: reservation.checkOutDate,
      guestName: reservation.guestName,
      cleaningCost: property?.cleaningCost || "0",
      cleaningTeam: property?.cleaningTeam || "Equipa Principal",
      status: reservation.status === 'completed' ? 'scheduled' : 'pending'
    }));

    res.json({
      property: property?.name,
      month: parseInt(month as string),
      year: parseInt(year as string),
      cleanings: cleaningSchedule,
      totalCleanings: cleaningSchedule.length,
      totalCost: cleaningSchedule.reduce((total, cleaning) =>
        total + parseFloat(cleaning.cleaningCost), 0
      ).toFixed(2)
    });

  } catch (error) {
    console.error('Erro ao buscar agenda de limpezas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;