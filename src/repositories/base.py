from typing import Any, Generic, TypeVar

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

    def list(self, db: Session) -> list[ModelT]:
        return db.query(self.model).all()

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
