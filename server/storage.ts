import {
  properties,
  owners,
  reservations,
  activities,
  financialDocuments,
  financialDocumentItems,
  paymentRecords,
  type Property,
  type InsertProperty,
  type Owner,
  type InsertOwner,
  type Reservation,
  type InsertReservation,
  type Activity,
  type InsertActivity,
  type FinancialDocument,
  type InsertFinancialDocument,
  type FinancialDocumentItem,
  type InsertFinancialDocumentItem,
  type PaymentRecord,
  type InsertPaymentRecord
} from "@shared/schema";
import { db } from './db';

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

  // Documentos financeiros
  getFinancialDocuments(options?: {
    type?: 'incoming' | 'outgoing';
    status?: 'pending' | 'invoiced' | 'paid' | 'cancelled';
    entityId?: number;
    entityType?: 'owner' | 'supplier';
    startDate?: Date;
    endDate?: Date;
  }): Promise<FinancialDocument[]>;
  getFinancialDocument(id: number): Promise<FinancialDocument | undefined>;
  createFinancialDocument(document: InsertFinancialDocument): Promise<FinancialDocument>;
  updateFinancialDocument(id: number, document: Partial<InsertFinancialDocument>): Promise<FinancialDocument | undefined>;
  deleteFinancialDocument(id: number): Promise<boolean>;
  
  // Itens de documentos financeiros
  getFinancialDocumentItems(documentId: number): Promise<FinancialDocumentItem[]>;
  getFinancialDocumentItem(id: number): Promise<FinancialDocumentItem | undefined>;
  createFinancialDocumentItem(item: InsertFinancialDocumentItem): Promise<FinancialDocumentItem>;
  updateFinancialDocumentItem(id: number, item: Partial<InsertFinancialDocumentItem>): Promise<FinancialDocumentItem | undefined>;
  deleteFinancialDocumentItem(id: number): Promise<boolean>;
  
  // Pagamentos
  getPaymentRecords(documentId?: number): Promise<PaymentRecord[]>;
  getPaymentRecord(id: number): Promise<PaymentRecord | undefined>;
  createPaymentRecord(payment: InsertPaymentRecord): Promise<PaymentRecord>;
  updatePaymentRecord(id: number, payment: Partial<InsertPaymentRecord>): Promise<PaymentRecord | undefined>;
  deletePaymentRecord(id: number): Promise<boolean>;
  
  // Relatórios financeiros
  generateOwnerFinancialReport(ownerId: number, month: string, year: string): Promise<any>;
  generateFinancialSummary(startDate?: Date, endDate?: Date): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private propertiesMap: Map<number, Property>;
  private ownersMap: Map<number, Owner>;
  private reservationsMap: Map<number, Reservation>;
  private activitiesMap: Map<number, Activity>;
  private financialDocumentsMap: Map<number, FinancialDocument>;
  private financialDocumentItemsMap: Map<number, FinancialDocumentItem>;
  private paymentRecordsMap: Map<number, PaymentRecord>;
  
  currentUserId: number;
  currentPropertyId: number;
  currentOwnerId: number;
  currentReservationId: number;
  currentActivityId: number;
  currentFinancialDocumentId: number;
  currentFinancialDocumentItemId: number;
  currentPaymentRecordId: number;

  constructor() {
    this.users = new Map();
    this.propertiesMap = new Map();
    this.ownersMap = new Map();
    this.reservationsMap = new Map();
    this.activitiesMap = new Map();
    this.financialDocumentsMap = new Map();
    this.financialDocumentItemsMap = new Map();
    this.paymentRecordsMap = new Map();
    
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentOwnerId = 1;
    this.currentReservationId = 1;
    this.currentActivityId = 1;
    this.currentFinancialDocumentId = 1;
    this.currentFinancialDocumentItemId = 1;
    this.currentPaymentRecordId = 1;
    
    // Seed data for properties, owners, financial documents, etc.
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
    
    // Converter datas para strings ISO para debugging
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];
    
    // Log de depuração removido para evitar excesso de mensagens no console
    
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

  // Métodos para documentos financeiros
  async getFinancialDocuments(options?: {
    type?: 'incoming' | 'outgoing';
    status?: 'pending' | 'invoiced' | 'paid' | 'cancelled';
    entityId?: number;
    entityType?: 'owner' | 'supplier';
    startDate?: Date;
    endDate?: Date;
  }): Promise<FinancialDocument[]> {
    let documents = Array.from(this.financialDocumentsMap.values());

    // Aplicar filtros se houver opções
    if (options) {
      if (options.type) {
        documents = documents.filter(doc => doc.type === options.type);
      }
      if (options.status) {
        documents = documents.filter(doc => doc.status === options.status);
      }
      if (options.entityId) {
        documents = documents.filter(doc => doc.entityId === options.entityId);
      }
      if (options.entityType) {
        documents = documents.filter(doc => doc.entityType === options.entityType);
      }
      if (options.startDate) {
        documents = documents.filter(doc => new Date(doc.date) >= options.startDate!);
      }
      if (options.endDate) {
        documents = documents.filter(doc => new Date(doc.date) <= options.endDate!);
      }
    }

    // Ordenar por data decrescente (mais recente primeiro)
    documents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return documents;
  }

  async getFinancialDocument(id: number): Promise<FinancialDocument | undefined> {
    return this.financialDocumentsMap.get(id);
  }

  async createFinancialDocument(document: InsertFinancialDocument): Promise<FinancialDocument> {
    const id = this.currentFinancialDocumentId++;
    const now = new Date();
    
    // Criar o documento financeiro com valores padrão para campos opcionais
    const newDocument: FinancialDocument = {
      ...document,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.financialDocumentsMap.set(id, newDocument);
    
    // Registrar atividade
    this.createActivity({
      type: "financial_document_created",
      description: `Documento financeiro ${newDocument.reference} foi criado`,
      entityId: id,
      entityType: "financial_document"
    });
    
    return newDocument;
  }

  async updateFinancialDocument(id: number, document: Partial<InsertFinancialDocument>): Promise<FinancialDocument | undefined> {
    const existingDocument = this.financialDocumentsMap.get(id);
    if (!existingDocument) return undefined;
    
    // Atualizar o documento
    const updatedDocument = {
      ...existingDocument,
      ...document,
      updatedAt: new Date()
    };
    
    this.financialDocumentsMap.set(id, updatedDocument);
    
    // Registrar atividade
    this.createActivity({
      type: "financial_document_updated",
      description: `Documento financeiro ${updatedDocument.reference} foi atualizado`,
      entityId: id,
      entityType: "financial_document"
    });
    
    return updatedDocument;
  }

  async deleteFinancialDocument(id: number): Promise<boolean> {
    const document = this.financialDocumentsMap.get(id);
    if (!document) return false;
    
    // Verificar se existem itens relacionados
    const hasItems = Array.from(this.financialDocumentItemsMap.values())
      .some(item => item.documentId === id);
    
    if (hasItems) {
      // Também excluir itens relacionados
      Array.from(this.financialDocumentItemsMap.values())
        .filter(item => item.documentId === id)
        .forEach(item => this.financialDocumentItemsMap.delete(item.id));
    }
    
    // Verificar se existem pagamentos relacionados
    const hasPayments = Array.from(this.paymentRecordsMap.values())
      .some(payment => payment.documentId === id);
    
    if (hasPayments) {
      // Também excluir pagamentos relacionados
      Array.from(this.paymentRecordsMap.values())
        .filter(payment => payment.documentId === id)
        .forEach(payment => this.paymentRecordsMap.delete(payment.id));
    }
    
    // Excluir o documento
    const result = this.financialDocumentsMap.delete(id);
    
    // Registrar atividade
    if (result) {
      this.createActivity({
        type: "financial_document_deleted",
        description: `Documento financeiro ${document.reference} foi excluído`,
        entityId: id,
        entityType: "financial_document"
      });
    }
    
    return result;
  }

  // Métodos para itens de documentos financeiros
  async getFinancialDocumentItems(documentId: number): Promise<FinancialDocumentItem[]> {
    return Array.from(this.financialDocumentItemsMap.values())
      .filter(item => item.documentId === documentId);
  }

  async getFinancialDocumentItem(id: number): Promise<FinancialDocumentItem | undefined> {
    return this.financialDocumentItemsMap.get(id);
  }

  async createFinancialDocumentItem(item: InsertFinancialDocumentItem): Promise<FinancialDocumentItem> {
    const id = this.currentFinancialDocumentItemId++;
    
    const newItem: FinancialDocumentItem = {
      ...item,
      id
    };
    
    this.financialDocumentItemsMap.set(id, newItem);
    
    // Atualizar o valor total do documento
    const document = await this.getFinancialDocument(item.documentId);
    if (document) {
      const items = await this.getFinancialDocumentItems(item.documentId);
      const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
      
      await this.updateFinancialDocument(item.documentId, {
        totalAmount: totalAmount.toString()
      });
    }
    
    return newItem;
  }

  async updateFinancialDocumentItem(id: number, item: Partial<InsertFinancialDocumentItem>): Promise<FinancialDocumentItem | undefined> {
    const existingItem = this.financialDocumentItemsMap.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.financialDocumentItemsMap.set(id, updatedItem);
    
    // Atualizar o valor total do documento
    const document = await this.getFinancialDocument(existingItem.documentId);
    if (document) {
      const items = await this.getFinancialDocumentItems(existingItem.documentId);
      const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
      
      await this.updateFinancialDocument(existingItem.documentId, {
        totalAmount: totalAmount.toString()
      });
    }
    
    return updatedItem;
  }

  async deleteFinancialDocumentItem(id: number): Promise<boolean> {
    const item = this.financialDocumentItemsMap.get(id);
    if (!item) return false;
    
    const documentId = item.documentId;
    const result = this.financialDocumentItemsMap.delete(id);
    
    // Atualizar o valor total do documento
    if (result) {
      const document = await this.getFinancialDocument(documentId);
      if (document) {
        const items = await this.getFinancialDocumentItems(documentId);
        const totalAmount = items.reduce((sum, item) => sum + Number(item.amount), 0);
        
        await this.updateFinancialDocument(documentId, {
          totalAmount: totalAmount.toString()
        });
      }
    }
    
    return result;
  }

  // Métodos para registros de pagamento
  async getPaymentRecords(documentId?: number): Promise<PaymentRecord[]> {
    if (documentId) {
      return Array.from(this.paymentRecordsMap.values())
        .filter(payment => payment.documentId === documentId);
    }
    return Array.from(this.paymentRecordsMap.values());
  }

  async getPaymentRecord(id: number): Promise<PaymentRecord | undefined> {
    return this.paymentRecordsMap.get(id);
  }

  async createPaymentRecord(payment: InsertPaymentRecord): Promise<PaymentRecord> {
    const id = this.currentPaymentRecordId++;
    const now = new Date();
    
    const newPayment: PaymentRecord = {
      ...payment,
      id,
      createdAt: now
    };
    
    this.paymentRecordsMap.set(id, newPayment);
    
    // Atualizar o status do documento financeiro
    const document = await this.getFinancialDocument(payment.documentId);
    if (document) {
      const payments = await this.getPaymentRecords(payment.documentId);
      const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Verificar se o valor total foi pago
      if (totalPaid >= Number(document.totalAmount)) {
        await this.updateFinancialDocument(payment.documentId, {
          status: 'paid',
          paidAmount: totalPaid.toString()
        });
      } else if (totalPaid > 0) {
        await this.updateFinancialDocument(payment.documentId, {
          status: 'partial',
          paidAmount: totalPaid.toString()
        });
      }
    }
    
    // Registrar atividade
    this.createActivity({
      type: "payment_recorded",
      description: `Pagamento de ${payment.amount} foi registrado`,
      entityId: id,
      entityType: "payment_record"
    });
    
    return newPayment;
  }

  async updatePaymentRecord(id: number, payment: Partial<InsertPaymentRecord>): Promise<PaymentRecord | undefined> {
    const existingPayment = this.paymentRecordsMap.get(id);
    if (!existingPayment) return undefined;
    
    const updatedPayment = { ...existingPayment, ...payment };
    this.paymentRecordsMap.set(id, updatedPayment);
    
    // Atualizar o status do documento financeiro
    const document = await this.getFinancialDocument(existingPayment.documentId);
    if (document) {
      const payments = await this.getPaymentRecords(existingPayment.documentId);
      const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      
      // Verificar se o valor total foi pago
      if (totalPaid >= Number(document.totalAmount)) {
        await this.updateFinancialDocument(existingPayment.documentId, {
          status: 'paid',
          paidAmount: totalPaid.toString()
        });
      } else if (totalPaid > 0) {
        await this.updateFinancialDocument(existingPayment.documentId, {
          status: 'partial',
          paidAmount: totalPaid.toString()
        });
      } else {
        await this.updateFinancialDocument(existingPayment.documentId, {
          status: 'pending',
          paidAmount: '0'
        });
      }
    }
    
    return updatedPayment;
  }

  async deletePaymentRecord(id: number): Promise<boolean> {
    const payment = this.paymentRecordsMap.get(id);
    if (!payment) return false;
    
    const documentId = payment.documentId;
    const result = this.paymentRecordsMap.delete(id);
    
    // Atualizar o status do documento financeiro
    if (result) {
      const document = await this.getFinancialDocument(documentId);
      if (document) {
        const payments = await this.getPaymentRecords(documentId);
        const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        
        // Verificar se o valor total foi pago
        if (totalPaid >= Number(document.totalAmount)) {
          await this.updateFinancialDocument(documentId, {
            status: 'paid',
            paidAmount: totalPaid.toString()
          });
        } else if (totalPaid > 0) {
          await this.updateFinancialDocument(documentId, {
            status: 'partial',
            paidAmount: totalPaid.toString()
          });
        } else {
          await this.updateFinancialDocument(documentId, {
            status: 'pending',
            paidAmount: '0'
          });
        }
      }
      
      // Registrar atividade
      this.createActivity({
        type: "payment_deleted",
        description: `Pagamento de ${payment.amount} foi excluído`,
        entityId: id,
        entityType: "payment_record"
      });
    }
    
    return result;
  }
  
  // Métodos para relatórios financeiros
  async generateOwnerFinancialReport(ownerId: number, month: string, year: string): Promise<any> {
    const owner = await this.getOwner(ownerId);
    if (!owner) return null;
    
    // Obter o período
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(new Date(startDate).setMonth(startDate.getMonth() + 1));
    endDate.setDate(endDate.getDate() - 1); // Último dia do mês
    
    // Obter propriedades do proprietário
    const properties = (await this.getProperties()).filter(p => p.ownerId === ownerId);
    
    // Para cada propriedade, calcular os ganhos e despesas
    const propertyReports = await Promise.all(properties.map(async (property) => {
      // Obter reservas no período
      const reservations = (await this.getReservationsByProperty(property.id))
        .filter(r => {
          const checkIn = new Date(r.checkInDate);
          const checkOut = new Date(r.checkOutDate);
          return (checkIn <= endDate && checkOut >= startDate);
        });
      
      // Calcular receita total, custos e lucro
      const revenue = reservations.reduce((sum, r) => sum + Number(r.totalAmount), 0);
      const cleaningCosts = reservations.reduce((sum, r) => sum + Number(r.cleaningFee || 0), 0);
      const checkInFees = reservations.reduce((sum, r) => sum + Number(r.checkInFee || 0), 0);
      const commission = reservations.reduce((sum, r) => sum + Number(r.commissionFee || 0), 0);
      const teamPayments = reservations.reduce((sum, r) => sum + Number(r.teamPayment || 0), 0);
      const netProfit = revenue - cleaningCosts - checkInFees - commission - teamPayments;
      
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
      
      return {
        propertyId: property.id,
        propertyName: property.name,
        reservations: reservationSummaries,
        revenue,
        cleaningCosts,
        checkInFees,
        commission,
        teamPayments,
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
        totalNetProfit,
        averageOccupancy,
        totalProperties: propertyReports.length,
        totalReservations: propertyReports.reduce((sum, p) => sum + p.reservations.length, 0)
      }
    };
  }

  async generateFinancialSummary(startDate?: Date, endDate?: Date): Promise<any> {
    // Definir período padrão para o mês atual se não especificado
    const now = new Date();
    const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Obter todos os documentos financeiros no período
    const documents = (await this.getFinancialDocuments())
      .filter(doc => {
        const docDate = new Date(doc.date);
        return docDate >= start && docDate <= end;
      });
    
    // Separar por tipo (receita/despesa)
    const incomingDocs = documents.filter(doc => doc.type === 'incoming');
    const outgoingDocs = documents.filter(doc => doc.type === 'outgoing');
    
    // Calcular totais
    const totalIncoming = incomingDocs.reduce((sum, doc) => sum + Number(doc.totalAmount), 0);
    const totalOutgoing = outgoingDocs.reduce((sum, doc) => sum + Number(doc.totalAmount), 0);
    const netIncome = totalIncoming - totalOutgoing;
    
    // Calcular por status
    const pendingIncoming = incomingDocs
      .filter(doc => doc.status === 'pending')
      .reduce((sum, doc) => sum + Number(doc.totalAmount), 0);
    
    const paidIncoming = incomingDocs
      .filter(doc => doc.status === 'paid')
      .reduce((sum, doc) => sum + Number(doc.totalAmount), 0);
    
    const pendingOutgoing = outgoingDocs
      .filter(doc => doc.status === 'pending')
      .reduce((sum, doc) => sum + Number(doc.totalAmount), 0);
    
    const paidOutgoing = outgoingDocs
      .filter(doc => doc.status === 'paid')
      .reduce((sum, doc) => sum + Number(doc.totalAmount), 0);
    
    // Calcular por entidade (proprietário/fornecedor)
    const byOwner = {};
    const bySupplier = {};
    
    // Processar documentos por proprietário
    for (const doc of documents.filter(d => d.entityType === 'owner')) {
      const entityId = doc.entityId;
      if (!byOwner[entityId]) {
        const owner = await this.getOwner(entityId);
        byOwner[entityId] = {
          id: entityId,
          name: owner ? owner.name : `Proprietário #${entityId}`,
          incoming: 0,
          outgoing: 0,
          balance: 0
        };
      }
      
      if (doc.type === 'incoming') {
        byOwner[entityId].incoming += Number(doc.totalAmount);
      } else {
        byOwner[entityId].outgoing += Number(doc.totalAmount);
      }
      byOwner[entityId].balance = byOwner[entityId].incoming - byOwner[entityId].outgoing;
    }
    
    // Processar documentos por fornecedor
    for (const doc of documents.filter(d => d.entityType === 'supplier')) {
      const entityId = doc.entityId;
      const entityName = doc.entityName || `Fornecedor #${entityId}`;
      
      if (!bySupplier[entityId]) {
        bySupplier[entityId] = {
          id: entityId,
          name: entityName,
          incoming: 0,
          outgoing: 0,
          balance: 0
        };
      }
      
      if (doc.type === 'incoming') {
        bySupplier[entityId].incoming += Number(doc.totalAmount);
      } else {
        bySupplier[entityId].outgoing += Number(doc.totalAmount);
      }
      bySupplier[entityId].balance = bySupplier[entityId].incoming - bySupplier[entityId].outgoing;
    }
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      summary: {
        totalIncoming,
        totalOutgoing,
        netIncome,
        pendingIncoming,
        paidIncoming,
        pendingOutgoing,
        paidOutgoing,
        totalDocuments: documents.length,
        incomingDocuments: incomingDocs.length,
        outgoingDocuments: outgoingDocs.length
      },
      byOwner: Object.values(byOwner),
      bySupplier: Object.values(bySupplier),
      recentDocuments: documents
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10) // Últimos 10 documentos
    };
  }

  // Seed method to initialize sample data
  private seedData() {
    // Seed initial financial data
    const seedFinancialDocuments = () => {
      // Criar alguns documentos financeiros de exemplo
      const financialDocumentsData = [
        {
          id: 1,
          reference: "FT2025/001",
          type: "incoming", 
          status: "pending",
          date: "2025-03-01",
          dueDate: "2025-03-15",
          description: "Serviços de gestão - Mar 2025",
          entityId: 10, // Owner ID
          entityType: "owner",
          entityName: "Gabriela",
          totalAmount: "125.50",
          paidAmount: "0",
          notes: "Pagamento pendente para os serviços do mês de março",
          invoiceNumber: "",
          createdAt: new Date("2025-03-01T10:30:00"),
          updatedAt: new Date("2025-03-01T10:30:00")
        },
        {
          id: 2,
          reference: "FT2025/002",
          type: "outgoing",
          status: "paid",
          date: "2025-02-25",
          dueDate: "2025-03-10",
          description: "Serviços de limpeza - Fev 2025",
          entityId: 1, // Supplier ID
          entityType: "supplier",
          entityName: "Maria Faz Limpezas",
          totalAmount: "350.00",
          paidAmount: "350.00",
          notes: "Pagamento efetuado por transferência bancária",
          invoiceNumber: "A/123",
          createdAt: new Date("2025-02-25T14:00:00"),
          updatedAt: new Date("2025-03-02T09:15:00")
        },
        {
          id: 3,
          reference: "FT2025/003",
          type: "incoming",
          status: "invoiced",
          date: "2025-03-05",
          dueDate: "2025-03-20",
          description: "Comissão Booking.com - Fev 2025",
          entityId: 5, // Owner ID
          entityType: "owner",
          entityName: "Innkeeper",
          totalAmount: "230.75",
          paidAmount: "0",
          notes: "Fatura emitida, aguardando pagamento",
          invoiceNumber: "B/2025/42",
          createdAt: new Date("2025-03-05T11:45:00"),
          updatedAt: new Date("2025-03-05T16:20:00")
        }
      ];

      // Adicionar os documentos financeiros ao mapa
      financialDocumentsData.forEach(doc => {
        this.financialDocumentsMap.set(doc.id, doc);
        if (doc.id >= this.currentFinancialDocumentId) {
          this.currentFinancialDocumentId = doc.id + 1;
        }
      });

      // Criar alguns itens de documentos financeiros
      const financialDocumentItemsData = [
        {
          id: 1,
          documentId: 1,
          description: "Gestão da propriedade Ajuda - Mar 2025",
          quantity: "1",
          unitPrice: "75.00",
          amount: "75.00"
        },
        {
          id: 2,
          documentId: 1,
          description: "Taxa de check-in - Reserva #123",
          quantity: "1",
          unitPrice: "15.00",
          amount: "15.00"
        },
        {
          id: 3,
          documentId: 1,
          description: "Comissão de 10% - Reserva #123",
          quantity: "1",
          unitPrice: "35.50",
          amount: "35.50"
        },
        {
          id: 4,
          documentId: 2,
          description: "Limpeza regular - Propriedade Ajuda",
          quantity: "2",
          unitPrice: "45.00",
          amount: "90.00"
        },
        {
          id: 5,
          documentId: 2,
          description: "Limpeza profunda - Propriedade Bernardo",
          quantity: "1",
          unitPrice: "65.00",
          amount: "65.00"
        },
        {
          id: 6,
          documentId: 2,
          description: "Limpeza regular - Propriedade Aroeira 3",
          quantity: "1",
          unitPrice: "50.00",
          amount: "50.00"
        },
        {
          id: 7,
          documentId: 2,
          description: "Mudança de toalhas e lençóis",
          quantity: "3",
          unitPrice: "25.00",
          amount: "75.00"
        },
        {
          id: 8,
          documentId: 2,
          description: "Produtos de limpeza",
          quantity: "1",
          unitPrice: "70.00",
          amount: "70.00"
        },
        {
          id: 9,
          documentId: 3,
          description: "Comissão de gestão - Fev 2025",
          quantity: "1",
          unitPrice: "230.75",
          amount: "230.75"
        }
      ];

      // Adicionar os itens ao mapa
      financialDocumentItemsData.forEach(item => {
        this.financialDocumentItemsMap.set(item.id, item);
        if (item.id >= this.currentFinancialDocumentItemId) {
          this.currentFinancialDocumentItemId = item.id + 1;
        }
      });

      // Criar alguns registros de pagamento
      const paymentRecordsData = [
        {
          id: 1,
          documentId: 2,
          date: "2025-03-02",
          method: "bank_transfer",
          amount: "350.00",
          reference: "TRANSF-83294",
          notes: "Transferência bancária para Maria Faz",
          createdAt: new Date("2025-03-02T09:15:00")
        }
      ];

      // Adicionar os pagamentos ao mapa
      paymentRecordsData.forEach(payment => {
        this.paymentRecordsMap.set(payment.id, payment);
        if (payment.id >= this.currentPaymentRecordId) {
          this.currentPaymentRecordId = payment.id + 1;
        }
      });
    };

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
    
    // Seed financial documents data
    seedFinancialDocuments.call(this);
  }
}

// DatabaseStorage implementation
import { db } from "./db";
import { 
  properties, owners, reservations, activities,
  type Property, type Owner, type Reservation, type Activity,
  type InsertProperty, type InsertOwner, type InsertReservation, type InsertActivity 
} from "@shared/schema";
import { eq, desc, sql, and, gte, lte, count, sum, avg } from "drizzle-orm";

// Implementação da classe DatabaseStorage
export class DatabaseStorage implements IStorage {
  // User methods (original da template)
  async getUser(id: number): Promise<any | undefined> {
    // Não temos tabela de users atualmente, mas mantemos a interface
    return undefined;
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    // Não temos tabela de users atualmente, mas mantemos a interface
    return undefined;
  }

  async createUser(user: any): Promise<any> {
    // Não temos tabela de users atualmente, mas mantemos a interface
    return { id: 1, ...user };
  }
  
  // Financial Document Item methods
  async getFinancialDocumentItem(id: number): Promise<FinancialDocumentItem | undefined> {
    if (!db) return undefined;
    
    try {
      const [item] = await db.select().from(financialDocumentItems).where(eq(financialDocumentItems.id, id));
      return item;
    } catch (error) {
      console.error("Erro ao buscar item do documento financeiro:", error);
      return undefined;
    }
  }
  
  // Implementação do método estatísticas de propriedade
  async getPropertyStatistics(propertyId: number): Promise<any> {
    if (!db) return {
      totalRevenue: 0,
      totalReservations: 0,
      averageStay: 0,
      occupancyRate: 0
    };
    
    try {
      // Obter receita total
      const revenueResults = await db.execute(sql`
        SELECT SUM(CAST(total_amount as DECIMAL)) as total
        FROM reservations
        WHERE property_id = ${propertyId}
      `);
      
      // Obter número total de reservas
      const reservationsResults = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM reservations
        WHERE property_id = ${propertyId}
      `);
      
      // Obter duração média da estadia
      const stayDurationResults = await db.execute(sql`
        SELECT AVG(
          (CAST(check_out_date as DATE) - CAST(check_in_date as DATE))
        ) as average
        FROM reservations
        WHERE property_id = ${propertyId}
      `);
      
      // Obter taxa de ocupação para o ano atual
      const startDate = new Date(new Date().getFullYear(), 0, 1);
      const occupancyRate = await this.getOccupancyRate(propertyId, startDate);
      
      return {
        totalRevenue: Number(revenueResults[0]?.total) || 0,
        totalReservations: Number(reservationsResults[0]?.count) || 0,
        averageStay: Number(stayDurationResults[0]?.average) || 0,
        occupancyRate
      };
    } catch (error) {
      console.error("Erro ao obter estatísticas da propriedade:", error);
      return {
        totalRevenue: 0,
        totalReservations: 0,
        averageStay: 0,
        occupancyRate: 0
      };
    }
  }

  // Property methods
  async getProperties(): Promise<Property[]> {
    if (!db) return [];
    const results = await db.select().from(properties);
    return results;
  }

  async getProperty(id: number): Promise<Property | undefined> {
    if (!db) return undefined;
    const [result] = await db.select().from(properties).where(eq(properties.id, id));
    return result;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    if (!db) {
      throw new Error("Database not available");
    }
    const [result] = await db.insert(properties).values(property).returning();
    return result;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    if (!db) return undefined;
    const [result] = await db
      .update(properties)
      .set(property)
      .where(eq(properties.id, id))
      .returning();
    return result;
  }

  async deleteProperty(id: number): Promise<boolean> {
    if (!db) return false;
    const result = await db.delete(properties).where(eq(properties.id, id));
    return true; // Postgres não retorna o número de linhas afetadas facilmente
  }

  // Owner methods
  async getOwners(): Promise<Owner[]> {
    if (!db) return [];
    const results = await db.select().from(owners);
    return results;
  }

  async getOwner(id: number): Promise<Owner | undefined> {
    if (!db) return undefined;
    const [result] = await db.select().from(owners).where(eq(owners.id, id));
    return result;
  }

  async createOwner(owner: InsertOwner): Promise<Owner> {
    if (!db) {
      throw new Error("Database not available");
    }
    const [result] = await db.insert(owners).values(owner).returning();
    return result;
  }

  async updateOwner(id: number, owner: Partial<InsertOwner>): Promise<Owner | undefined> {
    if (!db) return undefined;
    const [result] = await db
      .update(owners)
      .set(owner)
      .where(eq(owners.id, id))
      .returning();
    return result;
  }

  async deleteOwner(id: number): Promise<boolean> {
    if (!db) return false;
    const result = await db.delete(owners).where(eq(owners.id, id));
    return true;
  }

  // Reservation methods
  async getReservations(): Promise<Reservation[]> {
    if (!db) return [];
    const results = await db.select().from(reservations).orderBy(desc(reservations.createdAt));
    return results;
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    if (!db) return undefined;
    const [result] = await db.select().from(reservations).where(eq(reservations.id, id));
    return result;
  }

  async getReservationsByProperty(propertyId: number): Promise<Reservation[]> {
    if (!db) return [];
    const results = await db
      .select()
      .from(reservations)
      .where(eq(reservations.propertyId, propertyId))
      .orderBy(desc(reservations.checkInDate));
    return results;
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    if (!db) {
      throw new Error("Database not available");
    }
    const [result] = await db.insert(reservations).values(reservation).returning();
    return result;
  }

  async updateReservation(id: number, reservation: Partial<InsertReservation>): Promise<Reservation | undefined> {
    if (!db) return undefined;
    const [result] = await db
      .update(reservations)
      .set(reservation)
      .where(eq(reservations.id, id))
      .returning();
    return result;
  }

  async deleteReservation(id: number): Promise<boolean> {
    if (!db) return false;
    const result = await db.delete(reservations).where(eq(reservations.id, id));
    return true;
  }

  // Activity methods
  async getActivities(limit?: number): Promise<Activity[]> {
    if (!db) return [];
    let query = db.select().from(activities).orderBy(desc(activities.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const results = await query;
    return results;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    if (!db) {
      throw new Error("Database not available");
    }
    const [result] = await db.insert(activities).values(activity).returning();
    return result;
  }

  // Statistics methods
  async getTotalRevenue(startDate?: Date, endDate?: Date): Promise<number> {
    if (!db) return 0;
    
    try {
      // Converter datas para strings ISO
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : null;
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : null;
      
      // Construir a consulta base
      let queryStr = `
        SELECT SUM(CAST(total_amount AS DECIMAL)) as total_revenue
        FROM reservations
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      // Adicionar filtros de data se fornecidos
      if (startDateStr) {
        queryStr += ` AND check_in_date::DATE >= $${paramIndex}::DATE`;
        params.push(startDateStr);
        paramIndex++;
      }
      
      if (endDateStr) {
        queryStr += ` AND check_out_date::DATE <= $${paramIndex}::DATE`;
        params.push(endDateStr);
        paramIndex++;
      }
      
      // Executar a consulta
      const result = await db.execute(sql.raw(queryStr, ...params));
      return Number(result[0]?.total_revenue) || 0;
    } catch (error) {
      console.error("Erro ao calcular receita total:", error);
      return 0;
    }
  }

  async getNetProfit(startDate?: Date, endDate?: Date): Promise<number> {
    if (!db) return 0;
    
    try {
      // Converter datas para strings ISO
      const startDateStr = startDate ? startDate.toISOString().split('T')[0] : null;
      const endDateStr = endDate ? endDate.toISOString().split('T')[0] : null;
      
      // Construir a consulta
      let queryStr = `
        SELECT 
          SUM(CAST(total_amount AS DECIMAL)) as total_revenue,
          SUM(
            COALESCE(CAST(cleaning_fee AS DECIMAL), 0) + 
            COALESCE(CAST(check_in_fee AS DECIMAL), 0) + 
            COALESCE(CAST(commission_fee AS DECIMAL), 0) + 
            COALESCE(CAST(team_payment AS DECIMAL), 0)
          ) as total_costs
        FROM reservations
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      // Adicionar filtros de data se fornecidos
      if (startDateStr) {
        queryStr += ` AND check_in_date::DATE >= $${paramIndex}::DATE`;
        params.push(startDateStr);
        paramIndex++;
      }
      
      if (endDateStr) {
        queryStr += ` AND check_out_date::DATE <= $${paramIndex}::DATE`;
        params.push(endDateStr);
        paramIndex++;
      }
      
      // Executar a consulta
      const result = await db.execute(sql.raw(queryStr, ...params));
      const revenue = Number(result[0]?.total_revenue) || 0;
      const costs = Number(result[0]?.total_costs) || 0;
      return revenue - costs;
    } catch (error) {
      console.error("Erro ao calcular lucro líquido:", error);
      return 0;
    }
  }

  async getOccupancyRate(propertyId?: number, startDate?: Date, endDate?: Date): Promise<number> {
    // Se não há conexão com banco de dados, retorna zero
    if (!db) return 0;
    
    try {
      // Definir datas padrão se não forem fornecidas
      const start = startDate || new Date(new Date().getFullYear(), 0, 1);
      const end = endDate || new Date();
      
      // Calcular o número total de dias entre as datas
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (totalDays <= 0) return 0; // Evita divisão por zero
      
      // Converter datas para strings ISO
      const startDateStr = start.toISOString().split('T')[0];
      const endDateStr = end.toISOString().split('T')[0];
      
      // Log de depuração removido para evitar excesso de mensagens no console
      
      // Obter dias ocupados para as propriedades
      let occupiedDaysQuery;
      
      // Query específica para uma propriedade
      if (propertyId) {
        occupiedDaysQuery = await db.execute(sql`
          SELECT SUM(
            (LEAST(
              "check_out_date"::DATE, 
              ${endDateStr}::DATE
            ) - 
            GREATEST(
              "check_in_date"::DATE, 
              ${startDateStr}::DATE
            ))
          ) as days
          FROM reservations
          WHERE property_id = ${propertyId}
          AND "check_in_date"::DATE <= ${endDateStr}::DATE
          AND "check_out_date"::DATE >= ${startDateStr}::DATE
        `);
        
        const occupiedDays = Number(occupiedDaysQuery[0]?.days) || 0;
        return (occupiedDays / totalDays) * 100;
      } 
      // Query para todas as propriedades
      else {
        // Obter contagem de propriedades
        const propertiesResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM properties WHERE active = true
        `);
        const numProperties = Number(propertiesResult[0]?.count) || 1;
        
        // Obter dias ocupados para todas as propriedades
        const occupiedDaysResult = await db.execute(sql`
          SELECT SUM(
            (LEAST(
              "check_out_date"::DATE, 
              ${endDateStr}::DATE
            ) - 
            GREATEST(
              "check_in_date"::DATE, 
              ${startDateStr}::DATE
            ))
          ) as days
          FROM reservations
          WHERE "check_in_date"::DATE <= ${endDateStr}::DATE
          AND "check_out_date"::DATE >= ${startDateStr}::DATE
        `);
        
        const totalOccupiedDays = Number(occupiedDaysResult[0]?.days) || 0;
        const totalPossibleDays = totalDays * numProperties;
        
        return (totalOccupiedDays / totalPossibleDays) * 100;
      }
    } catch (error) {
      console.error("Erro no cálculo da taxa de ocupação:", error);
      return 0;
    }
  }

  // Este método foi movido para cima para evitar duplicação
}

// Decide which storage to use based on environment
// Verificamos se o db está disponível e se o DATABASE_URL existe
let usePostgres = db && process.env.DATABASE_URL ? true : false;

// Log para diagnóstico
console.log(`Usando armazenamento ${usePostgres ? 'PostgreSQL' : 'em memória'}`);

// Importar a flag de estado do banco de dados
import { isDatabaseAvailable, checkDatabaseConnection } from './db';

// Variável para armazenar a instância de armazenamento atual
let storageInstance: IStorage;
// Variável para armazenar a instância de memória para fallback
let memStorage: MemStorage;
// Variável para armazenar a instância de banco de dados
let dbStorage: DatabaseStorage | null = null;

// Função auxiliar para criar a instância de armazenamento apropriada
async function createStorage(): Promise<IStorage> {
  // Sempre inicializar o armazenamento em memória como fallback
  if (!memStorage) {
    memStorage = new MemStorage();
  }
  
  // Se não estamos usando PostgreSQL, retornar a instância de memória
  if (!usePostgres) {
    console.log('Usando armazenamento em memória por configuração');
    return memStorage;
  }
  
  // Verificar se o banco de dados está disponível
  const dbAvailable = await checkDatabaseConnection();
  
  // Se o banco de dados está disponível e a instância do banco não existe, criar uma
  if (dbAvailable && !dbStorage) {
    try {
      dbStorage = new DatabaseStorage();
      console.log('Conexão com o banco de dados PostgreSQL está funcionando corretamente');
      return dbStorage;
    } catch (error) {
      console.error('Erro ao criar DatabaseStorage, usando MemStorage como fallback:', error);
      return memStorage;
    }
  }
  
  // Se o banco de dados está disponível e a instância existe, usá-la
  if (dbAvailable && dbStorage) {
    return dbStorage;
  }
  
  // Se chegamos aqui, o banco de dados não está disponível, usar memória
  console.log('Banco de dados não disponível, usando armazenamento em memória');
  return memStorage;
}

// Inicializar o armazenamento
(async () => {
  try {
    storageInstance = await createStorage();
  } catch (error) {
    console.error('Erro ao inicializar armazenamento, usando MemStorage como fallback:', error);
    storageInstance = memStorage || new MemStorage();
  }
})();

// Função de proxy para garantir que sempre usamos a instância correta
// e tentamos reconectar ao banco quando necessário
export const storage = new Proxy({} as IStorage, {
  get: function(target, prop) {
    // Se a propriedade não for uma função, apenas retornar o valor
    if (typeof storageInstance[prop as keyof IStorage] !== 'function') {
      return storageInstance[prop as keyof IStorage];
    }
    
    // Se for uma função, retornar uma função que verifica o estado do armazenamento antes de executar
    return async function(...args: any[]) {
      try {
        // Tentar usar a instância atual
        return await (storageInstance[prop as keyof IStorage] as Function).apply(storageInstance, args);
      } catch (error) {
        // Se falhar, verificar se podemos reconectar ao banco
        console.error(`Erro ao executar ${String(prop)}:`, error);
        
        // Tentar reconectar e criar uma nova instância
        storageInstance = await createStorage();
        
        // Tentar novamente com a nova instância
        return await (storageInstance[prop as keyof IStorage] as Function).apply(storageInstance, args);
      }
    };
  }
});
