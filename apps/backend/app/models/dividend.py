from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Dividend(Base):
    __tablename__ = "dividends"
    id = Column(String, primary_key=True)
    user_email = Column(String, ForeignKey("users.email", ondelete="CASCADE"), nullable=False, index=True)
    symbol = Column(String, nullable=False, index=True)
    amount_per_share = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    currency = Column(String, default="EUR")
    date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
