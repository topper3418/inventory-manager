from src.models.category import InventoryCategory
from src.repositories.base import BaseRepository


category_repository = BaseRepository[InventoryCategory](InventoryCategory)
