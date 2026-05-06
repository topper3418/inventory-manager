from sqlalchemy.orm import Session

from src.models.inventory import Inventory
from src.repositories.base import BaseRepository


class InventoryRepository(BaseRepository[Inventory]):
	def __init__(self) -> None:
		super().__init__(Inventory)

	def list(self, db: Session) -> list[Inventory]:
		return db.query(Inventory).order_by(Inventory.updated_at.desc()).all()


inventory_repository = InventoryRepository()
