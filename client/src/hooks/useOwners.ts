import { useQuery, useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Owner } from '@shared/schema';

export function useOwners() {
  return useQuery<Owner[]>({
    queryKey: ['/api/owners'],
  });
}

export function useOwner(id: number | string | null) {
  return useQuery<Owner>({
    queryKey: ['/api/owners', id],
    enabled: !!id,
  });
}

export function useDeleteOwner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/owners/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/owners'] });
    },
  });
}