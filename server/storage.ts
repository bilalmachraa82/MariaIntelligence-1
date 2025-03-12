import {
  properties,
  owners,
  reservations,
  activities,
  type Property,
  type InsertProperty,
  type Owner,
  type InsertOwner,
  type Reservation,
  type InsertReservation,
  type Activity,
  type InsertActivity,
} from "@shared/schema";

export interface IStorage {
  // User methods (from original template)
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;

  // Property methods
  getProperties(): Promise<Property[]>;
  getProperty(id: number): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  
  // Owner methods
  getOwners(): Promise<Owner[]>;
  getOwner(id: number): Promise<Owner | undefined>;
  createOwner(owner: InsertOwner): Promise<Owner>;
  updateOwner(id: number, owner: Partial<InsertOwner>): Promise<Owner | undefined>;
  deleteOwner(id: number): Promise<boolean>;
  
  // Reservation methods
  getReservations(): Promise<Reservation[]>;
  getReservation(id: number): Promise<Reservation | undefined>;
  getReservationsByProperty(propertyId: number): Promise<Reservation[]>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: number, reservation: Partial<InsertReservation>): Promise<Reservation | undefined>;
  deleteReservation(id: number): Promise<boolean>;
  
  // Activity methods
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Statistics methods
  getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number>;
  getNetProfit(startDate?: Date, endDate?: Date): Promise<number>;
  getOccupancyRate(propertyId?: number, startDate?: Date, endDate?: Date): Promise<number>;
  getPropertyStatistics(propertyId: number): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private propertiesMap: Map<number, Property>;
  private ownersMap: Map<number, Owner>;
  private reservationsMap: Map<number, Reservation>;
  private activitiesMap: Map<number, Activity>;
  currentUserId: number;
  currentPropertyId: number;
  currentOwnerId: number;
  currentReservationId: number;
  currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.propertiesMap = new Map();
    this.ownersMap = new Map();
    this.reservationsMap = new Map();
    this.activitiesMap = new Map();
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentOwnerId = 1;
    this.currentReservationId = 1;
    this.currentActivityId = 1;
    
    // Seed data for properties and owners
    this.seedData();
  }

  // User methods from original template
  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Property methods
  async getProperties(): Promise<Property[]> {
    return Array.from(this.propertiesMap.values());
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.propertiesMap.get(id);
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const id = this.currentPropertyId++;
    const newProperty: Property = { ...property, id };
    this.propertiesMap.set(id, newProperty);
    
    // Log activity
    this.createActivity({
      type: "property_created",
      description: `Property "${newProperty.name}" was created`,
      entityId: id,
      entityType: "property"
    });
    
    return newProperty;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const existingProperty = this.propertiesMap.get(id);
    if (!existingProperty) return undefined;

    const updatedProperty = { ...existingProperty, ...property };
    this.propertiesMap.set(id, updatedProperty);
    
    // Log activity
    this.createActivity({
      type: "property_updated",
      description: `Property "${updatedProperty.name}" was updated`,
      entityId: id,
      entityType: "property"
    });
    
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    const property = this.propertiesMap.get(id);
    if (!property) return false;
    
    const result = this.propertiesMap.delete(id);
    
    // Log activity
    if (result) {
      this.createActivity({
        type: "property_deleted",
        description: `Property "${property.name}" was deleted`,
        entityId: id,
        entityType: "property"
      });
    }
    
    return result;
  }

  // Owner methods
  async getOwners(): Promise<Owner[]> {
    return Array.from(this.ownersMap.values());
  }

  async getOwner(id: number): Promise<Owner | undefined> {
    return this.ownersMap.get(id);
  }

  async createOwner(owner: InsertOwner): Promise<Owner> {
    const id = this.currentOwnerId++;
    const newOwner: Owner = { ...owner, id };
    this.ownersMap.set(id, newOwner);
    
    // Log activity
    this.createActivity({
      type: "owner_created",
      description: `Owner "${newOwner.name}" was created`,
      entityId: id,
      entityType: "owner"
    });
    
    return newOwner;
  }

  async updateOwner(id: number, owner: Partial<InsertOwner>): Promise<Owner | undefined> {
    const existingOwner = this.ownersMap.get(id);
    if (!existingOwner) return undefined;

    const updatedOwner = { ...existingOwner, ...owner };
    this.ownersMap.set(id, updatedOwner);
    
    // Log activity
    this.createActivity({
      type: "owner_updated",
      description: `Owner "${updatedOwner.name}" was updated`,
      entityId: id,
      entityType: "owner"
    });
    
    return updatedOwner;
  }

  async deleteOwner(id: number): Promise<boolean> {
    const owner = this.ownersMap.get(id);
    if (!owner) return false;
    
    const result = this.ownersMap.delete(id);
    
    // Log activity
    if (result) {
      this.createActivity({
        type: "owner_deleted",
        description: `Owner "${owner.name}" was deleted`,
        entityId: id,
        entityType: "owner"
      });
    }
    
    return result;
  }

  // Reservation methods
  async getReservations(): Promise<Reservation[]> {
    return Array.from(this.reservationsMap.values());
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    return this.reservationsMap.get(id);
  }

  async getReservationsByProperty(propertyId: number): Promise<Reservation[]> {
    return Array.from(this.reservationsMap.values()).filter(
      (reservation) => reservation.propertyId === propertyId
    );
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const id = this.currentReservationId++;
    const now = new Date();
    const newReservation: Reservation = { 
      ...reservation, 
      id, 
      createdAt: now 
    };
    this.reservationsMap.set(id, newReservation);
    
    // Log activity
    const property = await this.getProperty(reservation.propertyId);
    this.createActivity({
      type: "reservation_created",
      description: `New reservation for "${property?.name || 'Unknown property'}" was created`,
      entityId: id,
      entityType: "reservation"
    });
    
    return newReservation;
  }

  async updateReservation(id: number, reservation: Partial<InsertReservation>): Promise<Reservation | undefined> {
    const existingReservation = this.reservationsMap.get(id);
    if (!existingReservation) return undefined;

    const updatedReservation = { ...existingReservation, ...reservation };
    this.reservationsMap.set(id, updatedReservation);
    
    // Log activity
    const property = await this.getProperty(updatedReservation.propertyId);
    this.createActivity({
      type: "reservation_updated",
      description: `Reservation for "${property?.name || 'Unknown property'}" was updated`,
      entityId: id,
      entityType: "reservation"
    });
    
    return updatedReservation;
  }

  async deleteReservation(id: number): Promise<boolean> {
    const reservation = this.reservationsMap.get(id);
    if (!reservation) return false;
    
    const property = await this.getProperty(reservation.propertyId);
    const result = this.reservationsMap.delete(id);
    
    // Log activity
    if (result) {
      this.createActivity({
        type: "reservation_deleted",
        description: `Reservation for "${property?.name || 'Unknown property'}" was deleted`,
        entityId: id,
        entityType: "reservation"
      });
    }
    
    return result;
  }

  // Activity methods
  async getActivities(limit?: number): Promise<Activity[]> {
    const activities = Array.from(this.activitiesMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? activities.slice(0, limit) : activities;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const now = new Date();
    const newActivity: Activity = { ...activity, id, createdAt: now };
    this.activitiesMap.set(id, newActivity);
    return newActivity;
  }

  // Statistics methods
  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    let reservations = Array.from(this.reservationsMap.values());
    
    if (startDate) {
      reservations = reservations.filter(r => new Date(r.checkInDate) >= startDate);
    }
    
    if (endDate) {
      reservations = reservations.filter(r => new Date(r.checkInDate) <= endDate);
    }
    
    return reservations.reduce((sum, reservation) => {
      return sum + Number(reservation.totalAmount);
    }, 0);
  }

  async getNetProfit(startDate?: Date, endDate?: Date): Promise<number> {
    let reservations = Array.from(this.reservationsMap.values());
    
    if (startDate) {
      reservations = reservations.filter(r => new Date(r.checkInDate) >= startDate);
    }
    
    if (endDate) {
      reservations = reservations.filter(r => new Date(r.checkInDate) <= endDate);
    }
    
    return reservations.reduce((sum, reservation) => {
      return sum + Number(reservation.netAmount);
    }, 0);
  }

  async getOccupancyRate(propertyId?: number, startDate?: Date, endDate?: Date): Promise<number> {
    // Default to current month if no dates provided
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    // Total days in the period
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    let reservations = Array.from(this.reservationsMap.values())
      .filter(r => 
        new Date(r.checkOutDate) > start && 
        new Date(r.checkInDate) < end);
    
    if (propertyId) {
      reservations = reservations.filter(r => r.propertyId === propertyId);
    }
    
    // Calculate occupied days (this is simplified and doesn't account for overlaps)
    let occupiedDays = 0;
    
    reservations.forEach(r => {
      const checkIn = new Date(r.checkInDate) < start ? start : new Date(r.checkInDate);
      const checkOut = new Date(r.checkOutDate) > end ? end : new Date(r.checkOutDate);
      const days = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      occupiedDays += days;
    });
    
    // If calculating for all properties, factor in the number of properties
    if (!propertyId) {
      const propertiesCount = this.propertiesMap.size;
      if (propertiesCount === 0) return 0;
      return (occupiedDays / (totalDays * propertiesCount)) * 100;
    }
    
    return (occupiedDays / totalDays) * 100;
  }

  async getPropertyStatistics(propertyId: number): Promise<any> {
    const property = await this.getProperty(propertyId);
    if (!property) return null;
    
    const reservations = await this.getReservationsByProperty(propertyId);
    
    // Calculate total revenue
    const totalRevenue = reservations.reduce((sum, r) => sum + Number(r.totalAmount), 0);
    
    // Calculate total costs
    const totalCosts = reservations.reduce((sum, r) => {
      return sum + 
        Number(r.cleaningFee) + 
        Number(r.checkInFee) + 
        Number(r.commissionFee) + 
        Number(r.teamPayment);
    }, 0);
    
    // Calculate net profit
    const netProfit = totalRevenue - totalCosts;
    
    // Calculate occupancy rate
    const occupancyRate = await this.getOccupancyRate(propertyId);
    
    return {
      totalRevenue,
      totalCosts,
      netProfit,
      occupancyRate,
      reservationsCount: reservations.length
    };
  }

  // Seed method to initialize sample data
  private seedData() {
    // Seed initial owners
    const ownerData = [
      { id: 1, name: "José Gustavo", company: "José Gustavo", address: "rua curvo semendo, 37 - Montemor o novo", taxId: "", email: "", phone: "" },
      { id: 2, name: "Hélia", company: "BRIGHT JOBS UNIPESSOAL LDA", address: "AVENIDA PROF DR AUGUSTO ABREU LOPES EDIF 1 BLOCO B 5 C, ODIVELAS", taxId: "514487097", email: "", phone: "" },
      { id: 3, name: "Filipe villas boas", company: "Vanguardpriority Unipessoal Lda", address: "Lisboa", taxId: "514537027", email: "vanguardpriority@gmail.com", phone: "" },
      { id: 4, name: "Maria Lorena", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 5, name: "innkeeper", company: "Criterion Legacy Unipessoal LDA", address: "Lisboa", taxId: "514887869", email: "miguel@innkeeper.pt", phone: "" },
      { id: 6, name: "Maria Ines", company: "IMAGINARY AVENUE - LDA", address: "RUA DA REPUBLICA DA GUINE BISSAU N 1 3 E, AMADORA", taxId: "517107341", email: "", phone: "" },
      { id: 7, name: "Ana Robalo", company: "Ana Teresa Robalo Arquitetura unipessoal Lda", address: "Av. Guerra Junqueiro n9, 4ºdt, lisboa", taxId: "514279141", email: "anatrobalo@gmail.com", phone: "" },
      { id: 8, name: "Cláudia", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 9, name: "José", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 10, name: "Gabriela", company: "Tribunadomus, Lda", address: "", taxId: "507764277", email: "tribunadomus@gmail.com", phone: "" },
      { id: 11, name: "lydia", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 12, name: "Ana Tomaz", company: "contrato", address: "", taxId: "", email: "", phone: "" },
      { id: 13, name: "Francisco", company: "FCO Living, lda", address: "", taxId: "516298968", email: "couto_francisco@hotmail.com", phone: "" },
      { id: 14, name: "Sandra", company: "TRIUMPH CHIMERA LDA", address: "RUA FRANCISCO FRANCO N 30B BAIRRO DAS MORENAS", taxId: "515942022", email: "sandrar@triumphinc.ca", phone: "" },
      { id: 15, name: "Mariana", company: "Mariana Arga Lima lda", address: "Rua Álvaro Pedro Gomes, 12 4D, Sacavem", taxId: "514759232", email: "hshgestao@gmail.com", phone: "" },
      { id: 16, name: "Filipe", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 17, name: "maria ines", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 18, name: "Ana costa", company: "pessoal", address: "", taxId: "", email: "", phone: "" },
      { id: 19, name: "sandra", company: "pessoal", address: "", taxId: "", email: "", phone: "" }
    ];

    // Add owners to the map
    ownerData.forEach(owner => {
      this.ownersMap.set(owner.id, owner);
      if (owner.id >= this.currentOwnerId) {
        this.currentOwnerId = owner.id + 1;
      }
    });

    // Seed initial properties
    const propertyData = [
      { id: 1, name: "Ajuda", cleaningCost: "45", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "Maria faz", ownerId: 10, monthlyFixedCost: "0", active: true },
      { id: 2, name: "Almada rei", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "cristina", ownerId: 5, monthlyFixedCost: "0", active: true },
      { id: 3, name: "Aroeira 3", cleaningCost: "50", checkInFee: "0", commission: "0", teamPayment: "50", cleaningTeam: "Maria faz", ownerId: 11, monthlyFixedCost: "0", active: true },
      { id: 4, name: "Aroeira 4", cleaningCost: "45", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "Maria faz", ownerId: 8, monthlyFixedCost: "0", active: true },
      { id: 5, name: "Barcos (Check-in)", cleaningCost: "55", checkInFee: "15", commission: "0", teamPayment: "70", cleaningTeam: "Maria faz", ownerId: 5, monthlyFixedCost: "0", active: true },
      { id: 6, name: "Bernardo", cleaningCost: "65", checkInFee: "15", commission: "0", teamPayment: "55", cleaningTeam: "cristina", ownerId: 5, monthlyFixedCost: "0", active: true },
      { id: 7, name: "Costa cabanas", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "Primavera", ownerId: 15, monthlyFixedCost: "0", active: true },
      { id: 8, name: "Cristo Rei", cleaningCost: "45", checkInFee: "0", commission: "0", teamPayment: "40", cleaningTeam: "cristina", ownerId: 10, monthlyFixedCost: "0", active: true },
      { id: 9, name: "Ericeira nova", cleaningCost: "45", checkInFee: "15", commission: "0", teamPayment: "60", cleaningTeam: "Maria faz", ownerId: 9, monthlyFixedCost: "0", active: true },
      { id: 10, name: "Gomeira", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "Primavera", ownerId: 15, monthlyFixedCost: "0", active: true },
      { id: 11, name: "João Batista", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "55", cleaningTeam: "cristina", ownerId: 5, monthlyFixedCost: "0", active: true },
      { id: 12, name: "Magoito anexo", cleaningCost: "90", checkInFee: "0", commission: "0", teamPayment: "90", cleaningTeam: "maria faz", ownerId: 2, monthlyFixedCost: "0", active: true },
      { id: 13, name: "Magoito vivenda", cleaningCost: "90", checkInFee: "0", commission: "0", teamPayment: "90", cleaningTeam: "Maria faz", ownerId: 2, monthlyFixedCost: "0", active: true },
      { id: 14, name: "Montemor", cleaningCost: "65", checkInFee: "0", commission: "20", teamPayment: "55", cleaningTeam: "Maria joão", ownerId: 1, monthlyFixedCost: "0", active: true },
      { id: 15, name: "Nazaré T2", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "50", cleaningTeam: "Home deluxe", ownerId: 5, monthlyFixedCost: "0", active: true },
      { id: 16, name: "Palmela", cleaningCost: "45", checkInFee: "0", commission: "0", teamPayment: "35", cleaningTeam: "Cristina", ownerId: 10, monthlyFixedCost: "0", active: true },
      { id: 17, name: "Reboleira", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "55", cleaningTeam: "Maria faz", ownerId: 17, monthlyFixedCost: "0", active: true },
      { id: 18, name: "Silves", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "55", cleaningTeam: "Primavera", ownerId: 16, monthlyFixedCost: "0", active: true },
      { id: 19, name: "Sé", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "65", cleaningTeam: "Maria faz", ownerId: 4, monthlyFixedCost: "0", active: true },
      { id: 20, name: "Trafaria 1ª", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "cristina", ownerId: 16, monthlyFixedCost: "0", active: true },
      { id: 21, name: "Trafaria RC", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "cristina", ownerId: 16, monthlyFixedCost: "0", active: true },
      { id: 22, name: "Tróia", cleaningCost: "55", checkInFee: "0", commission: "20", teamPayment: "45", cleaningTeam: "Setubal", ownerId: 13, monthlyFixedCost: "0", active: true },
      { id: 23, name: "Óbidos", cleaningCost: "90", checkInFee: "0", commission: "0", teamPayment: "85", cleaningTeam: "Home deluxe", ownerId: 5, monthlyFixedCost: "0", active: true },
      { id: 24, name: "Setubal", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "45", cleaningTeam: "cristina", ownerId: 10, monthlyFixedCost: "0", active: true },
      { id: 25, name: "Costa blue", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "50", cleaningTeam: "cristina", ownerId: 18, monthlyFixedCost: "0", active: true },
      { id: 26, name: "Tropical", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "60", cleaningTeam: "Home deluxe", ownerId: 19, monthlyFixedCost: "0", active: true },
      { id: 27, name: "Praia chic", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "55", cleaningTeam: "Home deluxe", ownerId: 19, monthlyFixedCost: "0", active: true },
      { id: 28, name: "Maresia", cleaningCost: "55", checkInFee: "0", commission: "0", teamPayment: "55", cleaningTeam: "Home deluxe", ownerId: 19, monthlyFixedCost: "0", active: true },
      { id: 29, name: "Escandinavo", cleaningCost: "65", checkInFee: "0", commission: "0", teamPayment: "60", cleaningTeam: "Home deluxe", ownerId: 19, monthlyFixedCost: "0", active: true },
      { id: 30, name: "Aroeira 1", cleaningCost: "0", checkInFee: "0", commission: "0", teamPayment: "0", cleaningTeam: "Maria faz", ownerId: 12, monthlyFixedCost: "75", active: true },
      { id: 31, name: "Aroeira2", cleaningCost: "0", checkInFee: "0", commission: "0", teamPayment: "0", cleaningTeam: "Maria faz", ownerId: 12, monthlyFixedCost: "75", active: true },
      { id: 32, name: "Graça", cleaningCost: "0", checkInFee: "0", commission: "0", teamPayment: "0", cleaningTeam: "Maria faz", ownerId: 12, monthlyFixedCost: "75", active: true },
      { id: 33, name: "Sete Rios", cleaningCost: "0", checkInFee: "0", commission: "0", teamPayment: "0", cleaningTeam: "Maria faz", ownerId: 12, monthlyFixedCost: "75", active: true },
      { id: 34, name: "Filipe da mata", cleaningCost: "0", checkInFee: "0", commission: "0", teamPayment: "0", cleaningTeam: "Maria faz", ownerId: 12, monthlyFixedCost: "75", active: true },
      { id: 35, name: "05-Oct", cleaningCost: "0", checkInFee: "0", commission: "0", teamPayment: "0", cleaningTeam: "Maria faz", ownerId: 12, monthlyFixedCost: "75", active: true },
    ];

    // Add properties to the map
    propertyData.forEach(property => {
      this.propertiesMap.set(property.id, property);
      if (property.id >= this.currentPropertyId) {
        this.currentPropertyId = property.id + 1;
      }
    });

    // Seed sample reservations
    const today = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    
    const reservationData = [
      {
        id: 1,
        propertyId: 3,
        guestName: "Maria Silva",
        guestEmail: "maria.silva@example.com",
        guestPhone: "+351912345678",
        checkInDate: new Date(today.getTime() + (2 * oneDay)),
        checkOutDate: new Date(today.getTime() + (7 * oneDay)),
        numGuests: 2,
        totalAmount: "480",
        status: "confirmed",
        platform: "airbnb",
        platformFee: "48",
        cleaningFee: "50",
        checkInFee: "0",
        commissionFee: "0",
        teamPayment: "50",
        netAmount: "332",
        notes: "",
        createdAt: new Date(today.getTime() - (2 * oneDay))
      },
      {
        id: 2,
        propertyId: 13,
        guestName: "João Almeida",
        guestEmail: "joao.almeida@example.com",
        guestPhone: "+351934567890",
        checkInDate: new Date(today.getTime() + (5 * oneDay)),
        checkOutDate: new Date(today.getTime() + (12 * oneDay)),
        numGuests: 4,
        totalAmount: "920",
        status: "pending",
        platform: "booking",
        platformFee: "92",
        cleaningFee: "90",
        checkInFee: "0",
        commissionFee: "0",
        teamPayment: "90",
        netAmount: "648",
        notes: "Guests will arrive late, around 22:00",
        createdAt: new Date(today.getTime() - (1 * oneDay))
      },
      {
        id: 3,
        propertyId: 9,
        guestName: "Carlos Santos",
        guestEmail: "carlos.santos@example.com",
        guestPhone: "+351967890123",
        checkInDate: new Date(today.getTime() + (8 * oneDay)),
        checkOutDate: new Date(today.getTime() + (10 * oneDay)),
        numGuests: 2,
        totalAmount: "320",
        status: "confirmed",
        platform: "direct",
        platformFee: "0",
        cleaningFee: "45",
        checkInFee: "15",
        commissionFee: "0",
        teamPayment: "60",
        netAmount: "200",
        notes: "",
        createdAt: new Date(today.getTime() - (3 * oneDay))
      },
      {
        id: 4,
        propertyId: 19,
        guestName: "Ana Martins",
        guestEmail: "ana.martins@example.com",
        guestPhone: "+351923456789",
        checkInDate: new Date(today.getTime() + (11 * oneDay)),
        checkOutDate: new Date(today.getTime() + (16 * oneDay)),
        numGuests: 3,
        totalAmount: "750",
        status: "confirmed",
        platform: "airbnb",
        platformFee: "75",
        cleaningFee: "65",
        checkInFee: "0",
        commissionFee: "0",
        teamPayment: "65",
        netAmount: "545",
        notes: "Will need extra bedding for child",
        createdAt: new Date(today.getTime() - (5 * oneDay))
      }
    ];

    // Add reservations to the map
    reservationData.forEach(reservation => {
      this.reservationsMap.set(reservation.id, reservation);
      if (reservation.id >= this.currentReservationId) {
        this.currentReservationId = reservation.id + 1;
      }
    });

    // Seed sample activities
    const activityData = [
      {
        id: 1,
        type: "reservation_created",
        description: "Nova reserva processada para Aroeira 3 via OCR. Check-in: 15/10/2023.",
        entityId: 1,
        entityType: "reservation",
        createdAt: new Date(today.getTime() - (2 * oneDay))
      },
      {
        id: 2,
        type: "owner_updated",
        description: "Dados de contacto do proprietário Mariana foram atualizados.",
        entityId: 15,
        entityType: "owner",
        createdAt: new Date(today.getTime() - (3 * oneDay))
      },
      {
        id: 3,
        type: "maintenance_requested",
        description: "Solicitação de manutenção para Magoito Anexo foi registrada.",
        entityId: 12,
        entityType: "property",
        createdAt: new Date(today.getTime() - (4 * oneDay))
      },
      {
        id: 4,
        type: "cleaning_completed",
        description: "Limpeza da propriedade Sé concluída e pronta para próxima reserva.",
        entityId: 19,
        entityType: "property",
        createdAt: new Date(today.getTime() - (5 * oneDay))
      }
    ];

    // Add activities to the map
    activityData.forEach(activity => {
      this.activitiesMap.set(activity.id, activity);
      if (activity.id >= this.currentActivityId) {
        this.currentActivityId = activity.id + 1;
      }
    });
  }
}

export const storage = new MemStorage();
