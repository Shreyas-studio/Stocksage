# Design Guidelines: AI-Powered Stock Portfolio Tracker

## Design Approach
**Selected Approach:** Design System + Fintech Reference Hybrid

**Justification:** This is a data-intensive financial application where clarity, trust, and efficiency are paramount. Drawing inspiration from modern fintech platforms (Robinhood's clarity, Webull's data density, Bloomberg's professionalism) while maintaining systematic design principles for consistency.

**Key Design Principles:**
- Data clarity above all else - every number must be instantly readable
- Visual hierarchy that prioritizes critical information (prices, P/L, AI recommendations)
- Professional, trustworthy aesthetic appropriate for financial decisions
- Efficient use of space to display maximum information without clutter
- Clear status communication through color coding and visual indicators

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background: `222 10% 10%` (deep charcoal)
- Surface: `222 10% 14%` (elevated panels)
- Surface Hover: `222 10% 18%` (interactive states)
- Border: `222 10% 25%` (subtle separators)
- Text Primary: `222 5% 95%` (high contrast)
- Text Secondary: `222 5% 65%` (muted)

**Financial Status Colors:**
- Profit/Positive: `142 76% 36%` (green - buy indicators)
- Loss/Negative: `0 72% 51%` (red - sell indicators)
- Neutral/Hold: `48 96% 53%` (amber - caution/hold)
- AI Recommendation: `217 91% 60%` (blue - system suggestions)

**Light Mode:**
- Background: `0 0% 100%`
- Surface: `222 10% 98%`
- Border: `222 10% 90%`
- Text Primary: `222 10% 10%`

### B. Typography

**Font Stack:**
- Primary: 'Inter' (via Google Fonts) - excellent for financial data, clean numbers
- Monospace: 'JetBrains Mono' (for stock symbols, precise numerical data)

**Scale & Usage:**
- Display (Stock Symbols): 24px, font-weight: 600, font-family: JetBrains Mono
- Heading (Section Titles): 20px, font-weight: 600
- Body (Primary Data): 16px, font-weight: 500
- Label (Secondary Info): 14px, font-weight: 400
- Caption (Timestamps, Meta): 12px, font-weight: 400
- Numbers (Prices, P/L): 18px, font-weight: 600, tabular-nums

### C. Layout System

**Spacing Primitives (Tailwind):**
- Core spacing units: 2, 4, 6, 8, 12, 16
- Component padding: p-6 (cards), p-8 (main content areas)
- Section margins: my-8 (between major sections)
- Grid gaps: gap-4 (tight), gap-6 (standard), gap-8 (generous)

**Container Strategy:**
- Max width: max-w-7xl (dashboard container)
- Responsive grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 (for stock cards)
- Full-width tables with horizontal scroll on mobile

### D. Component Library

**Navigation:**
- Top bar: Fixed header with logo, user profile, total portfolio value
- Main nav: Icon + label format, active state with accent border-l-2
- Quick actions: Floating action button (bottom-right) for "Add Stock"

**Data Display:**
- Stock Cards: Elevated surface with symbol, current price, P/L percentage, AI badge
- Data Tables: Striped rows for readability, sticky header, sortable columns
- Price Display: Large, bold numbers with small +/- indicator and percentage in colored pill
- AI Recommendation Badge: Colored pill (green=Buy, red=Sell, amber=Hold) with icon

**Forms & Inputs:**
- Stock Entry Form: Two-column layout (symbol + quantity, prices + targets)
- Input fields: Dark background with subtle border, focus state with blue accent
- Validation: Inline error messages below fields in red
- Submit buttons: Full-width on mobile, auto-width on desktop

**Charts & Analytics:**
- Portfolio Chart: Line chart (Recharts) with gradient fill, tooltips showing exact values
- P/L Indicator: Large percentage with trend arrow and sparkline
- Summary Cards: 3-column grid showing Total Value, Total P/L, Active Alerts

**Alerts & Notifications:**
- Toast notifications: Top-right corner, 5-second auto-dismiss
- Alert cards: Left border accent based on urgency (red=urgent, blue=info)
- Alert list: Scrollable panel with timestamp, stock symbol, action required

**Status Indicators:**
- AI Analysis Status: Pill showing "Analyzing...", "Last updated: 5m ago"
- Live Price Indicator: Pulsing green dot next to "Live" label
- Connection Status: Small icon in header showing API connection health

### E. Dashboard Layout Structure

**Header Section:**
- Logo + app name on left
- Total portfolio value (large, center-prominent)
- User avatar + settings on right

**Main Content (3-section layout):**
1. **Portfolio Overview** (top): Summary cards in 3-column grid showing key metrics
2. **AI Recommendations** (middle-left, 60% width): Scrollable list of stock cards with AI suggestions
3. **Analytics Panel** (middle-right, 40% width): Portfolio performance chart + recent alerts

**Stock Cards:**
Each card displays: Stock symbol (mono font), current price (large), buy price (small), P/L (colored percentage), AI recommendation badge, quantity owned, action buttons (Edit/Remove)

### F. Interactions & Micro-animations

**Minimal Animations (Performance-First):**
- Card hover: Subtle elevation change (shadow-md to shadow-lg)
- Button states: Color transition on hover (200ms ease)
- Price updates: Gentle flash animation (green/red) when value changes
- Loading states: Skeleton screens for data tables, spinner for AI analysis

**No Animations For:**
- Page transitions
- Stock price changes (use color coding only)
- Alert appearances (instant display)

---

## Images
No hero images required - this is a data-focused dashboard application.

**Icon Usage:**
- Use Heroicons (outline style) for all UI icons via CDN
- Stock icons: TrendingUp, TrendingDown, MinusCircle for recommendations
- Action icons: PlusCircle, Pencil, Trash for CRUD operations
- Status icons: CheckCircle, ExclamationTriangle, InformationCircle

---

## Accessibility & Quality

- Maintain WCAG AAA contrast ratios for all financial data
- All P/L indicators use both color AND icons/text for clarity
- Tables include screen-reader-only labels for numerical data
- Forms have explicit labels and error messaging
- Keyboard navigation fully supported with visible focus indicators
- Price alerts include both visual and text notifications