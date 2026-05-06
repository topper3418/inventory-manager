from fastapi import HTTPException, status

from src.core.settings import settings


def enforce_mcp_permission(operation: str, enabled: bool) -> None:
    if not enabled:
        return

    crud = settings.mcp_crud
    allowed = {
        "create": crud.create,
        "read": crud.read,
        "update": crud.update,
        "delete": crud.delete,
    }.get(operation, False)

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"MCP {operation} operation is disabled",
        )
