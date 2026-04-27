"""Multi-source price fetching: Tiingo, Twelve Data, CoinGecko, Treasury rates."""

import logging
import httpx
from typing import Optional

from app.config import settings

COINGECKO_API = "https://api.coingecko.com/api/v3"
FRED_API = "https://api.stlouisfed.org/fred/series/observations"
TIINGO_API = "https://api.tiingo.com/iex"
TWELVE_DATA_API = "https://api.twelvedata.com"

TREASURY_SYMBOLS = {
    "1m": "DGS1MO",
    "3m": "DGS3MO",
    "6m": "DGS6MO",
    "1y": "DGS1",
    "2y": "DGS2",
    "5y": "DGS5",
    "7y": "DGS7",
    "10y": "DGS10",
    "20y": "DGS20",
    "30y": "DGS30",
}


async def get_stock_price_tiingo(symbol: str) -> Optional[float]:
    """Fetch stock price from Tiingo API."""
    if not settings.TIINGO_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{TIINGO_API}/{symbol.upper()}",
                params={"token": settings.TIINGO_API_KEY}
            )
            if resp.status_code == 200:
                data = resp.json()
                price = data[0].get("last") if isinstance(data, list) else data.get("last")
                if price and float(price) > 0:
                    return float(price)
    except Exception as e:
        logging.warning(f"Tiingo failed for {symbol}: {e}")
    return None


async def get_stock_price_twelve_data(symbol: str) -> Optional[float]:
    """Fetch stock price from Twelve Data API."""
    if not settings.TWELVE_DATA_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{TWELVE_DATA_API}/price",
                params={"symbol": symbol.upper(), "apikey": settings.TWELVE_DATA_API_KEY}
            )
            if resp.status_code == 200:
                data = resp.json()
                price = data.get("price")
                if price and float(price) > 0:
                    return float(price)
    except Exception as e:
        logging.warning(f"Twelve Data failed for {symbol}: {e}")
    return None


async def get_crypto_price_coingecko(symbol: str) -> Optional[float]:
    """Fetch crypto price from CoinGecko free API."""
    coingecko_ids = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "USDT": "tether",
        "BNB": "binancecoin",
        "SOL": "solana",
        "XRP": "ripple",
        "USDC": "usd-coin",
        "ADA": "cardano",
        "AVAX": "avalanche-2",
        "DOGE": "dogecoin",
        "DOT": "polkadot",
        "MATIC": "matic-network",
        "SHIB": "shiba-inu",
        "LTC": "litecoin",
        "UNI": "uniswap",
        "LINK": "chainlink",
        "ATOM": "cosmos",
        "ETC": "ethereum-classic",
        "XLM": "stellar",
        "ALGO": "algorand",
        "VET": "vechain",
        "FIL": "filecoin",
        "ICP": "internet-computer",
        "FTM": "fantom",
        "NEAR": "near",
        "APT": "aptos",
        "ARB": "arbitrum",
        "OP": "optimism",
        "SUI": "sui",
    }
    slug = coingecko_ids.get(symbol.upper(), symbol.lower())
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{COINGECKO_API}/simple/price",
                params={"ids": slug, "vs_currencies": "usd"}
            )
            if resp.status_code == 200:
                data = resp.json()
                price = data.get(slug, {}).get("usd")
                if price and float(price) > 0:
                    return float(price)
    except Exception as e:
        logging.warning(f"CoinGecko failed for {symbol}: {e}")
    return None


async def get_treasury_rate(maturity: str = "10y") -> Optional[float]:
    """Fetch US Treasury rate from FRED or TreasuryDirect."""
    fred_symbol = TREASURY_SYMBOLS.get(maturity, "DGS10")

    if settings.FRED_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    FRED_API,
                    params={
                        "series_id": fred_symbol,
                        "api_key": settings.FRED_API_KEY,
                        "file_type": "json",
                        "sort_order": "desc",
                        "limit": 1,
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    observations = data.get("observations", [])
                    if observations:
                        val = observations[0].get("value")
                        if val and val != ".":
                            return float(val)
        except Exception as e:
            logging.warning(f"FRED treasury failed: {e}")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates",
                params={"sort": "-record_date", "page[size]": 1}
            )
            if resp.status_code == 200:
                data = resp.json()
                records = data.get("data", [])
                if records:
                    rate = records[0].get("avg_interest_rate_amt")
                    if rate:
                        return float(rate)
    except Exception as e:
        logging.warning(f"TreasuryDirect failed: {e}")

    return None


async def get_forex_rate(from_currency: str, to_currency: str) -> Optional[float]:
    """Fetch exchange rate."""
    if from_currency.upper() == to_currency.upper():
        return 1.0
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.frankfurter.app/latest",
                params={"from": from_currency.upper(), "to": to_currency.upper()}
            )
            if resp.status_code == 200:
                data = resp.json()
                rates = data.get("rates", {})
                rate = rates.get(to_currency.upper())
                if rate and rate > 0:
                    return float(rate)
    except Exception as e:
        logging.warning(f"Forex API failed for {from_currency}->{to_currency}: {e}")
    return None
