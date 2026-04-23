from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True)
    hashed_password = Column(String)
    full_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True)
    user_email = Column(String)
    type = Column(String)
    symbol = Column(String)
    quantity = Column(Float)
    purchase_price = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())