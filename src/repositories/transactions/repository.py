from src.models.transaction import Transaction
from src.repositories.base import BaseRepository


transaction_repository = BaseRepository[Transaction](Transaction)
