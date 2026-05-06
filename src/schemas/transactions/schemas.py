from datetime import datetime

from src.schemas.common import ORMBase


class TransactionCreate(ORMBase):
    inventory_id: int
    qty_delta: int
    note: str = ""


class TransactionUpdate(ORMBase):
    inventory_id: int | None = None
    qty_delta: int | None = None
    note: str | None = None


class TransactionRead(TransactionCreate):
    id: int
    created_at: datetime
