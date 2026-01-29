import OpenAI from 'openai';
import { getStockPrice } from './stockPrice';

const PRICE_CONCURRENCY = 3;
const PRICE_BATCH_DELAY_MS = 600;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPricesInBatches<T>(
  items: T[],
  getSymbol: (item: T) => string,
  buildResult: (item: T, price: number) => MultibaggerRecommendation | null
): Promise<MultibaggerRecommendation[]> {
  const out: MultibaggerRecommendation[] = [];
  for (let i = 0; i < items.length; i += PRICE_CONCURRENCY) {
    const chunk = items.slice(i, i + PRICE_CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (rec) => {
        const quote = await getStockPrice(getSymbol(rec));
        if (!quote || quote.price <= 0) {
          console.warn(`[MULTIBAGGER] No valid price for ${getSymbol(rec)}`);
          return null;
        }
        return buildResult(rec, quote.price);
      })
    );
    for (const r of chunkResults) if (r) out.push(r);
    if (i + PRICE_CONCURRENCY < items.length) await delay(PRICE_BATCH_DELAY_MS);
  }
  return out;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  ...(process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && {
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  }),
});

export interface MultibaggerRecommendation {
  symbol: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  targetPrice5Year: number;
  expectedReturn: string;
  growthDrivers: string[];
  risks: string[];
  investmentThesis: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export async function analyzeMultibaggers(marketCap?: string): Promise<MultibaggerRecommendation[]> {
  const marketCapFilter = marketCap || 'any market cap';
  
  const prompt = `You are a long-term value investor and growth stock analyst specializing in the INDIAN STOCK MARKET (NSE/BSE). Identify potential multibagger stocks (stocks that can return 3x-10x) for a 5-10 year investment horizon.

CRITICAL REQUIREMENTS:
- ONLY recommend stocks listed on NSE (National Stock Exchange) or BSE (Bombay Stock Exchange)
- Use ONLY Indian stock symbols with .NS suffix (for NSE) or .BO suffix (for BSE)
- Examples: RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS, TATAMOTORS.NS
- DO NOT recommend any US stocks (like NVDA, AAPL, TSLA, etc.)
- Focus on Indian companies operating primarily in India

Market cap preference: ${marketCapFilter}

Analyze Indian stocks based on:
1. Strong business fundamentals and competitive moats in Indian market
2. Growing addressable market within India and export opportunities
3. Innovative products/services with pricing power in Indian economy
4. Strong management team and execution track record
5. Financial health and cash flow generation (consider Indian financial reporting)
6. Reasonable valuation relative to growth potential

IMPORTANT: Instead of providing absolute target prices, provide a GROWTH MULTIPLE.
For example:
- If you expect 3x returns, set targetMultiple: 3
- If you expect 5x returns, set targetMultiple: 5
- If you expect 10x returns, set targetMultiple: 10

We will calculate the actual target price by multiplying current price × targetMultiple.

Return a JSON array with 12-15 top multibagger candidates from NSE/BSE (variety across budget ranges):
[
  {
    "symbol": "STOCK.NS or STOCK.BO",
    "companyName": "Company Name",
    "sector": "Technology" | "Banking" | "Finance" | "Pharma" | "Auto" | "FMCG" | "Energy" | "Telecom" | "Industrial" | "Other",
    "targetMultiple": 3.0,
    "expectedReturn": "3x-5x" or "5x-10x" or "10x+",
    "growthDrivers": ["driver 1", "driver 2", "driver 3"],
    "risks": ["risk 1", "risk 2"],
    "investmentThesis": "Comprehensive thesis explaining why this Indian stock can be a multibagger (max 150 words)",
    "confidenceLevel": "high" | "medium" | "low"
  }
]

IMPORTANT: Recommend diverse stocks across different price ranges (under ₹100, ₹100-500, ₹500-1000, ₹1000-5000, above ₹5000) so users have options in every budget.
Focus on quality Indian stocks with strong fundamentals and clear growth catalysts. Prioritize Indian blue-chips and emerging leaders.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a legendary value investor specializing in the Indian stock market (NSE/BSE). You have expertise in identifying long-term compounders and multibagger stocks from India. Always respond with valid JSON only. NEVER recommend US stocks - only Indian stocks with .NS or .BO suffix.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.error('No JSON array found in multibagger response:', content);
      return [];
    }
    
    interface AIMultibaggerResponse {
      symbol: string;
      companyName: string;
      sector: string;
      targetMultiple: number;
      expectedReturn: string;
      growthDrivers: string[];
      risks: string[];
      investmentThesis: string;
      confidenceLevel: 'high' | 'medium' | 'low';
    }
    
    const aiRecommendations: AIMultibaggerResponse[] = JSON.parse(jsonMatch[0]);
    
    // CRITICAL: Validate that all symbols are Indian stocks (NSE/BSE) before fetching prices
    const validatedRecommendations = aiRecommendations.filter((rec) => {
      const symbol = rec.symbol?.toUpperCase() || '';
      const isIndianStock = symbol.endsWith('.NS') || symbol.endsWith('.BO');
      
      if (!isIndianStock) {
        console.warn(`[MULTIBAGGER] Rejected non-Indian stock: ${rec.symbol} (${rec.companyName})`);
      }
      
      return isIndianStock;
    });
    
    if (validatedRecommendations.length === 0) {
      console.error('[MULTIBAGGER] No valid Indian stocks in AI recommendations');
      return [];
    }
    
    // Parse and validate growth multiple
    const parseMultiple = (value: unknown): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const cleaned = value.replace('x', '').trim();
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    // Fetch real-time prices in small batches to avoid ETIMEDOUT / rate limits
    const recommendationsWithPrices = await fetchPricesInBatches(
      validatedRecommendations,
      (rec) => rec.symbol,
      (rec, currentPrice) => {
        const multiple = parseMultiple(rec.targetMultiple);
        if (multiple < 2 || multiple > 20) {
          console.warn(`[MULTIBAGGER] Invalid growth multiple for ${rec.symbol}: ${multiple}x`);
          return null;
        }
        const targetPrice5Year = currentPrice * multiple;
        return {
          symbol: rec.symbol,
          companyName: rec.companyName,
          sector: rec.sector,
          currentPrice,
          targetPrice5Year,
          expectedReturn: rec.expectedReturn,
          growthDrivers: rec.growthDrivers,
          risks: rec.risks,
          investmentThesis: rec.investmentThesis,
          confidenceLevel: rec.confidenceLevel,
        } as MultibaggerRecommendation;
      }
    );

    return recommendationsWithPrices;
  } catch (error) {
    console.error('Error analyzing multibaggers:', error);
    return [];
  }
}
