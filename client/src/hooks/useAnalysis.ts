import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export interface SwingTradeRecommendation {
  symbol: string;
  volatility: 'high' | 'medium' | 'low';
  currentPrice: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  reason: string;
  riskLevel: 'high' | 'medium' | 'low';
}

export interface MultibaggerRecommendation {
  symbol: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  targetPrice5Year: number;
  expectedReturn: string;
  growthDrivers: string[];
  risks: string[];
  investmentThesis: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export function useSwingTradeAnalysis() {
  return useMutation({
    mutationFn: async (marketCap?: string) => {
      const response = await apiRequest('POST', '/api/analysis/swing-trades', { marketCap });
      const data = await response.json();
      return data.recommendations as SwingTradeRecommendation[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/history'] });
    },
  });
}

export function useMultibaggerAnalysis() {
  return useMutation({
    mutationFn: async (marketCap?: string) => {
      const response = await apiRequest('POST', '/api/analysis/multibaggers', { marketCap });
      const data = await response.json();
      return data.recommendations as MultibaggerRecommendation[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/analysis/history'] });
    },
  });
}

export function useLastSwingTradeAnalysis() {
  return useQuery({
    queryKey: ['/api/analysis/swing-trades/last'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analysis/swing-trades/last');
      const data = await response.json();
      return (data.recommendations ?? []) as SwingTradeRecommendation[];
    },
    retry: false,
  });
}

export function useLastMultibaggerAnalysis() {
  return useQuery({
    queryKey: ['/api/analysis/multibaggers/last'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analysis/multibaggers/last');
      const data = await response.json();
      return (data.recommendations ?? []) as MultibaggerRecommendation[];
    },
    retry: false,
  });
}

export interface AnalysisHistoryEntry {
  id: string;
  type: string;
  data: unknown;
  createdAt: string;
}

export function useAnalysisHistory(type?: string) {
  const queryKey = type
    ? ['/api/analysis/history', type]
    : ['/api/analysis/history'];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = type
        ? `/api/analysis/history?type=${encodeURIComponent(type)}&limit=50`
        : '/api/analysis/history?limit=50';
      const response = await apiRequest('GET', url);
      const data = await response.json();
      return (data.history ?? []) as AnalysisHistoryEntry[];
    },
    retry: false,
  });
}
