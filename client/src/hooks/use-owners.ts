import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Owner } from "@shared/schema";

// Get all owners
export function useOwners() {
  return useQuery({
    queryKey: ["/api/owners"],
  });
}

// Get a specific owner by ID
export function useOwner(id: number | undefined) {
  return useQuery({
    queryKey: ["/api/owners", id],
    enabled: !!id,
  });
}

// Create a new owner
export function useCreateOwner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ownerData: Omit<Owner, "id">) => {
      const res = await apiRequest("POST", "/api/owners", ownerData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owners"] });
    },
  });
}

// Update an existing owner
export function useUpdateOwner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Owner> }) => {
      const res = await apiRequest("PATCH", `/api/owners/${id}`, data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/owners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owners", variables.id] });
    },
  });
}

// Delete an owner
export function useDeleteOwner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/owners/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owners"] });
    },
  });
}
