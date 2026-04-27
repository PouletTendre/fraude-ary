import logging
from typing import Dict, Optional

import httpx

from fastapi import APIRouter, Depends, Query

from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.technical import (
    TechnicalIndicatorsResponse,
)
from app.services.technical_service import compute_all_indicators

router = APIRouter(prefix="/technical", tags=["technical"])

YAHOO_CHART_API = "https://query1.finance.yahoo.com/v8/finance/chart"


async def _fetch_yahoo_ohlcv(symbol: str, period: str = "1mo") -> Optional[Dict]:
    period_map = {"1d": "1d", "5d": "5d", "1mo": "1mo", "3mo": "3mo", "6mo": "6mo", "1y": "1y", "2y": "2y"}
    range_val = period_map.get(period, "1mo")
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            url = f"{YAHOO_CHART_API}/{symbol.upper()}?interval=1d&range={range_val}"
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            })
            if resp.status_code != 200:
                return None
            data = resp.json()
            result = data.get("chart", {}).get("result", [None])[0]
            if not result:
                return None
            quotes = result.get("indicators", {}).get("quote", [{}])[0]
            closes = [c for c in quotes.get("close", []) if c is not None]
            highs = [h for h in quotes.get("high", []) if h is not None]
            lows = [l for l in quotes.get("low", []) if l is not None]
            opens = [o for o in quotes.get("open", []) if o is not None]
            volumes = [v if v is not None else 0 for v in quotes.get("volume", [])]
            if not closes:
                return None
            return {
                "close": closes,
                "high": highs or closes,
                "low": lows or closes,
                "open": opens or closes,
                "volume": volumes or [1.0] * len(closes),
            }
    except Exception as e:
        logging.warning(f"Yahoo chart API failed for {symbol}: {e}")
        return None


@router.get("/indicators", response_model=TechnicalIndicatorsResponse)
async def get_technical_indicators(
    symbol: str = Query(..., min_length=1, pattern=r"^[A-Z0-9.\-]{1,20}$"),
    period: str = Query("1mo"),
    current_user: User = Depends(get_current_user),
):
    ohlcv = await _fetch_yahoo_ohlcv(symbol, period)
    if not ohlcv or not ohlcv["close"]:
        return TechnicalIndicatorsResponse(
            symbol=symbol.upper(),
            rsi=None,
            macd=None,
            bollinger=None,
            sma_20=None,
            sma_50=None,
            sma_200=None,
            ema_12=None,
            ema_26=None,
            atr=None,
            obv=None,
            stochastic=None,
            mfi=None,
            adx=None,
        )

    indicators = compute_all_indicators(
        close_prices=ohlcv["close"],
        high_prices=ohlcv["high"],
        low_prices=ohlcv["low"],
        volumes=ohlcv["volume"],
    )

    stoch_raw = indicators.get("stochastic")
    stochastic = None
    if stoch_raw and stoch_raw.get("k") is not None:
        stochastic = {"stoch_k": stoch_raw["k"], "stoch_d": stoch_raw.get("d")}

    return TechnicalIndicatorsResponse(
        symbol=symbol.upper(),
        rsi=indicators.get("rsi"),
        macd=indicators.get("macd"),
        bollinger=indicators.get("bollinger"),
        sma_20=indicators.get("sma_20"),
        sma_50=indicators.get("sma_50"),
        sma_200=indicators.get("sma_200"),
        ema_12=indicators.get("ema_12"),
        ema_26=indicators.get("ema_26"),
        atr=indicators.get("atr"),
        obv=indicators.get("obv"),
        stochastic=stochastic,
        mfi=indicators.get("mfi"),
        adx=indicators.get("adx"),
    )
