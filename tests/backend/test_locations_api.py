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


def test_create_location() -> None:
    response = client.post(
        "/api/locations",
        json={"name": "Warehouse A", "description": "Main warehouse", "coordinate": "A1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Warehouse A"
    assert data["coordinate"] == "A1"
    assert data["parent_id"] is None
    assert "id" in data


def test_create_location_with_parent() -> None:
    parent = client.post("/api/locations", json={"name": "Building 1"}).json()
    child = client.post(
        "/api/locations",
        json={"name": "Room 101", "parent_id": parent["id"]},
    ).json()
    assert child["parent_id"] == parent["id"]


def test_list_locations() -> None:
    client.post("/api/locations", json={"name": "Loc A"})
    client.post("/api/locations", json={"name": "Loc B"})
    response = client.get("/api/locations")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_locations_filter_and_pagination() -> None:
    client.post("/api/locations", json={"name": "Zone Alpha"})
    client.post("/api/locations", json={"name": "Zone Beta"})
    client.post("/api/locations", json={"name": "Alpha Shelf"})

    response = client.get("/api/locations?q=Alpha&page=1&page_size=10&sort_by=name&sort_order=asc")
    assert response.status_code == 200
    names = [r["name"] for r in response.json()]
    assert all("alpha" in n.lower() for n in names)
    assert "Zone Beta" not in names


def test_get_location() -> None:
    created = client.post("/api/locations", json={"name": "Shelf 5"}).json()
    response = client.get(f"/api/locations/{created['id']}")
    assert response.status_code == 200
    assert response.json()["name"] == "Shelf 5"


def test_get_location_not_found() -> None:
    response = client.get("/api/locations/999999")
    assert response.status_code == 404


def test_update_location() -> None:
    created = client.post("/api/locations", json={"name": "Old Loc"}).json()
    response = client.patch(
        f"/api/locations/{created['id']}",
        json={"name": "New Loc", "coordinate": "B2"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Loc"
    assert data["coordinate"] == "B2"


def test_update_location_not_found() -> None:
    response = client.patch("/api/locations/999999", json={"name": "X"})
    assert response.status_code == 404


def test_delete_location() -> None:
    created = client.post("/api/locations", json={"name": "To Delete"}).json()
    delete_response = client.delete(f"/api/locations/{created['id']}")
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/locations/{created['id']}")
    assert get_response.status_code == 404


def test_delete_location_not_found() -> None:
    response = client.delete("/api/locations/999999")
    assert response.status_code == 404
