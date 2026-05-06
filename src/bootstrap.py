from sqlalchemy import inspect, text

from src.db.base import Base
from src.db.session import engine
from src import models  # noqa: F401


def _migrate_transactions_drop_unit_price_if_needed() -> None:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "transactions" not in table_names:
        return

    columns = [column["name"] for column in inspector.get_columns("transactions")]
    if "unit_price" not in columns:
        return

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE transactions_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    inventory_id INTEGER NOT NULL,
                    qty_delta INTEGER NOT NULL,
                    note VARCHAR(1024) NOT NULL DEFAULT '',
                    created_at DATETIME NOT NULL,
                    FOREIGN KEY(inventory_id) REFERENCES inventory (id)
                )
                """
            )
        )
        conn.execute(
            text(
                """
                INSERT INTO transactions_new (id, inventory_id, qty_delta, note, created_at)
                SELECT id, inventory_id, qty_delta, note, created_at FROM transactions
                """
            )
        )
        conn.execute(text("DROP TABLE transactions"))
        conn.execute(text("ALTER TABLE transactions_new RENAME TO transactions"))


def bootstrap_database() -> None:
    _migrate_transactions_drop_unit_price_if_needed()
    Base.metadata.create_all(bind=engine)
