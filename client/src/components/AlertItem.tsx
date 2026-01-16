import { Bell, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AlertItemProps {
  symbol: string;
  message: string;
  targetPrice: number;
  currentPrice: number;
  type: 'buy' | 'sell' | 'info';
  timestamp: string;
}

export default function AlertItem({ 
  symbol, 
  message, 
  targetPrice, 
  currentPrice, 
  type,
  timestamp 
}: AlertItemProps) {
  const getTypeColor = () => {
    if (type === 'buy') return 'border-l-profit';
    if (type === 'sell') return 'border-l-loss';
    return 'border-l-primary';
  };

  const getTypeIcon = () => {
    if (type === 'buy') return <TrendingUp className="h-4 w-4 text-profit" />;
    if (type === 'sell') return <TrendingDown className="h-4 w-4 text-loss" />;
    return <Bell className="h-4 w-4 text-primary" />;
  };

  return (
    <Card className={`p-4 border-l-4 ${getTypeColor()}`} data-testid={`alert-${symbol}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getTypeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-semibold">{symbol}</span>
            <Badge variant="outline" className="text-xs">
              {type.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm text-foreground mb-1">{message}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Current: ₹{currentPrice.toLocaleString()}</span>
            <span>Target: ₹{targetPrice.toLocaleString()}</span>
            <span className="ml-auto">{timestamp}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
