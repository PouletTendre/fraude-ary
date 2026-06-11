from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime


class LinkTokenRequest(BaseModel):
    pass


class LinkTokenResponse(BaseModel):
    link_token: str
    expiration: str


class ExchangeTokenRequest(BaseModel):
    public_token: str


class ExchangeTokenResponse(BaseModel):
    item_id: str
    accounts_count: int


class BankAccountResponse(BaseModel):
    id: str
    institution_name: str
    account_name: str
    account_type: str
    balance_current: float
    balance_available: float
    currency: str
    last_synced: Optional[datetime] = None


class BankTransactionResponse(BaseModel):
    id: str
    account_id: str
    date: date
    amount: float
    name: str
    category: Optional[List[str]] = None
    pending: bool


class SyncResponse(BaseModel):
    added: int
    modified: int
    removed: int
    next_cursor: Optional[str] = None
