from sqlalchemy import Column, String, Float, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
import enum
import uuid

class AlertCondition(str, enum.Enum):
    ABOVE = "above"
    BELOW = "below"

class PriceAlert(Base):
    __tablename__ = "price_alerts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_email = Column(String, nullable=False, index=True)
    symbol = Column(String, nullable=False, index=True)
    target_price = Column(Float, nullable=False)
    condition = Column(SQLEnum(AlertCondition), nullable=False)
    currency = Column(String, nullable=False, default="EUR")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshots"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_email = Column(String, nullable=False, index=True)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    total_value = Column(Float, nullable=False)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_email = Column(String, nullable=False, index=True)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
