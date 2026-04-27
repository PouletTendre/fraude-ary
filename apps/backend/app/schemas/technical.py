from pydantic import BaseModel
from typing import Optional, List


class IndicatorRequest(BaseModel):
    symbol: str
    period: Optional[str] = "1mo"


class TechnicalIndicatorsResponse(BaseModel):
    symbol: str
    rsi: Optional[float] = None
    macd: Optional[dict] = None
    bollinger: Optional[dict] = None
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    sma_200: Optional[float] = None
    ema_12: Optional[float] = None
    ema_26: Optional[float] = None
    atr: Optional[float] = None
    obv: Optional[float] = None
    stochastic: Optional[dict] = None
    mfi: Optional[float] = None
    adx: Optional[float] = None


class PortfolioAnalyticsRequest(BaseModel):
    asset_ids: List[str]


class PortfolioAnalyticsResponse(BaseModel):
    total_value: float
    daily_return: Optional[float] = None
    weekly_return: Optional[float] = None
    monthly_return: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    var_95: Optional[float] = None
    cvar_95: Optional[float] = None
    volatility_annual: Optional[float] = None
    best_day: Optional[dict] = None
    worst_day: Optional[dict] = None


class OHLCVPoint(BaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: int


class OHLCVResponse(BaseModel):
    symbol: str
    period: str
    interval: str
    data: List[OHLCVPoint]


class NewsItem(BaseModel):
    title: str
    link: str
    published: Optional[str] = None
    source: Optional[str] = None


class NewsResponse(BaseModel):
    symbol: str
    items: List[NewsItem]
