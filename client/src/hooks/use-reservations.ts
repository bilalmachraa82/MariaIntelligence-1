import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Reservation } from "@shared/schema";

// Get all reservations
export function useReservations(propertyId?: number) {
  const url = propertyId 
    ? `/api/reservations?propertyId=${propertyId}`
    : "/api/reservations";
    
  return useQuery({
    queryKey: ["/api/reservations", propertyId],
  });
}

// Get a specific reservation by ID
export function useReservation(id: number | undefined) {
  return useQuery({
    queryKey: ["/api/reservations", id],
    enabled: !!id,
  });
}

// Create a new reservation
export function useCreateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (reservationData: Omit<Reservation, "id" | "createdAt">) => {
      const res = await apiRequest("POST", "/api/reservations", reservationData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations", data.propertyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
    },
  });
}

// Update an existing reservation
export function useUpdateReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Reservation> }) => {
      const res = await apiRequest("PATCH", `/api/reservations/${id}`, data);
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations", data.propertyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
    },
  });
}

// Delete a reservation
export function useDeleteReservation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reservations/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
    },
  });
}

// Get available reservation statuses and platforms
export function useReservationEnums() {
  return useQuery({
    queryKey: ["/api/enums"],
  });
}
