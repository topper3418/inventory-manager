from typing import Any

from sqlalchemy.orm import Session

from src.models.inventory import Inventory
from src.models.transaction import Transaction
from src.repositories.inventory.repository import inventory_repository
from src.repositories.transactions.repository import transaction_repository
from src.services.base import BaseService


class TransactionService(BaseService[Transaction]):
	def __init__(self) -> None:
		super().__init__(transaction_repository)

	def create(self, db: Session, payload: dict[str, Any]) -> Transaction:
		inventory_id = int(payload.get("inventory_id"))
		qty_delta = int(payload.get("qty_delta", 0) or 0)
		inventory = inventory_repository.get(db, inventory_id)
		if inventory is None:
			raise ValueError("Inventory item not found")

		next_qty = max(0, inventory.qty + qty_delta)
		applied_delta = next_qty - inventory.qty
		if applied_delta == 0:
			raise ValueError("Transaction results in no quantity change")

		transaction_payload = {
			"inventory_id": inventory_id,
			"qty_delta": applied_delta,
			"note": payload.get("note", ""),
		}
		created = super().create(db, transaction_payload)
		inventory_repository.update(db, inventory_id, {"qty": next_qty})
		return created


transaction_service = TransactionService()
