from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    id: str
    user_email: str
    message: str
    is_read: bool
    created_at: Optional[datetime] = None
