from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime

class PriceAlertCreate(BaseModel):
    symbol: str
    target_price: float
    condition: Literal["above", "below"]

class PriceAlertResponse(BaseModel):
    id: str
    user_email: str
    symbol: str
    target_price: float
    condition: str
    is_active: bool
    created_at: Optional[datetime] = None

class PortfolioHistoryEntry(BaseModel):
    date: datetime
    total_value: float

class PortfolioHistoryResponse(BaseModel):
    period: str
    history: list[PortfolioHistoryEntry]
