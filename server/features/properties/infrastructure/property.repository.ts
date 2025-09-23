import type { PropertyRepository } from "../domain/property.service.js";
import type { Property, CreatePropertyRequest, UpdatePropertyRequest, PropertyStatistics } from "../domain/property.entity.js";
import { storage } from "../../../storage.js";

export class DrizzlePropertyRepository implements PropertyRepository {
  async findAll(): Promise<Property[]> {
    return await storage.getProperties();
  }

  async findById(id: number): Promise<Property | null> {
    return await storage.getProperty(id);
  }

  async findByName(name: string): Promise<Property | null> {
    const properties = await storage.getProperties();
    return properties.find(p => p.name.toLowerCase() === name.toLowerCase()) || null;
  }

  async findActive(): Promise<Property[]> {
    const properties = await storage.getProperties();
    return properties.filter(p => p.active);
  }

  async create(data: CreatePropertyRequest): Promise<Property> {
    return await storage.createProperty(data);
  }

  async update(id: number, data: UpdatePropertyRequest): Promise<Property> {
    return await storage.updateProperty(id, data);
  }

  async delete(id: number): Promise<boolean> {
    return await storage.deleteProperty(id);
  }

  async getStatistics(id: number): Promise<PropertyStatistics> {
    return await storage.getPropertyStatistics(id);
  }

  async hasActiveReservations(propertyId: number): Promise<boolean> {
    try {
      const reservations = await storage.getReservationsByProperty(propertyId);
      return reservations.some(r =>
        r.status === 'confirmed' ||
        r.status === 'pending' ||
        (r.status === 'completed' && new Date(r.checkOutDate) > new Date())
      );
    } catch (error) {
      console.error('Error checking active reservations:', error);
      return false;
    }
  }
}