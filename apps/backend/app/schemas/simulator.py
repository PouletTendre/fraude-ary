from pydantic import BaseModel, Field
from typing import List


class SimulatorRequest(BaseModel):
    initial_capital: float = Field(..., ge=0, description="Current portfolio value in EUR")
    monthly_contribution: float = Field(0, ge=0, description="Monthly savings amount in EUR")
    annual_return_rate: float = Field(7.0, ge=-50, le=100, description="Expected annual return %")
    inflation_rate: float = Field(2.0, ge=0, le=20, description="Expected annual inflation %")
    years: int = Field(20, ge=1, le=50, description="Projection horizon in years")
    dividend_yield: float = Field(0, ge=0, le=20, description="Annual dividend yield %")


class YearProjection(BaseModel):
    year: int
    portfolio_value: float
    portfolio_value_real: float
    total_contributions: float
    total_dividends: float
    gains: float


class SimulatorResponse(BaseModel):
    projections: List[YearProjection]
    final_value: float
    final_value_real: float
    total_contributions: float
    total_dividends: float
    total_gains: float
    years: int
