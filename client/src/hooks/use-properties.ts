import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import type { Property } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useProperties() {
  const query = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    queryFn: () => apiRequest('/api/properties')
  });
  
  return {
    ...query,
    properties: query.data || []
  };
}

export function useProperty(id: number) {
  return useQuery<Property>({
    queryKey: ['/api/properties', id],
    queryFn: () => apiRequest(`/api/properties/${id}`),
    enabled: !!id
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Omit<Property, 'id'>) => apiRequest('/api/properties', {
      method: 'POST',
      data
    }),

    // Optimistic update
    onMutate: async (newProperty) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/properties'] });

      // Snapshot previous value
      const previousProperties = queryClient.getQueryData(['/api/properties']);

      // Optimistically update cache
      queryClient.setQueryData(['/api/properties'], (old: Property[] | undefined) => {
        if (!old) return old;
        return [
          ...old,
          {
            ...newProperty,
            id: Date.now(), // Temporary ID
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as Property
        ];
      });

      return { previousProperties };
    },

    // Rollback on error
    onError: (err, newProperty, context) => {
      if (context?.previousProperties) {
        queryClient.setQueryData(['/api/properties'], context.previousProperties);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao criar propriedade',
        variant: 'destructive'
      });
    },

    // Refetch on success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    },

    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Propriedade criada com sucesso'
      });
    }
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Property> }) =>
      apiRequest(`/api/properties/${id}`, {
        method: 'PATCH',
        data
      }),

    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/properties'] });
      await queryClient.cancelQueries({ queryKey: ['/api/properties', id] });

      // Snapshot previous values
      const previousProperties = queryClient.getQueryData(['/api/properties']);
      const previousProperty = queryClient.getQueryData(['/api/properties', id]);

      // Optimistically update in list
      queryClient.setQueryData(['/api/properties'], (old: Property[] | undefined) => {
        if (!old) return old;
        return old.map((p) =>
          p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
        );
      });

      // Optimistically update single property cache
      queryClient.setQueryData(['/api/properties', id], (old: Property | undefined) => {
        if (!old) return old;
        return { ...old, ...data, updatedAt: new Date().toISOString() };
      });

      return { previousProperties, previousProperty };
    },

    onError: (err, { id }, context) => {
      // Rollback to previous values
      if (context?.previousProperties) {
        queryClient.setQueryData(['/api/properties'], context.previousProperties);
      }
      if (context?.previousProperty) {
        queryClient.setQueryData(['/api/properties', id], context.previousProperty);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar propriedade',
        variant: 'destructive'
      });
    },

    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties', id] });
    },

    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Propriedade atualizada com sucesso'
      });
    }
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => apiRequest(`/api/properties/${id}`, { method: 'DELETE' }),

    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/properties'] });
      await queryClient.cancelQueries({ queryKey: ['/api/properties', id] });

      // Snapshot previous values
      const previousProperties = queryClient.getQueryData(['/api/properties']);
      const previousProperty = queryClient.getQueryData(['/api/properties', id]);

      // Optimistically remove from list
      queryClient.setQueryData(['/api/properties'], (old: Property[] | undefined) => {
        if (!old) return old;
        return old.filter((p) => p.id !== id);
      });

      // Remove single property cache
      queryClient.removeQueries({ queryKey: ['/api/properties', id] });

      return { previousProperties, previousProperty };
    },

    onError: (err, id, context) => {
      // Rollback to previous values
      if (context?.previousProperties) {
        queryClient.setQueryData(['/api/properties'], context.previousProperties);
      }
      if (context?.previousProperty) {
        queryClient.setQueryData(['/api/properties', id], context.previousProperty);
      }
      toast({
        title: 'Erro',
        description: 'Falha ao excluir propriedade',
        variant: 'destructive'
      });
    },

    onSettled: (data, error, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties', id] });
    },

    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Propriedade excluída com sucesso'
      });
    }
  });
}

export function usePropertyStatistics(id: number) {
  return useQuery({
    queryKey: ['/api/statistics/property', id],
    queryFn: () => apiRequest(`/api/statistics/property/${id}`),
    enabled: !!id
  });
}