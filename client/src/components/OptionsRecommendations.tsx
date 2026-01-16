import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, TrendingUp, TrendingDown, Activity, Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface StrategyLeg {
  action: 'buy' | 'sell';
  optionType: 'call' | 'put';
  strikePrice: number;
  premium: number;
  quantity: number;
}

interface OptionRecommendation {
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  expiryDate: string;
  strategy: string;
  legs: StrategyLeg[];
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  targetProfit: string;
  maxLoss: string;
  netCost: number;
  marketOutlook: string;
}

export default function OptionsRecommendations() {
  const { toast } = useToast();
  const [budget, setBudget] = useState<string>("100000");
  const [riskTolerance, setRiskTolerance] = useState<string>("moderate");
  const [strategyPreference, setStrategyPreference] = useState<string>("all");

  const queryUrl = `/api/options/recommendations?budget=${budget}&riskTolerance=${riskTolerance}&strategyPreference=${strategyPreference}`;
  
  const { data, isLoading, refetch, isFetching } = useQuery<{ recommendations: OptionRecommendation[] }>({
    queryKey: [queryUrl],
    enabled: false,
  });

  const handleGetRecommendations = () => {
    refetch();
  };

  const handleAddOption = async (rec: OptionRecommendation) => {
    try {
      // For multi-leg strategies, add each leg separately
      for (const leg of rec.legs) {
        console.log('Adding leg:', {
          underlyingSymbol: rec.stockSymbol,
          optionType: leg.optionType,
          strikePrice: leg.strikePrice.toString(),
          premium: leg.premium.toString(),
          quantity: leg.quantity,
          expiryDate: rec.expiryDate,
          strategy: rec.strategy,
        });

        await apiRequest('POST', '/api/options', {
          underlyingSymbol: rec.stockSymbol,
          optionType: leg.optionType,
          strikePrice: leg.strikePrice.toString(),
          premium: leg.premium.toString(),
          quantity: leg.quantity,
          expiryDate: rec.expiryDate,
          strategy: rec.strategy,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/options'] });

      const legDescription = rec.legs.length > 1 
        ? `${rec.legs.length}-leg ${strategyLabels[rec.strategy] || rec.strategy}`
        : `${rec.legs[0].optionType.toUpperCase()} option`;

      toast({
        title: "Strategy Added",
        description: `${legDescription} for ${rec.stockSymbol} added to your portfolio`,
      });
    } catch (error) {
      console.error('Error adding option:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add strategy to portfolio",
        variant: "destructive",
      });
    }
  };

  const strategyLabels: Record<string, string> = {
    'protective_put': 'Protective Put',
    'covered_call': 'Covered Call',
    'collar': 'Collar',
    'straddle': 'Straddle',
    'strangle': 'Strangle',
    'iron_condor': 'Iron Condor',
    'bull_call_spread': 'Bull Call Spread',
    'bear_put_spread': 'Bear Put Spread',
    'standalone': 'Standalone',
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950';
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950';
      default: return 'text-muted-foreground';
    }
  };

  const getOutlookIcon = (outlook: string) => {
    switch (outlook) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'volatile': return <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            AI Options Recommendations
          </CardTitle>
          <CardDescription>
            Get personalized options trading suggestions based on your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (₹)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="100000"
                data-testid="input-recommendation-budget"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk">Risk Tolerance</Label>
              <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                <SelectTrigger id="risk" data-testid="select-risk-tolerance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy Focus (Optional)</Label>
              <Select value={strategyPreference} onValueChange={setStrategyPreference}>
                <SelectTrigger id="strategy" data-testid="select-strategy-focus">
                  <SelectValue placeholder="All strategies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Strategies</SelectItem>
                  <SelectItem value="hedging">Hedging & Protection</SelectItem>
                  <SelectItem value="income">Income Generation</SelectItem>
                  <SelectItem value="volatility">Volatility Plays</SelectItem>
                  <SelectItem value="spreads">Spread Strategies</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGetRecommendations}
            disabled={isLoading || isFetching}
            className="w-full"
            data-testid="button-get-recommendations"
          >
            {(isLoading || isFetching) ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Getting Recommendations...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get AI Recommendations
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {data?.recommendations && data.recommendations.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {data.recommendations.map((rec, index) => (
            <Card key={index} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {rec.stockSymbol}
                      <Badge variant="secondary">
                        {strategyLabels[rec.strategy] || rec.strategy}
                      </Badge>
                      {getOutlookIcon(rec.marketOutlook)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>{rec.stockName}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="font-semibold text-foreground">CMP: ₹{rec.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddOption(rec)}
                    data-testid={`button-add-recommendation-${index}`}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Portfolio
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Strategy Legs Table */}
                {rec.legs && rec.legs.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 grid grid-cols-3 gap-4 text-sm font-medium">
                      <div>Strategy (execute all)</div>
                      <div>Entry</div>
                      <div>Expiry</div>
                    </div>
                    {rec.legs.map((leg, legIndex) => (
                      <div key={legIndex} className="px-4 py-3 grid grid-cols-3 gap-4 text-sm border-t items-center">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={leg.action === 'buy' ? 'default' : 'secondary'}
                            className={leg.action === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                          >
                            {leg.action.toUpperCase()}
                          </Badge>
                          <span className="font-mono">
                            {new Date(rec.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()} {leg.strikePrice} {leg.optionType === 'put' ? 'PE' : 'CE'}
                          </span>
                        </div>
                        <div className="font-semibold">
                          ₹{leg.premium.toLocaleString('en-IN')}
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(rec.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Strategy Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="font-semibold">{rec.legs[0]?.quantity || 0} lots</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Cost</p>
                    <p className="font-semibold">{rec.netCost > 0 ? '+' : ''}₹{rec.netCost.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Target Profit</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">{rec.targetProfit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Max Loss</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">{rec.maxLoss}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge className={getRiskColor(rec.riskLevel)}>
                    {rec.riskLevel.toUpperCase()} Risk
                  </Badge>
                </div>

                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground font-medium mb-1">AI Analysis</p>
                  <p className="text-sm">{rec.reasoning}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data?.recommendations && data.recommendations.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No recommendations available. Try adjusting your filters.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
