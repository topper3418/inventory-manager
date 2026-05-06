# Development Guide (macOS, Linux, Windows)

## Prerequisites
- Python 3.11+
- Node.js 20+
- npm

## 1. Backend Setup
1. Create and activate virtual environment.
2. Install backend dependencies.
3. Copy `example.config.yaml` to a local config file.
4. Create local `.env` values.

## 2. Frontend Setup
1. Change to `frontend/`.
2. Install dependencies.
3. Start React development server.

## 3. Run in Development Mode
- Unix-like systems (macOS/Linux):
  - `bash scripts/dev.sh`
- Windows PowerShell:
  - `powershell -ExecutionPolicy Bypass -File scripts/dev.ps1`

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

## 5. Notes
- Keep runtime/test data inside `data/`.
- Follow rules in `dev_notes.md`.
- Clarify ambiguous requirements with the developer before implementing behavior.
