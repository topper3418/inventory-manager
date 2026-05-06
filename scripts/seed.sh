#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$ROOT_DIR/venv"
SAMPLE_JSON="$ROOT_DIR/sample_data/sample_db.json"

if [[ ! -f "$SAMPLE_JSON" ]]; then
  echo "Missing sample data file: $SAMPLE_JSON"
  exit 1
fi

if [[ ! -d "$VENV_DIR" ]]; then
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
python -m pip install --upgrade pip >/dev/null
python -m pip install -r "$ROOT_DIR/requirements.txt" >/dev/null

cd "$ROOT_DIR"

python <<'PY'
import json
from datetime import datetime
from pathlib import Path

from src.bootstrap import bootstrap_database
from src.db.session import SessionLocal
from src.models.category import InventoryCategory
from src.models.inventory import Inventory
from src.models.location import Location
from src.models.transaction import Transaction


def parse_dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


root = Path.cwd()
sample_path = root / "sample_data" / "sample_db.json"

with sample_path.open("r", encoding="utf-8") as f:
    payload = json.load(f)

bootstrap_database()

db = SessionLocal()
try:
    db.query(Transaction).delete()
    db.query(Inventory).delete()
    db.query(InventoryCategory).delete()
    db.query(Location).delete()

    for row in payload.get("locations", []):
        db.add(
            Location(
                id=row["id"],
                name=row["name"],
                description=row.get("description", ""),
                coordinate=row.get("coordinate", ""),
                parent_id=row.get("parent_id"),
            )
        )

    for row in payload.get("inventory_categories", []):
        db.add(
            InventoryCategory(
                id=row["id"],
                name=row["name"],
                description=row.get("description", ""),
                parent_id=row.get("parent_id"),
            )
        )

    for row in payload.get("inventory", []):
        db.add(
            Inventory(
                id=row["id"],
                name=row["name"],
                description=row.get("description", ""),
                link=row.get("link", ""),
                data=row.get("data", ""),
                qty=row.get("qty", 0),
                price=row.get("price", 0),
                category_id=row.get("category_id"),
                location_id=row.get("location_id"),
                created_at=parse_dt(row["created_at"]),
                updated_at=parse_dt(row["updated_at"]),
            )
        )

    for row in payload.get("transactions", []):
        db.add(
            Transaction(
                id=row["id"],
                inventory_id=row["inventory_id"],
                qty_delta=row["qty_delta"],
                note=row.get("note", ""),
                created_at=parse_dt(row["created_at"]),
            )
        )

    db.commit()
    print("Seed completed successfully.")
finally:
    db.close()
PY
