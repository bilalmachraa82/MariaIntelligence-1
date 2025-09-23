import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationApi } from '../services/reservationApi';
import { Reservation, ReservationFormData, ReservationSearchParams } from '../types';
import { useDebounce } from '@/shared/hooks/useDebounce';

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

  return useMutation({
    mutationFn: (data: ReservationFormData) => reservationApi.createReservation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReservationFormData> }) =>
      reservationApi.updateReservation(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation', variables.id] });
    },
  });
}

export function useReservationActions() {
  const queryClient = useQueryClient();

  const confirmReservation = useMutation({
    mutationFn: (id: string) => reservationApi.confirmReservation(id),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation', variables] });
    },
  });

  const cancelReservation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      reservationApi.cancelReservation(id, reason),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation', variables.id] });
    },
  });

  const checkIn = useMutation({
    mutationFn: (id: string) => reservationApi.checkIn(id),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation', variables] });
    },
  });

  const checkOut = useMutation({
    mutationFn: (id: string) => reservationApi.checkOut(id),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['reservation', variables] });
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