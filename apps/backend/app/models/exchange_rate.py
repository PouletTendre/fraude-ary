from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    currency = Column(String, primary_key=True)
    rate_vs_usd = Column(Float, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
