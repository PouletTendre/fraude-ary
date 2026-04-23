from pydantic import EmailStr
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None