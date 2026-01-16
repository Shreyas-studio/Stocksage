import OpenAI from 'openai';
import { getStockPrice } from './stockPrice';

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface SwingTradeRecommendation {
  symbol: string;
  volatility: 'high' | 'medium' | 'low';
  currentPrice: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  reason: string;
  riskLevel: 'high' | 'medium' | 'low';
}

export async function analyzeSwingTrades(marketCap?: string): Promise<SwingTradeRecommendation[]> {
  const marketCapFilter = marketCap || 'any market cap';
  
  const prompt = `You are a professional swing trader and technical analyst specializing in the Indian stock market (NSE/BSE). Identify the BEST swing trading opportunities that can be bought AT CURRENT MARKET PRICES for the next 1 week.

CRITICAL REQUIREMENTS:
- ONLY recommend stocks listed on NSE (National Stock Exchange) or BSE (Bombay Stock Exchange)
- Use ONLY Indian stock symbols with .NS suffix (for NSE) or .BO suffix (for BSE)
- Examples: RELIANCE.NS, TATAMOTORS.NS, VEDL.NS, SAIL.NS, BANKBARODA.NS
- DO NOT recommend any US stocks
- Focus on HIGH VOLATILITY Indian stocks suitable for swing trading
- Recommendations should be actionable NOW (buy at current market price)

Market cap preference: ${marketCapFilter}

Find Indian stocks with:
1. HIGH short-term volatility (price movement patterns in Indian market)
2. Clear support and resistance levels (based on INR price movements)
3. Strong volume trends and momentum (NSE/BSE trading volumes)
4. Good technical setup for IMMEDIATE entry (buy now at current levels)
5. Favorable risk-reward ratio (minimum 1:2)

IMPORTANT: targetPricePercent and stopLossPercent should be PERCENTAGE gains/losses from CURRENT PRICE.
- For example, if you expect 8% upside, set targetPricePercent: 8
- If stop loss is 3% below current, set stopLossPercent: 3

IMPORTANT: Recommend diverse stocks across different price ranges (under ₹100, ₹100-500, ₹500-1000, ₹1000-5000, above ₹5000) so users have options in every budget.

Return a JSON array with 12-15 top swing trade opportunities from NSE/BSE:
[
  {
    "symbol": "STOCK.NS or STOCK.BO",
    "volatility": "high" | "medium",
    "targetPricePercent": 5.0,
    "stopLossPercent": 2.0,
    "timeframe": "3-5 days" or "5-7 days",
    "reason": "Brief technical reason why this stock is good to buy NOW at current levels (max 100 words)",
    "riskLevel": "high" | "medium" | "low"
  }
]

Focus on stocks with HIGH volatility and strong momentum that are at good technical buy zones NOW. Prioritize liquid stocks with good trading volumes on NSE/BSE.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert swing trader specializing in the Indian stock market (NSE/BSE). You have deep knowledge of technical analysis, volatility patterns, and short-term price movements in Indian stocks. Always respond with valid JSON only. Work with Indian stock symbols that have .NS or .BO suffix.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.error('No JSON array found in swing trade response:', content);
      return [];
    }
    
    interface AISwingResponse {
      symbol: string;
      volatility: 'high' | 'medium' | 'low';
      targetPricePercent: number;
      stopLossPercent: number;
      timeframe: string;
      reason: string;
      riskLevel: 'high' | 'medium' | 'low';
    }
    
    const aiRecommendations: AISwingResponse[] = JSON.parse(jsonMatch[0]);
    
    // CRITICAL: Validate that all symbols are Indian stocks (NSE/BSE)
    const validatedRecommendations = aiRecommendations.filter((rec) => {
      const symbol = rec.symbol?.toUpperCase() || '';
      const isIndianStock = symbol.endsWith('.NS') || symbol.endsWith('.BO');
      
      if (!isIndianStock) {
        console.warn(`[SWING TRADE] Rejected non-Indian stock: ${rec.symbol}`);
      }
      
      return isIndianStock;
    });
    
    if (validatedRecommendations.length === 0) {
      console.warn('[SWING TRADE] No valid Indian stocks in AI recommendations');
      return [];
    }
    
    // Fetch real-time prices and calculate entry/target/stop based on current price
    const recommendationsWithPrices = await Promise.all(
      validatedRecommendations.map(async (rec) => {
        try {
          const quote = await getStockPrice(rec.symbol);
          
          if (!quote || quote.price <= 0) {
            console.warn(`[SWING TRADE] No valid price for ${rec.symbol}`);
            return null;
          }
          
          // Parse and validate percentage values (handle strings like "8%" or "8")
          const parsePercent = (value: any): number => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
              const cleaned = value.replace('%', '').trim();
              const parsed = parseFloat(cleaned);
              return isNaN(parsed) ? 0 : parsed;
            }
            return 0;
          };
          
          const targetPercent = parsePercent(rec.targetPricePercent);
          const stopPercent = parsePercent(rec.stopLossPercent);
          
          // Validate percentage ranges (reasonable swing trade bounds)
          if (targetPercent <= 0 || targetPercent > 50 || stopPercent <= 0 || stopPercent > 20) {
            console.warn(`[SWING TRADE] Invalid percentages for ${rec.symbol}: target=${targetPercent}%, stop=${stopPercent}%`);
            return null;
          }
          
          const currentPrice = quote.price;
          // Entry price = current market price (buy now)
          const entryPrice = currentPrice;
          // Target = current price + percentage gain
          const targetPrice = currentPrice * (1 + targetPercent / 100);
          // Stop loss = current price - percentage loss
          const stopLoss = currentPrice * (1 - stopPercent / 100);
          
          return {
            symbol: rec.symbol,
            volatility: rec.volatility,
            currentPrice,
            entryPrice,
            targetPrice,
            stopLoss,
            timeframe: rec.timeframe,
            reason: rec.reason,
            riskLevel: rec.riskLevel
          } as SwingTradeRecommendation;
        } catch (error) {
          console.error(`Error fetching price for ${rec.symbol}:`, error);
          return null;
        }
      })
    );
    
    // Filter out null results (where we couldn't get prices)
    return recommendationsWithPrices.filter((rec): rec is SwingTradeRecommendation => rec !== null);
  } catch (error) {
    console.error('Error analyzing swing trades:', error);
    return [];
  }
}
