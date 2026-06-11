from sqlalchemy import Column, String, Float, Date, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from app.database import Base


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(String, primary_key=True)
    user_email = Column(
        String,
        ForeignKey("users.email", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plaid_item_id = Column(String, nullable=False, unique=True, index=True)
    plaid_account_id = Column(String, nullable=False, unique=True)
    access_token_encrypted = Column(String, nullable=False)  # encrypted with Fernet
    institution_name = Column(String, nullable=False)
    account_name = Column(String, nullable=False)
    account_type = Column(String, nullable=False)  # checking, savings, credit
    balance_current = Column(Float, default=0.0)
    balance_available = Column(Float, default=0.0)
    currency = Column(String, default="EUR")
    last_synced = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id = Column(String, primary_key=True)
    account_id = Column(
        String,
        ForeignKey("bank_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    plaid_transaction_id = Column(String, nullable=False, unique=True)
    date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    name = Column(String, nullable=False)
    category = Column(JSON, nullable=True)  # array of strings
    pending = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
