import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationApi } from '../services/reservationApi';
import { Reservation, ReservationFormData, ReservationSearchParams } from '../types';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';

export function useReservations(initialParams?: ReservationSearchParams) {
  const [searchParams, setSearchParams] = useState<ReservationSearchParams>(initialParams || {});
  const debouncedParams = useDebounce(searchParams, 300);

  const queryKey = ['reservations', debouncedParams];

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => reservationApi.getReservations(debouncedParams),
    enabled: true,
  });

  const updateSearchParams = useCallback((newParams: Partial<ReservationSearchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams,
      page: newParams.page || 1,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchParams({ page: 1 });
  }, []);

  return {
    reservations: data?.data?.data || [],
    totalCount: data?.data?.total || 0,
    currentPage: data?.data?.page || 1,
    totalPages: Math.ceil((data?.data?.total || 0) / (data?.data?.limit || 10)),
    isLoading,
    error,
    searchParams,
    updateSearchParams,
    clearFilters,
    refetch,
  };
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: ['reservation', id],
    queryFn: () => reservationApi.getReservation(id),
    enabled: !!id,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: ReservationFormData) => reservationApi.createReservation(data),

    onMutate: async (newReservation) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['reservations'] });

      // Snapshot previous value
      const previousReservations = queryClient.getQueryData(['reservations']);

      // Optimistically update cache - need to handle the nested data structure
      queryClient.setQueriesData({ queryKey: ['reservations'] }, (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: [
              ...old.data.data,
              {
                ...newReservation,
                id: `temp-${Date.now()}`, // Temporary ID
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: newReservation.status || 'pending'
              }
            ],
            total: (old.data.total || 0) + 1
          }
        };
      });

      return { previousReservations };
    },

    onError: (err, newReservation, context) => {
      // Rollback to previous value
      if (context?.previousReservations) {
        queryClient.setQueryData(['reservations'], context.previousReservations);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao criar reserva',
        variant: 'destructive'
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({
        title: 'Sucesso',
        description: 'Reserva criada com sucesso'
      });
    }
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReservationFormData> }) =>
      reservationApi.updateReservation(id, data),

    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['reservations'] });
      await queryClient.cancelQueries({ queryKey: ['reservation', id] });

      // Snapshot previous values
      const previousReservations = queryClient.getQueryData(['reservations']);
      const previousReservation = queryClient.getQueryData(['reservation', id]);

      // Optimistically update in list
      queryClient.setQueriesData({ queryKey: ['reservations'] }, (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((r: any) =>
              r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
            )
          }
        };
      });

      // Optimistically update single reservation cache
      queryClient.setQueryData(['reservation', id], (old: any) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      return { previousReservations, previousReservation };
    },

    onError: (err, { id }, context) => {
      // Rollback to previous values
      if (context?.previousReservations) {
        queryClient.setQueryData(['reservations'], context.previousReservations);
      }
      if (context?.previousReservation) {
        queryClient.setQueryData(['reservation', id], context.previousReservation);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar reserva',
        variant: 'destructive'
      });
    },

    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation', variables.id] });
      toast({
        title: 'Sucesso',
        description: 'Reserva atualizada com sucesso'
      });
    }
  });
}

export function useReservationActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const confirmReservation = useMutation({
    mutationFn: (id: string) => reservationApi.confirmReservation(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['reservations'] });
      await queryClient.cancelQueries({ queryKey: ['reservation', id] });

      const previousReservations = queryClient.getQueryData(['reservations']);
      const previousReservation = queryClient.getQueryData(['reservation', id]);

      // Optimistically update status to confirmed
      queryClient.setQueriesData({ queryKey: ['reservations'] }, (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((r: any) =>
              r.id === id ? { ...r, status: 'confirmed', updatedAt: new Date().toISOString() } : r
            )
          }
        };
      });

      queryClient.setQueryData(['reservation', id], (old: any) => {
        if (!old) return old;
        return { ...old, status: 'confirmed', updatedAt: new Date().toISOString() };
      });

      return { previousReservations, previousReservation };
    },

    onError: (err, id, context) => {
      if (context?.previousReservations) {
        queryClient.setQueryData(['reservations'], context.previousReservations);
      }
      if (context?.previousReservation) {
        queryClient.setQueryData(['reservation', id], context.previousReservation);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao confirmar reserva',
        variant: 'destructive'
      });
    },

    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      toast({
        title: 'Sucesso',
        description: 'Reserva confirmada com sucesso'
      });
    },
  });

  const cancelReservation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      reservationApi.cancelReservation(id, reason),

    onMutate: async ({ id, reason }) => {
      await queryClient.cancelQueries({ queryKey: ['reservations'] });
      await queryClient.cancelQueries({ queryKey: ['reservation', id] });

      const previousReservations = queryClient.getQueryData(['reservations']);
      const previousReservation = queryClient.getQueryData(['reservation', id]);

      // Optimistically update status to cancelled
      queryClient.setQueriesData({ queryKey: ['reservations'] }, (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((r: any) =>
              r.id === id ? { ...r, status: 'cancelled', cancellationReason: reason, updatedAt: new Date().toISOString() } : r
            )
          }
        };
      });

      queryClient.setQueryData(['reservation', id], (old: any) => {
        if (!old) return old;
        return { ...old, status: 'cancelled', cancellationReason: reason, updatedAt: new Date().toISOString() };
      });

      return { previousReservations, previousReservation };
    },

    onError: (err, { id }, context) => {
      if (context?.previousReservations) {
        queryClient.setQueryData(['reservations'], context.previousReservations);
      }
      if (context?.previousReservation) {
        queryClient.setQueryData(['reservation', id], context.previousReservation);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao cancelar reserva',
        variant: 'destructive'
      });
    },

    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      toast({
        title: 'Sucesso',
        description: 'Reserva cancelada com sucesso'
      });
    },
  });

  const checkIn = useMutation({
    mutationFn: (id: string) => reservationApi.checkIn(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['reservations'] });
      await queryClient.cancelQueries({ queryKey: ['reservation', id] });

      const previousReservations = queryClient.getQueryData(['reservations']);
      const previousReservation = queryClient.getQueryData(['reservation', id]);

      // Optimistically update check-in
      queryClient.setQueriesData({ queryKey: ['reservations'] }, (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((r: any) =>
              r.id === id ? { ...r, checkInDate: new Date().toISOString(), updatedAt: new Date().toISOString() } : r
            )
          }
        };
      });

      queryClient.setQueryData(['reservation', id], (old: any) => {
        if (!old) return old;
        return { ...old, checkInDate: new Date().toISOString(), updatedAt: new Date().toISOString() };
      });

      return { previousReservations, previousReservation };
    },

    onError: (err, id, context) => {
      if (context?.previousReservations) {
        queryClient.setQueryData(['reservations'], context.previousReservations);
      }
      if (context?.previousReservation) {
        queryClient.setQueryData(['reservation', id], context.previousReservation);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao fazer check-in',
        variant: 'destructive'
      });
    },

    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      toast({
        title: 'Sucesso',
        description: 'Check-in realizado com sucesso'
      });
    },
  });

  const checkOut = useMutation({
    mutationFn: (id: string) => reservationApi.checkOut(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['reservations'] });
      await queryClient.cancelQueries({ queryKey: ['reservation', id] });

      const previousReservations = queryClient.getQueryData(['reservations']);
      const previousReservation = queryClient.getQueryData(['reservation', id]);

      // Optimistically update check-out
      queryClient.setQueriesData({ queryKey: ['reservations'] }, (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((r: any) =>
              r.id === id ? { ...r, checkOutDate: new Date().toISOString(), status: 'completed', updatedAt: new Date().toISOString() } : r
            )
          }
        };
      });

      queryClient.setQueryData(['reservation', id], (old: any) => {
        if (!old) return old;
        return { ...old, checkOutDate: new Date().toISOString(), status: 'completed', updatedAt: new Date().toISOString() };
      });

      return { previousReservations, previousReservation };
    },

    onError: (err, id, context) => {
      if (context?.previousReservations) {
        queryClient.setQueryData(['reservations'], context.previousReservations);
      }
      if (context?.previousReservation) {
        queryClient.setQueryData(['reservation', id], context.previousReservation);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao fazer check-out',
        variant: 'destructive'
      });
    },

    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation', id] });
      toast({
        title: 'Sucesso',
        description: 'Check-out realizado com sucesso'
      });
    },
  });

  return {
    confirmReservation,
    cancelReservation,
    checkIn,
    checkOut,
  };
}

export function useReservationSummary() {
  return useQuery({
    queryKey: ['reservation-summary'],
    queryFn: () => reservationApi.getReservationSummary(),
  });
}