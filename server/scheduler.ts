import cron from 'node-cron';
import { storage } from './storage';
import { getMultipleStockPrices } from './services/stockPrice';
import { analyzePortfolio } from './services/aiAnalysis';
import { createAlertsForStocks } from './services/alertService';

let isRunning = false;

async function runScheduledAnalysis() {
  if (isRunning) {
    console.log('Analysis already running, skipping...');
    return;
  }

  isRunning = true;
  console.log(`[${new Date().toISOString()}] Starting scheduled portfolio analysis...`);

  try {
    const userIds = await storage.getAllUserIds();
    
    if (userIds.length === 0) {
      console.log('No users with stocks to analyze');
      isRunning = false;
      return;
    }

    console.log(`Analyzing portfolios for ${userIds.length} user(s)`);

    for (const userId of userIds) {
      try {
        const stocks = await storage.getStocksByUserId(userId);
        
        if (stocks.length === 0) {
          continue;
        }

        const symbols = stocks.map(s => s.symbol);
        console.log(`User ${userId}: Fetching prices for ${symbols.length} stocks`);
        
        const priceMap = await getMultipleStockPrices(symbols);

        for (const stock of stocks) {
          const quote = priceMap.get(stock.symbol);
          if (quote) {
            await storage.updateStock(stock.id, {
              currentPrice: quote.price.toString(),
              lastPriceUpdate: new Date(),
            });
          }
        }

        const updatedStocks = await storage.getStocksByUserId(userId);
        console.log(`User ${userId}: Running AI analysis...`);
        const recommendations = await analyzePortfolio(updatedStocks);

        for (const rec of recommendations) {
          const stock = updatedStocks.find(s => s.symbol === rec.symbol);
          if (stock) {
            await storage.updateStock(stock.id, {
              aiAction: rec.action,
              aiReason: rec.reason,
              aiTargetPrice: rec.targetPrice ? rec.targetPrice.toString() : null,
              lastAiAnalysis: new Date(),
            });
          }
        }

        console.log(`User ${userId}: Checking for price alerts...`);
        await createAlertsForStocks(await storage.getStocksByUserId(userId));
      } catch (userError) {
        console.error(`Error processing user ${userId}:`, userError);
      }
    }

    console.log(`[${new Date().toISOString()}] Scheduled analysis completed successfully`);
  } catch (error) {
    console.error('Error in scheduled analysis:', error);
  } finally {
    isRunning = false;
  }
}

export function startScheduler() {
  console.log('Starting portfolio monitoring scheduler (every 5 minutes)...');
  
  cron.schedule('*/5 * * * *', () => {
    runScheduledAnalysis();
  });

  runScheduledAnalysis();
}
