from src.models.inventory import Inventory
from src.repositories.inventory.repository import inventory_repository
from src.services.base import BaseService


inventory_service = BaseService[Inventory](inventory_repository)
