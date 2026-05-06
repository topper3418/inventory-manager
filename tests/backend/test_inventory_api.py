import pytest
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


def _create_item(name: str = "Widget", qty: int = 5, price: float = 1.0) -> dict:
    response = client.post(
        "/api/inventory",
        json={
            "name": name,
            "qty": qty,
            "price": price,
            "description": "",
            "link": "",
            "data": "",
            "category_id": None,
            "location_id": None,
        },
    )
    assert response.status_code == 200
    return response.json()


def test_create_inventory_generates_initial_transaction() -> None:
    response = client.post(
        "/api/inventory",
        json={
            "name": "Widget A",
            "qty": 10,
            "price": 4.25,
            "description": "",
            "link": "",
            "data": "",
            "category_id": None,
            "location_id": None,
        },
    )
    assert response.status_code == 200
    record_id = response.json()["id"]

    tx_response = client.get("/api/transactions")
    assert tx_response.status_code == 200
    transactions = tx_response.json()
    assert len(transactions) == 1
    assert transactions[0]["inventory_id"] == record_id
    assert transactions[0]["qty_delta"] == 10


def test_update_inventory_qty_generates_delta_transaction() -> None:
    create_response = client.post(
        "/api/inventory",
        json={
            "name": "Widget B",
            "qty": 5,
            "price": 7,
            "description": "",
            "link": "",
            "data": "",
            "category_id": None,
            "location_id": None,
        },
    )
    assert create_response.status_code == 200
    record_id = create_response.json()["id"]

    update_response = client.patch(f"/api/inventory/{record_id}", json={"qty": 8})
    assert update_response.status_code == 200

    tx_response = client.get("/api/transactions?sort_by=id&sort_order=asc")
    assert tx_response.status_code == 200
    transactions = tx_response.json()
    assert len(transactions) == 2
    assert transactions[0]["qty_delta"] == 5
    assert transactions[1]["qty_delta"] == 3


def test_inventory_list_supports_filter_and_pagination() -> None:
    payloads = [
        {
            "name": "Alpha Box",
            "qty": 1,
            "price": 1,
            "description": "desc",
            "link": "",
            "data": "",
            "category_id": None,
            "location_id": None,
        },
        {
            "name": "Beta Box",
            "qty": 2,
            "price": 2,
            "description": "desc",
            "link": "",
            "data": "",
            "category_id": None,
            "location_id": None,
        },
    ]
    for payload in payloads:
        post_response = client.post("/api/inventory", json=payload)
        assert post_response.status_code == 200

    response = client.get(
        "/api/inventory?q=Alpha&page=1&page_size=1&sort_by=name&sort_order=asc"
    )
    assert response.status_code == 200
    rows = response.json()
    assert len(rows) == 1
    assert rows[0]["name"] == "Alpha Box"


def test_get_inventory_by_id() -> None:
    item = _create_item(name="Lookup Item")
    response = client.get(f"/api/inventory/{item['id']}")
    assert response.status_code == 200
    assert response.json()["name"] == "Lookup Item"


def test_get_inventory_not_found() -> None:
    response = client.get("/api/inventory/999999")
    assert response.status_code == 404


def test_update_inventory_fields() -> None:
    item = _create_item(name="Old Name", price=1.0)
    response = client.patch(
        f"/api/inventory/{item['id']}",
        json={"name": "New Name", "price": 9.99},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["price"] == pytest.approx(9.99)


def test_update_inventory_not_found() -> None:
    response = client.patch("/api/inventory/999999", json={"name": "X"})
    assert response.status_code == 404


def test_delete_inventory() -> None:
    item = _create_item(name="Delete Me")
    delete_response = client.delete(f"/api/inventory/{item['id']}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/inventory/{item['id']}")
    assert get_response.status_code == 404


def test_delete_inventory_not_found() -> None:
    response = client.delete("/api/inventory/999999")
    assert response.status_code == 404
