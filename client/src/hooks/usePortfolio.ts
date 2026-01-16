import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { Stock, InsertStock } from '@shared/schema';

// Replit Auth: userId now comes from authenticated session
export function useStocks() {
  return useQuery<Stock[]>({
    queryKey: ['/api/stocks'],
  });
}

export function useAddStock() {
  return useMutation({
    mutationFn: async (stock: InsertStock) => {
      await apiRequest('POST', '/api/stocks', stock);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
    },
  });
}

export function useUpdateStock() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Stock> }) => {
      await apiRequest('PATCH', `/api/stocks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
    },
  });
}

export function useDeleteStock() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/stocks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
    },
  });
}

export function useRefreshPortfolio() {
  return useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/portfolio/refresh', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
    },
  });
}

export function useAnalyzePortfolio() {
  return useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/portfolio/analyze', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stocks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });
}
