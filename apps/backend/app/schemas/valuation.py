from pydantic import BaseModel
from typing import Optional, List, Dict


class ValuationMethod(BaseModel):
    method: str
    intrinsic_value: float
    margin_pct: float
    label: str


class ValuationScenario(BaseModel):
    bear: float
    base: float
    bull: float


class ValuationResponse(BaseModel):
    symbol: str
    market_price: float
    currency: str
    intrinsic_value: float
    margin_pct: float
    label: str
    methods: List[ValuationMethod]
    scenarios: ValuationScenario
    financial_data: dict
    is_estimated: bool
