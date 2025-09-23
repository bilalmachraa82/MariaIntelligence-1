import { BaseEntity } from '@/shared/types';

export interface Property extends BaseEntity {
  name: string;
  address: string;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  currency: string;
  description?: string;
  amenities: string[];
  images: PropertyImage[];
  ownerId: string;
  status: PropertyStatus;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  availability: PropertyAvailability[];
  settings: PropertySettings;
}

export interface PropertyImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface PropertyAvailability {
  id: string;
  startDate: Date;
  endDate: Date;
  available: boolean;
  reason?: string;
}

export interface PropertySettings {
  instantBooking: boolean;
  requireApproval: boolean;
  minimumStay: number;
  maximumStay: number;
  checkInTime: string;
  checkOutTime: string;
  cleaningFee: number;
  securityDeposit: number;
}

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  VILLA = 'villa',
  STUDIO = 'studio',
  LOFT = 'loft',
  CABIN = 'cabin',
  COTTAGE = 'cottage',
}

export enum PropertyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  PENDING_APPROVAL = 'pending_approval',
}

export interface PropertyFormData {
  name: string;
  address: string;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  description: string;
  amenities: string[];
  location: Partial<Property['location']>;
  settings: Partial<PropertySettings>;
}

export interface PropertyFilters {
  type?: PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  amenities?: string[];
  location?: string;
  status?: PropertyStatus[];
}

export interface PropertySearchParams {
  query?: string;
  filters?: PropertyFilters;
  sortBy?: 'name' | 'price' | 'created' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}