from src.models.transaction import Transaction
from src.repositories.transactions.repository import transaction_repository
from src.services.base import BaseService


transaction_service = BaseService[Transaction](transaction_repository)
