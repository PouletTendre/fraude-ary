from fastapi import APIRouter

router = APIRouter()

@router.post("/refresh")
async def refresh_prices():
    return {"status": "ok", "prices_updated": 0}