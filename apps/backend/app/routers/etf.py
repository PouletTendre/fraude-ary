import asyncio
import logging
from typing import Optional

import httpx
import yfinance
from fastapi import APIRouter, HTTPException, Query

from app.schemas.etf import (
    ETFSearchResponse,
    ETFInfo,
    ETFHoldingWeights,
)
from app.services.cache_service import cache_service

router = APIRouter(prefix="/api/v1/etf", tags=["etf"])

YAHOO_SEARCH_API = "https://query2.finance.yahoo.com/v1/finance/search"
SEARCH_TTL = 900
INFO_TTL = 3600
HOLDINGS_TTL = 21600


def _sanitize_float(val) -> Optional[float]:
    if val is None:
        return None
    try:
        f = float(val)
        if str(f) in ("nan", "inf", "-inf"):
            return None
        return f
    except (ValueError, TypeError):
        return None


@router.get("/search", response_model=ETFSearchResponse)
async def search_etfs(q: str = Query(..., min_length=1)):
    cache_key = f"etf:search:{q.strip().upper()}"
    cached = await cache_service.get(cache_key)
    if cached:
        return ETFSearchResponse(**cached)

    results: list[dict] = []

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(
                YAHOO_SEARCH_API,
                params={"q": q.strip(), "quotesCount": 10},
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"},
            )
            if resp.status_code == 200:
                data = resp.json()
                quotes = data.get("quotes", [])
                for item in quotes:
                    quote_type = item.get("quoteType", "")
                    if quote_type.upper() == "ETF":
                        results.append({
                            "symbol": item.get("symbol", ""),
                            "name": item.get("shortname") or item.get("longname"),
                            "type": quote_type,
                            "exchange": item.get("exchange"),
                            "currency": item.get("currency"),
                        })
    except Exception as e:
        logging.warning(f"Yahoo ETF search failed for {q}: {e}")

    if not results:
        try:
            def _yf_fallback():
                try:
                    ticker = yfinance.Ticker(q.strip().upper())
                    info = ticker.info
                    if info and info.get("quoteType", "").upper() == "ETF":
                        return [{
                            "symbol": info.get("symbol", q.strip().upper()),
                            "name": info.get("longName") or info.get("shortName"),
                            "type": "ETF",
                            "exchange": info.get("exchange"),
                            "currency": info.get("currency"),
                        }]
                except Exception:
                    pass
                return []
            results = await asyncio.to_thread(_yf_fallback)
        except Exception as e:
            logging.warning(f"yfinance ETF fallback search failed for {q}: {e}")

    response_data = {"results": results}

    try:
        await cache_service.set(cache_key, response_data, ttl=SEARCH_TTL)
    except Exception as e:
        logging.warning(f"Failed to cache ETF search for {q}: {e}")

    return ETFSearchResponse(**response_data)


@router.get("/info/{symbol}", response_model=ETFInfo)
async def get_etf_info(symbol: str):
    symbol_upper = symbol.upper()
    cache_key = f"etf:info:{symbol_upper}"

    cached = await cache_service.get(cache_key)
    if cached:
        return ETFInfo(**cached)

    def _fetch():
        ticker = yfinance.Ticker(symbol_upper)
        info = ticker.info
        if not info:
            return None
        return {
            "symbol": symbol_upper,
            "name": info.get("longName") or info.get("shortName"),
            "description": info.get("longBusinessSummary"),
            "category": info.get("category"),
            "fund_family": info.get("fundFamily"),
            "fund_inception_date": str(info.get("fundInceptionDate")) if info.get("fundInceptionDate") else None,
            "legal_type": info.get("legalType"),
            "exchange": info.get("exchange"),
            "currency": info.get("currency"),
            "nav_price": _sanitize_float(info.get("navPrice")),
            "total_assets": _sanitize_float(info.get("totalAssets")),
            "expense_ratio": _sanitize_float(info.get("annualReportExpenseRatio")),
            "yield_": _sanitize_float(info.get("yield")),
            "ytd_return": _sanitize_float(info.get("ytdReturn")),
            "three_year_return": _sanitize_float(info.get("threeYearAverageReturn")),
            "five_year_return": _sanitize_float(info.get("fiveYearAverageReturn")),
            "beta": _sanitize_float(info.get("beta3Year") or info.get("beta")),
            "pe_ratio": _sanitize_float(info.get("trailingPE")),
        }

    try:
        data = await asyncio.to_thread(_fetch)
    except Exception as e:
        logging.warning(f"yfinance ETF info failed for {symbol_upper}: {e}")
        raise HTTPException(status_code=404, detail=f"ETF not found: {symbol_upper}")

    if data is None:
        raise HTTPException(status_code=404, detail=f"ETF not found: {symbol_upper}")

    try:
        await cache_service.set(cache_key, data, ttl=INFO_TTL)
    except Exception as e:
        logging.warning(f"Failed to cache ETF info for {symbol_upper}: {e}")

    return ETFInfo(**data)


@router.get("/holdings/{symbol}", response_model=ETFHoldingWeights)
async def get_etf_holdings(symbol: str):
    symbol_upper = symbol.upper()
    cache_key = f"etf:holdings:{symbol_upper}"

    cached = await cache_service.get(cache_key)
    if cached:
        return ETFHoldingWeights(**cached)

    def _fetch():
        ticker = yfinance.Ticker(symbol_upper)
        info = ticker.info

        if not info:
            return None

        holdings: list[dict] = []
        sectors: list[dict] = []

        try:
            fund_holdings = ticker.fund_holding_info
            if fund_holdings is not None and not fund_holdings.empty:
                for idx, row in fund_holdings.iterrows():
                    holdings.append({
                        "symbol": str(idx),
                        "name": str(row.get("holdingName", row.get("name", idx))),
                        "weight": _sanitize_float(row.get("holdingPercent")),
                    })
        except Exception as e:
            logging.info(f"No fund_holding_info for {symbol_upper}: {e}")

        if not holdings:
            holdings_raw = info.get("holdings", [])
            if isinstance(holdings_raw, list):
                for h in holdings_raw[:10]:
                    sym = h.get("symbol", "")
                    name = h.get("holdingName", h.get("name", sym))
                    weight = _sanitize_float(
                        h.get("holdingPercent")
                        or h.get("weight")
                        or h.get("percentage")
                    )
                    if sym and name:
                        holdings.append({
                            "symbol": str(sym),
                            "name": str(name),
                            "weight": weight,
                        })
                    elif name:
                        holdings.append({
                            "symbol": str(name),
                            "name": str(name),
                            "weight": weight,
                        })

        holdings = holdings[:10]

        sector_weights = info.get("sectorWeightings", [])
        if isinstance(sector_weights, list):
            for sw in sector_weights:
                sector_name = ""
                sector_pct = None
                if isinstance(sw, dict):
                    for k, v in sw.items():
                        sector_name = str(k)
                        sector_pct = _sanitize_float(v)
                if sector_name:
                    sectors.append({sector_name: sector_pct})

        if not sectors:
            sector_info_raw = info.get("sectorWeightings", {})
            if isinstance(sector_info_raw, dict):
                for k, v in sector_info_raw.items():
                    sectors.append({str(k): _sanitize_float(v)})

        return {
            "symbol": symbol_upper,
            "holdings": holdings,
            "sectors": sectors,
        }

    try:
        data = await asyncio.to_thread(_fetch)
    except Exception as e:
        logging.warning(f"yfinance ETF holdings failed for {symbol_upper}: {e}")
        raise HTTPException(status_code=404, detail=f"ETF not found: {symbol_upper}")

    if data is None:
        raise HTTPException(status_code=404, detail=f"ETF not found: {symbol_upper}")

    try:
        await cache_service.set(cache_key, data, ttl=HOLDINGS_TTL)
    except Exception as e:
        logging.warning(f"Failed to cache ETF holdings for {symbol_upper}: {e}")

    return ETFHoldingWeights(**data)
