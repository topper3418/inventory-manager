from sqlalchemy.orm import Session

from src.models.inventory import Inventory
from src.repositories.base import BaseRepository


class InventoryRepository(BaseRepository[Inventory]):
	def __init__(self) -> None:
		super().__init__(Inventory)

	def list(
		self,
		db: Session,
		*,
		q: str | None = None,
		page: int = 1,
		page_size: int = 25,
		sort_by: str = "updated_at",
		sort_order: str = "desc",
	) -> list[Inventory]:
		return super().list(
			db,
			q=q,
			page=page,
			page_size=page_size,
			sort_by=sort_by,
			sort_order=sort_order,
		)


inventory_repository = InventoryRepository()
