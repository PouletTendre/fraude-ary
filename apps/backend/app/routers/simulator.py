from fastapi import APIRouter, Depends
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.simulator import SimulatorRequest, SimulatorResponse, YearProjection

router = APIRouter()


@router.post("/simulate", response_model=SimulatorResponse)
async def simulate_wealth(
    req: SimulatorRequest,
    current_user: User = Depends(get_current_user)
):
    projections = []
    portfolio = req.initial_capital
    total_contributions = req.initial_capital
    total_dividends = 0.0
    monthly_rate = req.annual_return_rate / 100 / 12
    dividend_monthly = req.dividend_yield / 100 / 12

    for year in range(1, req.years + 1):
        for month in range(12):
            portfolio *= (1 + monthly_rate)
            portfolio += req.monthly_contribution
            total_contributions += req.monthly_contribution
            div = portfolio * dividend_monthly
            total_dividends += div
            portfolio += div

        inflation_factor = (1 + req.inflation_rate / 100) ** year
        portfolio_real = portfolio / inflation_factor
        gains = portfolio - total_contributions

        projections.append(YearProjection(
            year=year,
            portfolio_value=round(portfolio, 2),
            portfolio_value_real=round(portfolio_real, 2),
            total_contributions=round(total_contributions, 2),
            total_dividends=round(total_dividends, 2),
            gains=round(gains, 2),
        ))

    final = projections[-1] if projections else None

    return SimulatorResponse(
        projections=projections,
        final_value=final.portfolio_value if final else req.initial_capital,
        final_value_real=final.portfolio_value_real if final else req.initial_capital,
        total_contributions=round(total_contributions, 2),
        total_dividends=round(total_dividends, 2),
        total_gains=round(portfolio - total_contributions, 2),
        years=req.years,
    )
