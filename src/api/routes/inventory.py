from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.mcp.permissions import enforce_mcp_permission
from src.schemas.inventory.schemas import InventoryCreate, InventoryRead, InventoryUpdate
from src.services.inventory.service import inventory_service


def _build_router(enforce_mcp: bool) -> APIRouter:
    router = APIRouter(prefix="/inventory", tags=["inventory"])

    @router.post("", response_model=InventoryRead)
    def create_inventory(payload: InventoryCreate, db: Session = Depends(get_db)) -> InventoryRead:
        enforce_mcp_permission("create", enforce_mcp)
        created = inventory_service.create(db, payload.model_dump())
        return InventoryRead.model_validate(created)

    @router.get("", response_model=list[InventoryRead])
    def list_inventory(db: Session = Depends(get_db)) -> list[InventoryRead]:
        enforce_mcp_permission("read", enforce_mcp)
        records = inventory_service.list(db)
        return [InventoryRead.model_validate(item) for item in records]

    @router.get("/{record_id}", response_model=InventoryRead)
    def get_inventory(record_id: int, db: Session = Depends(get_db)) -> InventoryRead:
        enforce_mcp_permission("read", enforce_mcp)
        record = inventory_service.get(db, record_id)
        if record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return InventoryRead.model_validate(record)

    @router.patch("/{record_id}", response_model=InventoryRead)
    def update_inventory(
        record_id: int,
        payload: InventoryUpdate,
        db: Session = Depends(get_db),
    ) -> InventoryRead:
        enforce_mcp_permission("update", enforce_mcp)
        updated = inventory_service.update(
            db,
            record_id,
            payload.model_dump(exclude_unset=True),
        )
        if updated is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return InventoryRead.model_validate(updated)

    @router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_inventory(record_id: int, db: Session = Depends(get_db)) -> None:
        enforce_mcp_permission("delete", enforce_mcp)
        deleted = inventory_service.delete(db, record_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    return router


api_router = _build_router(enforce_mcp=False)
mcp_router = _build_router(enforce_mcp=True)
