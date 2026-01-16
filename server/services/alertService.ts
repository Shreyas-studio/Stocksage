import type { Stock } from '@shared/schema';
import { storage } from '../storage';

interface AlertCheck {
  shouldAlert: boolean;
  message: string;
  type: 'buy' | 'sell' | 'info';
}

export function checkPriceAlert(stock: Stock): AlertCheck {
  if (!stock.currentPrice) {
    return { shouldAlert: false, message: '', type: 'info' };
  }

  const currentPrice = parseFloat(stock.currentPrice);
  const aiTarget = stock.aiTargetPrice ? parseFloat(stock.aiTargetPrice) : null;
  const targetSell = stock.targetSellPrice ? parseFloat(stock.targetSellPrice) : null;
  const targetBuy = stock.targetBuyPrice ? parseFloat(stock.targetBuyPrice) : null;

  const threshold = 0.005;

  if (aiTarget && stock.aiAction) {
    const diff = Math.abs(currentPrice - aiTarget) / aiTarget;
    if (diff <= threshold) {
      const action = stock.aiAction === 'Sell' ? 'sell' : stock.aiAction === 'Buy' ? 'buy' : 'info';
      return {
        shouldAlert: true,
        message: `Stock is near ₹${aiTarget.toLocaleString()} (${stock.aiAction} Target). AI Suggests: ${stock.aiReason || 'Review position'}`,
        type: action,
      };
    }
  }

  if (targetSell) {
    const diff = Math.abs(currentPrice - targetSell) / targetSell;
    if (diff <= threshold) {
      return {
        shouldAlert: true,
        message: `Stock approaching your sell target of ₹${targetSell.toLocaleString()}. Consider taking profits.`,
        type: 'sell',
      };
    }
  }

  if (targetBuy) {
    const diff = Math.abs(currentPrice - targetBuy) / targetBuy;
    if (diff <= threshold) {
      return {
        shouldAlert: true,
        message: `Stock approaching your buy target of ₹${targetBuy.toLocaleString()}. Consider adding to position.`,
        type: 'buy',
      };
    }
  }

  return { shouldAlert: false, message: '', type: 'info' };
}

export async function createAlertsForStocks(stocks: Stock[]): Promise<void> {
  for (const stock of stocks) {
    const alertCheck = checkPriceAlert(stock);
    
    if (alertCheck.shouldAlert && stock.currentPrice) {
      const recentAlert = await storage.getRecentAlert(
        stock.userId, 
        stock.id, 
        alertCheck.type
      );
      
      if (!recentAlert) {
        await storage.createAlert({
          userId: stock.userId,
          stockId: stock.id,
          symbol: stock.symbol,
          message: alertCheck.message,
          targetPrice: stock.aiTargetPrice || stock.targetSellPrice || stock.targetBuyPrice || '0',
          currentPrice: stock.currentPrice,
          type: alertCheck.type,
          isRead: 0,
        });
      }
    }
  }
}
