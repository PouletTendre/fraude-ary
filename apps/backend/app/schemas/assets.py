from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Literal
from datetime import datetime
from decimal import Decimal

class AssetCreate(BaseModel):
    type: Literal["crypto", "stocks", "real_estate"]
    symbol: str
    quantity: float
    purchase_price: float
    name: Optional[str] = None
    purchase_date: Optional[str] = None
    currency: Optional[str] = "USD"

class AssetUpdate(BaseModel):
    quantity: Optional[float] = None
    purchase_price: Optional[float] = None

class AssetResponse(BaseModel):
    id: str
    user_email: str
    type: str
    symbol: str
    quantity: float
    purchase_price: float
    current_price: float
    total_value: float
    purchase_date: Optional[str] = None
    currency: str
    created_at: Optional[datetime] = None

class PriceHistoryResponse(BaseModel):
    id: str
    asset_id: str
    price: float
    timestamp: datetime

class PerformanceData(BaseModel):
    daily: float
    monthly: float
    yearly: float

class AllocationData(BaseModel):
    crypto: float
    stocks: float
    real_estate: float

class ByTypeEntry(BaseModel):
    type: str
    value: float
    percentage: float

class HistoryPoint(BaseModel):
    date: str
    value: float

class PortfolioSummary(BaseModel):
    total_value: float
    total_gain_loss: float
    gain_loss_percentage: float
    assets: List[AssetResponse]
    performance: PerformanceData
    allocation: AllocationData
    by_type: List[ByTypeEntry]
    history: List[HistoryPoint]

class PriceRefreshResponse(BaseModel):
    status: str
    prices_updated: int
    prices: Dict[str, float] = {}
    errors: List[str] = []

class OHLCData(BaseModel):
    open: float
    high: float
    low: float
    close: float
    timestamp: Optional[str] = None

class PriceHistoryEnrichedResponse(BaseModel):
    asset_id: str
    symbol: str
    current_price: float
    ohlc: Optional[OHLCData] = None
    history: List[Dict] = []

class PortfolioStatistics(BaseModel):
    best_asset: Optional[Dict] = None
    worst_asset: Optional[Dict] = None
    portfolio_volatility: float
    performance_vs_market: float
    total_return: float
    sharpe_ratio: Optional[float] = None

class AssetPerformance(BaseModel):
    symbol: str
    asset_type: str
    quantity: float
    purchase_price: float
    current_price: float
    return_amount: float
    return_percentage: float
    weight: float


class AssetImportResponse(BaseModel):
    status: str
    imported_count: int
    errors: List[str] = []


class BenchmarkResponse(BaseModel):
    portfolio_return: float
    benchmark_return: float
    alpha: float
    beta: float
    benchmark_symbol: str
    period: str