import { Brain, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AIStatusBadgeProps {
  isAnalyzing: boolean;
  lastAnalyzed?: string;
  nextCheck?: string;
  onRefresh?: () => void;
}

export default function AIStatusBadge({ 
  isAnalyzing, 
  lastAnalyzed = "5 min ago", 
  nextCheck = "in 3 min",
  onRefresh 
}: AIStatusBadgeProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Badge 
        variant={isAnalyzing ? "default" : "secondary"} 
        className="gap-2"
        data-testid="badge-ai-status"
      >
        <Brain className={`h-3 w-3 ${isAnalyzing ? 'animate-pulse' : ''}`} />
        {isAnalyzing ? 'Analyzing...' : 'AI Ready'}
      </Badge>
      
      {!isAnalyzing && (
        <>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastAnalyzed}
          </span>
          <span className="text-sm text-muted-foreground">
            Next check: {nextCheck}
          </span>
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-2 h-7"
            onClick={onRefresh}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </>
      )}
    </div>
  );
}
