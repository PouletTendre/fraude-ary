from typing import Generic, TypeVar, List
from pydantic import BaseModel

T = TypeVar("T")


class PaginationParams(BaseModel):
    limit: int = 50
    offset: int = 0


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    total: int
    limit: int
    offset: int
