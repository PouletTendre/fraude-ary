from sqlalchemy import Column, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
import enum

class AssetType(str, enum.Enum):
    CRYPTO = "crypto"
    STOCKS = "stocks"
    REAL_ESTATE = "real_estate"

class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True)
    user_email = Column(String, nullable=False, index=True)
    type = Column(SQLEnum(AssetType), nullable=False, index=True)
    symbol = Column(String, nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    purchase_price = Column(Float, nullable=False)
    purchase_price_eur = Column(Float, default=0.0)
    current_price = Column(Float, default=0.0)
    purchase_date = Column(String, nullable=True)
    currency = Column(String, default="EUR")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class PriceHistory(Base):
    __tablename__ = "price_history"
    id = Column(String, primary_key=True)
    asset_id = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)