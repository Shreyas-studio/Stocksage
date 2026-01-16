import OpenAI from 'openai';
import { getMultipleStockPrices } from './stockPrice';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface StrategyLeg {
  action: 'buy' | 'sell';
  optionType: 'call' | 'put';
  strikePrice: number;
  premium: number;
  quantity: number;
}

export interface OptionRecommendation {
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

export async function generateOptionsRecommendations(
  budget?: number,
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive',
  strategyPreference?: string
): Promise<OptionRecommendation[]> {
  const budgetText = budget ? `₹${budget.toLocaleString('en-IN')}` : '₹50,000 to ₹1,00,000';
  const risk = riskTolerance || 'moderate';
  
  let strategyText = 'mix of hedging strategies and income generation';
  let hedgingFocus = false;
  
  if (strategyPreference === 'hedging') {
    strategyText = 'HEDGING & PROTECTION ONLY - protective puts, collars, bear put spreads for downside protection';
    hedgingFocus = true;
  } else if (strategyPreference === 'income') {
    strategyText = 'income generation - covered calls, iron condors for premium collection';
  } else if (strategyPreference === 'volatility') {
    strategyText = 'volatility plays - straddles, strangles for event-driven opportunities';
  } else if (strategyPreference === 'spreads') {
    strategyText = 'spread strategies - bull call spreads, bear put spreads for directional plays';
  }

  // Fetch current stock prices for popular NSE stocks
  const popularStocks = [
    'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'HINDUNILVR.NS',
    'ICICIBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'WIPRO.NS'
  ];
  
  const stockPrices = await getMultipleStockPrices(popularStocks);
  
  // Create current price context for AI
  const priceContext = Array.from(stockPrices.entries())
    .map(([symbol, quote]) => `${symbol}: ₹${quote.price.toFixed(2)}`)
    .join(', ');
  
  const currentPricesText = priceContext || 'Unable to fetch current prices';

  const prompt = `You are an expert options trading advisor for Indian stock markets (NSE/BSE) specializing in hedging strategies.

Provide 5-7 specific options trading recommendations for today (${new Date().toLocaleDateString('en-IN')}).

**CURRENT STOCK PRICES (LIVE NSE DATA):**
${currentPricesText}

Parameters:
- Budget: ${budgetText}
- Risk Tolerance: ${risk}
- Strategy Focus: ${strategyText}
- Market: NSE (National Stock Exchange of India)

IMPORTANT: Include a good mix of hedging strategies to protect capital:

**Hedging Strategies to Include:**
1. **Protective Put** - Downside protection for long positions (buy put below current price)
2. **Covered Call** - Income generation on existing holdings (sell call above current price)  
3. **Collar** - Balanced protection (buy protective put + sell covered call)
4. **Bear Put Spread** - Profit from downside with limited cost
5. **Bull Call Spread** - Moderate upside with capped risk
6. **Iron Condor** - Range-bound income (for stable/sideways markets)
7. **Straddle/Strangle** - Volatility protection (earnings, events)

For each recommendation, provide MULTI-LEG strategies where applicable:

**IMPORTANT: Spread strategies must have MULTIPLE LEGS:**
- Bear Put Spread: [BUY lower strike put, SELL higher strike put]
- Bull Call Spread: [BUY lower strike call, SELL higher strike call]
- Collar: [BUY put, SELL call]
- Iron Condor: [SELL lower put, BUY even lower put, SELL higher call, BUY even higher call]
- Single strategies (Protective Put, Covered Call): [ONE leg only]

For each recommendation provide:
1. Stock Symbol (with .NS suffix - RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS, HINDUNILVR.NS, etc.)
2. Stock Name (company name)
3. **Current Price** - Use the LIVE CURRENT PRICE from the data provided above
4. Expiry Date - **CRITICAL: Must be a TUESDAY only** (Indian options expire on Tuesdays):
   - For October 2025: Use 2025-10-07, 2025-10-14, 2025-10-21, or 2025-10-28 (last Tuesday = monthly expiry)
   - For November 2025: Use 2025-11-04, 2025-11-11, 2025-11-18, or 2025-11-25 (last Tuesday = monthly expiry)
   - Format: YYYY-MM-DD
5. Strategy (protective_put, covered_call, collar, straddle, strangle, iron_condor, bull_call_spread, bear_put_spread, or standalone)
6. Legs Array - for EACH leg specify:
   - action: "buy" or "sell"
   - optionType: "call" or "put"
   - **strikePrice: CRITICAL - Use strikes based on CURRENT PRICE:**
     * For Puts (bearish protection): Use strikes BELOW current price (e.g., if stock at ₹1471, use 1450, 1440, 1420, etc.)
     * For Calls (bullish): Use strikes ABOVE current price (e.g., if stock at ₹1471, use 1480, 1500, 1520, etc.)
     * For Spreads: Use realistic price intervals (₹10-50 apart for stocks, ₹50-100 for high-priced stocks)
     * **Match strikes available on NSE** - typically in multiples of 10, 20, or 50 depending on stock price
   - premium: estimated premium per contract (realistic based on moneyness and time to expiry)
   - quantity: number of contracts (same for all legs in strategy)
7. Reasoning (explain the hedging benefit - what risk it protects against, why now)
8. Risk Level (low/medium/high)
9. Target Profit (expected profit potential in ₹ - aim for minimum 10-20% return on capital)
10. Max Loss (maximum possible loss - key for hedging)
11. Net Cost (total cost after premiums - negative if credit received)
12. Market Outlook (bullish/bearish/neutral/volatile)

Focus on:
${hedgingFocus ? '- **CRITICAL: ALL recommendations must be hedging/protection strategies ONLY**\n- **PRIORITY: Protective puts, collars, bear put spreads for downside protection**' : '- **Portfolio protection strategies** (at least 40% of recommendations should be hedging-focused)'}
- Liquid, high-volume NSE stocks (Nifty 50 components preferred)
- Current market volatility and risk factors
- Realistic strike prices and expiries
${hedgingFocus ? '- Cost-effective protective strategies\n- Focus on capital preservation and downside protection' : '- Mix of protective and income-generating strategies\n- Cost-effective hedging solutions'}
- Clear risk-reward profiles

Return ONLY a valid JSON array with no markdown formatting:

Example 1 - Bear Put Spread (if INFY current price is ₹1471):
{
  "stockSymbol": "INFY.NS",
  "stockName": "Infosys",
  "currentPrice": 1471.50,
  "expiryDate": "2025-10-28",
  "strategy": "bear_put_spread",
  "legs": [
    {
      "action": "buy",
      "optionType": "put",
      "strikePrice": 1460,
      "premium": 28.00,
      "quantity": 2
    },
    {
      "action": "sell",
      "optionType": "put",
      "strikePrice": 1420,
      "premium": 12.50,
      "quantity": 2
    }
  ],
  "reasoning": "IT sector consolidation expected. Bear put spread protects against 3-4% downside with limited cost.",
  "riskLevel": "medium",
  "targetProfit": "₹8,000-₹10,000",
  "maxLoss": "₹3,100",
  "netCost": 31,
  "marketOutlook": "bearish"
}

Example 2 - Protective Put (if RELIANCE current price is ₹2850):
{
  "stockSymbol": "RELIANCE.NS",
  "stockName": "Reliance Industries",
  "currentPrice": 2850.00,
  "expiryDate": "2025-10-28",
  "strategy": "protective_put",
  "legs": [
    {
      "action": "buy",
      "optionType": "put",
      "strikePrice": 2800,
      "premium": 42,
      "quantity": 1
    }
  ],
  "reasoning": "Protect recent gains in Reliance. Put provides downside insurance below ₹2800.",
  "riskLevel": "low",
  "targetProfit": "₹0 (pure protection)",
  "maxLoss": "₹4,200",
  "netCost": 42,
  "marketOutlook": "neutral"
}

Return array of 5-7 such recommendations.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert Indian stock options trading advisor. Provide specific, actionable trade recommendations with realistic parameters for NSE stocks. Always return valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No recommendations generated');
    }

    const cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const recommendations = JSON.parse(cleanedContent) as OptionRecommendation[];

    return recommendations.slice(0, 10);
  } catch (error) {
    console.error('Error generating options recommendations:', error);
    throw new Error('Failed to generate options recommendations');
  }
}
