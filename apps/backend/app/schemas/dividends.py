from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class DividendCreate(BaseModel):
    symbol: str = Field(..., pattern=r"^[A-Z0-9.\-]{1,20}$")
    amount_per_share: float = Field(..., gt=0)
    quantity: float = Field(..., gt=0)
    currency: str = "EUR"
    date: str


class DividendUpdate(BaseModel):
    amount_per_share: Optional[float] = Field(None, gt=0)
    quantity: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = None
    date: Optional[str] = None


class DividendResponse(BaseModel):
    id: str
    user_email: str
    symbol: str
    amount_per_share: float
    quantity: float
    total_amount: float
    currency: str
    date: str
    created_at: Optional[datetime] = None


class DividendSummary(BaseModel):
    total_dividends: float
    total_by_symbol: dict
    monthly_history: list
    yield_on_cost: float
    count: int
