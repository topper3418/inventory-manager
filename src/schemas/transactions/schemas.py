from datetime import datetime

from src.schemas.common import ORMBase


class TransactionCreate(ORMBase):
    inventory_id: int
    qty_delta: int
    unit_price: float = 0
    note: str = ""


class TransactionUpdate(ORMBase):
    inventory_id: int | None = None
    qty_delta: int | None = None
    unit_price: float | None = None
    note: str | None = None


class TransactionRead(TransactionCreate):
    id: int
    created_at: datetime
