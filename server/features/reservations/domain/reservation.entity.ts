import type { BaseEntity } from "../../../shared/types/common.js";

export interface Reservation extends BaseEntity {
  propertyId: number;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  totalAmount: string;
  platformFee: string;
  cleaningFee: string;
  checkInFee: string;
  commission: string;
  teamPayment: string;
  netAmount: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  platform: 'airbnb' | 'booking' | 'direct' | 'other';
  notes?: string;
  propertyName?: string; // Derived field from join
}

export interface CreateReservationRequest {
  propertyId: number;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  totalAmount: string;
  platformFee?: string;
  cleaningFee?: string;
  checkInFee?: string;
  commission?: string;
  teamPayment?: string;
  netAmount?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  platform: 'airbnb' | 'booking' | 'direct' | 'other';
  notes?: string;
}

export interface UpdateReservationRequest extends Partial<CreateReservationRequest> {}

export interface DashboardData {
  checkIns: Reservation[];
  checkOuts: Reservation[];
  cleaningTasks: CleaningTask[];
}

export interface CleaningTask {
  id: string;
  propertyId: number;
  propertyName: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  type: 'cleaning';
  date: string;
}

export interface ReservationFilters {
  propertyId?: number;
  status?: string;
  platform?: string;
  startDate?: Date;
  endDate?: Date;
  guestName?: string;
}

export interface ImportFromTextRequest {
  text: string;
  propertyId?: number;
  userAnswers?: Record<string, any>;
}

export interface ImportFromTextResponse {
  success: boolean;
  needsClarification: boolean;
  clarificationQuestions?: string[];
  reservationData?: any;
  message?: string;
  error?: string;
}