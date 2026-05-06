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


def test_create_category() -> None:
    response = client.post("/api/categories", json={"name": "Electronics", "description": "Electronic goods"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Electronics"
    assert data["description"] == "Electronic goods"
    assert data["parent_id"] is None
    assert "id" in data


def test_create_category_with_parent() -> None:
    parent = client.post("/api/categories", json={"name": "Parent"}).json()
    child = client.post(
        "/api/categories",
        json={"name": "Child", "parent_id": parent["id"]},
    ).json()
    assert child["parent_id"] == parent["id"]


def test_list_categories() -> None:
    client.post("/api/categories", json={"name": "Cat A"})
    client.post("/api/categories", json={"name": "Cat B"})
    response = client.get("/api/categories")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_categories_filter_and_pagination() -> None:
    client.post("/api/categories", json={"name": "Alpha"})
    client.post("/api/categories", json={"name": "Beta"})
    client.post("/api/categories", json={"name": "Alpha Two"})

    response = client.get("/api/categories?q=Alpha&page=1&page_size=10&sort_by=name&sort_order=asc")
    assert response.status_code == 200
    names = [r["name"] for r in response.json()]
    assert all("alpha" in n.lower() for n in names)
    assert "Beta" not in names


def test_get_category() -> None:
    created = client.post("/api/categories", json={"name": "Gadgets"}).json()
    response = client.get(f"/api/categories/{created['id']}")
    assert response.status_code == 200
    assert response.json()["name"] == "Gadgets"


def test_get_category_not_found() -> None:
    response = client.get("/api/categories/999999")
    assert response.status_code == 404


def test_update_category() -> None:
    created = client.post("/api/categories", json={"name": "Old Name"}).json()
    response = client.patch(
        f"/api/categories/{created['id']}",
        json={"name": "New Name", "description": "Updated"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["description"] == "Updated"


def test_update_category_not_found() -> None:
    response = client.patch("/api/categories/999999", json={"name": "X"})
    assert response.status_code == 404


def test_delete_category() -> None:
    created = client.post("/api/categories", json={"name": "To Delete"}).json()
    delete_response = client.delete(f"/api/categories/{created['id']}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/categories/{created['id']}")
    assert get_response.status_code == 404


def test_delete_category_not_found() -> None:
    response = client.delete("/api/categories/999999")
    assert response.status_code == 404
