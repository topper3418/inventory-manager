from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.db.session import get_db
from src.mcp.permissions import enforce_mcp_permission
from src.schemas.transactions.schemas import (
    TransactionCreate,
    TransactionRead,
    TransactionUpdate,
)
from src.services.transactions.service import transaction_service


def _build_router(enforce_mcp: bool) -> APIRouter:
    router = APIRouter(prefix="/transactions", tags=["transactions"])

    @router.post("", response_model=TransactionRead)
    def create_transaction(
        payload: TransactionCreate,
        db: Session = Depends(get_db),
    ) -> TransactionRead:
        enforce_mcp_permission("create", enforce_mcp)
        created = transaction_service.create(db, payload.model_dump())
        return TransactionRead.model_validate(created)

    @router.get("", response_model=list[TransactionRead])
    def list_transactions(
        q: str | None = Query(default=None),
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=25, ge=1, le=200),
        sort_by: str = Query(default="id"),
        sort_order: str = Query(default="asc", pattern="^(asc|desc)$"),
        db: Session = Depends(get_db),
    ) -> list[TransactionRead]:
        enforce_mcp_permission("read", enforce_mcp)
        records = transaction_service.list(
            db,
            q=q,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )
        return [TransactionRead.model_validate(item) for item in records]

    @router.get("/{record_id}", response_model=TransactionRead)
    def get_transaction(record_id: int, db: Session = Depends(get_db)) -> TransactionRead:
        enforce_mcp_permission("read", enforce_mcp)
        record = transaction_service.get(db, record_id)
        if record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return TransactionRead.model_validate(record)

    @router.patch("/{record_id}", response_model=TransactionRead)
    def update_transaction(
        record_id: int,
        payload: TransactionUpdate,
        db: Session = Depends(get_db),
    ) -> TransactionRead:
        enforce_mcp_permission("update", enforce_mcp)
        updated = transaction_service.update(
            db,
            record_id,
            payload.model_dump(exclude_unset=True),
        )
        if updated is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
        return TransactionRead.model_validate(updated)

    @router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_transaction(record_id: int, db: Session = Depends(get_db)) -> None:
        enforce_mcp_permission("delete", enforce_mcp)
        deleted = transaction_service.delete(db, record_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    return router


api_router = _build_router(enforce_mcp=False)
mcp_router = _build_router(enforce_mcp=True)
