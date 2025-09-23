import type { Property, CreatePropertyRequest, UpdatePropertyRequest, PropertyStatistics } from "./property.entity.js";
import type { ServiceResult } from "../../../shared/types/common.js";

export interface PropertyService {
  getAllProperties(): Promise<ServiceResult<Property[]>>;
  getPropertyById(id: number): Promise<ServiceResult<Property>>;
  createProperty(data: CreatePropertyRequest): Promise<ServiceResult<Property>>;
  updateProperty(id: number, data: UpdatePropertyRequest): Promise<ServiceResult<Property>>;
  deleteProperty(id: number): Promise<ServiceResult<boolean>>;
  getPropertyStatistics(id: number): Promise<ServiceResult<PropertyStatistics>>;
  getActiveProperties(): Promise<ServiceResult<Property[]>>;
}

export class PropertyDomainService implements PropertyService {
  constructor(
    private readonly propertyRepository: PropertyRepository
  ) {}

  async getAllProperties(): Promise<ServiceResult<Property[]>> {
    try {
      const properties = await this.propertyRepository.findAll();
      return {
        success: true,
        data: properties
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch properties'
      };
    }
  }

  async getPropertyById(id: number): Promise<ServiceResult<Property>> {
    try {
      const property = await this.propertyRepository.findById(id);
      if (!property) {
        return {
          success: false,
          error: 'Property not found'
        };
      }
      return {
        success: true,
        data: property
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch property'
      };
    }
  }

  async createProperty(data: CreatePropertyRequest): Promise<ServiceResult<Property>> {
    try {
      // Business logic validation
      if (!data.name || data.name.trim() === '') {
        return {
          success: false,
          error: 'Property name is required'
        };
      }

      // Check for duplicate names
      const existingProperty = await this.propertyRepository.findByName(data.name);
      if (existingProperty) {
        return {
          success: false,
          error: 'A property with this name already exists'
        };
      }

      const property = await this.propertyRepository.create(data);
      return {
        success: true,
        data: property
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create property'
      };
    }
  }

  async updateProperty(id: number, data: UpdatePropertyRequest): Promise<ServiceResult<Property>> {
    try {
      const existingProperty = await this.propertyRepository.findById(id);
      if (!existingProperty) {
        return {
          success: false,
          error: 'Property not found'
        };
      }

      // Business logic validation
      if (data.name && data.name !== existingProperty.name) {
        const duplicateProperty = await this.propertyRepository.findByName(data.name);
        if (duplicateProperty && duplicateProperty.id !== id) {
          return {
            success: false,
            error: 'A property with this name already exists'
          };
        }
      }

      const updatedProperty = await this.propertyRepository.update(id, data);
      return {
        success: true,
        data: updatedProperty
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update property'
      };
    }
  }

  async deleteProperty(id: number): Promise<ServiceResult<boolean>> {
    try {
      const property = await this.propertyRepository.findById(id);
      if (!property) {
        return {
          success: false,
          error: 'Property not found'
        };
      }

      // Business logic: Check if property has active reservations
      const hasActiveReservations = await this.propertyRepository.hasActiveReservations(id);
      if (hasActiveReservations) {
        return {
          success: false,
          error: 'Cannot delete property with active reservations'
        };
      }

      const result = await this.propertyRepository.delete(id);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete property'
      };
    }
  }

  async getPropertyStatistics(id: number): Promise<ServiceResult<PropertyStatistics>> {
    try {
      const property = await this.propertyRepository.findById(id);
      if (!property) {
        return {
          success: false,
          error: 'Property not found'
        };
      }

      const statistics = await this.propertyRepository.getStatistics(id);
      return {
        success: true,
        data: statistics
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch property statistics'
      };
    }
  }

  async getActiveProperties(): Promise<ServiceResult<Property[]>> {
    try {
      const properties = await this.propertyRepository.findActive();
      return {
        success: true,
        data: properties
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch active properties'
      };
    }
  }
}

// Repository interface (to be implemented in infrastructure layer)
export interface PropertyRepository {
  findAll(): Promise<Property[]>;
  findById(id: number): Promise<Property | null>;
  findByName(name: string): Promise<Property | null>;
  findActive(): Promise<Property[]>;
  create(data: CreatePropertyRequest): Promise<Property>;
  update(id: number, data: UpdatePropertyRequest): Promise<Property>;
  delete(id: number): Promise<boolean>;
  getStatistics(id: number): Promise<PropertyStatistics>;
  hasActiveReservations(propertyId: number): Promise<boolean>;
}