from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Literal
from datetime import datetime
from decimal import Decimal

class AssetCreate(BaseModel):
    type: Literal["crypto", "stocks", "real_estate"]
    symbol: str
    quantity: float
    purchase_price: float

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

class PortfolioSummary(BaseModel):
    total_value: float
    total_gain_loss: float
    gain_loss_percentage: float
    assets: List[AssetResponse]
    performance: PerformanceData
    allocation: AllocationData
    by_type: List[ByTypeEntry]

class PriceRefreshResponse(BaseModel):
    status: str
    prices_updated: int
    prices: Dict[str, float] = {}
    errors: List[str] = []