from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base

if TYPE_CHECKING:
    from src.models.inventory import Inventory


class InventoryCategory(Base):
    __tablename__ = "inventory_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(1024), default="")
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("inventory_categories.id"))

    parent: Mapped[InventoryCategory | None] = relationship(
        "InventoryCategory", remote_side=[id], back_populates="children"
    )
    children: Mapped[list[InventoryCategory]] = relationship(
        "InventoryCategory", back_populates="parent"
    )
    inventory_items: Mapped[list[Inventory]] = relationship(back_populates="category")
