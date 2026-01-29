import { useState } from "react";
import { useAnalysisHistory, type AnalysisHistoryEntry } from "@/hooks/useAnalysis";
import type { SwingTradeRecommendation, MultibaggerRecommendation } from "@/hooks/useAnalysis";
import SwingTradeCard from "@/components/SwingTradeCard";
import MultibaggerCard from "@/components/MultibaggerCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { History, ChevronDown, ChevronRight, Zap, Target, Shield } from "lucide-react";
import { format } from "date-fns";

type HistoryTypeFilter = "" | "swing_trade" | "multibagger" | "options_recommendations";

const TYPE_LABELS: Record<string, string> = {
  swing_trade: "Swing Trades",
  multibagger: "Multibaggers",
  options_recommendations: "Options",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  swing_trade: <Zap className="h-4 w-4" />,
  multibagger: <Target className="h-4 w-4" />,
  options_recommendations: <Shield className="h-4 w-4" />,
};

// Option recommendation shape (matches server / OptionsRecommendations)
interface OptionRecLeg {
  action: "buy" | "sell";
  optionType: "call" | "put";
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
  legs: OptionRecLeg[];
  reasoning: string;
  riskLevel: "low" | "medium" | "high";
  targetProfit: string;
  maxLoss: string;
  netCost: number;
  marketOutlook: string;
}

const strategyLabels: Record<string, string> = {
  protective_put: "Protective Put",
  covered_call: "Covered Call",
  collar: "Collar",
  straddle: "Straddle",
  strangle: "Strangle",
  iron_condor: "Iron Condor",
  bull_call_spread: "Bull Call Spread",
  bear_put_spread: "Bear Put Spread",
  standalone: "Standalone",
};

function OptionRecCard({ rec }: { rec: OptionRecommendation }) {
  const riskColor =
    rec.riskLevel === "low"
      ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950"
      : rec.riskLevel === "medium"
        ? "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950"
        : "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950";
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {rec.stockSymbol}
          <Badge variant="secondary">{strategyLabels[rec.strategy] || rec.strategy}</Badge>
          <Badge className={riskColor}>{rec.riskLevel}</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {rec.stockName} · CMP ₹{rec.currentPrice?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </p>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {rec.legs?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {rec.legs.map((leg, i) => (
              <span key={i} className="font-mono text-muted-foreground">
                {leg.action.toUpperCase()} {leg.strikePrice} {leg.optionType === "put" ? "PE" : "CE"} @
                ₹{leg.premium?.toLocaleString("en-IN")}
              </span>
            ))}
          </div>
        )}
        <p className="text-muted-foreground line-clamp-2">{rec.reasoning}</p>
        <div className="flex gap-4 text-muted-foreground">
          <span>Target: {rec.targetProfit}</span>
          <span>Max loss: {rec.maxLoss}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryEntryRow({ entry }: { entry: AnalysisHistoryEntry }) {
  const [open, setOpen] = useState(false);
  const label = TYPE_LABELS[entry.type] ?? entry.type;
  const icon = TYPE_ICONS[entry.type] ?? <History className="h-4 w-4" />;
  const createdAt =
    typeof entry.createdAt === "string"
      ? format(new Date(entry.createdAt), "MMM d, yyyy · h:mm a")
      : entry.createdAt instanceof Date
        ? format(entry.createdAt, "MMM d, yyyy · h:mm a")
        : "—";

  const data = entry.data;
  const isArray = Array.isArray(data);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 rounded-lg transition-colors"
          >
            {open ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <span className="flex items-center gap-2 shrink-0">
              {icon}
              <Badge variant="secondary">{label}</Badge>
            </span>
            <span className="text-sm text-muted-foreground ml-auto shrink-0">{createdAt}</span>
            {isArray && (
              <span className="text-sm text-muted-foreground">
                {(data as unknown[]).length} item(s)
              </span>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 border-t">
            {!isArray && (
              <p className="text-sm text-muted-foreground py-4">No recommendation data.</p>
            )}
            {entry.type === "swing_trade" && isArray && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {(data as SwingTradeRecommendation[]).map((rec) => (
                  <SwingTradeCard key={rec.symbol} {...rec} />
                ))}
              </div>
            )}
            {entry.type === "multibagger" && isArray && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {(data as MultibaggerRecommendation[]).map((rec) => (
                  <MultibaggerCard key={rec.symbol} {...rec} />
                ))}
              </div>
            )}
            {entry.type === "options_recommendations" && isArray && (
              <div className="grid grid-cols-1 gap-4 pt-4">
                {(data as OptionRecommendation[]).map((rec, index) => (
                  <OptionRecCard key={`${rec.stockSymbol}-${index}`} rec={rec} />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function AnalysisHistory() {
  const [typeFilter, setTypeFilter] = useState<HistoryTypeFilter>("");
  const { data: history = [], isLoading } = useAnalysisHistory(
    typeFilter === "" ? undefined : typeFilter
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          View past suggestions by date and time. Filter by type below.
        </p>
        <Select
          value={typeFilter || "all"}
          onValueChange={(v) => setTypeFilter((v === "all" ? "" : v) as HistoryTypeFilter)}
        >
          <SelectTrigger className="w-[200px]" data-testid="select-history-type">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="swing_trade">Swing Trades</SelectItem>
            <SelectItem value="multibagger">Multibaggers</SelectItem>
            <SelectItem value="options_recommendations">Options</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading history...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground">
            No past suggestions yet. Run Swing Trade, Multibagger, or Options analysis to see
            history here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <HistoryEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
