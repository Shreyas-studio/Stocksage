interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export async function getStockPrice(symbol: string): Promise<StockQuote | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    );
    
    if (!response.ok) {
      console.error(`Failed to fetch price for ${symbol}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      console.error(`No data found for ${symbol}`);
      return null;
    }

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    
    if (!currentPrice) {
      console.error(`No current price for ${symbol}`);
      return null;
    }

    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      symbol,
      price: currentPrice,
      change,
      changePercent,
    };
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

export async function getMultipleStockPrices(symbols: string[]): Promise<Map<string, StockQuote>> {
  const priceMap = new Map<string, StockQuote>();
  
  const promises = symbols.map(async (symbol) => {
    const quote = await getStockPrice(symbol);
    if (quote) {
      priceMap.set(symbol, quote);
    }
  });

  await Promise.all(promises);
  return priceMap;
}
