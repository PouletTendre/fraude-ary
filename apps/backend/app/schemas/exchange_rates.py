from pydantic import BaseModel
from datetime import datetime
from typing import List


class ExchangeRateResponse(BaseModel):
    currency: str
    rate_vs_usd: float
    updated_at: datetime


class ExchangeRatesListResponse(BaseModel):
    rates: List[ExchangeRateResponse]
    base_currency: str = "EUR"
