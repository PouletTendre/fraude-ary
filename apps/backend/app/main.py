from contextlib import asynccontextmanager
import logging
import time
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.routers import auth, assets, portfolio, prices, demo, alerts, notifications, exchange_rates, cache, monitoring, transactions, dividends
from app.services.cache_service import cache_service
from app.services.price_service import price_service
from app.database import async_session
from app.config import settings

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

async def refresh_prices_task():
    async with async_session() as db:
        try:
            result = await price_service.auto_refresh_all_prices(db)
            logging.info(f"[Auto-Refresh] Updated {result['updated']} prices. Errors: {result['errors']}")
        except Exception as e:
            logging.error(f"[Auto-Refresh] Error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await cache_service.connect()
    scheduler = AsyncIOScheduler()
    scheduler.add_job(refresh_prices_task, "interval", minutes=5, id="price_refresh", replace_existing=True)
    scheduler.start()
    yield
    scheduler.shutdown()
    await cache_service.disconnect()

app = FastAPI(title="Fraude-Ary API", version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.state.start_time = datetime.now(timezone.utc)
app.state.metrics = {
    "total_requests": 0,
    "by_endpoint": {},
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start

    app.state.metrics["total_requests"] += 1
    key = f"{request.method} {request.url.path}"
    if key not in app.state.metrics["by_endpoint"]:
        app.state.metrics["by_endpoint"][key] = {
            "count": 0,
            "avg_response_time_ms": 0.0,
        }
    entry = app.state.metrics["by_endpoint"][key]
    entry["count"] += 1
    entry["avg_response_time_ms"] = (
        (entry["avg_response_time_ms"] * (entry["count"] - 1) + duration * 1000)
        / entry["count"]
    )

    logging.info(f"[{request.method}] {request.url.path} - {response.status_code} - {duration:.3f}s")
    return response

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(assets.router, prefix="/api/v1/assets", tags=["assets"])
app.include_router(portfolio.router, prefix="/api/v1/portfolio", tags=["portfolio"])
app.include_router(prices.router, prefix="/api/v1/prices", tags=["prices"])
app.include_router(demo.router, prefix="/api/v1/demo", tags=["demo"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(exchange_rates.router, prefix="/api/v1/exchange-rates", tags=["exchange-rates"])
app.include_router(cache.router, prefix="/api/v1/cache", tags=["cache"])
app.include_router(monitoring.router, prefix="/api/v1/health", tags=["health"])
app.include_router(transactions.router, prefix="/api/v1/transactions", tags=["transactions"])
app.include_router(dividends.router, prefix="/api/v1/dividends", tags=["dividends"])

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/rate-limit-test")
@limiter.limit("10/minute")
async def rate_limit_test(request: Request):
    return {"message": "This is a rate limited endpoint"}