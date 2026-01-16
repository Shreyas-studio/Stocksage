import { type User, type UpsertUser, type Stock, type InsertStockWithUserId, type Alert, type InsertAlertWithUserId, type Option, type InsertOptionWithUserId } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Replit Auth: Required user operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUserIds(): Promise<string[]>;
  
  getStocksByUserId(userId: string): Promise<Stock[]>;
  getStockById(id: string): Promise<Stock | undefined>;
  createStock(stock: InsertStockWithUserId): Promise<Stock>;
  updateStock(id: string, updates: Partial<Stock>): Promise<Stock | undefined>;
  deleteStock(id: string): Promise<boolean>;
  
  getAlertsByUserId(userId: string): Promise<Alert[]>;
  getAlertById(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlertWithUserId): Promise<Alert>;
  markAlertAsRead(id: string): Promise<boolean>;
  getRecentAlert(userId: string, stockId: string, type: string): Promise<Alert | undefined>;

  getOptionsByUserId(userId: string): Promise<Option[]>;
  getOptionById(id: string): Promise<Option | undefined>;
  createOption(option: InsertOptionWithUserId): Promise<Option>;
  updateOption(id: string, updates: Partial<Option>): Promise<Option | undefined>;
  deleteOption(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private stocks: Map<string, Stock>;
  private alerts: Map<string, Alert>;
  private options: Map<string, Option>;

  constructor() {
    this.users = new Map();
    this.stocks = new Map();
    this.alerts = new Map();
    this.options = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  // Replit Auth: Upsert user (create or update)
  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = userData.id ? this.users.get(userData.id) : undefined;
    
    const user: User = {
      id: userData.id || randomUUID(),
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(user.id, user);
    return user;
  }

  async getAllUserIds(): Promise<string[]> {
    const userIds = new Set<string>();
    const stocksArray = Array.from(this.stocks.values());
    for (const stock of stocksArray) {
      userIds.add(stock.userId);
    }
    return Array.from(userIds);
  }

  async getStocksByUserId(userId: string): Promise<Stock[]> {
    return Array.from(this.stocks.values()).filter(
      (stock) => stock.userId === userId,
    );
  }

  async getStockById(id: string): Promise<Stock | undefined> {
    return this.stocks.get(id);
  }

  async createStock(insertStock: InsertStockWithUserId): Promise<Stock> {
    const id = randomUUID();
    const stock: Stock = {
      symbol: insertStock.symbol,
      quantity: insertStock.quantity,
      buyPrice: insertStock.buyPrice,
      targetSellPrice: insertStock.targetSellPrice ?? null,
      targetBuyPrice: insertStock.targetBuyPrice ?? null,
      userId: insertStock.userId,
      id,
      currentPrice: null,
      aiAction: null,
      aiReason: null,
      aiTargetPrice: null,
      lastPriceUpdate: null,
      lastAiAnalysis: null,
      createdAt: new Date(),
    };
    this.stocks.set(id, stock);
    return stock;
  }

  async updateStock(id: string, updates: Partial<Stock>): Promise<Stock | undefined> {
    const stock = this.stocks.get(id);
    if (!stock) return undefined;
    
    const updatedStock = { ...stock, ...updates };
    this.stocks.set(id, updatedStock);
    return updatedStock;
  }

  async deleteStock(id: string): Promise<boolean> {
    return this.stocks.delete(id);
  }

  async getAlertsByUserId(userId: string): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter((alert) => alert.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getAlertById(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlertWithUserId): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = {
      ...insertAlert,
      id,
      isRead: 0,
      createdAt: new Date(),
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async markAlertAsRead(id: string): Promise<boolean> {
    const alert = this.alerts.get(id);
    if (!alert) return false;
    
    alert.isRead = 1;
    this.alerts.set(id, alert);
    return true;
  }

  async getRecentAlert(userId: string, stockId: string, type: string): Promise<Alert | undefined> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    return Array.from(this.alerts.values()).find(
      (alert) => 
        alert.userId === userId && 
        alert.stockId === stockId && 
        alert.type === type &&
        alert.createdAt && 
        alert.createdAt > oneHourAgo
    );
  }

  async getOptionsByUserId(userId: string): Promise<Option[]> {
    return Array.from(this.options.values())
      .filter((option) => option.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async getOptionById(id: string): Promise<Option | undefined> {
    return this.options.get(id);
  }

  async createOption(insertOption: InsertOptionWithUserId): Promise<Option> {
    const id = randomUUID();
    const option: Option = {
      ...insertOption,
      id,
      strategy: insertOption.strategy ?? null,
      linkedStockId: insertOption.linkedStockId ?? null,
      currentPrice: null,
      aiRecommendation: null,
      aiReason: null,
      lastPriceUpdate: null,
      lastAiAnalysis: null,
      createdAt: new Date(),
    };
    this.options.set(id, option);
    return option;
  }

  async updateOption(id: string, updates: Partial<Option>): Promise<Option | undefined> {
    const option = this.options.get(id);
    if (!option) return undefined;
    
    const updatedOption = { ...option, ...updates };
    this.options.set(id, updatedOption);
    return updatedOption;
  }

  async deleteOption(id: string): Promise<boolean> {
    return this.options.delete(id);
  }
}

export const storage = new MemStorage();
