from sqlalchemy import Column, String, Float, Date, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.sql import func
from app.database import Base
import enum

class TransactionType(str, enum.Enum):
    BUY = "buy"
    SELL = "sell"

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True)
    user_email = Column(String, ForeignKey("users.email", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String, ForeignKey("assets.id", ondelete="CASCADE"), nullable=True, index=True)
    type = Column(SQLEnum(TransactionType, values_callable=lambda x: [e.value for e in x]), nullable=False)
    symbol = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    currency = Column(String, default="EUR")
    exchange_rate = Column(Float, default=1.0)
    fees = Column(Float, default=0.0)
    total_invested = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    @property
    def type_value(self) -> str:
        return self.type.value if hasattr(self.type, 'value') else str(self.type)
