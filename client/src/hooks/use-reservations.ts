import { useQuery, useMutation, UseQueryOptions, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { Reservation, InsertReservation } from "@shared/schema";

export function useReservations(options?: Partial<UseQueryOptions<Reservation[]>>) {
  return useQuery<Reservation[]>({
    queryKey: options?.queryKey || ['/api/reservations'],
    queryFn: () => apiRequest('/api/reservations'),
    refetchOnWindowFocus: options?.refetchOnWindowFocus || false,
    ...options
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
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir reserva');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
    }
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reservation: InsertReservation) => {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservation)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar reserva');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
    }
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
        reservationStatus: ['pending', 'confirmed', 'cancelled', 'completed'],
        ...data
      };
    }
  });
}