import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, integer, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Replit Auth: Session storage table (required for authentication)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Replit Auth: User storage table (updated for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stocks = pgTable("stocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: text("symbol").notNull(),
  quantity: integer("quantity").notNull(),
  buyPrice: decimal("buy_price", { precision: 10, scale: 2 }).notNull(),
  targetSellPrice: decimal("target_sell_price", { precision: 10, scale: 2 }),
  targetBuyPrice: decimal("target_buy_price", { precision: 10, scale: 2 }),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }),
  aiAction: text("ai_action"),
  aiReason: text("ai_reason"),
  aiTargetPrice: decimal("ai_target_price", { precision: 10, scale: 2 }),
  lastPriceUpdate: timestamp("last_price_update"),
  lastAiAnalysis: timestamp("last_ai_analysis"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  stockId: varchar("stock_id").notNull().references(() => stocks.id, { onDelete: 'cascade' }),
  symbol: text("symbol").notNull(),
  message: text("message").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }).notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(),
  isRead: integer("is_read").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const options = pgTable("options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  underlyingSymbol: text("underlying_symbol").notNull(),
  optionType: text("option_type").notNull(), // 'call' or 'put'
  strikePrice: decimal("strike_price", { precision: 10, scale: 2 }).notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  quantity: integer("quantity").notNull(),
  premium: decimal("premium", { precision: 10, scale: 2 }).notNull(), // Price paid per option
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }),
  strategy: text("strategy"), // protective_put, covered_call, collar, straddle, iron_condor, etc.
  linkedStockId: varchar("linked_stock_id").references(() => stocks.id, { onDelete: 'set null' }),
  aiRecommendation: text("ai_recommendation"),
  aiReason: text("ai_reason"),
  lastPriceUpdate: timestamp("last_price_update"),
  lastAiAnalysis: timestamp("last_ai_analysis"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStockSchema = createInsertSchema(stocks).omit({
  id: true,
  userId: true,
  currentPrice: true,
  aiAction: true,
  aiReason: true,
  aiTargetPrice: true,
  lastPriceUpdate: true,
  lastAiAnalysis: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertOptionSchema = createInsertSchema(options).omit({
  id: true,
  userId: true,
  currentPrice: true,
  aiRecommendation: true,
  aiReason: true,
  lastPriceUpdate: true,
  lastAiAnalysis: true,
  createdAt: true,
}).extend({
  optionType: z.enum(['call', 'put']),
  expiryDate: z.coerce.date(),
  strategy: z.enum([
    'protective_put',
    'covered_call',
    'collar',
    'straddle',
    'strangle',
    'iron_condor',
    'bull_call_spread',
    'bear_put_spread',
    'standalone'
  ]).optional(),
});

// Replit Auth: User types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertStock = z.infer<typeof insertStockSchema>;
export type InsertStockWithUserId = InsertStock & { userId: string };
export type Stock = typeof stocks.$inferSelect;

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type InsertAlertWithUserId = InsertAlert & { userId: string };
export type Alert = typeof alerts.$inferSelect;

export type InsertOption = z.infer<typeof insertOptionSchema>;
export type InsertOptionWithUserId = InsertOption & { userId: string };
export type Option = typeof options.$inferSelect;
