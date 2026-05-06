# Feature Requirements

This document tracks user requirements with specific behavior and interaction details.

## Product Scope
- Build a basic inventory management system.
- Mandatory stack:
  - Backend: FastAPI, SQLAlchemy, Pydantic.
  - Frontend: React (TypeScript), Ant Design.

## Core Domain Model
- Inventory item fields:
  - name, description, link, data, qty, price
  - created_at, updated_at (auto-managed)
- Inventory must link to:
  - inventory category
  - location

- Location fields:
  - name, description, coordinate
- Location must support self-referential hierarchy (parent-child tree).

- Inventory category:
  - Must be self-referential (tree/hierarchy), similar to locations.

- Transactions:
  - Fields: inventory_id, qty_delta, note, created_at
  - Auto-created when an inventory item is created with qty > 0.
  - Auto-created (delta) whenever inventory qty is updated.
  - Deleting an inventory item cascades to its transactions.
  - Exposed as full CRUD via `/api/transactions` and `/mcp/transactions`.

## Backend Functional Requirements
- Every table must expose full CRUD operations in the DB API and MCP API.
- MCP server must support enabling/disabling CRUD operations per operation (create/read/update/delete).
- Default MCP server policy must allow all CRUD operations.
- When an MCP operation is disabled, the endpoint returns HTTP 403.
- Primary keys: use auto-increment integer primary keys for all non-join tables.
- All list endpoints support: `q` (text filter), `page`, `page_size`, `sort_by`, `sort_order`.

## Frontend Functional Requirements
- Inventory page:
  - View, Transact, Delete actions per row.
  - View modal shows full item details with Edit and Transact buttons.
  - Transact modal shows before/after qty preview.
  - Supports create new inventory item.
  - Supports filtering and search.
  - Default order: recently updated first.
  - Table supports sorting by columns.
  - Category and location shown by name (not ID).

- Locations view:
  - Tree view by default, table toggle via segmented control.
  - Tree nodes are collapsible (children in Collapse panel).
  - Each location shows total inventory count including indirect descendants.
  - Edit button accessible from inside the view modal (not standalone in table/tree row).
  - View modal shows items directly at the location with View and Transact buttons per item.
  - Parent shown by name in table and form uses Select dropdown.

- Categories view:
  - Tree view by default, table toggle via segmented control.
  - Edit + Delete actions on tree cards and table rows.
  - Full CRUD for categories.
  - Parent shown by name; form uses Select dropdown.

## Non-Functional and Process Requirements
- Enforce separation of concerns in project structure and implementation.
- Keep code files within specified line count limits (250 lines Python/TS, 500 lines TSX).
- Place each backend/frontend service/component in its own directory.
- Clarify ambiguous behavior with the developer before implementation.
