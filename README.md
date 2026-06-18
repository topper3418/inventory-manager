# Inventory Manager

Full-stack inventory management system using FastAPI + SQLAlchemy + Pydantic for the backend and React TypeScript + Ant Design for the frontend.

## Stack
- Backend: FastAPI 0.115+, SQLAlchemy 2.0, Pydantic 2.x, Python 3.11+, SQLite
- Frontend: React 19 (TypeScript), Vite, Ant Design v6
- Testing: pytest (backend), Vitest + Testing Library (frontend)

## Project Layout
- `data/` — gitignored runtime SQLite database
- `src/` — backend source (models, schemas, repositories, services, API/MCP routes)
- `frontend/` — React frontend root
- `server/` — deployment templates (systemd, nginx)
- `scripts/` — CLI scripts for development, seeding, and deployment
- `tests/` — pytest backend test suite
- `sample_data/` — seed data JSON

## Backend Scope
- SQLAlchemy models: inventory, locations (self-referential), inventory_categories (self-referential), transactions
- Layered architecture: models → repositories → services → API/MCP routers
- Transactions auto-created on inventory create (if qty > 0) and on qty update (delta)
- Cascade delete: removing an inventory item deletes its transactions
- MCP router at `/mcp/*` with per-operation CRUD permission controls via `example.config.yaml`
- Full CRUD + filter/sort/pagination on all endpoints (`/api/*` and `/mcp/*`)

## Frontend Scope
- Ant Design interface with three views:
  - **Inventory**: search, sort, view/transact/delete modals, category column, default sort by recently updated
  - **Locations**: tree view (default) + table toggle, recursive inventory totals, collapsible children, view modal with item drilldown (view + transact buttons per item), edit inside view modal
  - **Categories**: tree view (default) + table toggle, self-referential hierarchy, full CRUD

## Run in Development
- Unix/macOS: `bash scripts/dev.sh`
- Windows PowerShell: `powershell -ExecutionPolicy Bypass -File scripts/dev.ps1`

Starts:
- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`

## Run Tests
```bash
# Backend (59 tests)
source venv/bin/activate
python -m pytest tests/backend/ -v

# Frontend
cd frontend && npm test
```

## New World Deployment

Registered on the New World platform at **http://devpi.local/apps/inventory-manager/**.

- Manifest: `mcp-app.yaml` (icon, health_path, required_files, frontend, sqlite resources)
- Production config: `production.config.yaml`
- API: `/apps/inventory-manager/api/*`
- Health: `/health` (probed on the unix socket at deploy time)

Redeploy after pushing to GitHub:

```bash
# Via MCP deploy_repo on devpi.local/mcp
github_url: https://github.com/topper3418/inventory-manager.git
branch: main
```

## Key Docs
- [development.md](development.md) — setup and local dev guide
- [deployment.md](deployment.md) — Linux server deployment
- [dev_notes.md](dev_notes.md) — architecture rules
- [feature_requirements.md](feature_requirements.md) — product requirements

## Current Status
- ✅ Full backend CRUD for all four resources
- ✅ MCP router with configurable per-operation permission enforcement
- ✅ Transaction automation on inventory create/update
- ✅ Server-side filter, sort, pagination on all list endpoints
- ✅ 59 backend tests passing (categories, inventory, locations, transactions, MCP permissions)
- ✅ React frontend with all three views fully implemented
