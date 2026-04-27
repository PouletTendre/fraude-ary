
from fastapi import APIRouter, Depends, Query

from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.technical import NewsItem, NewsResponse
from app.services.news_service import get_news

router = APIRouter(prefix="/news", tags=["news"])


@router.get("", response_model=NewsResponse)
async def fetch_news(
    symbol: str = Query(..., min_length=1, pattern=r"^[A-Z0-9.\-]{1,20}$"),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    items = await get_news(symbol.upper(), limit=limit)
    news_items = [
        NewsItem(
            title=item.get("title", ""),
            link=item.get("link", ""),
            published=item.get("published"),
            source=item.get("source"),
        )
        for item in items
    ]
    return NewsResponse(symbol=symbol.upper(), items=news_items)
