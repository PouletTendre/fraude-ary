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
  current_price: number;
  purchase_date: string;
  user_id: string;
  last_updated?: string;
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