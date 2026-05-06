from typing import Any

from sqlalchemy.orm import Session

from src.models.inventory import Inventory
from src.repositories.inventory.repository import inventory_repository
from src.repositories.transactions.repository import transaction_repository
from src.services.base import BaseService


class InventoryService(BaseService[Inventory]):
	def __init__(self) -> None:
		super().__init__(inventory_repository)

	def create(self, db: Session, payload: dict[str, Any]) -> Inventory:
		created = super().create(db, payload)
		initial_qty = int(payload.get("qty", 0) or 0)
		if initial_qty != 0:
			self._create_transaction(
				db,
				inventory_id=created.id,
				qty_delta=initial_qty,
				unit_price=float(payload.get("price", created.price) or 0),
				note="Initial stock",
			)
		return created

	def update(self, db: Session, record_id: int, payload: dict[str, Any]) -> Inventory | None:
		existing = self.repository.get(db, record_id)
		if existing is None:
			return None

		previous_qty = existing.qty
		updated = super().update(db, record_id, payload)
		if updated is None or "qty" not in payload:
			return updated

		delta = updated.qty - previous_qty
		if delta != 0:
			self._create_transaction(
				db,
				inventory_id=updated.id,
				qty_delta=delta,
				unit_price=float(payload.get("price", updated.price) or 0),
				note="Quantity adjustment",
			)
		return updated

	def _create_transaction(
		self,
		db: Session,
		*,
		inventory_id: int,
		qty_delta: int,
		unit_price: float,
		note: str,
	) -> None:
		transaction_repository.create(
			db,
			{
				"inventory_id": inventory_id,
				"qty_delta": qty_delta,
				"unit_price": unit_price,
				"note": note,
			},
		)


inventory_service = InventoryService()
