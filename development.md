# Development Guide (macOS, Linux, Windows)

## Prerequisites
- Python 3.11+
- Node.js 20+
- npm

## 1. Backend Setup
1. Create and activate virtual environment: `python -m venv venv && source venv/bin/activate`
2. Install backend dependencies: `pip install -r requirements.txt`
3. Copy `example.config.yaml` to a local config file (optional; defaults are used if absent).
4. Create local `.env` to override settings (e.g. `INV_CONFIG_PATH=local.config.yaml`).

## 2. Frontend Setup
1. Change to `frontend/`.
2. Install dependencies: `npm install`
3. Start React development server: `npm run dev`

## 3. Run in Development Mode
- Unix-like systems (macOS/Linux): `bash scripts/dev.sh`
- Windows PowerShell: `powershell -ExecutionPolicy Bypass -File scripts/dev.ps1`

## 4. Manual Run (Alternative)
- Backend:
  - `python -m venv venv`
  - `source venv/bin/activate` (or `venv\Scripts\Activate.ps1` on Windows)
  - `pip install -r requirements.txt`
  - `uvicorn src.main:app --reload --host 127.0.0.1 --port 8000`
- Frontend:
  - `cd frontend`
  - `npm install`
  - `npm run dev -- --host 127.0.0.1 --port 5173`

## 5. Seed Sample Data
Load the bundled sample dataset into the local SQLite database:
```bash
bash scripts/seed.sh
```
Sample data is defined in `sample_data/sample_db.json`.

## 6. Running Tests

### Backend (pytest)
```bash
source venv/bin/activate
python -m pytest tests/backend/ -v
```
Test files:
- `tests/backend/test_inventory_api.py` — inventory CRUD, transaction automation
- `tests/backend/test_categories_api.py` — categories CRUD (create, read, update, delete, 404s)
- `tests/backend/test_locations_api.py` — locations CRUD (create, read, update, delete, 404s)
- `tests/backend/test_transactions_api.py` — transactions CRUD, invalid FK handling
- `tests/backend/test_mcp_permissions.py` — MCP 403 enforcement for all four resources

### Frontend (Vitest)
```bash
cd frontend && npm test
```

## 7. Notes
- Keep runtime/test data inside `data/`.
- Follow rules in `dev_notes.md`.
- Clarify ambiguous requirements with the developer before implementing behavior.
