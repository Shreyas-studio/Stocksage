import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Alert } from '@shared/schema';

// Replit Auth: userId now comes from authenticated session
export function useAlerts() {
  return useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
  });
}

export function useMarkAlertRead() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('PATCH', `/api/alerts/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });
}
