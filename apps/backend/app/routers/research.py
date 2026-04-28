import asyncio
import logging
from typing import Optional

import yfinance
from fastapi import APIRouter, HTTPException

from app.schemas.research import (
    AnalystTargets,
    CompanyProfile,
    FinancialStatements,
    PeerComparison,
)
from app.services.cache_service import cache_service

router = APIRouter(prefix="/research", tags=["research"])

PROFILE_TTL = 3600
FINANCIALS_TTL = 21600
ANALYSTS_TTL = 3600
PEERS_TTL = 3600

YAHOO_SEARCH_API = "https://query2.finance.yahoo.com/v1/finance/search"

SECTOR_PEERS: dict[str, list[str]] = {
    "Technology": ["AAPL", "MSFT", "GOOGL", "META", "NVDA", "AMD", "INTC", "CRM", "ADBE", "ORCL"],
    "Communication Services": ["GOOGL", "META", "NFLX", "DIS", "VZ", "T", "TMUS", "SPOT", "SNAP", "PINS"],
    "Consumer Cyclical": ["AMZN", "TSLA", "HD", "MCD", "NKE", "LOW", "BKNG", "SBUX", "TJX", "CMG"],
    "Consumer Defensive": ["WMT", "PG", "KO", "PEP", "COST", "PM", "MO", "CL", "KMB", "GIS"],
    "Healthcare": ["JNJ", "PFE", "UNH", "MRK", "ABBV", "ABT", "LLY", "TMO", "BMY", "ISRG"],
    "Financial Services": ["JPM", "BAC", "WFC", "GS", "MS", "V", "MA", "BLK", "C", "AXP"],
    "Industrials": ["BA", "GE", "CAT", "HON", "UPS", "MMM", "DE", "RTX", "LMT", "UNP"],
    "Energy": ["XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PXD", "OXY", "VLO", "HAL"],
    "Utilities": ["NEE", "SO", "DUK", "D", "AEP", "EXC", "SRE", "XEL", "ED", "PEG"],
    "Real Estate": ["AMT", "PLD", "CCI", "EQIX", "SPG", "O", "DLR", "WELL", "AVB", "EQR"],
    "Basic Materials": ["LIN", "APD", "DD", "NEM", "FCX", "NUE", "ECL", "DOW", "SHW", "CTVA"],
}


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


def _sanitize_int(val) -> Optional[int]:
    if val is None:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


def _extract_profile(symbol: str, info: dict) -> dict:
    return {
        "symbol": symbol.upper(),
        "name": info.get("longName") or info.get("shortName"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "description": info.get("longBusinessSummary"),
        "website": info.get("website"),
        "employees": _sanitize_int(info.get("fullTimeEmployees")),
        "country": info.get("country"),
        "exchange": info.get("exchange"),
        "currency": info.get("currency"),
        "market_cap": _sanitize_float(info.get("marketCap")),
        "enterprise_value": _sanitize_float(info.get("enterpriseValue")),
        "pe_ratio": _sanitize_float(info.get("trailingPE") or info.get("forwardPE")),
        "forward_pe": _sanitize_float(info.get("forwardPE")),
        "peg_ratio": _sanitize_float(info.get("pegRatio")),
        "pb_ratio": _sanitize_float(info.get("priceToBook")),
        "ev_revenue": _sanitize_float(info.get("enterpriseToRevenue")),
        "ev_ebitda": _sanitize_float(info.get("enterpriseToEbitda")),
        "beta": _sanitize_float(info.get("beta")),
        "fifty_two_week_high": _sanitize_float(info.get("fiftyTwoWeekHigh")),
        "fifty_two_week_low": _sanitize_float(info.get("fiftyTwoWeekLow")),
        "fifty_day_average": _sanitize_float(info.get("fiftyDayAverage")),
        "two_hundred_day_average": _sanitize_float(info.get("twoHundredDayAverage")),
        "dividend_rate": _sanitize_float(info.get("dividendRate")),
        "dividend_yield": _sanitize_float(info.get("dividendYield")),
        "shares_outstanding": _sanitize_int(info.get("sharesOutstanding")),
        "float_shares": _sanitize_int(info.get("floatShares")),
        "short_ratio": _sanitize_float(info.get("shortRatio")),
        "short_percent": _sanitize_float(info.get("shortPercentOfFloat")),
        "gross_margins": _sanitize_float(info.get("grossMargins")),
        "operating_margins": _sanitize_float(info.get("operatingMargins")),
        "ebitda_margins": _sanitize_float(info.get("ebitdaMargins")),
        "profit_margins": _sanitize_float(info.get("profitMargins")),
        "return_on_equity": _sanitize_float(info.get("returnOnEquity")),
        "return_on_assets": _sanitize_float(info.get("returnOnAssets")),
        "revenue_growth": _sanitize_float(info.get("revenueGrowth")),
        "earnings_growth": _sanitize_float(info.get("earningsGrowth")),
    }


@router.get("/profile/{symbol}", response_model=CompanyProfile)
async def get_company_profile(symbol: str):
    symbol_upper = symbol.upper()
    cache_key = f"research:profile:{symbol_upper}"

    cached = await cache_service.get(cache_key)
    if cached:
        return CompanyProfile(**cached)

    def _fetch():
        ticker = yfinance.Ticker(symbol_upper)
        info = ticker.info
        if not info or info.get("trailingPegRatio"):
            pass
        return info

    try:
        info = await asyncio.to_thread(_fetch)
    except Exception as e:
        logging.warning(f"yfinance profile failed for {symbol_upper}: {e}")
        raise HTTPException(status_code=404, detail=f"Symbol not found: {symbol_upper}")

    if not info or not info.get("symbol") and not info.get("shortName") and not info.get("longName"):
        raise HTTPException(status_code=404, detail=f"Symbol not found: {symbol_upper}")

    data = _extract_profile(symbol_upper, info)

    try:
        await cache_service.set(cache_key, data, ttl=PROFILE_TTL)
    except Exception as e:
        logging.warning(f"Failed to cache profile for {symbol_upper}: {e}")

    return CompanyProfile(**data)


def _df_to_records(df) -> list[dict]:
    if df is None or getattr(df, "empty", True):
        return []
    result = []
    for idx, row in df.iterrows():
        record: dict = {"date": str(idx)}
        for col in df.columns:
            val = row[col]
            if hasattr(val, "item"):
                val = val.item()
            if val is not None and str(val) not in ("nan", "inf", "-inf"):
                record[str(col)] = val
            else:
                record[str(col)] = None
        result.append(record)
    return result


@router.get("/financials/{symbol}", response_model=FinancialStatements)
async def get_financial_statements(symbol: str):
    symbol_upper = symbol.upper()
    cache_key = f"research:financials:{symbol_upper}"

    cached = await cache_service.get(cache_key)
    if cached:
        return FinancialStatements(**cached)

    def _fetch():
        ticker = yfinance.Ticker(symbol_upper)
        info = ticker.info
        if not info or info.get("symbol") is None and not info.get("shortName"):
            return None
        return {
            "annual_income": _df_to_records(ticker.financials),
            "annual_balance": _df_to_records(ticker.balance_sheet),
            "annual_cashflow": _df_to_records(ticker.cashflow),
            "quarterly_income": _df_to_records(ticker.quarterly_financials),
            "quarterly_balance": _df_to_records(ticker.quarterly_balance_sheet),
            "quarterly_cashflow": _df_to_records(ticker.quarterly_cashflow),
        }

    try:
        data = await asyncio.to_thread(_fetch)
    except Exception as e:
        logging.warning(f"yfinance financials failed for {symbol_upper}: {e}")
        raise HTTPException(status_code=404, detail=f"Symbol not found: {symbol_upper}")

    if data is None:
        raise HTTPException(status_code=404, detail=f"Symbol not found: {symbol_upper}")

    data["symbol"] = symbol_upper

    try:
        await cache_service.set(cache_key, data, ttl=FINANCIALS_TTL)
    except Exception as e:
        logging.warning(f"Failed to cache financials for {symbol_upper}: {e}")

    return FinancialStatements(**data)


@router.get("/analysts/{symbol}", response_model=AnalystTargets)
async def get_analyst_targets(symbol: str):
    symbol_upper = symbol.upper()
    cache_key = f"research:analysts:{symbol_upper}"

    cached = await cache_service.get(cache_key)
    if cached:
        return AnalystTargets(**cached)

    def _fetch():
        ticker = yfinance.Ticker(symbol_upper)
        info = ticker.info
        if not info or info.get("symbol") is None and not info.get("shortName"):
            return None

        targets = ticker.analyst_price_targets or {}
        recs_raw = None
        try:
            recs = ticker.recommendations
            if recs is not None and not recs.empty:
                recs_raw = _df_to_records(recs.tail(12))
        except Exception:
            recs_raw = []

        return {
            "symbol": symbol_upper,
            "target_high": _sanitize_float(targets.get("targetHighPrice")),
            "target_low": _sanitize_float(targets.get("targetLowPrice")),
            "target_mean": _sanitize_float(targets.get("targetMeanPrice")),
            "target_median": _sanitize_float(targets.get("targetMedianPrice")),
            "recommendation_mean": _sanitize_float(info.get("recommendationMean")),
            "recommendation_key": info.get("recommendationKey"),
            "number_of_analysts": _sanitize_int(info.get("numberOfAnalystOpinions")),
            "recommendations": recs_raw or [],
        }

    try:
        data = await asyncio.to_thread(_fetch)
    except Exception as e:
        logging.warning(f"yfinance analysts failed for {symbol_upper}: {e}")
        raise HTTPException(status_code=404, detail=f"Symbol not found: {symbol_upper}")

    if data is None:
        raise HTTPException(status_code=404, detail=f"Symbol not found: {symbol_upper}")

    try:
        await cache_service.set(cache_key, data, ttl=ANALYSTS_TTL)
    except Exception as e:
        logging.warning(f"Failed to cache analysts for {symbol_upper}: {e}")

    return AnalystTargets(**data)


@router.get("/peers/{symbol}", response_model=PeerComparison)
async def get_peers(symbol: str):
    symbol_upper = symbol.upper()
    cache_key = f"research:peers:{symbol_upper}"

    cached = await cache_service.get(cache_key)
    if cached:
        return PeerComparison(**cached)

    def _get_sector():
        ticker = yfinance.Ticker(symbol_upper)
        info = ticker.info
        if not info:
            return None, None
        sector = info.get("sector") or info.get("industry")
        return info, sector

    try:
        info, sector = await asyncio.to_thread(_get_sector)
    except Exception as e:
        logging.warning(f"yfinance profile failed for {symbol_upper}: {e}")
        raise HTTPException(status_code=404, detail=f"Symbol not found: {symbol_upper}")

    if not info or not info.get("symbol") and not info.get("shortName"):
        raise HTTPException(status_code=404, detail=f"Symbol not found: {symbol_upper}")

    peer_symbols = []
    if sector:
        for sec_key, symbols in SECTOR_PEERS.items():
            if sec_key.lower() in sector.lower() or sector.lower() in sec_key.lower():
                peer_symbols = [s for s in symbols if s.upper() != symbol_upper]
                break

    if not peer_symbols:
        peer_symbols = SECTOR_PEERS.get(sector, SECTOR_PEERS.get("Technology", []))
        peer_symbols = [s for s in peer_symbols if s.upper() != symbol_upper]

    peer_symbols = peer_symbols[:8]

    peers_data: list[dict] = []

    def _fetch_peer(sym: str) -> Optional[dict]:
        try:
            t = yfinance.Ticker(sym)
            pi = t.info
            if not pi:
                return None
            return {
                "symbol": sym.upper(),
                "name": pi.get("longName") or pi.get("shortName"),
                "market_cap": _sanitize_float(pi.get("marketCap")),
                "pe_ratio": _sanitize_float(pi.get("trailingPE") or pi.get("forwardPE")),
                "forward_pe": _sanitize_float(pi.get("forwardPE")),
                "peg_ratio": _sanitize_float(pi.get("pegRatio")),
                "pb_ratio": _sanitize_float(pi.get("priceToBook")),
                "ev_revenue": _sanitize_float(pi.get("enterpriseToRevenue")),
                "ev_ebitda": _sanitize_float(pi.get("enterpriseToEbitda")),
                "beta": _sanitize_float(pi.get("beta")),
                "dividend_yield": _sanitize_float(pi.get("dividendYield")),
                "operating_margins": _sanitize_float(pi.get("operatingMargins")),
                "profit_margins": _sanitize_float(pi.get("profitMargins")),
                "revenue_growth": _sanitize_float(pi.get("revenueGrowth")),
                "earnings_growth": _sanitize_float(pi.get("earningsGrowth")),
                "return_on_equity": _sanitize_float(pi.get("returnOnEquity")),
            }
        except Exception as e:
            logging.warning(f"Failed to fetch peer {sym}: {e}")
            return None

    for psym in peer_symbols:
        pdict = await asyncio.to_thread(_fetch_peer, psym)
        if pdict:
            peers_data.append(pdict)

    result_data = {"symbol": symbol_upper, "peers": peers_data}

    try:
        await cache_service.set(cache_key, result_data, ttl=PEERS_TTL)
    except Exception as e:
        logging.warning(f"Failed to cache peers for {symbol_upper}: {e}")

    return PeerComparison(**result_data)
