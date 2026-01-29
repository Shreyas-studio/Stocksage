interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

/** Request timeout in ms (Yahoo can be slow or block data-center IPs). */
const FETCH_TIMEOUT_MS = 18_000;
/** Max concurrent price requests to avoid connection timeouts / rate limits. */
const MAX_CONCURRENT_PRICES = 3;
/** Delay between batches of concurrent requests (ms). */
const BATCH_DELAY_MS = 600;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = FETCH_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: { ...YAHOO_HEADERS, ...(fetchOptions.headers as Record<string, string>) },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function getStockPrice(symbol: string, retries = 1): Promise<StockQuote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, { timeout: FETCH_TIMEOUT_MS });
      if (!response.ok) {
        if (attempt < retries) {
          await delay(1000);
          continue;
        }
        console.error(`Failed to fetch price for ${symbol}: ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      const result = data.chart?.result?.[0];
      if (!result) {
        if (attempt < retries) {
          await delay(1000);
          continue;
        }
        console.error(`No data found for ${symbol}`);
        return null;
      }

      const meta = result.meta;
      const currentPrice = meta.regularMarketPrice;
      const previousClose = meta.previousClose ?? currentPrice;
      if (currentPrice == null || currentPrice <= 0) {
        if (attempt < retries) {
          await delay(1000);
          continue;
        }
        console.error(`No current price for ${symbol}`);
        return null;
      }

      const change = previousClose ? currentPrice - previousClose : 0;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;

      return {
        symbol,
        price: currentPrice,
        change,
        changePercent,
      };
    } catch (error: unknown) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      if (attempt < retries) {
        await delay(1500);
        continue;
      }
      console.error(
        `Error fetching price for ${symbol}${isAbort ? " (timeout)" : ""}:`,
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
  return null;
}

/**
 * Fetch prices for multiple symbols with throttled concurrency to avoid
 * ETIMEDOUT / rate limits when running from cloud (e.g. Railway).
 */
export async function getMultipleStockPrices(symbols: string[]): Promise<Map<string, StockQuote>> {
  const priceMap = new Map<string, StockQuote>();
  const concurrency = MAX_CONCURRENT_PRICES;

  for (let i = 0; i < symbols.length; i += concurrency) {
    const chunk = symbols.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map(async (symbol) => {
        const quote = await getStockPrice(symbol);
        return { symbol, quote } as const;
      })
    );
    for (const { symbol, quote } of results) {
      if (quote) priceMap.set(symbol, quote);
    }
    if (i + concurrency < symbols.length) {
      await delay(BATCH_DELAY_MS);
    }
  }
  return priceMap;
}
