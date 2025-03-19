import { useQuery } from "@tanstack/react-query";

export function usePendingApprovals() {
  const { data: count = 0 } = useQuery({
    queryKey: ['/api/reservations', 'pending-count'],
    queryFn: async () => {
      const response = await fetch('/api/reservations?status=pending');
      if (!response.ok) {
        throw new Error('Failed to fetch pending reservations');
      }
      const data = await response.json();
      return data.length || 0;
    }
  });

  return { count };
}