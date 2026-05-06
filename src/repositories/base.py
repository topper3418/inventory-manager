from __future__ import annotations

from typing import Any, Generic, TypeVar

from sqlalchemy import String, or_
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import Session

from src.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, model: type[ModelT]) -> None:
        self.model = model

    def create(self, db: Session, payload: dict[str, Any]) -> ModelT:
        record = self.model(**payload)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def get(self, db: Session, record_id: int) -> ModelT | None:
        return db.get(self.model, record_id)

    def list(
        self,
        db: Session,
        *,
        q: str | None = None,
        page: int = 1,
        page_size: int = 25,
        sort_by: str = "id",
        sort_order: str = "asc",
    ) -> list[ModelT]:
        query = db.query(self.model)
        if q:
            text_filters = self._build_text_filters(q)
            if text_filters:
                query = query.filter(or_(*text_filters))

        sort_column = getattr(self.model, sort_by, None)
        if sort_column is None:
            sort_column = getattr(self.model, "id")
        order_clause = sort_column.desc() if sort_order == "desc" else sort_column.asc()

        safe_page = max(1, page)
        safe_page_size = max(1, min(200, page_size))
        offset = (safe_page - 1) * safe_page_size

        return query.order_by(order_clause).offset(offset).limit(safe_page_size).all()

    def _build_text_filters(self, q: str) -> list[Any]:
        filters: list[Any] = []
        mapper = inspect(self.model)
        for column in mapper.columns:
            if isinstance(column.type, String):
                filters.append(getattr(self.model, column.name).ilike(f"%{q}%"))
        return filters

    def update(self, db: Session, record_id: int, payload: dict[str, Any]) -> ModelT | None:
        record = self.get(db, record_id)
        if record is None:
            return None
        for key, value in payload.items():
            setattr(record, key, value)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

    def delete(self, db: Session, record_id: int) -> bool:
        record = self.get(db, record_id)
        if record is None:
            return False
        db.delete(record)
        db.commit()
        return True
