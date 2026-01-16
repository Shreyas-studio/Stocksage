import { useState, useMemo } from "react";
import PortfolioHeader from "@/components/PortfolioHeader";
import SummaryCard from "@/components/SummaryCard";
import StockCard, { AIAction } from "@/components/StockCard";
import PortfolioChart from "@/components/PortfolioChart";
import AlertItem from "@/components/AlertItem";
import AddStockDialog from "@/components/AddStockDialog";
import AIStatusBadge from "@/components/AIStatusBadge";
import ThemeToggle from "@/components/ThemeToggle";
import SwingTradeCard from "@/components/SwingTradeCard";
import MultibaggerCard from "@/components/MultibaggerCard";
import OptionsTrading from "@/components/OptionsTrading";
import OptionsRecommendations from "@/components/OptionsRecommendations";
import { Wallet, TrendingUp, Bell, Zap, Target, Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStocks, useAddStock, useDeleteStock, useAnalyzePortfolio } from "@/hooks/usePortfolio";
import { useAlerts } from "@/hooks/useAlerts";
import { useSwingTradeAnalysis, useMultibaggerAnalysis, type SwingTradeRecommendation, type MultibaggerRecommendation } from "@/hooks/useAnalysis";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: stocks = [], isLoading: stocksLoading } = useStocks();
  const { data: alerts = [], isLoading: alertsLoading } = useAlerts();
  const addStockMutation = useAddStock();
  const deleteStockMutation = useDeleteStock();
  const analyzeMutation = useAnalyzePortfolio();
  const swingTradeMutation = useSwingTradeAnalysis();
  const multibaggerMutation = useMultibaggerAnalysis();
  
  const [swingTradeRecs, setSwingTradeRecs] = useState<SwingTradeRecommendation[]>([]);
  const [multibaggerRecs, setMultibaggerRecs] = useState<MultibaggerRecommendation[]>([]);
  const [swingBudget, setSwingBudget] = useState<string>("all");
  const [multibaggerBudget, setMultibaggerBudget] = useState<string>("all");

  const filterByBudget = (price: number, budget: string): boolean => {
    switch (budget) {
      case "under-100": return price < 100;
      case "100-500": return price >= 100 && price < 500;
      case "500-1000": return price >= 500 && price < 1000;
      case "1000-5000": return price >= 1000 && price < 5000;
      case "above-5000": return price >= 5000;
      default: return true; // "all"
    }
  };

  const filteredSwingTrades = useMemo(() => {
    return swingTradeRecs.filter(rec => filterByBudget(rec.currentPrice, swingBudget));
  }, [swingTradeRecs, swingBudget]);

  const filteredMultibaggers = useMemo(() => {
    return multibaggerRecs.filter(rec => filterByBudget(rec.currentPrice, multibaggerBudget));
  }, [multibaggerRecs, multibaggerBudget]);

  const totalValue = useMemo(() => {
    return stocks.reduce((acc, stock) => {
      const currentPrice = parseFloat(stock.currentPrice || '0');
      return acc + (currentPrice * stock.quantity);
    }, 0);
  }, [stocks]);

  const totalProfitLoss = useMemo(() => {
    return stocks.reduce((acc, stock) => {
      const currentPrice = parseFloat(stock.currentPrice || '0');
      const buyPrice = parseFloat(stock.buyPrice || '0');
      return acc + ((currentPrice - buyPrice) * stock.quantity);
    }, 0);
  }, [stocks]);

  const profitLossPercent = useMemo(() => {
    const totalInvestment = totalValue - totalProfitLoss;
    return totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;
  }, [totalValue, totalProfitLoss]);

  const chartData = useMemo(() => {
    const baseValue = totalValue - totalProfitLoss;
    return [
      { date: 'Day 1', value: baseValue },
      { date: 'Day 2', value: baseValue * 1.02 },
      { date: 'Day 3', value: baseValue * 1.04 },
      { date: 'Day 4', value: baseValue * 1.02 },
      { date: 'Day 5', value: baseValue * 1.06 },
      { date: 'Day 6', value: baseValue * 1.08 },
      { date: 'Today', value: totalValue },
    ];
  }, [totalValue, totalProfitLoss]);

  const lastAnalyzed = useMemo(() => {
    const validDates = stocks
      .map(s => s.lastAiAnalysis)
      .filter(t => t !== null && t !== undefined)
      .map(t => typeof t === 'string' ? new Date(t) : t)
      .filter((t): t is Date => t instanceof Date && !isNaN(t.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());
    
    return validDates.length > 0 ? format(validDates[0], 'h:mm a') : 'Never';
  }, [stocks]);

  const handleAddStock = async (stockData: any) => {
    try {
      await addStockMutation.mutateAsync({
        symbol: stockData.symbol,
        quantity: stockData.quantity,
        buyPrice: stockData.buyPrice.toString(),
        targetSellPrice: stockData.targetSellPrice?.toString() || null,
        targetBuyPrice: stockData.targetBuyPrice?.toString() || null,
      });
      toast({
        title: "Stock Added",
        description: `${stockData.symbol} has been added to your portfolio`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add stock",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStock = async (id: string, symbol: string) => {
    try {
      await deleteStockMutation.mutateAsync(id);
      toast({
        title: "Stock Removed",
        description: `${symbol} has been removed from your portfolio`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete stock",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    try {
      await analyzeMutation.mutateAsync();
      toast({
        title: "Analysis Complete",
        description: "AI recommendations updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze portfolio",
        variant: "destructive",
      });
    }
  };

  const handleSwingTradeAnalysis = async () => {
    try {
      const recommendations = await swingTradeMutation.mutateAsync(undefined);
      setSwingTradeRecs(recommendations);
      toast({
        title: "Swing Trade Analysis Complete",
        description: `Found ${recommendations.length} swing trade opportunities from the market`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze swing trades",
        variant: "destructive",
      });
    }
  };

  const handleMultibaggerAnalysis = async () => {
    try {
      const recommendations = await multibaggerMutation.mutateAsync(undefined);
      setMultibaggerRecs(recommendations);
      toast({
        title: "Multibagger Analysis Complete",
        description: `Found ${recommendations.length} potential multibagger stocks`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze multibaggers",
        variant: "destructive",
      });
    }
  };

  const formattedAlerts = useMemo(() => {
    return alerts.map(alert => ({
      id: alert.id,
      symbol: alert.symbol,
      message: alert.message,
      targetPrice: parseFloat(alert.targetPrice || '0'),
      currentPrice: parseFloat(alert.currentPrice || '0'),
      type: alert.type as 'buy' | 'sell' | 'info',
      timestamp: alert.createdAt ? format(new Date(alert.createdAt), 'h:mm a') : 'Just now',
    }));
  }, [alerts]);

  if (stocksLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PortfolioHeader 
        totalValue={totalValue}
        totalProfitLoss={totalProfitLoss}
        profitLossPercent={profitLossPercent}
        userName={user?.name || user?.email?.split('@')[0] || 'User'}
        userEmail={user?.email}
        onNotificationClick={() => console.log('Notifications clicked')}
      />

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3 sm:gap-4">
          <AIStatusBadge 
            isAnalyzing={analyzeMutation.isPending}
            lastAnalyzed={lastAnalyzed}
            nextCheck="in 3 min"
            onRefresh={handleAnalyze}
          />
          <div className="flex items-center gap-2">
            <AddStockDialog onAddStock={handleAddStock} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <SummaryCard 
            title="Total Value"
            value={`₹${totalValue.toLocaleString()}`}
            icon={Wallet}
          />
          <SummaryCard 
            title="Total P/L"
            value={`${totalProfitLoss >= 0 ? '+' : ''}₹${totalProfitLoss.toLocaleString()}`}
            subtitle={`${totalProfitLoss >= 0 ? '+' : ''}${profitLossPercent.toFixed(2)}%`}
            icon={TrendingUp}
            trend={totalProfitLoss >= 0 ? 'up' : 'down'}
          />
          <SummaryCard 
            title="Active Alerts"
            value={alerts.length}
            subtitle={`${alerts.filter(a => !a.isRead).length} unread`}
            icon={Bell}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                {stocks.length > 0 ? 'AI Recommendations' : 'Your Portfolio'}
              </h2>
              {stocks.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">No stocks in your portfolio yet</p>
                  <AddStockDialog onAddStock={handleAddStock} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stocks.map((stock) => (
                    <StockCard 
                      key={stock.id}
                      symbol={stock.symbol}
                      quantity={stock.quantity}
                      buyPrice={parseFloat(stock.buyPrice || '0')}
                      currentPrice={parseFloat(stock.currentPrice || '0')}
                      aiAction={(stock.aiAction as AIAction) || 'Hold'}
                      aiReason={stock.aiReason || 'Awaiting analysis'}
                      targetPrice={stock.aiTargetPrice ? parseFloat(stock.aiTargetPrice) : undefined}
                      onEdit={() => console.log('Edit', stock.symbol)}
                      onDelete={() => handleDeleteStock(stock.id, stock.symbol)}
                    />
                  ))}
                </div>
              )}
            </div>

            {stocks.length > 0 && <PortfolioChart data={chartData} />}

            <div className="mt-6">
              <Tabs defaultValue="swing" className="w-full">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="text-xl font-semibold">AI Trading Insights</h2>
                  <TabsList>
                    <TabsTrigger value="swing" data-testid="tab-swing-trade">
                      <Zap className="h-4 w-4 mr-2" />
                      Swing Trades
                    </TabsTrigger>
                    <TabsTrigger value="multibagger" data-testid="tab-multibagger">
                      <Target className="h-4 w-4 mr-2" />
                      Multibaggers
                    </TabsTrigger>
                    <TabsTrigger value="options" data-testid="tab-options">
                      <Shield className="h-4 w-4 mr-2" />
                      Options
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="swing" className="space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm text-muted-foreground">
                      Find high-volatility Indian stocks ready to buy NOW at current market price
                    </p>
                    <div className="flex items-center gap-2">
                      <Select value={swingBudget} onValueChange={setSwingBudget}>
                        <SelectTrigger className="w-[180px]" data-testid="select-swing-budget">
                          <SelectValue placeholder="Select budget" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Budgets</SelectItem>
                          <SelectItem value="under-100">Under ₹100</SelectItem>
                          <SelectItem value="100-500">₹100 - ₹500</SelectItem>
                          <SelectItem value="500-1000">₹500 - ₹1,000</SelectItem>
                          <SelectItem value="1000-5000">₹1,000 - ₹5,000</SelectItem>
                          <SelectItem value="above-5000">Above ₹5,000</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleSwingTradeAnalysis}
                        disabled={swingTradeMutation.isPending}
                        size="sm"
                        data-testid="button-analyze-swing"
                      >
                        {swingTradeMutation.isPending ? "Analyzing..." : "Analyze"}
                      </Button>
                    </div>
                  </div>
                  {swingTradeRecs.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">
                        Click 'Analyze' to discover swing trade opportunities from the Indian market
                      </p>
                    </div>
                  ) : filteredSwingTrades.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">
                        No stocks found in this budget range. Try a different budget filter.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredSwingTrades.map((rec) => (
                        <SwingTradeCard key={rec.symbol} {...rec} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="multibagger" className="space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm text-muted-foreground">
                      Best stocks to buy and hold for 5-10 years
                    </p>
                    <div className="flex items-center gap-2">
                      <Select value={multibaggerBudget} onValueChange={setMultibaggerBudget}>
                        <SelectTrigger className="w-[180px]" data-testid="select-multibagger-budget">
                          <SelectValue placeholder="Select budget" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Budgets</SelectItem>
                          <SelectItem value="under-100">Under ₹100</SelectItem>
                          <SelectItem value="100-500">₹100 - ₹500</SelectItem>
                          <SelectItem value="500-1000">₹500 - ₹1,000</SelectItem>
                          <SelectItem value="1000-5000">₹1,000 - ₹5,000</SelectItem>
                          <SelectItem value="above-5000">Above ₹5,000</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleMultibaggerAnalysis}
                        disabled={multibaggerMutation.isPending}
                        size="sm"
                        data-testid="button-analyze-multibagger"
                      >
                        {multibaggerMutation.isPending ? "Analyzing..." : "Analyze"}
                      </Button>
                    </div>
                  </div>
                  {multibaggerRecs.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">
                        Click 'Analyze' to discover potential multibagger stocks
                      </p>
                    </div>
                  ) : filteredMultibaggers.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <p className="text-muted-foreground">
                        No stocks found in this budget range. Try a different budget filter.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredMultibaggers.map((rec) => (
                        <MultibaggerCard key={rec.symbol} {...rec} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="options" className="space-y-4">
                  <Tabs defaultValue="positions" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                      <TabsTrigger value="positions" data-testid="tab-my-positions">My Positions</TabsTrigger>
                      <TabsTrigger value="recommendations" data-testid="tab-recommendations">AI Recommendations</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="positions" className="mt-6">
                      <OptionsTrading />
                    </TabsContent>
                    
                    <TabsContent value="recommendations" className="mt-6">
                      <OptionsRecommendations />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
            {alertsLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading alerts...</div>
            ) : formattedAlerts.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No alerts yet</div>
            ) : (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {formattedAlerts.map((alert) => (
                    <AlertItem 
                      key={alert.id}
                      symbol={alert.symbol}
                      message={alert.message}
                      targetPrice={alert.targetPrice}
                      currentPrice={alert.currentPrice}
                      type={alert.type}
                      timestamp={alert.timestamp}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
