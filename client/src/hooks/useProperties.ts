import { useQuery } from '@tanstack/react-query';
import type { Property } from '@shared/schema';

export function useProperties() {
  return useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
}

export function useProperty(id: number | string | null) {
  return useQuery<Property>({
    queryKey: ['/api/properties', id],
    enabled: !!id,
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/properties/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    },
  });
}

// Imports necessários que faltaram
import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';