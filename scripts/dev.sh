#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="$ROOT_DIR/venv"

cd "$ROOT_DIR"

if [[ ! -d "$VENV_DIR" ]]; then
	python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

cd "$ROOT_DIR/frontend"
npm install

cd "$ROOT_DIR"
mkdir -p data

cleanup() {
	if [[ -n "${API_PID:-}" ]]; then
		kill "$API_PID" >/dev/null 2>&1 || true
	fi
	if [[ -n "${WEB_PID:-}" ]]; then
		kill "$WEB_PID" >/dev/null 2>&1 || true
	fi
}

trap cleanup EXIT INT TERM

source "$VENV_DIR/bin/activate"
uvicorn src.main:app --reload --host 127.0.0.1 --port 8000 &
API_PID=$!

cd "$ROOT_DIR/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 &
WEB_PID=$!

wait "$API_PID" "$WEB_PID"
