from typing import Any, Generic, TypeVar

from sqlalchemy.orm import Session

from src.db.base import Base
from src.repositories.base import BaseRepository

ModelT = TypeVar("ModelT", bound=Base)


class BaseService(Generic[ModelT]):
    def __init__(self, repository: BaseRepository[ModelT]) -> None:
        self.repository = repository

    def create(self, db: Session, payload: dict[str, Any]) -> ModelT:
        return self.repository.create(db, payload)

    def get(self, db: Session, record_id: int) -> ModelT | None:
        return self.repository.get(db, record_id)

    def list(self, db: Session) -> list[ModelT]:
        return self.repository.list(db)

    def update(self, db: Session, record_id: int, payload: dict[str, Any]) -> ModelT | None:
        return self.repository.update(db, record_id, payload)

    def delete(self, db: Session, record_id: int) -> bool:
        return self.repository.delete(db, record_id)
