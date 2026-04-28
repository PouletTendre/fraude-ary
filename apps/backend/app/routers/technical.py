import asyncio
import logging
from typing import Dict, List, Optional, Tuple

import httpx
import yfinance
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query

from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.technical import (
    OHLCVResponse,
    OHLCVPoint,
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


def _fetch_ohlcv_yf(symbol: str, period: str = "6mo", interval: str = "1d") -> List[Dict]:
    """Fetch OHLCV data via yfinance (primary source for charting)."""
    try:
        ticker = yfinance.Ticker(symbol.upper())
        hist = ticker.history(period=period, interval=interval)
        if hist.empty:
            return []
        results = []
        for idx, row in hist.iterrows():
            results.append({
                "time": int(idx.timestamp()),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })
        return results
    except Exception as e:
        logging.warning(f"yfinance OHLCV failed for {symbol}: {e}")
        return []


async def _fetch_ohlcv_chart_api(symbol: str, period: str = "6mo", interval: str = "1d") -> List[Dict]:
    """Fallback OHLCV via Yahoo Chart API."""
    period_map = {"1d": "1d", "5d": "5d", "1mo": "1mo", "3mo": "3mo", "6mo": "6mo", "1y": "1y", "2y": "2y", "5y": "5y"}
    range_val = period_map.get(period, "6mo")
    results = []
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            url = f"{YAHOO_CHART_API}/{symbol.upper()}?interval={interval}&range={range_val}"
            resp = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            })
            if resp.status_code != 200:
                return []
            data = resp.json()
            result = data.get("chart", {}).get("result", [None])[0]
            if not result:
                return []
            timestamps = result.get("timestamp", [])
            quotes = result.get("indicators", {}).get("quote", [{}])[0]
            for i, ts in enumerate(timestamps):
                o = quotes.get("open", [])[i] if i < len(quotes.get("open", [])) else None
                h = quotes.get("high", [])[i] if i < len(quotes.get("high", [])) else None
                l = quotes.get("low", [])[i] if i < len(quotes.get("low", [])) else None
                c = quotes.get("close", [])[i] if i < len(quotes.get("close", [])) else None
                v = quotes.get("volume", [])[i] if i < len(quotes.get("volume", [])) else 0
                if c is not None and ts is not None:
                    results.append({
                        "time": int(ts),
                        "open": round(float(o or c), 2),
                        "high": round(float(h or c), 2),
                        "low": round(float(l or c), 2),
                        "close": round(float(c), 2),
                        "volume": int(v or 0),
                    })
    except Exception as e:
        logging.warning(f"Yahoo chart OHLCV failed for {symbol}: {e}")
    return results


def _fetch_ohlcv_yf_date_range(symbol: str, start_date: str, end_date: str, interval: str = "1d") -> List[Dict]:
    """Fetch OHLCV via yfinance for an explicit date range."""
    try:
        ticker = yfinance.Ticker(symbol.upper())
        hist = ticker.history(start=start_date, end=end_date, interval=interval)
        if hist.empty:
            return []
        results = []
        for idx, row in hist.iterrows():
            results.append({
                "time": int(idx.timestamp()),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })
        return results
    except Exception as e:
        logging.warning(f"yfinance OHLCV date range failed for {symbol}: {e}")
        return []


@router.get("/ohlcv", response_model=OHLCVResponse)
async def get_ohlcv(
    symbol: str = Query(..., min_length=1, pattern=r"^[A-Z0-9.\-]{1,20}$"),
    period: str = Query("6mo"),
    interval: str = Query("1d"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD (overrides period)"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD (overrides period)"),
    current_user: User = Depends(get_current_user),
):
    if start_date and end_date:
        # Explicit date range (used for lazy zoom load)
        data = await asyncio.to_thread(_fetch_ohlcv_yf_date_range, symbol, start_date, end_date, interval)
    else:
        # 1. yfinance (period-based primary)
        data = await asyncio.to_thread(_fetch_ohlcv_yf, symbol, period, interval)
        # 2. Yahoo Chart API (fallback)
        if not data:
            data = await _fetch_ohlcv_chart_api(symbol, period, interval)
    return OHLCVResponse(
        symbol=symbol.upper(),
        period=period,
        interval=interval,
        data=[OHLCVPoint(**p) for p in data],
    )
