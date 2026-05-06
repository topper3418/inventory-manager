from src.models.location import Location
from src.repositories.base import BaseRepository


location_repository = BaseRepository[Location](Location)
