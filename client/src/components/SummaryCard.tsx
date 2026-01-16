import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
}

export default function SummaryCard({ title, value, subtitle, icon: Icon, trend }: SummaryCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-profit';
    if (trend === 'down') return 'text-loss';
    return 'text-muted-foreground';
  };

  return (
    <Card className="p-6" data-testid={`card-summary-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className={`font-mono text-2xl font-semibold tabular-nums ${getTrendColor()}`} data-testid={`text-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}
