from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base

if TYPE_CHECKING:
    from src.models.inventory import Inventory


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(1024), default="")
    coordinate: Mapped[str] = mapped_column(String(255), default="")
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"))

    parent: Mapped[Location | None] = relationship(
        "Location", remote_side=[id], back_populates="children"
    )
    children: Mapped[list[Location]] = relationship("Location", back_populates="parent")
    inventory_items: Mapped[list[Inventory]] = relationship(back_populates="location")
