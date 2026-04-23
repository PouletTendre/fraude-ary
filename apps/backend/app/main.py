from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import auth, assets, portfolio, prices, demo
from app.services.cache_service import cache_service
from app.config import settings

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

@asynccontextmanager
async def lifespan(app: FastAPI):
    await cache_service.connect()
    yield
    await cache_service.disconnect()

app = FastAPI(title="Fraude-Ary API", version="0.1.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(assets.router, prefix="/api/v1/assets", tags=["assets"])
app.include_router(portfolio.router, prefix="/api/v1/portfolio", tags=["portfolio"])
app.include_router(prices.router, prefix="/api/v1/prices", tags=["prices"])
app.include_router(demo.router, prefix="/api/v1/demo", tags=["demo"])

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/rate-limit-test")
@limiter.limit("10/minute")
async def rate_limit_test(request: Request):
    return {"message": "This is a rate limited endpoint"}