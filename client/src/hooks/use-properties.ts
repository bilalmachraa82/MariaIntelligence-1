import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Property } from "@shared/schema";

// Get all properties
export function useProperties() {
  return useQuery({
    queryKey: ["/api/properties"],
  });
}

// Get a specific property by ID
export function useProperty(id: number | undefined) {
  return useQuery({
    queryKey: ["/api/properties", id],
    enabled: !!id,
  });
}

// Create a new property
export function useCreateProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (propertyData: Omit<Property, "id">) => {
      const res = await apiRequest("POST", "/api/properties", propertyData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });
}

// Update an existing property
export function useUpdateProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Property> }) => {
      const res = await apiRequest("PATCH", `/api/properties/${id}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      queryClient.invalidateQueries({ queryKey: ["/api/properties", variables.id] });
    },
  });
}

// Delete a property
export function useDeleteProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/properties/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
    },
  });
}

// Get property statistics
export function usePropertyStatistics(id: number | undefined) {
  return useQuery({
    queryKey: ["/api/statistics/property", id],
    enabled: !!id,
  });
}
