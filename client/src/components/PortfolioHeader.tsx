import { TrendingUp, Bell, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/ThemeToggle";

interface PortfolioHeaderProps {
  totalValue: number;
  totalProfitLoss: number;
  profitLossPercent: number;
  userName?: string;
  userEmail?: string;
  onNotificationClick?: () => void;
}

export default function PortfolioHeader({
  totalValue,
  totalProfitLoss,
  profitLossPercent,
  userName = "User",
  userEmail,
  onNotificationClick,
}: PortfolioHeaderProps) {
  const isProfit = totalProfitLoss >= 0;
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <header className="border-b bg-card px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-semibold truncate">AI Portfolio Tracker</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Real-time monitoring & AI insights</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
          <div className="text-center hidden lg:block">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="font-mono text-xl xl:text-2xl font-semibold tabular-nums">₹{totalValue.toLocaleString()}</p>
          </div>

          <div className="text-center hidden xl:block">
            <p className="text-sm text-muted-foreground">P/L</p>
            <div className="flex items-center gap-2">
              <p className={`font-mono text-lg xl:text-xl font-semibold tabular-nums ${isProfit ? 'text-profit' : 'text-loss'}`}>
                {isProfit ? '+' : ''}₹{totalProfitLoss.toLocaleString()}
              </p>
              <span className={`text-sm font-medium ${isProfit ? 'text-profit' : 'text-loss'}`}>
                ({isProfit ? '+' : ''}{profitLossPercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={onNotificationClick}
              data-testid="button-notifications"
              className="h-9 w-9"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 w-9 rounded-full p-0" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarImage src="" alt={userName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium" data-testid="text-user-name">{userName}</p>
                    {userEmail && <p className="text-xs text-muted-foreground" data-testid="text-user-email">{userEmail}</p>}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
