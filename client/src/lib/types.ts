export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type ReservationPlatform = 'airbnb' | 'booking' | 'expedia' | 'direct' | 'other';

export interface Reservation {
  id: number;
  propertyId: number;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
  platform: ReservationPlatform;
  totalAmount: number;
  platformFee?: number;
  cleaningFee?: number;
  checkInFee?: number;
  commissionFee?: number;
  teamPayment?: number;
  observations?: string;
  numGuests?: number;
}

export interface Property {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  basePrice: number;
  cleaningFee: number;
  checkInFee: number;
  ownerId: number;
  images?: string[];
  description?: string;
  amenities?: string[];
}

export interface Owner {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string;
  documentType: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  bankAccount: string;
  bankName: string;
  bankBranch: string;
  pixKey?: string;
  notes?: string;
}

export interface CleaningTeam {
  id: number;
  name: string;
  email: string;
  phone: string;
  active: boolean;
  properties?: number[];
  rating?: number;
  notes?: string;
}

export interface Activity {
  id: number;
  type: 'reservation' | 'cleaning' | 'maintenance' | 'checkin' | 'checkout' | 'other';
  propertyId: number;
  reservationId?: number;
  teamId?: number;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  cost?: number;
  notes?: string;
  createdAt: string;
}