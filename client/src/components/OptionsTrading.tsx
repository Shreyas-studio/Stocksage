import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOptionSchema, type Option } from "@shared/schema";
import { z } from "zod";
import { Plus, TrendingUp, TrendingDown, Shield, Trash2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useOptions, useAddOption, useDeleteOption, useAnalyzeHedging, useAnalyzeOption } from "@/hooks/useOptions";

const formSchema = insertOptionSchema.extend({
  strikePrice: z.string().min(1, "Strike price is required"),
  premium: z.string().min(1, "Premium is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function OptionsTrading() {
  const { toast } = useToast();
  const { data: options = [], isLoading } = useOptions();
  const addOptionMutation = useAddOption();
  const deleteOptionMutation = useDeleteOption();
  const analyzeHedgingMutation = useAnalyzeHedging();
  const analyzeOptionMutation = useAnalyzeOption();
  
  const [open, setOpen] = useState(false);
  const [hedgingRecs, setHedgingRecs] = useState<any[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      underlyingSymbol: "",
      optionType: "call",
      strikePrice: "",
      premium: "",
      quantity: 1,
      expiryDate: "",
      strategy: undefined,
      linkedStockId: undefined,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await addOptionMutation.mutateAsync(data);
      
      toast({
        title: "Option Added",
        description: `${data.optionType.toUpperCase()} option for ${data.underlyingSymbol} added successfully`,
      });
      
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add option",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string, symbol: string) => {
    try {
      await deleteOptionMutation.mutateAsync(id);
      toast({
        title: "Option Deleted",
        description: `${symbol} option has been removed`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete option",
        variant: "destructive",
      });
    }
  };

  const handleAnalyzeHedging = async () => {
    try {
      const result = await analyzeHedgingMutation.mutateAsync();
      setHedgingRecs(result.analyses || []);
      toast({
        title: "Hedging Analysis Complete",
        description: `Found ${result.analyses?.length || 0} hedging opportunities`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze hedging strategies",
        variant: "destructive",
      });
    }
  };

  const handleAnalyzeOption = async (id: string) => {
    try {
      await analyzeOptionMutation.mutateAsync(id);
      toast({
        title: "Analysis Complete",
        description: "Option has been analyzed by AI",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze option",
        variant: "destructive",
      });
    }
  };

  const getStrategyColor = (strategy: string | null) => {
    const colors: Record<string, string> = {
      protective_put: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      covered_call: "bg-green-500/10 text-green-700 dark:text-green-400",
      collar: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
      straddle: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
      iron_condor: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
    };
    return colors[strategy || ""] || "bg-muted text-muted-foreground";
  };

  const formatStrategy = (strategy: string | null) => {
    if (!strategy) return "Standalone";
    return strategy.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const calculatePL = (option: Option) => {
    const current = parseFloat(option.currentPrice || option.premium);
    const premium = parseFloat(option.premium);
    const pl = (current - premium) * option.quantity;
    const plPercent = ((current - premium) / premium * 100).toFixed(2);
    return { pl, plPercent };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold">Options Trading</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your options positions and hedging strategies
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleAnalyzeHedging} 
            variant="outline"
            disabled={analyzeHedgingMutation.isPending}
            data-testid="button-analyze-hedging"
          >
            <Shield className="h-4 w-4 mr-2" />
            {analyzeHedgingMutation.isPending ? "Analyzing..." : "Analyze Hedging"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-option">
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Option Position</DialogTitle>
                <DialogDescription>
                  Enter the details of your options contract
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="underlyingSymbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Symbol</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="RELIANCE.NS" 
                            {...field}
                            data-testid="input-underlying-symbol"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="optionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Option Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-option-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="call">Call</SelectItem>
                            <SelectItem value="put">Put</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="strikePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Strike Price (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="2500" 
                              {...field}
                              data-testid="input-strike-price"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="premium"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Premium (₹)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="50" 
                              {...field}
                              data-testid="input-premium"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity (Lots)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="1"
                              {...field}
                              data-testid="input-quantity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              data-testid="input-expiry-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="strategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strategy (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-strategy">
                              <SelectValue placeholder="Select strategy" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="protective_put">Protective Put</SelectItem>
                            <SelectItem value="covered_call">Covered Call</SelectItem>
                            <SelectItem value="collar">Collar</SelectItem>
                            <SelectItem value="straddle">Straddle</SelectItem>
                            <SelectItem value="strangle">Strangle</SelectItem>
                            <SelectItem value="iron_condor">Iron Condor</SelectItem>
                            <SelectItem value="bull_call_spread">Bull Call Spread</SelectItem>
                            <SelectItem value="bear_put_spread">Bear Put Spread</SelectItem>
                            <SelectItem value="standalone">Standalone</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={addOptionMutation.isPending}
                    data-testid="button-submit-option"
                  >
                    {addOptionMutation.isPending ? "Adding..." : "Add Option"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Existing Options */}
      {options.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Options Positions</h3>
          <div className="grid gap-4">
            {options.map((option) => {
              const { pl, plPercent } = calculatePL(option);
              const daysToExpiry = Math.ceil(
                (new Date(option.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <Card key={option.id} data-testid={`option-card-${option.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold">
                        {option.underlyingSymbol}
                      </CardTitle>
                      <Badge variant={option.optionType === 'call' ? 'default' : 'secondary'}>
                        {option.optionType.toUpperCase()}
                      </Badge>
                      {option.strategy && (
                        <Badge className={getStrategyColor(option.strategy)}>
                          {formatStrategy(option.strategy)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleAnalyzeOption(option.id)}
                        disabled={analyzeOptionMutation.isPending}
                        data-testid={`button-analyze-${option.id}`}
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(option.id, option.underlyingSymbol)}
                        data-testid={`button-delete-${option.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Strike Price</p>
                        <p className="font-semibold">₹{option.strikePrice}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Premium Paid</p>
                        <p className="font-semibold">₹{option.premium}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quantity</p>
                        <p className="font-semibold">{option.quantity} lots</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expiry</p>
                        <p className="font-semibold">
                          {format(new Date(option.expiryDate), 'dd MMM yyyy')}
                          <span className="text-xs text-muted-foreground ml-1">
                            ({daysToExpiry}d)
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                      pl >= 0 ? 'bg-profit/10' : 'bg-loss/10'
                    }`}>
                      {pl >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-profit" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-loss" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">
                          {pl >= 0 ? '+' : ''}₹{pl.toFixed(2)} ({plPercent}%)
                        </p>
                      </div>
                    </div>

                    {option.aiRecommendation && (
                      <div className="p-3 bg-ai-recommendation/10 rounded-lg border border-ai-recommendation/20">
                        <p className="text-sm font-semibold text-ai-recommendation mb-1">
                          AI: {option.aiRecommendation.toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {option.aiReason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Hedging Recommendations */}
      {hedgingRecs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">AI Hedging Recommendations</h3>
          <div className="grid gap-4">
            {hedgingRecs.map((analysis, idx) => (
              <Card key={idx} data-testid={`hedging-rec-${idx}`}>
                <CardHeader>
                  <CardTitle className="text-base">{analysis.symbol}</CardTitle>
                  <CardDescription>{analysis.overallStrategy}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {analysis.recommendations?.map((rec: any, recIdx: number) => (
                    <div key={recIdx} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getStrategyColor(rec.strategy)}>
                          {formatStrategy(rec.strategy)}
                        </Badge>
                        <Badge variant={
                          rec.riskLevel === 'low' ? 'default' : 
                          rec.riskLevel === 'medium' ? 'secondary' : 'destructive'
                        }>
                          {rec.riskLevel} risk
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-semibold">{rec.optionType.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Strike</p>
                          <p className="font-semibold">₹{rec.strikePrice}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-semibold">{rec.quantity} lots</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cost</p>
                          <p className="font-semibold">~₹{rec.expectedCost}/lot</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {options.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Options Yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Start hedging your portfolio with options strategies
            </p>
            <Button onClick={() => setOpen(true)} data-testid="button-get-started">
              Get Started
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
