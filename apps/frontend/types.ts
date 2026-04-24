export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
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
  created_at: string;
  triggered_at?: string | null;
}