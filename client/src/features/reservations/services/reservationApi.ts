import { ApiResponse, PaginatedResponse } from '@/shared/types';
import { Reservation, ReservationFormData, ReservationSearchParams, ReservationSummary } from '../types';

const BASE_URL = '/api';

class ReservationApiService {
  async getReservations(params?: ReservationSearchParams): Promise<ApiResponse<PaginatedResponse<Reservation>>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            searchParams.append(key, JSON.stringify(value));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`${BASE_URL}/reservations?${searchParams}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch reservations: ${response.statusText}`);
    }

    return response.json();
  }

  async getReservation(id: string): Promise<ApiResponse<Reservation>> {
    const response = await fetch(`${BASE_URL}/reservations/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch reservation: ${response.statusText}`);
    }

    return response.json();
  }

  async createReservation(data: ReservationFormData): Promise<ApiResponse<Reservation>> {
    const response = await fetch(`${BASE_URL}/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create reservation: ${response.statusText}`);
    }

    return response.json();
  }

  async updateReservation(id: string, data: Partial<ReservationFormData>): Promise<ApiResponse<Reservation>> {
    const response = await fetch(`${BASE_URL}/reservations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update reservation: ${response.statusText}`);
    }

    return response.json();
  }

  async confirmReservation(id: string): Promise<ApiResponse<Reservation>> {
    const response = await fetch(`${BASE_URL}/reservations/${id}/confirm`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to confirm reservation: ${response.statusText}`);
    }

    return response.json();
  }

  async cancelReservation(id: string, reason: string): Promise<ApiResponse<Reservation>> {
    const response = await fetch(`${BASE_URL}/reservations/${id}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel reservation: ${response.statusText}`);
    }

    return response.json();
  }

  async checkIn(id: string): Promise<ApiResponse<Reservation>> {
    const response = await fetch(`${BASE_URL}/reservations/${id}/checkin`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to check in reservation: ${response.statusText}`);
    }

    return response.json();
  }

  async checkOut(id: string): Promise<ApiResponse<Reservation>> {
    const response = await fetch(`${BASE_URL}/reservations/${id}/checkout`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to check out reservation: ${response.statusText}`);
    }

    return response.json();
  }

  async getReservationSummary(): Promise<ApiResponse<ReservationSummary>> {
    const response = await fetch(`${BASE_URL}/reservations/summary`);

    if (!response.ok) {
      throw new Error(`Failed to fetch reservation summary: ${response.statusText}`);
    }

    return response.json();
  }
}

export const reservationApi = new ReservationApiService();