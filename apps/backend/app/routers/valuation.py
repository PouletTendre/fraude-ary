import asyncio
import logging
from typing import Optional, Dict

import httpx

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.valuation import ValuationMethod, ValuationScenario, ValuationResponse
from app.services.valuation_service import calculate_valuation

router = APIRouter(prefix="/valuation", tags=["valuation"])

YAHOO_CHART_API = "https://query1.finance.yahoo.com/v8/finance/chart"


async def _fetch_market_price(symbol: str) -> Optional[Dict]:
    """Fetch current market price and currency from Yahoo Chart API."""
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            url = f"{YAHOO_CHART_API}/{symbol.upper()}?interval=1d&range=1mo"
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            })
            if resp.status_code != 200:
                return None
            data = resp.json()
            result = data.get("chart", {}).get("result", [None])[0]
            if not result:
                return None
            meta = result.get("meta", {})
            closes = result.get("indicators", {}).get("quote", [{}])[0].get("close", [])
            price = None
            for c in reversed(closes):
                if c is not None:
                    price = c
                    break
            if price is None:
                price = meta.get("regularMarketPrice")
            if price is None:
                return None
            currency = meta.get("currency", "USD")
            return {"price": float(price), "currency": currency}
    except Exception as e:
        logging.warning(f"Yahoo chart price fetch failed for {symbol}: {e}")
        return None


def _fetch_financial_yfinance(symbol: str) -> Optional[Dict]:
    """Fetch financial data using yfinance (handles crumb auth automatically)."""
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info
        if not info or info.get("trailingEps") is None:
            return None
        
        fcf = info.get("freeCashflow")
        if not fcf or fcf == 0:
            fcf = info.get("operatingCashflow", 0) - info.get("capitalExpenditures", 0) or None
        
        eps = info.get("trailingEps")
        shares = info.get("sharesOutstanding")
        pe = info.get("trailingPE")
        growth = info.get("revenueGrowth")
        
        # Validate data looks reasonable (not stale/partial from cache)
        if eps and eps < 0:
            eps = None
        if fcf and fcf < 0:
            fcf = None
        
        return {
            "fcf": float(fcf) if fcf else None,
            "eps": float(eps) if eps else None,
            "shares_outstanding": int(shares) if shares and shares > 0 else None,
            "pe_ratio": float(pe) if pe and pe > 0 else None,
            "revenue_growth": float(growth) if growth else None,
        }
    except Exception as e:
        logging.warning(f"yfinance info fetch failed for {symbol}: {e}")
        return None


async def _fetch_financial_data(symbol: str) -> Optional[Dict]:
    """Fetch financial data, trying yfinance first."""
    return await asyncio.to_thread(_fetch_financial_yfinance, symbol)


@router.get("/{symbol}", response_model=ValuationResponse)
async def get_valuation(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    symbol = symbol.upper()

    price_data = await _fetch_market_price(symbol)
    if not price_data:
        raise HTTPException(status_code=404, detail=f"Could not fetch market price for {symbol}")

    market_price = price_data["price"]
    currency = price_data["currency"]

    financial_data = await _fetch_financial_data(symbol)
    is_estimated = False

    if not financial_data:
        financial_data = {}
        is_estimated = True

    eps = financial_data.get("eps")
    fcf = financial_data.get("fcf")
    shares = financial_data.get("shares_outstanding")

    # Use conservative fallback estimates when data is missing
    if not eps or eps <= 0:
        eps = market_price / 15.0  # assume P/E ≈ 15
        is_estimated = True
    if not shares or shares <= 0:
        # Typical large cap: 1B-20B shares; use mid-range default
        shares = 5_000_000_000
        is_estimated = True
    if not fcf or fcf <= 0:
        # Typical FCF yield: 3-8% of market cap; use 5%
        fcf = market_price * shares * 0.05
        is_estimated = True

    fin_data = {
        "fcf": fcf,
        "eps": eps,
        "shares_outstanding": shares,
        "pe_ratio": financial_data.get("pe_ratio"),
        "revenue_growth": financial_data.get("revenue_growth"),
        "currency": currency,
        "is_estimated": is_estimated,
    }

    result = calculate_valuation(symbol, market_price, fin_data)

    return ValuationResponse(
        symbol=result["symbol"],
        market_price=result["market_price"],
        currency=result["currency"],
        intrinsic_value=result["intrinsic_value"],
        margin_pct=result["margin_pct"],
        label=result["label"],
        methods=[ValuationMethod(**m) for m in result["methods"]],
        scenarios=ValuationScenario(**result["scenarios"]),
        financial_data=result["financial_data"],
        is_estimated=result["is_estimated"],
    )
