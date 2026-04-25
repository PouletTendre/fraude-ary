from fastapi import APIRouter, Depends, status

from app.services.cache_service import cache_service
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/stats")
async def get_cache_stats(current_user: User = Depends(get_current_user)):
    info = await cache_service.info()
    dbsize = await cache_service.dbsize()
    return {
        "status": "connected" if cache_service._redis else "disconnected",
        "dbsize": dbsize,
        "info": info,
    }


@router.post("/clear", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cache(current_user: User = Depends(get_current_user)):
    await cache_service.clear()
    return None
