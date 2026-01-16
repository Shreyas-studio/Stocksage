import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const DEMO_USER_ID = 'demo-user';

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
  });
}

export function useMultibaggerAnalysis() {
  return useMutation({
    mutationFn: async (marketCap?: string) => {
      const response = await apiRequest('POST', '/api/analysis/multibaggers', { marketCap });
      const data = await response.json();
      return data.recommendations as MultibaggerRecommendation[];
    },
  });
}
