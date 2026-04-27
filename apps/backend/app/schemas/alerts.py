from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class PriceAlertCreate(BaseModel):
    symbol: str
    target_price: float
    condition: Literal["above", "below"]
    currency: Optional[str] = "EUR"

class PriceAlertUpdate(BaseModel):
    target_price: Optional[float] = None
    condition: Optional[Literal["above", "below"]] = None
    is_active: Optional[bool] = None

class PriceAlertResponse(BaseModel):
    id: str
    user_email: str
    symbol: str
    target_price: float
    condition: str
    is_active: bool
    currency: str
    created_at: Optional[datetime] = None

class AlertCountResponse(BaseModel):
    total: int
    active: int

class PortfolioHistoryEntry(BaseModel):
    date: datetime
    total_value: float
    performance: Optional[float] = None

class PortfolioHistoryResponse(BaseModel):
    period: str
    history: list[PortfolioHistoryEntry]
