from src.models.location import Location
from src.repositories.locations.repository import location_repository
from src.services.base import BaseService


location_service = BaseService[Location](location_repository)
