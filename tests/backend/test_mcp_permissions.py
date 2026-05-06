"""
Tests that MCP routes enforce CRUD permission settings.

The MCP router lives at /mcp/* and uses enforce_mcp_permission(). When a
CRUD operation is disabled in settings, the endpoint must return 403.

We monkey-patch `src.core.settings.settings.mcp_crud` so no config file
changes are needed.
"""
from unittest.mock import PropertyMock, patch

import pytest
from fastapi.testclient import TestClient

from src.core.settings import CrudConfig
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


def _all_disabled() -> CrudConfig:
    return CrudConfig(create=False, read=False, update=False, delete=False)


def _all_enabled() -> CrudConfig:
    return CrudConfig(create=True, read=True, update=True, delete=True)


@pytest.fixture()
def mcp_disabled():
    """Context where all MCP CRUD ops are disabled."""
    with patch(
        "src.mcp.permissions.settings",
        mcp_crud=_all_disabled(),
    ):
        yield


@pytest.fixture()
def mcp_enabled():
    """Context where all MCP CRUD ops are enabled."""
    with patch(
        "src.mcp.permissions.settings",
        mcp_crud=_all_enabled(),
    ):
        yield


# ---------------------------------------------------------------------------
# Inventory MCP
# ---------------------------------------------------------------------------

def test_mcp_create_inventory_disabled(mcp_disabled) -> None:
    response = client.post(
        "/mcp/inventory",
        json={"name": "X", "qty": 0, "price": 0, "description": "", "link": "", "data": ""},
    )
    assert response.status_code == 403


def test_mcp_read_inventory_disabled(mcp_disabled) -> None:
    response = client.get("/mcp/inventory")
    assert response.status_code == 403


def test_mcp_update_inventory_disabled(mcp_disabled) -> None:
    response = client.patch("/mcp/inventory/1", json={"name": "Y"})
    assert response.status_code == 403


def test_mcp_delete_inventory_disabled(mcp_disabled) -> None:
    response = client.delete("/mcp/inventory/1")
    assert response.status_code == 403


def test_mcp_inventory_enabled(mcp_enabled) -> None:
    # Create via API (not MCP) so we have a record to test read
    api_response = client.post(
        "/api/inventory",
        json={"name": "MCP Item", "qty": 0, "price": 1.0, "description": "", "link": "", "data": ""},
    )
    assert api_response.status_code == 200
    item_id = api_response.json()["id"]

    assert client.get("/mcp/inventory").status_code == 200
    assert client.get(f"/mcp/inventory/{item_id}").status_code == 200


# ---------------------------------------------------------------------------
# Locations MCP
# ---------------------------------------------------------------------------

def test_mcp_create_location_disabled(mcp_disabled) -> None:
    response = client.post("/mcp/locations", json={"name": "Zone X"})
    assert response.status_code == 403


def test_mcp_read_locations_disabled(mcp_disabled) -> None:
    response = client.get("/mcp/locations")
    assert response.status_code == 403


def test_mcp_update_location_disabled(mcp_disabled) -> None:
    response = client.patch("/mcp/locations/1", json={"name": "Y"})
    assert response.status_code == 403


def test_mcp_delete_location_disabled(mcp_disabled) -> None:
    response = client.delete("/mcp/locations/1")
    assert response.status_code == 403


def test_mcp_locations_enabled(mcp_enabled) -> None:
    loc = client.post("/api/locations", json={"name": "MCP Zone"}).json()
    assert client.get("/mcp/locations").status_code == 200
    assert client.get(f"/mcp/locations/{loc['id']}").status_code == 200


# ---------------------------------------------------------------------------
# Categories MCP
# ---------------------------------------------------------------------------

def test_mcp_create_category_disabled(mcp_disabled) -> None:
    response = client.post("/mcp/categories", json={"name": "Cat X"})
    assert response.status_code == 403


def test_mcp_read_categories_disabled(mcp_disabled) -> None:
    response = client.get("/mcp/categories")
    assert response.status_code == 403


def test_mcp_update_category_disabled(mcp_disabled) -> None:
    response = client.patch("/mcp/categories/1", json={"name": "Y"})
    assert response.status_code == 403


def test_mcp_delete_category_disabled(mcp_disabled) -> None:
    response = client.delete("/mcp/categories/1")
    assert response.status_code == 403


def test_mcp_categories_enabled(mcp_enabled) -> None:
    cat = client.post("/api/categories", json={"name": "MCP Cat"}).json()
    assert client.get("/mcp/categories").status_code == 200
    assert client.get(f"/mcp/categories/{cat['id']}").status_code == 200


# ---------------------------------------------------------------------------
# Transactions MCP
# ---------------------------------------------------------------------------

def test_mcp_create_transaction_disabled(mcp_disabled) -> None:
    response = client.post(
        "/mcp/transactions",
        json={"inventory_id": 1, "qty_delta": 1, "note": ""},
    )
    assert response.status_code == 403


def test_mcp_read_transactions_disabled(mcp_disabled) -> None:
    response = client.get("/mcp/transactions")
    assert response.status_code == 403


def test_mcp_update_transaction_disabled(mcp_disabled) -> None:
    response = client.patch("/mcp/transactions/1", json={"note": "Y"})
    assert response.status_code == 403


def test_mcp_delete_transaction_disabled(mcp_disabled) -> None:
    response = client.delete("/mcp/transactions/1")
    assert response.status_code == 403


def test_mcp_transactions_enabled(mcp_enabled) -> None:
    item = client.post(
        "/api/inventory",
        json={"name": "MCP Tx Item", "qty": 0, "price": 1.0, "description": "", "link": "", "data": ""},
    ).json()
    tx = client.post(
        "/api/transactions",
        json={"inventory_id": item["id"], "qty_delta": 1, "note": ""},
    ).json()
    assert client.get("/mcp/transactions").status_code == 200
    assert client.get(f"/mcp/transactions/{tx['id']}").status_code == 200
