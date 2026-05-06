from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.mcp.permissions import enforce_mcp_permission
from src.schemas.categories.schemas import CategoryCreate, CategoryRead, CategoryUpdate
from src.services.categories.service import category_service


def _build_router(enforce_mcp: bool) -> APIRouter:
    router = APIRouter(prefix="/categories", tags=["categories"])

    @router.post("", response_model=CategoryRead)
    def create_category(payload: CategoryCreate, db: Session = Depends(get_db)) -> CategoryRead:
        enforce_mcp_permission("create", enforce_mcp)
        created = category_service.create(db, payload.model_dump())
        return CategoryRead.model_validate(created)

    @router.get("", response_model=list[CategoryRead])
    def list_categories(db: Session = Depends(get_db)) -> list[CategoryRead]:
        enforce_mcp_permission("read", enforce_mcp)
        records = category_service.list(db)
        return [CategoryRead.model_validate(item) for item in records]

    @router.get("/{record_id}", response_model=CategoryRead)
    def get_category(record_id: int, db: Session = Depends(get_db)) -> CategoryRead:
        enforce_mcp_permission("read", enforce_mcp)
        record = category_service.get(db, record_id)
        if record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return CategoryRead.model_validate(record)

    @router.patch("/{record_id}", response_model=CategoryRead)
    def update_category(
        record_id: int,
        payload: CategoryUpdate,
        db: Session = Depends(get_db),
    ) -> CategoryRead:
        enforce_mcp_permission("update", enforce_mcp)
        updated = category_service.update(
            db,
            record_id,
            payload.model_dump(exclude_unset=True),
        )
        if updated is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return CategoryRead.model_validate(updated)

    @router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_category(record_id: int, db: Session = Depends(get_db)) -> None:
        enforce_mcp_permission("delete", enforce_mcp)
        deleted = category_service.delete(db, record_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    return router


api_router = _build_router(enforce_mcp=False)
mcp_router = _build_router(enforce_mcp=True)
