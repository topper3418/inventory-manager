from src.db.base import Base
from src.db.session import engine
from src import models  # noqa: F401


def bootstrap_database() -> None:
    Base.metadata.create_all(bind=engine)
