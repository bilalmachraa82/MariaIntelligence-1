import type {
  Reservation,
  CreateReservationRequest,
  UpdateReservationRequest,
  DashboardData,
  ReservationFilters,
  ImportFromTextRequest,
  ImportFromTextResponse
} from "./reservation.entity.js";
import type { ServiceResult } from "../../../shared/types/common.js";
import type { Property } from "../../properties/domain/property.entity.js";

export interface ReservationService {
  getAllReservations(filters?: ReservationFilters): Promise<ServiceResult<Reservation[]>>;
  getReservationById(id: number): Promise<ServiceResult<Reservation>>;
  getReservationsByProperty(propertyId: number): Promise<ServiceResult<Reservation[]>>;
  createReservation(data: CreateReservationRequest): Promise<ServiceResult<Reservation>>;
  updateReservation(id: number, data: UpdateReservationRequest): Promise<ServiceResult<Reservation>>;
  deleteReservation(id: number): Promise<ServiceResult<boolean>>;
  getDashboardData(): Promise<ServiceResult<DashboardData>>;
  importFromText(data: ImportFromTextRequest): Promise<ServiceResult<ImportFromTextResponse>>;
}

export class ReservationDomainService implements ReservationService {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly propertyRepository: PropertyRepository,
    private readonly importService: ReservationImportService
  ) {}

  async getAllReservations(filters?: ReservationFilters): Promise<ServiceResult<Reservation[]>> {
    try {
      const reservations = await this.reservationRepository.findAll(filters);
      return {
        success: true,
        data: reservations
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reservations'
      };
    }
  }

  async getReservationById(id: number): Promise<ServiceResult<Reservation>> {
    try {
      const reservation = await this.reservationRepository.findById(id);
      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }
      return {
        success: true,
        data: reservation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reservation'
      };
    }
  }

  async getReservationsByProperty(propertyId: number): Promise<ServiceResult<Reservation[]>> {
    try {
      const reservations = await this.reservationRepository.findByProperty(propertyId);
      return {
        success: true,
        data: reservations
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch reservations by property'
      };
    }
  }

  async createReservation(data: CreateReservationRequest): Promise<ServiceResult<Reservation>> {
    try {
      // Business logic validation
      const validationResult = await this.validateReservationData(data);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: validationResult.errors.map(e => e.message).join(', '),
          validationResult
        };
      }

      // Verify property exists
      const property = await this.propertyRepository.findById(data.propertyId);
      if (!property) {
        return {
          success: false,
          error: 'Invalid property ID'
        };
      }

      // Calculate financial data
      const enrichedData = await this.calculateFinancialData(data, property);

      const reservation = await this.reservationRepository.create(enrichedData);
      return {
        success: true,
        data: reservation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create reservation'
      };
    }
  }

  async updateReservation(id: number, data: UpdateReservationRequest): Promise<ServiceResult<Reservation>> {
    try {
      const existingReservation = await this.reservationRepository.findById(id);
      if (!existingReservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }

      // Recalculate financial data if amount or property changed
      let enrichedData = data;
      if (data.totalAmount || data.propertyId) {
        const propertyId = data.propertyId || existingReservation.propertyId;
        const property = await this.propertyRepository.findById(propertyId);
        if (!property) {
          return {
            success: false,
            error: 'Invalid property ID'
          };
        }
        enrichedData = await this.calculateFinancialData({ ...existingReservation, ...data }, property);
      }

      const updatedReservation = await this.reservationRepository.update(id, enrichedData);
      return {
        success: true,
        data: updatedReservation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update reservation'
      };
    }
  }

  async deleteReservation(id: number): Promise<ServiceResult<boolean>> {
    try {
      const reservation = await this.reservationRepository.findById(id);
      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }

      const result = await this.reservationRepository.delete(id);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete reservation'
      };
    }
  }

  async getDashboardData(): Promise<ServiceResult<DashboardData>> {
    try {
      const dashboardData = await this.reservationRepository.getDashboardData();
      return {
        success: true,
        data: dashboardData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch dashboard data'
      };
    }
  }

  async importFromText(data: ImportFromTextRequest): Promise<ServiceResult<ImportFromTextResponse>> {
    try {
      if (!data.text || typeof data.text !== 'string' || data.text.trim() === '') {
        return {
          success: false,
          error: 'Text is empty or invalid'
        };
      }

      const result = await this.importService.importFromText(data.text, {
        originalText: data.text,
        userAnswers: data.userAnswers || {}
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import from text'
      };
    }
  }

  private async validateReservationData(data: CreateReservationRequest): Promise<{ isValid: boolean; errors: Array<{ message: string }> }> {
    const errors: Array<{ message: string }> = [];

    // Date validation
    const checkIn = new Date(data.checkInDate);
    const checkOut = new Date(data.checkOutDate);

    if (checkIn >= checkOut) {
      errors.push({ message: 'Check-out date must be after check-in date' });
    }

    // Guest validation
    if (data.numGuests < 1) {
      errors.push({ message: 'Number of guests must be at least 1' });
    }

    // Amount validation
    const totalAmount = parseFloat(data.totalAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      errors.push({ message: 'Total amount must be a positive number' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async calculateFinancialData(data: CreateReservationRequest, property: Property): Promise<CreateReservationRequest> {
    const totalAmount = parseFloat(data.totalAmount);

    const enrichedData = { ...data };
    enrichedData.cleaningFee = data.cleaningFee || property.cleaningCost || '0';
    enrichedData.checkInFee = data.checkInFee || property.checkInFee || '0';
    enrichedData.commission = data.commission || (totalAmount * parseFloat(property.commission || '0') / 100).toString();
    enrichedData.teamPayment = data.teamPayment || property.teamPayment || '0';

    const platformFee = parseFloat(data.platformFee || '0');
    const totalCosts = parseFloat(enrichedData.cleaningFee) +
                      parseFloat(enrichedData.checkInFee) +
                      parseFloat(enrichedData.commission) +
                      parseFloat(enrichedData.teamPayment) +
                      platformFee;

    enrichedData.netAmount = (totalAmount - totalCosts).toString();

    return enrichedData;
  }
}

// Repository interfaces (to be implemented in infrastructure layer)
export interface ReservationRepository {
  findAll(filters?: ReservationFilters): Promise<Reservation[]>;
  findById(id: number): Promise<Reservation | null>;
  findByProperty(propertyId: number): Promise<Reservation[]>;
  create(data: CreateReservationRequest): Promise<Reservation>;
  update(id: number, data: UpdateReservationRequest): Promise<Reservation>;
  delete(id: number): Promise<boolean>;
  getDashboardData(): Promise<DashboardData>;
}

export interface PropertyRepository {
  findById(id: number): Promise<Property | null>;
}

export interface ReservationImportService {
  importFromText(text: string, options: any): Promise<ImportFromTextResponse>;
}