from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base

if TYPE_CHECKING:
    from src.models.category import InventoryCategory
    from src.models.location import Location
    from src.models.transaction import Transaction


class Inventory(Base):
    __tablename__ = "inventory"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(1024), default="")
    link: Mapped[str] = mapped_column(String(1024), default="")
    data: Mapped[str] = mapped_column(String(4096), default="")
    qty: Mapped[int] = mapped_column(Integer, default=0)
    price: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
    category_id: Mapped[int | None] = mapped_column(ForeignKey("inventory_categories.id"))
    location_id: Mapped[int | None] = mapped_column(ForeignKey("locations.id"))

    category: Mapped[InventoryCategory | None] = relationship(back_populates="inventory_items")
    location: Mapped[Location | None] = relationship(back_populates="inventory_items")
    transactions: Mapped[list[Transaction]] = relationship(
        back_populates="inventory", cascade="all, delete-orphan"
    )
