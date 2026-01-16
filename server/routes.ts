import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStockSchema, insertOptionSchema, type Stock } from "@shared/schema";
import { getStockPrice, getMultipleStockPrices } from "./services/stockPrice";
import { analyzePortfolio } from "./services/aiAnalysis";
import { createAlertsForStocks } from "./services/alertService";
import { analyzeSwingTrades } from "./services/swingTradeAnalysis";
import { analyzeMultibaggers } from "./services/multibaggerAnalysis";
import { analyzeOptionsHedging, analyzeIndividualOption } from "./services/optionsHedgingAnalysis";
import { generateOptionsRecommendations } from "./services/optionsRecommendations";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Replit Auth: Setup authentication
  await setupAuth(app);

  // Replit Auth: Get authenticated user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Protected: Get user's stocks
  app.get("/api/stocks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stocks = await storage.getStocksByUserId(userId);
      res.json(stocks);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      res.status(500).json({ error: "Failed to fetch stocks" });
    }
  });

  // Protected: Create stock
  app.post("/api/stocks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertStockSchema.parse(req.body);
      const stock = await storage.createStock({
        ...validatedData,
        userId,
      });

      const quote = await getStockPrice(stock.symbol);
      if (quote) {
        const updatedStock = await storage.updateStock(stock.id, {
          currentPrice: quote.price.toString(),
          lastPriceUpdate: new Date(),
        });
        return res.json(updatedStock);
      }

      res.json(stock);
    } catch (error) {
      console.error("Error creating stock:", error);
      res.status(500).json({ error: "Failed to create stock" });
    }
  });

  // Protected: Update stock (with ownership verification)
  app.patch("/api/stocks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const updates = req.body;

      // Verify ownership before updating
      const existingStock = await storage.getStockById(id);
      if (!existingStock) {
        return res.status(404).json({ error: "Stock not found" });
      }
      if (existingStock.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You don't own this stock" });
      }

      const stock = await storage.updateStock(id, updates);
      res.json(stock);
    } catch (error) {
      console.error("Error updating stock:", error);
      res.status(500).json({ error: "Failed to update stock" });
    }
  });

  // Protected: Delete stock (with ownership verification)
  app.delete("/api/stocks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      // Verify ownership before deleting
      const existingStock = await storage.getStockById(id);
      if (!existingStock) {
        return res.status(404).json({ error: "Stock not found" });
      }
      if (existingStock.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You don't own this stock" });
      }

      const success = await storage.deleteStock(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting stock:", error);
      res.status(500).json({ error: "Failed to delete stock" });
    }
  });

  // Public: Get stock price (intentionally public for price checking before adding stocks)
  app.get("/api/stocks/price/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const quote = await getStockPrice(symbol);
      
      if (!quote) {
        return res.status(404).json({ error: "Stock price not found" });
      }

      res.json(quote);
    } catch (error) {
      console.error("Error fetching stock price:", error);
      res.status(500).json({ error: "Failed to fetch stock price" });
    }
  });

  // Protected: Refresh portfolio prices
  app.post("/api/portfolio/refresh", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stocks = await storage.getStocksByUserId(userId);
      
      const symbols = stocks.map(s => s.symbol);
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
      res.json(updatedStocks);
    } catch (error) {
      console.error("Error refreshing portfolio:", error);
      res.status(500).json({ error: "Failed to refresh portfolio" });
    }
  });

  // Protected: Analyze portfolio with AI
  app.post("/api/portfolio/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stocks = await storage.getStocksByUserId(userId);
      
      if (!stocks.length) {
        return res.json({ message: "No stocks to analyze" });
      }

      const symbols = stocks.map(s => s.symbol);
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

      await createAlertsForStocks(await storage.getStocksByUserId(userId));

      const finalStocks = await storage.getStocksByUserId(userId);
      res.json({ stocks: finalStocks, recommendations });
    } catch (error) {
      console.error("Error analyzing portfolio:", error);
      res.status(500).json({ error: "Failed to analyze portfolio" });
    }
  });

  // Protected: Get user's alerts
  app.get("/api/alerts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getAlertsByUserId(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Protected: Mark alert as read (with ownership verification)
  app.patch("/api/alerts/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      // Verify ownership before marking as read
      const existingAlert = await storage.getAlertById(id);
      if (!existingAlert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      if (existingAlert.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You don't own this alert" });
      }

      const success = await storage.markAlertAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ error: "Failed to mark alert as read" });
    }
  });

  // Protected: Analyze swing trades
  app.post("/api/analysis/swing-trades", isAuthenticated, async (req, res) => {
    try {
      const marketCap = req.body.marketCap;
      const recommendations = await analyzeSwingTrades(marketCap);

      res.json({ recommendations });
    } catch (error) {
      console.error("Error analyzing swing trades:", error);
      res.status(500).json({ error: "Failed to analyze swing trades" });
    }
  });

  // Protected: Analyze multibaggers
  app.post("/api/analysis/multibaggers", isAuthenticated, async (req, res) => {
    try {
      const marketCap = req.body.marketCap;
      const recommendations = await analyzeMultibaggers(marketCap);

      res.json({ recommendations });
    } catch (error) {
      console.error("Error analyzing multibaggers:", error);
      res.status(500).json({ error: "Failed to analyze multibaggers" });
    }
  });

  // Protected: Get user's options
  app.get("/api/options", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const options = await storage.getOptionsByUserId(userId);
      res.json(options);
    } catch (error) {
      console.error("Error fetching options:", error);
      res.status(500).json({ error: "Failed to fetch options" });
    }
  });

  // Protected: Create option
  app.post("/api/options", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertOptionSchema.parse(req.body);
      const option = await storage.createOption({
        ...validatedData,
        userId,
      });

      res.json(option);
    } catch (error) {
      console.error("Error creating option:", error);
      res.status(500).json({ error: "Failed to create option" });
    }
  });

  // Protected: Update option (with ownership verification)
  app.patch("/api/options/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const updates = req.body;

      // Verify ownership before updating
      const existingOption = await storage.getOptionById(id);
      if (!existingOption) {
        return res.status(404).json({ error: "Option not found" });
      }
      if (existingOption.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You don't own this option" });
      }

      const option = await storage.updateOption(id, updates);
      res.json(option);
    } catch (error) {
      console.error("Error updating option:", error);
      res.status(500).json({ error: "Failed to update option" });
    }
  });

  // Protected: Delete option (with ownership verification)
  app.delete("/api/options/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      // Verify ownership before deleting
      const existingOption = await storage.getOptionById(id);
      if (!existingOption) {
        return res.status(404).json({ error: "Option not found" });
      }
      if (existingOption.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You don't own this option" });
      }

      await storage.deleteOption(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting option:", error);
      res.status(500).json({ error: "Failed to delete option" });
    }
  });

  // Protected: Analyze options hedging strategies
  app.post("/api/options/analyze-hedging", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stocks = await storage.getStocksByUserId(userId);
      const existingOptions = await storage.getOptionsByUserId(userId);

      const analyses = await analyzeOptionsHedging(stocks, existingOptions);
      res.json({ analyses });
    } catch (error) {
      console.error("Error analyzing options hedging:", error);
      res.status(500).json({ error: "Failed to analyze options hedging" });
    }
  });

  // Protected: Analyze individual option
  app.post("/api/options/:id/analyze", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      // Verify ownership
      const option = await storage.getOptionById(id);
      if (!option) {
        return res.status(404).json({ error: "Option not found" });
      }
      if (option.userId !== userId) {
        return res.status(403).json({ error: "Forbidden: You don't own this option" });
      }

      // Get related stock if exists
      const stocks = await storage.getStocksByUserId(userId);
      const relatedStock = stocks.find(s => s.symbol === option.underlyingSymbol);

      const analysis = await analyzeIndividualOption(option, relatedStock);
      
      // Update option with AI analysis
      await storage.updateOption(id, {
        aiRecommendation: analysis.recommendation,
        aiReason: analysis.reason,
        lastAiAnalysis: new Date(),
      });

      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing individual option:", error);
      res.status(500).json({ error: "Failed to analyze individual option" });
    }
  });

  // Protected: Get AI options recommendations
  app.get("/api/options/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const budget = req.query.budget ? parseInt(req.query.budget as string) : undefined;
      const riskTolerance = req.query.riskTolerance as 'conservative' | 'moderate' | 'aggressive' | undefined;
      const strategyPreference = req.query.strategyPreference as string | undefined;

      const recommendations = await generateOptionsRecommendations(
        budget,
        riskTolerance,
        strategyPreference
      );

      res.json({ recommendations });
    } catch (error) {
      console.error("Error generating options recommendations:", error);
      res.status(500).json({ error: "Failed to generate options recommendations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
