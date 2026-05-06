from datetime import datetime

from pydantic import Field

from src.schemas.common import ORMBase


class InventoryCreate(ORMBase):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    link: str = ""
    data: str = ""
    qty: int = 0
    price: float = 0
    category_id: int | None = None
    location_id: int | None = None


class InventoryUpdate(ORMBase):
    name: str | None = None
    description: str | None = None
    link: str | None = None
    data: str | None = None
    qty: int | None = None
    price: float | None = None
    category_id: int | None = None
    location_id: int | None = None


class InventoryRead(InventoryCreate):
    id: int
    created_at: datetime
    updated_at: datetime
