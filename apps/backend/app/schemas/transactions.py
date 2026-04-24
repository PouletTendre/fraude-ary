from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TransactionCreate(BaseModel):
    asset_id: Optional[str] = None
    asset_type: Optional[str] = None
    type: str  # buy or sell
    symbol: str
    quantity: float
    unit_price: float
    currency: str = "EUR"
    exchange_rate: float = 1.0
    fees: float = 0.0
    total_invested: float
    date: str

class TransactionUpdate(BaseModel):
    asset_id: Optional[str] = None
    asset_type: Optional[str] = None
    type: Optional[str] = None
    symbol: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    currency: Optional[str] = None
    exchange_rate: Optional[float] = None
    fees: Optional[float] = None
    total_invested: Optional[float] = None
    date: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    user_email: str
    asset_id: Optional[str] = None
    type: str
    symbol: str
    quantity: float
    unit_price: float
    currency: str
    exchange_rate: float
    fees: float
    total_invested: float
    date: str
    created_at: Optional[datetime] = None
