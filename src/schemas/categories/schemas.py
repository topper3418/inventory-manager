from pydantic import Field

from src.schemas.common import ORMBase


class CategoryCreate(ORMBase):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    parent_id: int | None = None


class CategoryUpdate(ORMBase):
    name: str | None = None
    description: str | None = None
    parent_id: int | None = None


class CategoryRead(CategoryCreate):
    id: int
