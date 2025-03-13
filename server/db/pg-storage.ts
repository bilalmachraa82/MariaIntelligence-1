import { eq, and, gte, lte, desc, sql, or, like } from 'drizzle-orm';
import { getDrizzle } from './index';
import { 
  properties, 
  owners, 
  reservations, 
  activities, 
  Property,
  Owner,
  Reservation,
  Activity,
  InsertProperty,
  InsertOwner,
  InsertReservation,
  InsertActivity
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
      .where(eq(reservations.status, 'completed'));
    
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
      .where(eq(reservations.status, 'completed'));
    
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
      .where(eq(reservations.propertyId, propertyId));
    
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    
    // Get total net profit
    const profitResult = await this.db
      .select({ netProfit: sql<number>`sum(${reservations.netAmount})` })
      .from(reservations)
      .where(eq(reservations.propertyId, propertyId));
    
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
      type: 'system_initialized', 
      description: 'Sistema inicializado com sucesso' 
    });
    
    console.log('Data seeding completed!');
  }
}