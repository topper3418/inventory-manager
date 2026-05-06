from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.mcp.permissions import enforce_mcp_permission
from src.schemas.locations.schemas import LocationCreate, LocationRead, LocationUpdate
from src.services.locations.service import location_service


def _build_router(enforce_mcp: bool) -> APIRouter:
    router = APIRouter(prefix="/locations", tags=["locations"])

    @router.post("", response_model=LocationRead)
    def create_location(payload: LocationCreate, db: Session = Depends(get_db)) -> LocationRead:
        enforce_mcp_permission("create", enforce_mcp)
        created = location_service.create(db, payload.model_dump())
        return LocationRead.model_validate(created)

    @router.get("", response_model=list[LocationRead])
    def list_locations(
        q: str | None = Query(default=None),
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=25, ge=1, le=200),
        sort_by: str = Query(default="id"),
        sort_order: str = Query(default="asc", pattern="^(asc|desc)$"),
        db: Session = Depends(get_db),
    ) -> list[LocationRead]:
        enforce_mcp_permission("read", enforce_mcp)
        records = location_service.list(
            db,
            q=q,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return [LocationRead.model_validate(item) for item in records]

    @router.get("/{record_id}", response_model=LocationRead)
    def get_location(record_id: int, db: Session = Depends(get_db)) -> LocationRead:
        enforce_mcp_permission("read", enforce_mcp)
        record = location_service.get(db, record_id)
        if record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return LocationRead.model_validate(record)

    @router.patch("/{record_id}", response_model=LocationRead)
    def update_location(
        record_id: int,
        payload: LocationUpdate,
        db: Session = Depends(get_db),
    ) -> LocationRead:
        enforce_mcp_permission("update", enforce_mcp)
        updated = location_service.update(
            db,
            record_id,
            payload.model_dump(exclude_unset=True),
        )
        if updated is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return LocationRead.model_validate(updated)

    @router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_location(record_id: int, db: Session = Depends(get_db)) -> None:
        enforce_mcp_permission("delete", enforce_mcp)
        deleted = location_service.delete(db, record_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    return router


api_router = _build_router(enforce_mcp=False)
mcp_router = _build_router(enforce_mcp=True)
