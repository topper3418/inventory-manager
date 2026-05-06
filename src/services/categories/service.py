from src.models.category import InventoryCategory
from src.repositories.categories.repository import category_repository
from src.services.base import BaseService


category_service = BaseService[InventoryCategory](category_repository)
