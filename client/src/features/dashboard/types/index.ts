export interface DashboardMetrics {
  totalProperties: number;
  totalReservations: number;
  totalRevenue: number;
  occupancyRate: number;
  averageRating: number;
  pendingReservations: number;
  checkedInGuests: number;
  maintenanceRequests: number;
}

export interface RevenueChart {
  month: string;
  revenue: number;
  bookings: number;
}

export interface PropertyPerformance {
  propertyId: string;
  propertyName: string;
  revenue: number;
  bookings: number;
  occupancyRate: number;
  averageRating: number;
}

export interface RecentActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export enum ActivityType {
  NEW_RESERVATION = 'new_reservation',
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
  CANCELLATION = 'cancellation',
  PAYMENT_RECEIVED = 'payment_received',
  MAINTENANCE_REQUEST = 'maintenance_request',
  PROPERTY_ADDED = 'property_added',
  REVIEW_RECEIVED = 'review_received',
}

export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  propertyIds?: string[];
}

export interface OccupancyData {
  date: string;
  occupied: number;
  available: number;
  rate: number;
}

export interface TopPerformingProperty {
  id: string;
  name: string;
  revenue: number;
  bookings: number;
  rating: number;
  image?: string;
}

export interface UpcomingReservation {
  id: string;
  guestName: string;
  propertyName: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: string;
}