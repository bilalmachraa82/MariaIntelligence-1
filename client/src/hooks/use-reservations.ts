import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { Reservation, ReservationStatus } from "../lib/types";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => apiRequest(`/api/reservations/${id}`, { method: 'DELETE' }),

    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/reservations'] });
      await queryClient.cancelQueries({ queryKey: ['/api/reservations', id] });

      // Snapshot previous values
      const previousReservations = queryClient.getQueryData(['/api/reservations']);
      const previousReservation = queryClient.getQueryData(['/api/reservations', id]);

      // Optimistically remove from list
      queryClient.setQueryData(['/api/reservations'], (old: Reservation[] | undefined) => {
        if (!old) return old;
        return old.filter((r) => r.id !== id);
      });

      // Remove single reservation cache
      queryClient.removeQueries({ queryKey: ['/api/reservations', id] });

      return { previousReservations, previousReservation };
    },

    onError: (err, id, context) => {
      // Rollback to previous values
      if (context?.previousReservations) {
        queryClient.setQueryData(['/api/reservations'], context.previousReservations);
      }
      if (context?.previousReservation) {
        queryClient.setQueryData(['/api/reservations', id], context.previousReservation);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao excluir reserva',
        variant: 'destructive'
      });
    },

    onSettled: (data, error, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reservations', id] });
    },

    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Reserva excluída com sucesso'
      });
    }
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (reservation: Partial<Reservation>) =>
      apiRequest('/api/reservations', {
        method: 'POST',
        data: reservation
      }),

    onMutate: async (newReservation) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/reservations'] });

      // Snapshot previous value
      const previousReservations = queryClient.getQueryData(['/api/reservations']);

      // Optimistically update cache
      queryClient.setQueryData(['/api/reservations'], (old: Reservation[] | undefined) => {
        if (!old) return old;
        return [
          ...old,
          {
            ...newReservation,
            id: Date.now(), // Temporary ID
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: newReservation.status || 'pending'
          } as Reservation
        ];
      });

      return { previousReservations };
    },

    onError: (err, newReservation, context) => {
      // Rollback to previous value
      if (context?.previousReservations) {
        queryClient.setQueryData(['/api/reservations'], context.previousReservations);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao criar reserva',
        variant: 'destructive'
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
    },

    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Reserva criada com sucesso'
      });
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
        reservationStatus: ['pending', 'confirmed', 'cancelled', 'completed'] as ReservationStatus[],
        ...data
      };
    }
  });
}