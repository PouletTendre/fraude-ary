export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface Asset {
  id: string;
  type: 'crypto' | 'stocks' | 'real_estate';
  symbol: string;
  quantity: number;
  purchase_price: number;
  purchase_price_eur?: number;
  current_price: number;
  purchase_date: string;
  user_id: string;
  currency: string;
  last_updated?: string;
}

export interface Transaction {
  id: string;
  user_email: string;
  asset_id?: string;
  type: "buy" | "sell";
  symbol: string;
  quantity: number;
  unit_price: number;
  currency: string;
  exchange_rate: number;
  fees: number;
  total_invested: number;
  date: string;
  created_at?: string;
  asset_type?: string;
}

export interface PortfolioSummary {
  total_value: number;
  total_gain_loss: number;
  gain_loss_percentage: number;
  by_type: {
    type: string;
    value: number;
    percentage: number;
  }[];
  history: {
    date: string;
    value: number;
    performance?: number;
  }[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface PriceAlert {
  id: string;
  user_id: string;
  symbol: string;
  target_price: number;
  condition: "above" | "below";
  is_active: boolean;
  currency?: string;
  created_at: string;
  triggered_at?: string | null;
}

export interface Dividend {
  id: string;
  user_email: string;
  symbol: string;
  amount_per_share: number;
  quantity: number;
  total_amount: number;
  currency: string;
  date: string;
  created_at?: string;
}

export interface DividendSummary {
  total_dividends: number;
  total_by_symbol: Record<string, number>;
  monthly_history: { month: string; amount: number }[];
  yield_on_cost: number;
  count: number;
}

export interface DiversificationEntry {
  label: string;
  value: number;
  percentage: number;
}

export interface DiversificationData {
  total_value: number;
  by_type: DiversificationEntry[];
  by_sector: DiversificationEntry[];
  by_country: DiversificationEntry[];
}

export interface SimulatorRequest {
  initial_capital: number;
  monthly_contribution: number;
  annual_return_rate: number;
  inflation_rate: number;
  years: number;
  dividend_yield: number;
}

export interface YearProjection {
  year: number;
  portfolio_value: number;
  portfolio_value_real: number;
  total_contributions: number;
  total_dividends: number;
  gains: number;
}

export interface SimulatorResponse {
  projections: YearProjection[];
  final_value: number;
  final_value_real: number;
  total_contributions: number;
  total_dividends: number;
  total_gains: number;
  years: number;
}

export interface TechnicalIndicators {
  symbol: string;
  rsi: number | null;
  macd: { macd_line: number; signal_line: number; histogram: number } | null;
  bollinger: { upper: number; middle: number; lower: number } | null;
  sma_20: number | null;
  sma_50: number | null;
  sma_200: number | null;
  ema_12: number | null;
  ema_26: number | null;
  atr: number | null;
  obv: number | null;
  stochastic: { stoch_k: number; stoch_d: number } | null;
  mfi: number | null;
}

export interface PortfolioAnalytics {
  total_value: number;
  daily_return: number | null;
  weekly_return: number | null;
  monthly_return: number | null;
  sharpe_ratio: number | null;
  sortino_ratio: number | null;
  max_drawdown: number | null;
  var_95: number | null;
  cvar_95: number | null;
  volatility_annual: number | null;
  beta: number | null;
  best_day: { date: string; return_pct: number } | null;
  worst_day: { date: string; return_pct: number } | null;
}

export interface NewsItem {
  title: string;
  link: string;
  published: string | null;
  source: string | null;
}

export interface ValuationMethod {
  method: string;
  intrinsic_value: number;
  margin_pct: number;
  label: string;
}

export interface ValuationScenario {
  bear: number;
  base: number;
  bull: number;
}

export interface ValuationResponse {
  symbol: string;
  market_price: number;
  currency: string;
  intrinsic_value: number;
  margin_pct: number;
  label: string;
  methods: ValuationMethod[];
  scenarios: ValuationScenario;
  financial_data: Record<string, unknown>;
  is_estimated: boolean;
}

export interface OHLCVPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OHLCVResponse {
  symbol: string;
  period: string;
  interval: string;
  data: OHLCVPoint[];
}