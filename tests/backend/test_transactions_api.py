from fastapi.testclient import TestClient

from src.db.session import SessionLocal
from src.main import app
from src.models.category import InventoryCategory
from src.models.inventory import Inventory
from src.models.location import Location
from src.models.transaction import Transaction

client = TestClient(app)


def _reset_db() -> None:
    db = SessionLocal()
    try:
        db.query(Transaction).delete()
        db.query(Inventory).delete()
        db.query(InventoryCategory).delete()
        db.query(Location).delete()
        db.commit()
    finally:
        db.close()


def setup_function() -> None:
    _reset_db()


def teardown_function() -> None:
    _reset_db()


def _create_inventory_item(name: str = "Test Item", qty: int = 10) -> int:
    response = client.post(
        "/api/inventory",
        json={
            "name": name,
            "qty": qty,
            "price": 5.0,
            "description": "",
            "link": "",
            "data": "",
            "category_id": None,
            "location_id": None,
        },
    )
    assert response.status_code == 200
    return response.json()["id"]


def test_create_transaction() -> None:
    item_id = _create_inventory_item(qty=0)
    # Clear auto-created transaction from inventory creation (qty=0, no transaction)
    response = client.post(
        "/api/transactions",
        json={"inventory_id": item_id, "qty_delta": 5, "note": "Received stock"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["inventory_id"] == item_id
    assert data["qty_delta"] == 5
    assert data["note"] == "Received stock"
    assert "id" in data
    assert "created_at" in data


def test_create_transaction_invalid_inventory() -> None:
    response = client.post(
        "/api/transactions",
        json={"inventory_id": 999999, "qty_delta": 1, "note": ""},
    )
    assert response.status_code == 400


def test_list_transactions() -> None:
    item_id = _create_inventory_item(qty=5)
    client.post("/api/transactions", json={"inventory_id": item_id, "qty_delta": 3, "note": ""})
    client.post("/api/transactions", json={"inventory_id": item_id, "qty_delta": -1, "note": ""})

    response = client.get("/api/transactions")
    assert response.status_code == 200
    # At least the two we created plus the initial one from create_inventory (qty=5)
    assert len(response.json()) >= 3


def test_list_transactions_filter_and_pagination() -> None:
    item_id = _create_inventory_item(qty=0)
    for _ in range(3):
        client.post("/api/transactions", json={"inventory_id": item_id, "qty_delta": 1, "note": ""})

    response = client.get("/api/transactions?page=1&page_size=2&sort_by=id&sort_order=asc")
    assert response.status_code == 200
    assert len(response.json()) <= 2


def test_get_transaction() -> None:
    item_id = _create_inventory_item(qty=0)
    created = client.post(
        "/api/transactions",
        json={"inventory_id": item_id, "qty_delta": 7, "note": ""},
    ).json()
    response = client.get(f"/api/transactions/{created['id']}")
    assert response.status_code == 200
    assert response.json()["qty_delta"] == 7


def test_get_transaction_not_found() -> None:
    response = client.get("/api/transactions/999999")
    assert response.status_code == 404


def test_update_transaction() -> None:
    item_id = _create_inventory_item(qty=0)
    created = client.post(
        "/api/transactions",
        json={"inventory_id": item_id, "qty_delta": 2, "note": "Original"},
    ).json()
    response = client.patch(f"/api/transactions/{created['id']}", json={"note": "Updated"})
    assert response.status_code == 200
    assert response.json()["note"] == "Updated"


def test_update_transaction_not_found() -> None:
    response = client.patch("/api/transactions/999999", json={"note": "X"})
    assert response.status_code == 404


def test_delete_transaction() -> None:
    item_id = _create_inventory_item(qty=0)
    created = client.post(
        "/api/transactions",
        json={"inventory_id": item_id, "qty_delta": 1, "note": ""},
    ).json()
    delete_response = client.delete(f"/api/transactions/{created['id']}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/transactions/{created['id']}")
    assert get_response.status_code == 404


def test_delete_transaction_not_found() -> None:
    response = client.delete("/api/transactions/999999")
    assert response.status_code == 404
