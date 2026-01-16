import OpenAI from 'openai';
import type { Stock } from '@shared/schema';

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface AIRecommendation {
  symbol: string;
  action: 'Buy' | 'Sell' | 'Hold';
  targetPrice: number;
  reason: string;
}

export async function analyzePortfolio(stocks: Stock[]): Promise<AIRecommendation[]> {
  if (!stocks.length) {
    return [];
  }

  const portfolioData = stocks.map(stock => ({
    symbol: stock.symbol,
    quantity: stock.quantity,
    buyPrice: parseFloat(stock.buyPrice || '0'),
    currentPrice: parseFloat(stock.currentPrice || '0'),
    profitLossPercent: stock.currentPrice 
      ? ((parseFloat(stock.currentPrice) - parseFloat(stock.buyPrice)) / parseFloat(stock.buyPrice)) * 100
      : 0,
  }));

  const prompt = `
Analyze this stock portfolio and provide trading recommendations:
${JSON.stringify(portfolioData, null, 2)}

For each stock, suggest whether to Buy, Sell, or Hold based on:
- Current profit/loss percentage
- General market principles (RSI concepts, moving averages, market sentiment)
- Risk management

Provide a JSON array with this exact structure:
[
  {
    "symbol": "STOCK_SYMBOL",
    "action": "Buy|Sell|Hold",
    "targetPrice": <number>,
    "reason": "<brief explanation>"
  }
]

Keep reasons concise (under 50 characters). Be conservative with recommendations.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a financial analysis AI. Always respond with valid JSON only, no additional text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('No content in AI response');
      return [];
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response:', content);
      return [];
    }

    const recommendations: AIRecommendation[] = JSON.parse(jsonMatch[0]);
    return recommendations;
  } catch (error) {
    console.error('Error analyzing portfolio with AI:', error);
    return [];
  }
}
