import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type Owner } from "@shared/schema";

// Get all owners
export function useOwners() {
  return useQuery<Owner[]>({
    queryKey: ["/api/owners"],
  });
}

// Get a specific owner by ID
export function useOwner(id: number | undefined) {
  return useQuery<Owner>({
    queryKey: ["/api/owners", id],
    enabled: !!id,
  });
}

// Create a new owner
export function useCreateOwner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ownerData: Omit<Owner, "id">) => {
      return apiRequest("/api/owners", { method: "POST", data: ownerData });
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
      return apiRequest(`/api/owners/${id}`, { method: "PATCH", data });
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
      await apiRequest(`/api/owners/${id}`, { method: "DELETE" });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owners"] });
    },
  });
}
