import httpx
import logging
from typing import Optional, Dict
from datetime import date
from dateutil.relativedelta import relativedelta

from app.services.cache_service import cache_service

ECB_API_URL = "https://data-api.ecb.europa.eu/service/data/EXR"
CACHE_TTL_ECB = 21600  # 6 hours

# ECB only publishes rates for EUR as base. These are approximate
# fallback rates vs EUR for pre-1999 or when API is unavailable.
STATIC_FALLBACK_RATES_VS_EUR: Dict[str, float] = {
    "EUR": 1.0,
    "USD": 1.087,
    "GBP": 0.85,
    "JPY": 162.0,
    "CHF": 0.95,
    "CAD": 1.47,
    "AUD": 1.63,
    "CNY": 7.85,
    "SEK": 11.2,
    "NOK": 11.5,
    "DKK": 7.46,
    "PLN": 4.32,
    "CZK": 25.2,
    "HUF": 395.0,
    "BRL": 5.45,
    "MXN": 18.5,
    "INR": 90.5,
    "KRW": 1440.0,
    "SGD": 1.45,
    "HKD": 8.48,
    "NZD": 1.78,
    "ZAR": 19.8,
    "TRY": 35.0,
    "RUB": 96.0,
}


class ExchangeRateService:
    """ECB-based exchange rate service with Redis caching and cross-rate calculations."""

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=15.0,
                headers={"Accept": "application/json"},
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    async def get_rate(
        self,
        from_currency: str,
        to_currency: str,
        at_date: Optional[date] = None,
    ) -> float:
        """Get exchange rate from one currency to another.

        Uses EUR as pivot for cross-rate calculations.
        Returns the rate such that: amount_in_to = amount_in_from * rate
        """
        from_c = from_currency.upper()
        to_c = to_currency.upper()

        if from_c == to_c:
            return 1.0

        # If either side is EUR, fetch directly
        if from_c == "EUR":
            rate = await self._get_eur_rate(to_c, at_date)
            return rate
        if to_c == "EUR":
            rate = await self._get_eur_rate(from_c, at_date)
            return 1.0 / rate if rate > 0 else 1.0

        # Cross-rate: from -> EUR -> to
        from_rate = await self._get_eur_rate(from_c, at_date)
        to_rate = await self._get_eur_rate(to_c, at_date)

        if from_rate > 0 and to_rate > 0:
            return to_rate / from_rate

        # Fallback to static
        return self._fallback_static_rate(from_c, to_c)

    async def _get_eur_rate(self, currency: str, at_date: Optional[date] = None) -> float:
        """Get rate of 1 EUR in target currency. Returns 1.0 for EUR."""
        currency = currency.upper()
        if currency == "EUR":
            return 1.0

        date_str = (at_date or date.today()).strftime("%Y-%m-%d")
        cache_key = f"ecb_rate:{date_str}:{currency}"

        # Check Redis cache
        try:
            cached = await cache_service.get(cache_key)
            if cached is not None and isinstance(cached, dict):
                rate = cached.get("rate")
                if rate is not None and rate > 0:
                    return float(rate)
        except Exception as e:
            logging.warning(f"ECB cache miss for {currency} on {date_str}: {e}")

        # Fetch from ECB
        rate = await self._fetch_ecb_rate(currency, at_date)
        if rate and rate > 0:
            try:
                await cache_service.set(cache_key, {"rate": rate}, ttl=CACHE_TTL_ECB)
            except Exception as e:
                logging.warning(f"ECB cache set failed for {currency}: {e}")
            return rate

        # Static fallback
        static_rate = STATIC_FALLBACK_RATES_VS_EUR.get(currency)
        if static_rate and static_rate > 0:
            return static_rate

        logging.error(f"Could not fetch ECB rate for {currency} on {date_str}")
        return 1.0

    async def _fetch_ecb_rate(self, currency: str, at_date: Optional[date] = None) -> Optional[float]:
        """Fetch rate from ECB Data API.

        ECB publishes daily reference rates with EUR as base.
        For pre-1999 dates, we use the earliest available rate.
        """
        target_date = at_date or date.today()

        # ECB rates started on 1999-01-04
        ecb_start = date(1999, 1, 4)
        if target_date < ecb_start:
            logging.info(f"Pre-1999 date {target_date}, using earliest available ECB rate")
            target_date = ecb_start

        # ECB only publishes on business days. If today is weekend/holiday,
        # the API returns the latest available rate when using startPeriod.
        try:
            client = await self._get_client()
            # Use the REST-style JSON endpoint
            url = f"{ECB_API_URL}/M.{currency}.EUR.SP00.A"
            params = {
                "format": "jsondata",
                "startPeriod": target_date.strftime("%Y-%m-%d"),
                "endPeriod": (target_date + relativedelta(days=7)).strftime("%Y-%m-%d"),
            }
            resp = await client.get(url, params=params)

            if resp.status_code == 200:
                data = resp.json()
                # Parse ECB JSON response
                datasets = data.get("dataSets", [])
                if datasets:
                    series = datasets[0].get("series", {})
                    for key, series_data in series.items():
                        observations = series_data.get("observations", {})
                        if observations:
                            # Get the first (earliest matching) observation
                            # Observations are keyed by time index
                            for idx in sorted(observations.keys(), key=int):
                                obs = observations[idx]
                                if isinstance(obs, list) and len(obs) > 0:
                                    rate = float(obs[0])
                                    if rate > 0:
                                        return rate
                logging.warning(f"ECB returned no data for {currency} on {target_date}")
                return None
            elif resp.status_code == 404:
                logging.warning(f"ECB 404 for {currency} — currency may not be supported")
                return None
            else:
                logging.warning(f"ECB API returned {resp.status_code} for {currency}")
                return None
        except Exception as e:
            logging.warning(f"ECB API request failed for {currency}: {e}")
            return None

    def _fallback_static_rate(self, from_currency: str, to_currency: str) -> float:
        """Static fallback using hardcoded rates vs EUR."""
        from_rate = STATIC_FALLBACK_RATES_VS_EUR.get(from_currency, 1.0)
        to_rate = STATIC_FALLBACK_RATES_VS_EUR.get(to_currency, 1.0)
        if from_rate > 0:
            return to_rate / from_rate
        return 1.0


exchange_rate_service = ExchangeRateService()
