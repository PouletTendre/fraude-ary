import asyncio
import logging
from typing import List, Dict, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import yfinance

from app.database import get_db
from app.models.user import User
from app.models.asset import Asset
from app.routers.auth import get_current_user
from app.schemas.technical import (
    IndicatorRequest,
    TechnicalIndicatorsResponse,
)
from app.services.technical_service import compute_all_indicators

router = APIRouter(prefix="/technical", tags=["technical"])


def _fetch_yahoo_ohlcv(symbol: str, period: str = "1mo") -> Optional[Dict]:
    try:
        ticker = yfinance.Ticker(symbol.upper())
        hist = ticker.history(period=period)
        if hist.empty:
            return None
        return {
            "close": hist["Close"].tolist(),
            "high": hist["High"].tolist(),
            "low": hist["Low"].tolist(),
            "open": hist["Open"].tolist(),
            "volume": hist["Volume"].tolist(),
        }
    except Exception as e:
        logging.warning(f"yfinance history failed for {symbol}: {e}")
        return None


@router.get("/indicators", response_model=TechnicalIndicatorsResponse)
async def get_technical_indicators(
    symbol: str = Query(..., min_length=1, pattern=r"^[A-Z0-9.\-]{1,20}$"),
    period: str = Query("1mo"),
    current_user: User = Depends(get_current_user),
):
    ohlcv = await asyncio.to_thread(_fetch_yahoo_ohlcv, symbol, period)
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
