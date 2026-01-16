import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Building2, Target, AlertTriangle } from "lucide-react";

interface MultibaggerCardProps {
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

export default function MultibaggerCard({
  symbol,
  companyName,
  sector,
  currentPrice,
  targetPrice5Year,
  expectedReturn,
  growthDrivers,
  risks,
  investmentThesis,
  confidenceLevel,
}: MultibaggerCardProps) {
  const confidenceColor = {
    high: 'bg-green-500/10 text-green-500 border-green-500/20',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    low: 'bg-red-500/10 text-red-500 border-red-500/20',
  }[confidenceLevel];

  return (
    <Card className="hover-elevate" data-testid={`multibagger-card-${symbol}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="font-mono text-xl mb-1">{symbol}</CardTitle>
            <p className="text-sm text-muted-foreground" data-testid={`company-name-${symbol}`}>{companyName}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={confidenceColor} data-testid={`confidence-${symbol}`}>
              {confidenceLevel.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs" data-testid={`sector-${symbol}`}>
              <Building2 className="h-3 w-3 mr-1" />
              {sector}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Price</p>
            <p className="font-semibold" data-testid={`current-price-${symbol}`}>₹{currentPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">5Y Target</p>
            <p className="font-semibold text-green-500 flex items-center gap-1" data-testid={`target-5y-${symbol}`}>
              <Target className="h-3 w-3" />
              ₹{targetPrice5Year.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
          <span className="text-sm font-medium">Expected Return</span>
          <span className="font-bold text-green-500 flex items-center gap-1" data-testid={`expected-return-${symbol}`}>
            <TrendingUp className="h-4 w-4" />
            {expectedReturn}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Growth Drivers</p>
          <ul className="space-y-1">
            {growthDrivers.slice(0, 3).map((driver, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2" data-testid={`driver-${symbol}-${idx}`}>
                <span className="text-green-500 mt-0.5">•</span>
                <span className="flex-1">{driver}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Key Risks
          </p>
          <ul className="space-y-1">
            {risks.slice(0, 2).map((risk, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2" data-testid={`risk-${symbol}-${idx}`}>
                <span className="text-red-500 mt-0.5">•</span>
                <span className="flex-1">{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">Investment Thesis</p>
          <p className="text-sm leading-relaxed" data-testid={`thesis-${symbol}`}>{investmentThesis}</p>
        </div>
      </CardContent>
    </Card>
  );
}
