# AI Stock Portfolio Tracker

## Overview

An AI-powered stock portfolio tracking application designed to monitor real-time stock prices, provide automated buy/sell/hold recommendations using OpenAI's GPT models, and send alerts for target prices. The system aims to empower users with AI-driven insights and automated monitoring for informed trading decisions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React with TypeScript (Vite)
**UI:** shadcn/ui, Radix UI, Tailwind CSS, custom fintech-inspired design tokens, dark/light theme support, Inter and JetBrains Mono fonts.
**State Management:** React Query for server state, React hooks for local state.
**Routing:** Wouter.
**Key Design Decisions:** Single-page dashboard, component-based, TypeScript for type safety, mock user system for development.

### Backend Architecture

**Runtime:** Node.js with Express.js.
**API:** RESTful endpoints for stocks, alerts, options, and AI analysis (`/api/stocks`, `/api/alerts`, `/api/options`, `/api/options/recommendations`, `/api/analyze`).
**Scheduled Tasks:** Node-cron for 5-minute price updates and AI analysis, alert generation based on price thresholds.
**Data Storage:** In-memory storage (MemStorage) with a defined Drizzle ORM schema for future PostgreSQL migration.
**Service Layer:** Stock Price Service (Yahoo Finance), AI Analysis Service (OpenAI), Options AI Recommendations Service, Options Hedging Analysis Service, Alert Service.

### Database Schema

**Tables:** Users, Stocks, Alerts, Options.
**Relationships:** Foreign keys linking stocks, alerts, and options to users.
**Fields:**
- **Users:** id, email, password, name.
- **Stocks:** id, userId, symbol, quantity, buyPrice, currentPrice, targetSellPrice, targetBuyPrice, aiAction, aiReason, aiTargetPrice, timestamps.
- **Alerts:** id, userId, stockId, message, targetPrice, currentPrice, type, isRead, createdAt.
- **Options:** id, userId, underlyingSymbol, optionType, strikePrice, premium, quantity, expiryDate, currentPrice, strategy, aiRecommendation, aiReason, timestamps.
**Design Rationale:** UUIDs for primary keys, cascade deletes, separate AI fields, alert type support, options strategy tracking.

### UI/UX Decisions

- **Color Palette:** Custom financial status colors (profit green, loss red, neutral amber, AI recommendation blue).
- **Typography:** Inter for UI text, JetBrains Mono for financial data.
- **Theming:** Dual theme (dark/light) with CSS variables.
- **Design Inspiration:** Fintech platforms like Robinhood and Webull.

### Feature Specifications

- Real-time stock price tracking.
- AI-powered buy/sell/hold recommendations.
- Automated price alerts.
- Portfolio performance analytics.
- **Options Trading:** Comprehensive options portfolio management with real-time P/L tracking, AI-powered hedging strategies, and position analytics.
- **AI Options Recommendations:** Proactive AI-generated options trade suggestions with personalized stock picks, multi-leg spread strategies, and risk/return analysis based on budget and risk tolerance preferences. Features:
  - **Multi-Leg Strategies**: Bear Put Spread, Bull Call Spread, Collar, Iron Condor with Buy/Sell legs displayed in table format
  - **Hedging Filter**: Dedicated filter for protective strategies (Protective Put, Collar, Bear Put Spread)
  - **Income Strategies**: Covered Call, Iron Condor for premium collection
  - **Volatility Plays**: Straddle, Strangle for event-driven opportunities
  - **Net Cost Calculation**: Displays total strategy cost including premiums received/paid
- **Swing Trade Analysis:** AI-powered analysis for high-volatility Indian stocks (NSE/BSE) for short-term opportunities.
- **Multibagger Recommendations:** AI-driven identification of high-growth potential Indian stocks for long-term holds.

## External Dependencies

**Stock Market Data:**
- **Yahoo Finance API:** Real-time stock price quotes.

**AI Services:**
- **OpenAI API:** GPT models for portfolio analysis, integrated via Replit AI Integrations.

**Database (Future Integration):**
- **Neon PostgreSQL:** Serverless PostgreSQL.
- **Drizzle ORM:** Type-safe database queries.

**Development Tools:**
- **Vite:** Build tool.
- **TypeScript:** Type safety.
- **ESBuild:** Backend bundler.

**UI Libraries:**
- **Radix UI:** Accessible component primitives.
- **Recharts:** Data visualization.
- **date-fns:** Date manipulation.
- **Lucide React:** Icon system.

**Authentication & Session Management:**
- **Replit Auth:** OpenID Connect (OIDC) with Google/GitHub/email login.
- **express-session:** Session management.
- **connect-pg-simple:** PostgreSQL session store.