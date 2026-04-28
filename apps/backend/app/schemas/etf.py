from pydantic import BaseModel
from typing import Optional, List


class ETFSearchResult(BaseModel):
    symbol: str
    name: Optional[str] = None
    type: Optional[str] = None
    exchange: Optional[str] = None
    currency: Optional[str] = None


class ETFSearchResponse(BaseModel):
    results: List[ETFSearchResult] = []


class ETFInfo(BaseModel):
    symbol: str
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    fund_family: Optional[str] = None
    fund_inception_date: Optional[str] = None
    legal_type: Optional[str] = None
    exchange: Optional[str] = None
    currency: Optional[str] = None
    nav_price: Optional[float] = None
    total_assets: Optional[float] = None
    expense_ratio: Optional[float] = None
    yield_: Optional[float] = None
    ytd_return: Optional[float] = None
    three_year_return: Optional[float] = None
    five_year_return: Optional[float] = None
    beta: Optional[float] = None
    pe_ratio: Optional[float] = None


class ETFHolding(BaseModel):
    symbol: str
    name: Optional[str] = None
    weight: Optional[float] = None


class ETFHoldingWeights(BaseModel):
    symbol: str
    holdings: List[ETFHolding] = []
    sectors: List[dict] = []
