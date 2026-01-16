import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Shield } from "lucide-react";

interface SwingTradeCardProps {
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

export default function SwingTradeCard({
  symbol,
  volatility,
  currentPrice,
  entryPrice,
  targetPrice,
  stopLoss,
  timeframe,
  reason,
  riskLevel,
}: SwingTradeCardProps) {
  // Defensive checks for valid numeric values
  const safeCurrentPrice = currentPrice && isFinite(currentPrice) ? currentPrice : 0;
  const safeEntryPrice = entryPrice && isFinite(entryPrice) ? entryPrice : safeCurrentPrice;
  const safeTargetPrice = targetPrice && isFinite(targetPrice) ? targetPrice : safeCurrentPrice;
  const safeStopLoss = stopLoss && isFinite(stopLoss) ? stopLoss : safeCurrentPrice;
  
  const potentialReturn = safeEntryPrice > 0 ? ((safeTargetPrice - safeEntryPrice) / safeEntryPrice * 100).toFixed(2) : '0.00';
  const riskAmount = safeEntryPrice > 0 ? ((safeEntryPrice - safeStopLoss) / safeEntryPrice * 100).toFixed(2) : '0.00';

  const volatilityColor = {
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  }[volatility];

  const riskColor = {
    high: 'text-red-500',
    medium: 'text-amber-500',
    low: 'text-green-500',
  }[riskLevel];

  return (
    <Card className="hover-elevate" data-testid={`swing-trade-card-${symbol}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-mono text-xl">{symbol}</CardTitle>
          <Badge className={volatilityColor} data-testid={`badge-volatility-${symbol}`}>
            {volatility.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Current Price (Buy Now)</p>
              <p className="font-mono text-2xl font-bold" data-testid={`current-price-${symbol}`}>
                {safeCurrentPrice > 0 ? `₹${safeCurrentPrice.toFixed(2)}` : 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Timeframe</p>
              <p className="font-semibold" data-testid={`timeframe-${symbol}`}>{timeframe}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Target</p>
              <p className="font-semibold text-green-500 flex items-center gap-1" data-testid={`target-price-${symbol}`}>
                <TrendingUp className="h-3 w-3" />
                {safeTargetPrice > 0 ? `₹${safeTargetPrice.toFixed(2)}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
              <p className="font-semibold text-red-500 flex items-center gap-1" data-testid={`stop-loss-${symbol}`}>
                <TrendingDown className="h-3 w-3" />
                {safeStopLoss > 0 ? `₹${safeStopLoss.toFixed(2)}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Potential Return:</span>
            <span className="font-semibold text-green-500" data-testid={`potential-return-${symbol}`}>+{potentialReturn}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Risk:</span>
            <span className={`font-semibold flex items-center gap-1 ${riskColor}`} data-testid={`risk-${symbol}`}>
              <Shield className="h-3 w-3" />
              {riskLevel.toUpperCase()} (-{riskAmount}%)
            </span>
          </div>
        </div>

        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">Analysis</p>
          <p className="text-sm leading-relaxed" data-testid={`reason-${symbol}`}>{reason}</p>
        </div>
      </CardContent>
    </Card>
  );
}
