import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useReservationApproval() {
  const queryClient = useQueryClient();

  const approve = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/reservations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'confirmed' })
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
    }
  });

  const reject = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/reservations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' })
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
    }
  });

  return {
    approve,
    reject
  };
}