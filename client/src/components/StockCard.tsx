import { TrendingUp, TrendingDown, Minus, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AIAction = 'Buy' | 'Sell' | 'Hold';

interface StockCardProps {
  symbol: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  aiAction: AIAction;
  aiReason: string;
  targetPrice?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function StockCard({
  symbol,
  quantity,
  buyPrice,
  currentPrice,
  aiAction,
  aiReason,
  targetPrice,
  onEdit,
  onDelete,
}: StockCardProps) {
  const profitLoss = (currentPrice - buyPrice) * quantity;
  const profitLossPercent = ((currentPrice - buyPrice) / buyPrice) * 100;
  const isProfit = profitLoss >= 0;

  const getActionColor = (action: AIAction) => {
    if (action === 'Buy') return 'bg-profit/10 text-profit border-profit/20';
    if (action === 'Sell') return 'bg-loss/10 text-loss border-loss/20';
    return 'bg-neutral/10 text-neutral border-neutral/20';
  };

  const getActionIcon = (action: AIAction) => {
    if (action === 'Buy') return <TrendingUp className="h-3 w-3" />;
    if (action === 'Sell') return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  return (
    <Card className="p-4 hover-elevate" data-testid={`card-stock-${symbol}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-mono text-lg font-semibold" data-testid={`text-symbol-${symbol}`}>{symbol}</h3>
            <Badge className={`gap-1 ${getActionColor(aiAction)}`} data-testid={`badge-action-${symbol}`}>
              {getActionIcon(aiAction)}
              {aiAction}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">Qty: {quantity}</span>
              <span className="text-muted-foreground">Buy: ₹{buyPrice.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center gap-2">
              {currentPrice > 0 ? (
                <>
                  <span className="font-mono text-xl font-semibold tabular-nums" data-testid={`text-current-price-${symbol}`}>
                    ₹{currentPrice.toLocaleString()}
                  </span>
                  <span className={`text-sm font-medium ${isProfit ? 'text-profit' : 'text-loss'}`} data-testid={`text-pl-${symbol}`}>
                    {isProfit ? '+' : ''}₹{profitLoss.toLocaleString()} ({isProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%)
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground" data-testid={`text-current-price-${symbol}`}>
                    Price unavailable
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Check symbol format
                  </Badge>
                </div>
              )}
            </div>
            
            {targetPrice && (
              <p className="text-xs text-muted-foreground">
                AI Target: ₹{targetPrice.toLocaleString()}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">{aiReason}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" data-testid={`button-menu-${symbol}`}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit} data-testid={`button-edit-${symbol}`}>
              Edit Stock
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive" data-testid={`button-delete-${symbol}`}>
              Delete Stock
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
