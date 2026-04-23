from fastapi import APIRouter, status

from app.services.cache_service import cache_service

router = APIRouter()


@router.get("/stats")
async def get_cache_stats():
    info = await cache_service.info()
    dbsize = await cache_service.dbsize()
    return {
        "status": "connected" if cache_service._redis else "disconnected",
        "dbsize": dbsize,
        "info": info,
    }


@router.post("/clear", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cache():
    await cache_service.clear()
    return None
