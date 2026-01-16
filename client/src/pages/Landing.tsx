import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Zap, Target, BarChart3, Bell } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">AI Stock Tracker</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Sign In with Google
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Track Your Indian Stock Portfolio with{" "}
              <span className="text-primary">AI-Powered Insights</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Real-time NSE/BSE stock tracking, automated AI recommendations, and intelligent alerts to help you make smarter investment decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/api/login'}
                className="text-base sm:text-lg px-6 sm:px-8"
                data-testid="button-get-started"
              >
                Sign In with Google
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-base sm:text-lg px-6 sm:px-8"
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/50 py-12 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
              Powerful Features for Smart Investors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <FeatureCard
                icon={<TrendingUp className="h-8 w-8 text-primary" />}
                title="Real-Time Tracking"
                description="Live NSE/BSE stock prices updated every 5 minutes with Yahoo Finance integration"
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8 text-primary" />}
                title="AI Recommendations"
                description="OpenAI-powered buy/sell/hold suggestions based on market analysis and your portfolio"
              />
              <FeatureCard
                icon={<Target className="h-8 w-8 text-primary" />}
                title="Smart Alerts"
                description="Automated notifications when stocks approach your target buy or sell prices"
              />
              <FeatureCard
                icon={<BarChart3 className="h-8 w-8 text-primary" />}
                title="Swing Trades"
                description="Discover high-volatility Indian stocks for short-term trading opportunities"
              />
              <FeatureCard
                icon={<Shield className="h-8 w-8 text-primary" />}
                title="Multibagger Analysis"
                description="AI-identified long-term growth stocks for 5-10 year investment horizons"
              />
              <FeatureCard
                icon={<Bell className="h-8 w-8 text-primary" />}
                title="Portfolio Analytics"
                description="Track P/L, performance metrics, and visualize your investment journey"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to Supercharge Your Portfolio?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join investors who trust AI to make data-driven decisions in the Indian stock market.
            </p>
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              className="text-base sm:text-lg px-6 sm:px-8"
              data-testid="button-cta-signup"
            >
              Sign In with Google
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>AI Stock Portfolio Tracker • Built with OpenAI & Yahoo Finance</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover-elevate">
      <div className="mb-4">{icon}</div>
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
