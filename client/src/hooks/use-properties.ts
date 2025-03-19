import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { Property } from "@shared/schema";

export function useProperties() {
  return useQuery<Property[]>({
    queryKey: ['/api/properties'],
    queryFn: () => apiRequest('/api/properties')
  });
}

export function useProperty(id: number) {
  return useQuery<Property>({
    queryKey: ['/api/properties', id],
    queryFn: () => apiRequest(`/api/properties/${id}`),
    enabled: !!id
  });
}

export function useCreateProperty() {
  return useMutation({
    mutationFn: (data: Omit<Property, 'id'>) => apiRequest('/api/properties', {
      method: 'POST',
      data
    })
  });
}

export function useUpdateProperty() {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Property> }) => 
      apiRequest(`/api/properties/${id}`, {
        method: 'PATCH',
        data
      })
  });
}

export function useDeleteProperty() {
  return useMutation({
    mutationFn: (id: number) => apiRequest(`/api/properties/${id}`, { method: 'DELETE' }),
  });
}

export function usePropertyStatistics(id: number) {
  return useQuery({
    queryKey: ['/api/statistics/property', id],
    queryFn: () => apiRequest(`/api/statistics/property/${id}`),
    enabled: !!id
  });
}