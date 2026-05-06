# Inventory Manager

Basic inventory management system using FastAPI + SQLAlchemy + Pydantic for backend and React TypeScript + Ant Design for frontend.

## Stack
- Backend: FastAPI, SQLAlchemy, Pydantic
- Frontend: React (TypeScript), Ant Design

## Project Layout
- data: gitignored runtime data
- src: source code
- frontend: React frontend root
- server: deployment templates (systemd, nginx)
- scripts: CLI scripts for development and deployment

## Backend Scope
- SQLAlchemy models:
	- inventory
	- locations (self-referential)
	- inventory_categories (self-referential)
	- transactions
- Layered backend organization:
	- schemas
	- repositories
	- services
	- API and MCP routers
- MCP CRUD operation controls are read from `example.config.yaml`.

## Frontend Scope
- Ant Design based interface with three views:
	- Inventory: create, search, sort, increment/decrement, delete.
	- Locations: hierarchy navigation and recursive total counts.
	- Categories: CRUD management.

## Run in Development
- Unix/macOS:
	- `bash scripts/dev.sh`
- Windows PowerShell:
	- `powershell -ExecutionPolicy Bypass -File scripts/dev.ps1`

This starts:
- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:5173`

## Key Docs
- dev_notes.md
- feature_requirements.md
- development.md
- deployment.md

## Current Status
Full scaffold implemented for backend and frontend with baseline CRUD behavior.
