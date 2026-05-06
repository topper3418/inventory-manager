from fastapi import APIRouter

from src.api.routes.categories import api_router as categories_api_router
from src.api.routes.categories import mcp_router as categories_mcp_router
from src.api.routes.inventory import api_router as inventory_api_router
from src.api.routes.inventory import mcp_router as inventory_mcp_router
from src.api.routes.locations import api_router as locations_api_router
from src.api.routes.locations import mcp_router as locations_mcp_router
from src.api.routes.transactions import api_router as transactions_api_router
from src.api.routes.transactions import mcp_router as transactions_mcp_router

api_router = APIRouter(prefix="/api")
api_router.include_router(inventory_api_router)
api_router.include_router(locations_api_router)
api_router.include_router(categories_api_router)
api_router.include_router(transactions_api_router)

mcp_router = APIRouter(prefix="/mcp")
mcp_router.include_router(inventory_mcp_router)
mcp_router.include_router(locations_mcp_router)
mcp_router.include_router(categories_mcp_router)
mcp_router.include_router(transactions_mcp_router)
