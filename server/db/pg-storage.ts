import { eq, and, gte, lte, desc, sql, or, like, count, sum, between, isNull, inArray, asc } from 'drizzle-orm';
import { getDrizzle } from './index';
import { 
  properties, 
  owners, 
  reservations, 
  activities,
  quotations,
  financialDocuments,
  financialDocumentItems,
  paymentRecords,
  maintenanceTasks,
  Property,
  Owner,
  Reservation,
  Activity,
  Quotation,
  FinancialDocument,
  FinancialDocumentItem,
  PaymentRecord,
  MaintenanceTask,
  InsertProperty,
  InsertOwner,
  InsertReservation,
  InsertActivity,
  InsertQuotation,
  InsertFinancialDocument,
  InsertFinancialDocumentItem,
  InsertPaymentRecord,
  InsertMaintenanceTask
} from '../../shared/schema';
import { IStorage } from '../storage';

export class PgStorage implements IStorage {
  private db = getDrizzle();

  // User methods (from original template)
  async getUser(id: number): Promise<any | undefined> {
    return undefined; // Not implemented yet
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return undefined; // Not implemented yet
  }

  async createUser(user: any): Promise<any> {
    return user; // Not implemented yet
  }

  // Property methods
  async getProperties(): Promise<Property[]> {
    return await this.db.select().from(properties);
  }

  async getProperty(id: number): Promise<Property | undefined> {
    const result = await this.db.select().from(properties).where(eq(properties.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const result = await this.db.insert(properties).values(property).returning();
    return result[0];
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const result = await this.db
      .update(properties)
      .set(property)
      .where(eq(properties.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteProperty(id: number): Promise<boolean> {
    const result = await this.db
      .delete(properties)
      .where(eq(properties.id, id))
      .returning({ id: properties.id });
    return result.length > 0;
  }

  // Owner methods
  async getOwners(): Promise<Owner[]> {
    return await this.db.select().from(owners);
  }

  async getOwner(id: number): Promise<Owner | undefined> {
    const result = await this.db.select().from(owners).where(eq(owners.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createOwner(owner: InsertOwner): Promise<Owner> {
    const result = await this.db.insert(owners).values(owner).returning();
    return result[0];
  }

  async updateOwner(id: number, owner: Partial<InsertOwner>): Promise<Owner | undefined> {
    const result = await this.db
      .update(owners)
      .set(owner)
      .where(eq(owners.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteOwner(id: number): Promise<boolean> {
    const result = await this.db
      .delete(owners)
      .where(eq(owners.id, id))
      .returning({ id: owners.id });
    return result.length > 0;
  }

  // Reservation methods
  async getReservations(): Promise<Reservation[]> {
    return await this.db.select().from(reservations).orderBy(desc(reservations.checkInDate));
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    const result = await this.db.select().from(reservations).where(eq(reservations.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getReservationsByProperty(propertyId: number): Promise<Reservation[]> {
    return await this.db
      .select()
      .from(reservations)
      .where(eq(reservations.propertyId, propertyId))
      .orderBy(desc(reservations.checkInDate));
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    // Convert string dates to Date objects if needed
    const formattedReservation = {
      ...reservation,
      checkInDate: typeof reservation.checkInDate === 'string' 
        ? new Date(reservation.checkInDate) 
        : reservation.checkInDate,
      checkOutDate: typeof reservation.checkOutDate === 'string'
        ? new Date(reservation.checkOutDate)
        : reservation.checkOutDate
    };
    
    const result = await this.db.insert(reservations).values(formattedReservation).returning();
    return result[0];
  }

  async updateReservation(id: number, reservation: Partial<InsertReservation>): Promise<Reservation | undefined> {
    // Format dates if present
    const updateData = { ...reservation };
    if (updateData.checkInDate && typeof updateData.checkInDate === 'string') {
      updateData.checkInDate = new Date(updateData.checkInDate);
    }
    if (updateData.checkOutDate && typeof updateData.checkOutDate === 'string') {
      updateData.checkOutDate = new Date(updateData.checkOutDate);
    }

    const result = await this.db
      .update(reservations)
      .set(updateData)
      .where(eq(reservations.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteReservation(id: number): Promise<boolean> {
    const result = await this.db
      .delete(reservations)
      .where(eq(reservations.id, id))
      .returning({ id: reservations.id });
    return result.length > 0;
  }

  // Activity methods
  async getActivities(limit?: number): Promise<Activity[]> {
    const query = this.db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt));
    
    if (limit) {
      query.limit(limit);
    }
    
    return await query;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const result = await this.db.insert(activities).values(activity).returning();
    return result[0];
  }

  // Statistics methods
  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    let query = this.db
      .select({ totalRevenue: sql<number>`sum(${reservations.totalAmount})` })
      .from(reservations)
      .where(
        or(
          eq(reservations.status, 'completed'),
          eq(reservations.status, 'confirmed')
        )
      );
    
    if (startDate) {
      query = query.where(gte(reservations.checkInDate, startDate));
    }
    if (endDate) {
      query = query.where(lte(reservations.checkOutDate, endDate));
    }
    
    const result = await query;
    return result[0]?.totalRevenue || 0;
  }

  async getNetProfit(startDate?: Date, endDate?: Date): Promise<number> {
    let query = this.db
      .select({ netProfit: sql<number>`sum(${reservations.netAmount})` })
      .from(reservations)
      .where(
        or(
          eq(reservations.status, 'completed'),
          eq(reservations.status, 'confirmed')
        )
      );
    
    if (startDate) {
      query = query.where(gte(reservations.checkInDate, startDate));
    }
    if (endDate) {
      query = query.where(lte(reservations.checkOutDate, endDate));
    }
    
    const result = await query;
    return result[0]?.netProfit || 0;
  }

  async getOccupancyRate(propertyId?: number, startDate?: Date, endDate?: Date): Promise<number> {
    // This is a more complex calculation and might need to be refined
    // For now, we'll implement a simplified version
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);
    
    const start = startDate || startOfYear;
    const end = endDate || endOfYear;
    
    // Get total days in range
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get reservation days
    let query = this.db
      .select({
        propertyId: reservations.propertyId,
        days: sql<number>`sum(
          extract(day from age(${reservations.checkOutDate}, ${reservations.checkInDate}))
        )`
      })
      .from(reservations)
      .where(
        and(
          or(
            and(
              gte(reservations.checkInDate, start),
              lte(reservations.checkInDate, end)
            ),
            and(
              gte(reservations.checkOutDate, start),
              lte(reservations.checkOutDate, end)
            )
          ),
          or(
            eq(reservations.status, 'completed'),
            eq(reservations.status, 'confirmed'),
            eq(reservations.status, 'pending')
          )
        )
      );
    
    if (propertyId) {
      query = query.where(eq(reservations.propertyId, propertyId));
    }
    
    query = query.groupBy(reservations.propertyId);
    
    const result = await query;
    if (result.length === 0) return 0;
    
    // If propertyId is specified, return that property's occupancy
    if (propertyId) {
      const property = result.find(r => r.propertyId === propertyId);
      return property ? Math.min(100, (property.days / totalDays) * 100) : 0;
    }
    
    // Otherwise, calculate average occupancy for all properties
    let totalProperties = 0;
    try {
      totalProperties = (await this.db.select().from(properties)).length;
    } catch (e) {
      console.error("Error counting properties:", e);
      totalProperties = 1; // Default to 1 to avoid division by zero
    }
    
    if (totalProperties === 0) return 0;
    
    const totalOccupiedDays = result.reduce((sum, r) => sum + r.days, 0);
    return Math.min(100, (totalOccupiedDays / (totalDays * totalProperties)) * 100);
  }

  async getPropertyStatistics(propertyId: number): Promise<any> {
    // Get the property
    const propertyResult = await this.db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId));
    
    if (propertyResult.length === 0) {
      throw new Error(`Property with ID ${propertyId} not found`);
    }
    
    const property = propertyResult[0];
    
    // Get total revenue
    const revenueResult = await this.db
      .select({ totalRevenue: sql<number>`sum(${reservations.totalAmount})` })
      .from(reservations)
      .where(
        and(
          eq(reservations.propertyId, propertyId),
          or(
            eq(reservations.status, 'completed'),
            eq(reservations.status, 'confirmed')
          )
        )
      );
    
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    
    // Get total net profit
    const profitResult = await this.db
      .select({ netProfit: sql<number>`sum(${reservations.netAmount})` })
      .from(reservations)
      .where(
        and(
          eq(reservations.propertyId, propertyId),
          or(
            eq(reservations.status, 'completed'),
            eq(reservations.status, 'confirmed')
          )
        )
      );
    
    const netProfit = profitResult[0]?.netProfit || 0;
    
    // Get total reservations
    const reservationsResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(eq(reservations.propertyId, propertyId));
    
    const totalReservations = reservationsResult[0]?.count || 0;
    
    // Get occupancy rate
    const occupancyRate = await this.getOccupancyRate(propertyId);
    
    return {
      property,
      statistics: {
        totalRevenue,
        netProfit,
        totalReservations,
        occupancyRate
      }
    };
  }

  // Reset data functionality
  async resetDatabase(): Promise<boolean> {
    try {
      // Delete all records from tables in reverse order of dependencies
      await this.db.delete(activities);
      await this.db.delete(reservations);
      await this.db.delete(properties);
      await this.db.delete(owners);
      
      // Run seeding
      await this.seedData();
      
      return true;
    } catch (error) {
      console.error('Error resetting database:', error);
      return false;
    }
  }

  // Seed initial data
  async seedData(): Promise<void> {
    console.log('Seeding initial data...');
    
    // Seed Owners
    const seedOwners = [
      { name: 'João Silva', email: 'joao@example.com', phone: '912345678', company: 'Silva Imóveis', taxId: '123456789' },
      { name: 'Maria Oliveira', email: 'maria@example.com', phone: '934567890', taxId: '987654321' },
      { name: 'António Costa', email: 'antonio@example.com', phone: '967890123', company: 'Costa Properties', taxId: '456789123' }
    ];
    
    for (const owner of seedOwners) {
      await this.db.insert(owners).values(owner);
    }
    
    // Get the created owners to reference in properties
    const createdOwners = await this.db.select().from(owners);
    
    // Seed Properties
    if (createdOwners.length > 0) {
      const seedProperties = [
        { 
          name: 'Apartamento Vista Mar', 
          ownerId: createdOwners[0].id, 
          cleaningCost: '40', 
          checkInFee: '25', 
          commission: '10', 
          teamPayment: '15',
          cleaningTeam: 'Equipa Lisboa'
        },
        { 
          name: 'Casa da Montanha', 
          ownerId: createdOwners[1].id, 
          cleaningCost: '50', 
          checkInFee: '30', 
          commission: '12', 
          teamPayment: '20',
          cleaningTeam: 'Equipa Serra'
        },
        { 
          name: 'Moradia Algarve', 
          ownerId: createdOwners[2].id, 
          cleaningCost: '65', 
          checkInFee: '35', 
          commission: '15', 
          teamPayment: '25',
          cleaningTeam: 'Equipa Algarve'
        },
        { 
          name: 'Apartamento Centro Histórico', 
          ownerId: createdOwners[0].id, 
          cleaningCost: '35', 
          checkInFee: '25', 
          commission: '10', 
          teamPayment: '15',
          cleaningTeam: 'Equipa Lisboa'
        }
      ];
      
      for (const property of seedProperties) {
        await this.db.insert(properties).values(property);
      }
    }
    
    // Add initial activities to show system is operational
    await this.db.insert(activities).values({ 
      activityType: 'system_initialized', 
      description: 'Sistema inicializado com sucesso',
      resourceType: 'system',
      resourceId: 0
    });
    
    console.log('Data seeding completed!');
  }

  // Método para gerar relatório financeiro de proprietário
  // Método para obter atividades de manutenção por propriedade no período
  async getMaintenanceActivities(propertyId: number, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      // Consultar atividades de tipo 'maintenance_requested' para a propriedade no período
      const query = `
        SELECT a.*, CAST(COALESCE(
          (SELECT value FROM jsonb_each_text(a.description::jsonb) WHERE key = 'cost'),
          '0'
        ) AS DECIMAL) AS maintenance_cost
        FROM activities a
        WHERE a.type = 'maintenance_requested'
        AND a.entity_type = 'property'
        AND a.entity_id = $1
        AND a.created_at BETWEEN $2 AND $3
      `;
      
      const result = await this.db.query(query, [propertyId, startDate.toISOString(), endDate.toISOString()]);
      
      return result.rows.map(row => ({
        id: row.id,
        description: row.description,
        createdAt: row.created_at,
        maintenanceCost: Number(row.maintenance_cost) || 0
      }));
    } catch (error) {
      console.error(`Erro ao obter atividades de manutenção para propriedade ${propertyId}:`, error);
      return [];
    }
  }
  
  async generateOwnerFinancialReport(ownerId: number, month: string, year: string): Promise<any> {
    try {
      console.log(`Gerando relatório financeiro para proprietário ${ownerId} no mês ${month}/${year}`);
      
      // Obter o proprietário
      const owner = await this.getOwner(ownerId);
      if (!owner) return null;
      
      // Obter o período
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));
      endDate.setDate(endDate.getDate() - 1); // Último dia do mês
      
      console.log(`Período do relatório: ${startDate.toISOString()} até ${endDate.toISOString()}`);
      
      // Obter propriedades do proprietário
      const properties = (await this.getProperties()).filter(p => p.ownerId === ownerId);
      console.log(`Encontradas ${properties.length} propriedades do proprietário`);
      
      // Para cada propriedade, calcular os ganhos e despesas
      const propertyReports = await Promise.all(properties.map(async (property) => {
        // Obter reservas no período
        const reservations = (await this.getReservationsByProperty(property.id))
          .filter(r => {
            const checkIn = new Date(r.checkInDate);
            const checkOut = new Date(r.checkOutDate);
            return (checkIn <= endDate && checkOut >= startDate);
          });
        
        // Obter atividades de manutenção no período
        const maintenanceActivities = await this.getMaintenanceActivities(property.id, startDate, endDate);
        const maintenanceCosts = maintenanceActivities.reduce((sum, activity) => sum + activity.maintenanceCost, 0);
        
        // Calcular receita total, custos e lucro
        const revenue = reservations.reduce((sum, r) => sum + Number(r.totalAmount), 0);
        const cleaningCosts = reservations.reduce((sum, r) => sum + Number(r.cleaningFee || 0), 0);
        const checkInFees = reservations.reduce((sum, r) => sum + Number(r.checkInFee || 0), 0);
        const commission = reservations.reduce((sum, r) => sum + Number(r.commissionFee || 0), 0);
        const teamPayments = reservations.reduce((sum, r) => sum + Number(r.teamPayment || 0), 0);
        
        // Incluir custos de manutenção no cálculo do lucro líquido
        const netProfit = revenue - cleaningCosts - checkInFees - commission - teamPayments - maintenanceCosts;
        
        // Calcular taxa de ocupação
        const occupancyRate = await this.getOccupancyRate(property.id, startDate, endDate);
        
        // Calcular dias disponíveis e ocupados
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const occupiedDays = Math.ceil(totalDays * (occupancyRate / 100));
        
        // Resumo de reservas
        const reservationSummaries = reservations.map(r => ({
          id: r.id,
          checkInDate: r.checkInDate,
          checkOutDate: r.checkOutDate,
          guestName: r.guestName,
          totalAmount: Number(r.totalAmount),
          cleaningFee: Number(r.cleaningFee || 0),
          checkInFee: Number(r.checkInFee || 0),
          commission: Number(r.commissionFee || 0),
          teamPayment: Number(r.teamPayment || 0),
          netAmount: Number(r.netAmount || 0),
          platform: r.platform || 'direct'
        }));
        
        // Resumo de atividades de manutenção
        const maintenanceSummaries = maintenanceActivities.map(a => ({
          id: a.id,
          description: a.description,
          date: a.createdAt,
          cost: a.maintenanceCost
        }));
        
        return {
          propertyId: property.id,
          propertyName: property.name,
          reservations: reservationSummaries,
          maintenanceActivities: maintenanceSummaries,
          revenue,
          cleaningCosts,
          checkInFees,
          commission,
          teamPayments,
          maintenanceCosts,
          netProfit,
          occupancyRate,
          availableDays: totalDays,
          occupiedDays
        };
      }));
      
      // Calcular totais
      const totalRevenue = propertyReports.reduce((sum, p) => sum + p.revenue, 0);
      const totalCleaningCosts = propertyReports.reduce((sum, p) => sum + p.cleaningCosts, 0);
      const totalCheckInFees = propertyReports.reduce((sum, p) => sum + p.checkInFees, 0);
      const totalCommission = propertyReports.reduce((sum, p) => sum + p.commission, 0);
      const totalTeamPayments = propertyReports.reduce((sum, p) => sum + p.teamPayments, 0);
      const totalMaintenanceCosts = propertyReports.reduce((sum, p) => sum + p.maintenanceCosts, 0);
      const totalNetProfit = propertyReports.reduce((sum, p) => sum + p.netProfit, 0);
      
      // Calcular média de ocupação
      const totalOccupancy = propertyReports.reduce((sum, p) => sum + p.occupancyRate, 0);
      const averageOccupancy = propertyReports.length > 0 ? totalOccupancy / propertyReports.length : 0;
      
      return {
        ownerId,
        ownerName: owner.name,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        propertyReports,
        totals: {
          totalRevenue,
          totalCleaningCosts,
          totalCheckInFees,
          totalCommission,
          totalTeamPayments,
          totalMaintenanceCosts,
          totalNetProfit,
          averageOccupancy,
          totalProperties: propertyReports.length,
          totalReservations: propertyReports.reduce((sum, p) => sum + p.reservations.length, 0),
          totalMaintenanceActivities: propertyReports.reduce((sum, p) => sum + p.maintenanceActivities.length, 0)
        }
      };
    } catch (error) {
      console.error("Erro ao gerar relatório financeiro:", error);
      throw error;
    }
  }

  // Método para gerar resumo financeiro do sistema
  async generateFinancialSummary(startDate?: Date, endDate?: Date): Promise<any> {
    // Definir período padrão para o mês atual se não especificado
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    try {
      // Receita total no período
      const totalRevenue = await this.getTotalRevenue(start, end);
      
      // Lucro líquido no período
      const netProfit = await this.getNetProfit(start, end);
      
      // Taxa de ocupação média
      const occupancyRate = await this.getOccupancyRate(undefined, start, end);
      
      // Top 5 propriedades por receita
      const properties = await this.getProperties();
      const propertyStats = await Promise.all(
        properties.filter(p => p.active).map(async property => {
          const stats = await this.getPropertyStatistics(property.id);
          return {
            id: property.id,
            name: property.name,
            revenue: stats.totalRevenue,
            profit: stats.netProfit,
            occupancyRate: stats.occupancyRate
          };
        })
      );
      
      // Ordenar por receita e pegar as top 5
      const topProperties = propertyStats
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      return {
        period: {
          startDate: start.toISOString(),
          endDate: end.toISOString()
        },
        financialMetrics: {
          totalRevenue,
          netProfit,
          occupancyRate
        },
        topProperties
      };
    } catch (error) {
      console.error("Erro ao gerar resumo financeiro:", error);
      throw error;
    }
  }

  /**
   * Busca todos os orçamentos com filtros opcionais
   * @param options Opções de filtro (status, datas)
   * @returns Lista de orçamentos
   */
  async getQuotations(options?: {
    status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    startDate?: Date;
    endDate?: Date;
  }): Promise<any[]> {
    try {
      // Implementação simplificada para evitar erros de compilação
      // Em um cenário real, precisaríamos implementar a lógica completa com filtros
      console.log("Simulando busca de orçamentos com opções:", options);
      
      // Retornar um array vazio como stub
      // Na implementação real, faríamos a consulta ao banco de dados
      return [];
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error);
      return [];
    }
  }

  /**
   * Busca um orçamento específico por ID
   * @param id ID do orçamento
   * @returns Orçamento encontrado ou undefined
   */
  async getQuotation(id: number): Promise<any | undefined> {
    try {
      // Implementação simplificada para evitar erros de compilação
      console.log(`Simulando busca de orçamento #${id}`);
      
      // Retornar um objeto mock para testes
      // Na implementação real, faríamos a consulta ao banco de dados
      return {
        id,
        clientName: "Cliente Teste",
        clientEmail: "cliente@exemplo.com",
        clientPhone: "+351 912 345 678",
        propertyType: "apartment",
        propertyAddress: "Av. da República, Lisboa",
        propertyArea: 80,
        exteriorArea: 15,
        isDuplex: true,
        hasBBQ: true,
        hasGlassGarden: false,
        basePrice: 200.00,
        duplexSurcharge: 25.00,
        bbqSurcharge: 25.00,
        exteriorSurcharge: 0.00,
        glassGardenSurcharge: 0.00,
        additionalSurcharges: 0.00,
        totalPrice: 250.00,
        status: "draft",
        notes: "Orçamento para limpeza completa do apartamento incluindo áreas exteriores e churrasqueira.",
        internalNotes: "Cliente pediu desconto, mas mantivemos preço padrão.",
        validUntil: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Erro ao buscar orçamento #${id}:`, error);
      return undefined;
    }
  }

  /**
   * Método para gerar um PDF de orçamento
   * @param id ID do orçamento
   * @returns Caminho do arquivo PDF gerado
   */
  async generateQuotationPdf(id: number): Promise<string> {
    try {
      // Importar o serviço de PDF - abordagem mais escalável
      const { pdfService } = await import('../services/pdf.service');
      
      // Buscar o orçamento pelo ID
      console.log(`Buscando orçamento #${id} para geração de PDF`);
      const quotation = await this.getQuotation(id);
      if (!quotation) {
        console.error(`Orçamento #${id} não encontrado`);
        throw new Error("Orçamento não encontrado");
      }
      
      // Delegar geração do PDF para o serviço especializado
      console.log(`Delegando geração de PDF para serviço especializado`);
      const filePath = await pdfService.generateQuotationPdf(quotation, id);
      
      // Atualizar o caminho do PDF no banco de dados
      console.log(`Atualizando o campo pdfPath do orçamento #${id} para: ${filePath}`);
      await this.updateQuotation(id, {
        pdfPath: filePath,
        updatedAt: new Date()
      });
      
      // Criar um registro de atividade para rastreamento
      await this.createActivity({
        activityType: "quotation_pdf_generated",
        description: `PDF do orçamento para ${quotation.clientName} foi gerado`,
        resourceId: id,
        resourceType: "quotation"
      });
      
      return filePath;
    } catch (error) {
      console.error(`Erro ao gerar PDF para orçamento #${id}:`, error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "Erro sem stack trace");
      throw error;
    }
  }
  
  /**
   * Cria um novo orçamento no sistema
   * @param quotation Dados do orçamento a ser criado
   * @returns Orçamento criado com ID
   */
  async createQuotation(quotation: any): Promise<any> {
    try {
      console.log("Simulando criação de orçamento:", quotation);
      
      // Em uma implementação real, faríamos um insert no banco de dados
      // Stub de implementação para testes
      return {
        id: Math.floor(Math.random() * 1000) + 1,
        ...quotation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Erro ao criar orçamento:", error);
      throw error;
    }
  }
  
  /**
   * Atualiza um orçamento existente
   * @param id ID do orçamento
   * @param quotation Dados para atualização
   * @returns Orçamento atualizado
   */
  async updateQuotation(id: number, quotation: any): Promise<any> {
    try {
      console.log(`Atualizando orçamento #${id} no banco de dados:`, quotation);
      
      // Verificar se o orçamento existe
      const existing = await this.getQuotation(id);
      if (!existing) {
        console.error(`Orçamento #${id} não encontrado para atualização`);
        throw new Error("Orçamento não encontrado");
      }
      
      // Atualizar o timestamp de modificação
      const updatedData = {
        ...quotation,
        updatedAt: new Date()
      };
      
      // Executar atualização no banco de dados
      const result = await this.db
        .update(quotations)
        .set(updatedData)
        .where(eq(quotations.id, id))
        .returning();
      
      console.log(`Orçamento #${id} atualizado com sucesso:`, result[0]);
      
      // Retornar o objeto atualizado
      return result[0];
    } catch (error) {
      console.error(`Erro ao atualizar orçamento #${id}:`, error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "Erro sem stack trace");
      throw error;
    }
  }
  
  /**
   * Remove um orçamento do sistema
   * @param id ID do orçamento
   * @returns Indicação de sucesso da operação
   */
  async deleteQuotation(id: number): Promise<boolean> {
    try {
      console.log(`Simulando exclusão do orçamento #${id}`);
      
      // Em uma implementação real, faríamos um delete no banco de dados
      // Verificar se o orçamento existe para consistência
      const existing = await this.getQuotation(id);
      if (!existing) return false;
      
      // Simular sucesso da exclusão
      return true;
    } catch (error) {
      console.error(`Erro ao excluir orçamento #${id}:`, error);
      return false;
    }
  }

  // Sistema de Manutenção
  /**
   * Obtém todas as tarefas de manutenção
   * @returns Lista de tarefas de manutenção
   */
  async getMaintenanceTasks(): Promise<MaintenanceTask[]> {
    try {
      const tasks = await this.db
        .select()
        .from(maintenanceTasks)
        .orderBy(desc(maintenanceTasks.reportedAt));
      return tasks;
    } catch (error) {
      console.error("Erro ao obter tarefas de manutenção:", error);
      return [];
    }
  }

  /**
   * Obtém uma tarefa de manutenção específica
   * @param id ID da tarefa
   * @returns Tarefa de manutenção ou undefined
   */
  async getMaintenanceTask(id: number): Promise<MaintenanceTask | undefined> {
    try {
      const results = await this.db
        .select()
        .from(maintenanceTasks)
        .where(eq(maintenanceTasks.id, id));
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      console.error(`Erro ao obter tarefa de manutenção #${id}:`, error);
      return undefined;
    }
  }

  /**
   * Obtém tarefas de manutenção de uma propriedade específica
   * @param propertyId ID da propriedade
   * @returns Lista de tarefas de manutenção
   */
  async getMaintenanceTasksByProperty(propertyId: number): Promise<MaintenanceTask[]> {
    try {
      const tasks = await this.db
        .select()
        .from(maintenanceTasks)
        .where(eq(maintenanceTasks.propertyId, propertyId))
        .orderBy(desc(maintenanceTasks.reportedAt));
      return tasks;
    } catch (error) {
      console.error(`Erro ao obter tarefas de manutenção para propriedade #${propertyId}:`, error);
      return [];
    }
  }

  /**
   * Obtém tarefas de manutenção por status
   * @param status Status das tarefas (pending, scheduled, completed)
   * @returns Lista de tarefas de manutenção
   */
  async getMaintenanceTasksByStatus(status: string): Promise<MaintenanceTask[]> {
    try {
      const tasks = await this.db
        .select()
        .from(maintenanceTasks)
        .where(eq(maintenanceTasks.status, status))
        .orderBy(desc(maintenanceTasks.reportedAt));
      return tasks;
    } catch (error) {
      console.error(`Erro ao obter tarefas de manutenção com status ${status}:`, error);
      return [];
    }
  }

  /**
   * Cria uma nova tarefa de manutenção
   * @param task Dados da tarefa de manutenção
   * @returns Nova tarefa de manutenção criada
   */
  async createMaintenanceTask(task: InsertMaintenanceTask): Promise<MaintenanceTask> {
    try {
      // Formatar as datas se estiverem em string
      const formattedTask = {
        ...task,
        reportedAt: typeof task.reportedAt === 'string' ? task.reportedAt : task.reportedAt,
        dueDate: typeof task.dueDate === 'string' ? task.dueDate : task.dueDate,
        completedAt: task.completedAt ? 
          (typeof task.completedAt === 'string' ? task.completedAt : task.completedAt) : 
          null
      };

      // Inserir no banco de dados
      const result = await this.db
        .insert(maintenanceTasks)
        .values(formattedTask)
        .returning();

      const newTask = result[0];

      // Criar atividade para registrar a criação da tarefa
      const property = await this.getProperty(newTask.propertyId);
      if (property) {
        await this.createActivity({
          activityType: "maintenance_task_created",
          description: `Nova tarefa de manutenção criada para ${property.name}: ${newTask.description.substring(0, 50)}${newTask.description.length > 50 ? '...' : ''}`,
          resourceId: newTask.id,
          resourceType: "maintenance_task"
        });
      }

      return newTask;
    } catch (error) {
      console.error("Erro ao criar tarefa de manutenção:", error);
      throw error;
    }
  }

  /**
   * Atualiza uma tarefa de manutenção existente
   * @param id ID da tarefa
   * @param task Dados atualizados
   * @returns Tarefa atualizada ou undefined
   */
  async updateMaintenanceTask(id: number, task: Partial<InsertMaintenanceTask>): Promise<MaintenanceTask | undefined> {
    try {
      // Verificar se a tarefa existe
      const existingTask = await this.getMaintenanceTask(id);
      if (!existingTask) {
        console.error(`Tarefa de manutenção #${id} não encontrada para atualização`);
        return undefined;
      }

      // Formatar as datas se estiverem em string
      const updateData = { ...task };
      if (updateData.reportedAt && typeof updateData.reportedAt === 'string') {
        updateData.reportedAt = updateData.reportedAt;
      }
      if (updateData.dueDate && typeof updateData.dueDate === 'string') {
        updateData.dueDate = updateData.dueDate;
      }
      if (updateData.completedAt && typeof updateData.completedAt === 'string') {
        updateData.completedAt = updateData.completedAt;
      }

      // Atualizar o campo updatedAt para a data atual
      const now = new Date();
      const result = await this.db
        .update(maintenanceTasks)
        .set({ ...updateData, updatedAt: now })
        .where(eq(maintenanceTasks.id, id))
        .returning();

      if (result.length === 0) {
        return undefined;
      }

      const updatedTask = result[0];

      // Registrar atividade para esta atualização
      const property = await this.getProperty(updatedTask.propertyId);
      const activityType = updatedTask.status === 'completed' ? 
        "maintenance_task_completed" : 
        "maintenance_task_updated";

      await this.createActivity({
        activityType,
        description: `Tarefa de manutenção ${updatedTask.status === 'completed' ? 'concluída' : 'atualizada'} para ${property?.name || `Propriedade #${updatedTask.propertyId}`}: ${updatedTask.description.substring(0, 50)}${updatedTask.description.length > 50 ? '...' : ''}`,
        resourceId: updatedTask.id,
        resourceType: "maintenance_task"
      });

      return updatedTask;
    } catch (error) {
      console.error(`Erro ao atualizar tarefa de manutenção #${id}:`, error);
      return undefined;
    }
  }

  /**
   * Remove uma tarefa de manutenção
   * @param id ID da tarefa
   * @returns Indicação de sucesso da operação
   */
  async deleteMaintenanceTask(id: number): Promise<boolean> {
    try {
      // Obter os dados da tarefa antes de excluir para registrar a atividade
      const task = await this.getMaintenanceTask(id);
      if (!task) {
        return false;
      }

      const property = await this.getProperty(task.propertyId);
      
      // Excluir a tarefa
      const result = await this.db
        .delete(maintenanceTasks)
        .where(eq(maintenanceTasks.id, id))
        .returning({ id: maintenanceTasks.id });

      if (result.length === 0) {
        return false;
      }

      // Registrar atividade para esta exclusão
      await this.createActivity({
        activityType: "maintenance_task_deleted",
        description: `Tarefa de manutenção excluída para ${property?.name || `Propriedade #${task.propertyId}`}: ${task.description.substring(0, 50)}${task.description.length > 50 ? '...' : ''}`,
        resourceId: task.propertyId,
        resourceType: "property"
      });

      return true;
    } catch (error) {
      console.error(`Erro ao excluir tarefa de manutenção #${id}:`, error);
      return false;
    }
  }
}