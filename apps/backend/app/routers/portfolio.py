from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User

router = APIRouter()

@router.get("/summary")
async def get_portfolio_summary(
    type: str | None = Query(None),
    db: AsyncSession = Depends(get_db)
):
    return {
        "total_value": 0,
        "assets": [],
        "performance": {"daily": 0, "monthly": 0, "yearly": 0},
        "allocation": {"crypto": 0, "stocks": 0, "real_estate": 0}
    }