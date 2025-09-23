import type {
  ReservationRepository,
  PropertyRepository as ReservationPropertyRepository,
  ReservationImportService
} from "../domain/reservation.service.js";
import type {
  Reservation,
  CreateReservationRequest,
  UpdateReservationRequest,
  DashboardData,
  ReservationFilters,
  ImportFromTextResponse
} from "../domain/reservation.entity.js";
import type { Property } from "../../properties/domain/property.entity.js";
import { storage } from "../../../storage.js";
import ReservationImporterService from "../../../services/reservation-importer.service.js";

export class DrizzleReservationRepository implements ReservationRepository {
  async findAll(filters?: ReservationFilters): Promise<Reservation[]> {
    if (filters?.propertyId) {
      return await storage.getReservationsByProperty(filters.propertyId);
    }

    let reservations = await storage.getReservations();

    // Apply client-side filters if needed
    if (filters) {
      if (filters.status) {
        reservations = reservations.filter(r => r.status === filters.status);
      }
      if (filters.platform) {
        reservations = reservations.filter(r => r.platform === filters.platform);
      }
      if (filters.startDate) {
        reservations = reservations.filter(r => new Date(r.checkInDate) >= filters.startDate!);
      }
      if (filters.endDate) {
        reservations = reservations.filter(r => new Date(r.checkInDate) <= filters.endDate!);
      }
      if (filters.guestName) {
        const searchTerm = filters.guestName.toLowerCase();
        reservations = reservations.filter(r =>
          r.guestName.toLowerCase().includes(searchTerm)
        );
      }
    }

    return reservations;
  }

  async findById(id: number): Promise<Reservation | null> {
    return await storage.getReservation(id);
  }

  async findByProperty(propertyId: number): Promise<Reservation[]> {
    return await storage.getReservationsByProperty(propertyId);
  }

  async create(data: CreateReservationRequest): Promise<Reservation> {
    return await storage.createReservation(data);
  }

  async update(id: number, data: UpdateReservationRequest): Promise<Reservation> {
    return await storage.updateReservation(id, data);
  }

  async delete(id: number): Promise<boolean> {
    return await storage.deleteReservation(id);
  }

  async getDashboardData(): Promise<DashboardData> {
    const reservations = await storage.getReservationsForDashboard();
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const checkIns: Reservation[] = [];
    const checkOuts: Reservation[] = [];
    const cleaningTasks: any[] = [];

    reservations.forEach((reservation: any) => {
      const checkInStr = reservation.checkInDate instanceof Date
        ? reservation.checkInDate.toISOString().split('T')[0]
        : String(reservation.checkInDate).split('T')[0];

      if (checkInStr === today || checkInStr === tomorrowStr) {
        checkIns.push(reservation);
      }

      const checkOutStr = reservation.checkOutDate instanceof Date
        ? reservation.checkOutDate.toISOString().split('T')[0]
        : String(reservation.checkOutDate).split('T')[0];

      if (checkOutStr === today) {
        checkOuts.push(reservation);
        cleaningTasks.push({
          id: `cleaning-${reservation.id}`,
          propertyId: reservation.propertyId,
          propertyName: reservation.propertyName,
          title: `Limpeza após saída`,
          description: `Limpeza necessária após saída do hóspede ${reservation.guestName}`,
          status: 'pending',
          priority: 'medium',
          type: 'cleaning',
          date: reservation.checkOutDate
        });
      }
    });

    return {
      checkIns,
      checkOuts,
      cleaningTasks
    };
  }
}

export class DrizzlePropertyRepositoryForReservations implements ReservationPropertyRepository {
  async findById(id: number): Promise<Property | null> {
    return await storage.getProperty(id);
  }
}

export class ReservationImportServiceImpl implements ReservationImportService {
  private importerService: ReservationImporterService | null = null;

  private async getImporterService(): Promise<ReservationImporterService> {
    if (!this.importerService) {
      this.importerService = new ReservationImporterService();
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
      await this.importerService.initialize(apiKey);
    }
    return this.importerService;
  }

  async importFromText(text: string, options: any): Promise<ImportFromTextResponse> {
    const importer = await this.getImporterService();
    const result = await importer.importFromText(text, options);

    const response: ImportFromTextResponse = {
      success: !!result.reservation_data,
      needsClarification: !!(result.clarification_questions && result.clarification_questions.length > 0),
      clarificationQuestions: result.clarification_questions,
      reservationData: result.reservation_data
    };

    if (!response.success) {
      response.message = "Não foi possível extrair dados estruturados do texto";
    }

    return response;
  }
}