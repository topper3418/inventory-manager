# Feature Requirements

This document tracks user requirements with specific behavior and interaction details.

## Product Scope
- Build a basic inventory management system.
- Mandatory stack:
  - Backend: FastAPI, SQLAlchemy, Pydantic.
  - Frontend: React (TypeScript), Ant Design.

## Core Domain Model
- Inventory item fields:
  - name
  - description
  - link
  - data
  - qty
  - price
- Inventory must link to:
  - inventory category
  - location

- Location fields:
  - name
  - description
  - coordinate
- Location must support self-referential hierarchy (parent-child tree).

- Inventory category:
  - Must be self-referential (tree/hierarchy), similar to locations.

- Transactions:
  - Transactions are mentioned but incomplete in source requirements.
  - Final transaction schema and behavior are pending clarification.

## Backend Functional Requirements
- Every table must expose full CRUD operations in the DB API.
- MCP server must support enabling/disabling CRUD operations per table/operation.
- Default MCP server policy must allow all CRUD operations.
- Primary keys:
  - Use auto-increment integer primary keys for all non-join tables.

## Frontend Functional Requirements
- Inventory page:
  - Supports increment quantity.
  - Supports decrement quantity.
  - Supports create new inventory item.
  - Supports drill-down into inventory details.
  - Supports filtering and search.
  - Default order: recently updated first.
  - Table must support sorting by columns.

- Locations view:
  - Must support Finder-style column navigation (Mac-style click-through hierarchy).
  - Each location card must show total inventory count including indirect descendants.

- Categories view:
  - Must support full CRUD for categories.

## Non-Functional and Process Requirements
- Enforce separation of concerns in project structure and implementation.
- Keep code files within specified line count limits.
- Place each backend/frontend service/component in its own directory.
- Clarify ambiguous behavior with the developer before implementation.
