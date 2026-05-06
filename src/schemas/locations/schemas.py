from pydantic import Field

from src.schemas.common import ORMBase


class LocationCreate(ORMBase):
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    coordinate: str = ""
    parent_id: int | None = None


class LocationUpdate(ORMBase):
    name: str | None = None
    description: str | None = None
    coordinate: str | None = None
    parent_id: int | None = None


class LocationRead(LocationCreate):
    id: int
