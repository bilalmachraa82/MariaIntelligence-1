import { BaseEntity } from '@/shared/types';

export interface Reservation extends BaseEntity {
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalAmount: number;
  currency: string;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  notes?: string;
  source: ReservationSource;
  property?: {
    id: string;
    name: string;
    address: string;
  };
  payments: Payment[];
  cancellation?: CancellationInfo;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: Date;
  transactionId?: string;
  refundAmount?: number;
  refundedAt?: Date;
}

export interface CancellationInfo {
  cancelledAt: Date;
  reason: string;
  refundAmount: number;
  cancelledBy: 'guest' | 'host' | 'admin';
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  PIX = 'pix',
  CASH = 'cash',
  OTHER = 'other',
}

export enum ReservationSource {
  DIRECT = 'direct',
  AIRBNB = 'airbnb',
  BOOKING = 'booking',
  VRBO = 'vrbo',
  EXPEDIA = 'expedia',
  OTHER = 'other',
}

export interface ReservationFormData {
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  specialRequests?: string;
  notes?: string;
  source: ReservationSource;
}

export interface ReservationFilters {
  status?: ReservationStatus[];
  paymentStatus?: PaymentStatus[];
  propertyId?: string;
  source?: ReservationSource[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  guestName?: string;
}

export interface ReservationSearchParams {
  query?: string;
  filters?: ReservationFilters;
  sortBy?: 'checkIn' | 'checkOut' | 'created' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ReservationSummary {
  total: number;
  confirmed: number;
  pending: number;
  cancelled: number;
  totalRevenue: number;
  averageStay: number;
  occupancyRate: number;
}