from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional["UserResponse"] = None

class UserResponse(BaseModel):
    email: str
    full_name: Optional[str] = None