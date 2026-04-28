from pydantic import BaseModel
from typing import Optional, List


class CompanyProfile(BaseModel):
    symbol: str
    name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    employees: Optional[int] = None
    country: Optional[str] = None
    exchange: Optional[str] = None
    currency: Optional[str] = None
    market_cap: Optional[float] = None
    enterprise_value: Optional[float] = None
    pe_ratio: Optional[float] = None
    forward_pe: Optional[float] = None
    peg_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    ev_revenue: Optional[float] = None
    ev_ebitda: Optional[float] = None
    beta: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    fifty_day_average: Optional[float] = None
    two_hundred_day_average: Optional[float] = None
    dividend_rate: Optional[float] = None
    dividend_yield: Optional[float] = None
    shares_outstanding: Optional[int] = None
    float_shares: Optional[int] = None
    short_ratio: Optional[float] = None
    short_percent: Optional[float] = None
    gross_margins: Optional[float] = None
    operating_margins: Optional[float] = None
    ebitda_margins: Optional[float] = None
    profit_margins: Optional[float] = None
    return_on_equity: Optional[float] = None
    return_on_assets: Optional[float] = None
    revenue_growth: Optional[float] = None
    earnings_growth: Optional[float] = None


class FinancialItem(BaseModel):
    date: str
    value: Optional[float] = None


class FinancialStatements(BaseModel):
    symbol: str
    annual_income: List[dict] = []
    annual_balance: List[dict] = []
    annual_cashflow: List[dict] = []
    quarterly_income: List[dict] = []
    quarterly_balance: List[dict] = []
    quarterly_cashflow: List[dict] = []


class AnalystTargets(BaseModel):
    symbol: str
    target_high: Optional[float] = None
    target_low: Optional[float] = None
    target_mean: Optional[float] = None
    target_median: Optional[float] = None
    recommendation_mean: Optional[float] = None
    recommendation_key: Optional[str] = None
    number_of_analysts: Optional[int] = None
    recommendations: List[dict] = []


class PeerData(BaseModel):
    symbol: str
    name: Optional[str] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    forward_pe: Optional[float] = None
    peg_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    ev_revenue: Optional[float] = None
    ev_ebitda: Optional[float] = None
    beta: Optional[float] = None
    dividend_yield: Optional[float] = None
    operating_margins: Optional[float] = None
    profit_margins: Optional[float] = None
    revenue_growth: Optional[float] = None
    earnings_growth: Optional[float] = None
    return_on_equity: Optional[float] = None


class PeerComparison(BaseModel):
    symbol: str
    peers: List[PeerData] = []
