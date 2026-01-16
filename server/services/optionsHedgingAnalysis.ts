import OpenAI from "openai";
import type { Stock, Option } from "@shared/schema";

// This uses Replit's AI Integrations service for OpenAI-compatible API access
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

interface HedgingRecommendation {
  strategy: string;
  optionType: 'call' | 'put';
  strikePrice: number;
  expiryDays: number;
  quantity: number;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedCost: number;
}

interface OptionsAnalysisResult {
  stockId: string;
  symbol: string;
  recommendations: HedgingRecommendation[];
  portfolioRisk: string;
  overallStrategy: string;
}

export async function analyzeOptionsHedging(
  stocks: Stock[],
  existingOptions: Option[]
): Promise<OptionsAnalysisResult[]> {
  if (stocks.length === 0) {
    return [];
  }

  const stockData = stocks.map(stock => ({
    id: stock.id,
    symbol: stock.symbol,
    quantity: stock.quantity,
    buyPrice: stock.buyPrice,
    currentPrice: stock.currentPrice || stock.buyPrice,
    profitLoss: stock.currentPrice 
      ? ((parseFloat(stock.currentPrice) - parseFloat(stock.buyPrice)) / parseFloat(stock.buyPrice) * 100).toFixed(2)
      : '0',
    value: stock.currentPrice
      ? (parseFloat(stock.currentPrice) * stock.quantity).toFixed(2)
      : (parseFloat(stock.buyPrice) * stock.quantity).toFixed(2)
  }));

  const existingStrategies = existingOptions.map(opt => ({
    symbol: opt.underlyingSymbol,
    type: opt.optionType,
    strategy: opt.strategy,
    strikePrice: opt.strikePrice,
    expiry: opt.expiryDate,
  }));

  const prompt = `You are an expert options trader specializing in hedging strategies for the Indian stock market (NSE/BSE).

Analyze this portfolio and recommend hedging strategies:

Portfolio:
${stockData.map(s => `- ${s.symbol}: ${s.quantity} shares at ₹${s.currentPrice} (bought at ₹${s.buyPrice}, P/L: ${s.profitLoss}%, Value: ₹${s.value})`).join('\n')}

Existing Options Positions:
${existingStrategies.length > 0 ? existingStrategies.map(o => `- ${o.symbol} ${o.type} ${o.strategy || 'standalone'} (Strike: ₹${o.strikePrice})`).join('\n') : 'None'}

For EACH stock, recommend appropriate hedging strategies from:
1. **Protective Put** - Downside protection (buy put below current price)
2. **Covered Call** - Income generation (sell call above current price)
3. **Collar** - Balanced protection (buy put + sell call)
4. **Bull Call Spread** - Moderate upside with limited risk
5. **Bear Put Spread** - Downside protection with reduced cost
6. **Straddle** - Volatility play (buy call + put at same strike)
7. **Iron Condor** - Range-bound income strategy

For each recommendation, provide:
- strategy: exact strategy name (protective_put, covered_call, collar, straddle, strangle, iron_condor, bull_call_spread, bear_put_spread)
- optionType: "call" or "put"
- strikePrice: recommended strike in rupees
- expiryDays: days until expiry (7, 14, 30, 60, 90)
- quantity: number of contracts (usually matches stock quantity/lot size)
- reasoning: why this hedge makes sense (2-3 sentences)
- riskLevel: "low", "medium", or "high"
- expectedCost: estimated cost in rupees per contract

Consider:
- Current market volatility
- Stock's profit/loss status
- Existing hedges to avoid over-hedging
- Cost-effectiveness of the strategy
- Indian options lot sizes (typically 25-100)

Respond in JSON format:
{
  "analyses": [
    {
      "stockId": "stock_id_here",
      "symbol": "SYMBOL",
      "recommendations": [
        {
          "strategy": "protective_put",
          "optionType": "put",
          "strikePrice": 1450,
          "expiryDays": 30,
          "quantity": 50,
          "reasoning": "Stock is up 15%, secure profits with downside protection",
          "riskLevel": "low",
          "expectedCost": 45
        }
      ],
      "portfolioRisk": "Medium - concentrated in tech sector",
      "overallStrategy": "Focus on protective strategies due to recent gains"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert options trading analyst for Indian markets. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const result = JSON.parse(content);
    return result.analyses || [];
  } catch (error) {
    console.error("Options hedging analysis error:", error);
    return [];
  }
}

export async function analyzeIndividualOption(
  option: Option,
  relatedStock?: Stock
): Promise<{ recommendation: string; reason: string }> {
  const currentPrice = option.currentPrice || option.premium;
  const profitLoss = option.currentPrice 
    ? ((parseFloat(option.currentPrice) - parseFloat(option.premium)) / parseFloat(option.premium) * 100).toFixed(2)
    : '0';

  const daysToExpiry = Math.ceil(
    (new Date(option.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const prompt = `You are an expert options trader for Indian markets (NSE/BSE).

Analyze this options position and provide a recommendation:

Option Details:
- Symbol: ${option.underlyingSymbol}
- Type: ${option.optionType.toUpperCase()}
- Strike Price: ₹${option.strikePrice}
- Premium Paid: ₹${option.premium}
- Current Price: ₹${currentPrice}
- P/L: ${profitLoss}%
- Quantity: ${option.quantity} contracts
- Days to Expiry: ${daysToExpiry}
- Strategy: ${option.strategy || 'Standalone'}
${relatedStock ? `\nUnderlying Stock:\n- Current Price: ₹${relatedStock.currentPrice}\n- Position: ${relatedStock.quantity} shares at ₹${relatedStock.buyPrice}` : ''}

Provide:
1. **recommendation**: "hold", "close", "roll", or "add"
2. **reason**: 2-3 sentence explanation considering:
   - Time decay (theta)
   - Moneyness (ITM/ATM/OTM)
   - Days to expiry
   - Current P/L
   - Strategy effectiveness

Respond in JSON format:
{
  "recommendation": "hold",
  "reason": "Option is ITM with 15 days to expiry. Time decay is accelerating but still has intrinsic value. Consider closing if underlying shows weakness."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert options trading analyst. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const result = JSON.parse(content);
    return {
      recommendation: result.recommendation || "hold",
      reason: result.reason || "Analysis unavailable",
    };
  } catch (error) {
    console.error("Individual option analysis error:", error);
    return {
      recommendation: "hold",
      reason: "Unable to analyze at this time",
    };
  }
}
