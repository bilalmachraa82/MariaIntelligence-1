import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { Reservation, ReservationStatus } from "../lib/types";

export function useReservations() {
  return useQuery<Reservation[]>({
    queryKey: ['/api/reservations'],
    queryFn: () => apiRequest('/api/reservations')
  });
}

export function useReservation(id: number) {
  return useQuery<Reservation>({
    queryKey: ['/api/reservations', id],
    queryFn: () => apiRequest(`/api/reservations/${id}`),
    enabled: !!id
  });
}

export function useDeleteReservation() {
  return useMutation({
    mutationFn: (id: number) => apiRequest(`/api/reservations/${id}`, { method: 'DELETE' }),
  });
}

export function useReservationEnums() {
  return useQuery({
    queryKey: ['/api/enums', 'reservations'],
    queryFn: async () => {
      const response = await fetch('/api/enums');
      if (!response.ok) {
        throw new Error('Failed to fetch enums');
      }
      const data = await response.json();
      return {
        reservationStatus: ['pending', 'confirmed', 'cancelled', 'completed'] as ReservationStatus[],
        ...data
      };
    }
  });
}