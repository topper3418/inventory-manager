# Development Notes

These rules are mandatory unless explicitly overridden by the developer.

## Architecture and Style
- Practice proper separation of concerns.
- Follow PEP 8 for Python code.
- Keep files small:
  - Max 250 lines per Python or TypeScript file.
  - Max 500 lines per TSX component file.
- Each frontend/backend component or service must have its own directory.

## Data and API Rules
- Every table must support CRUD operations in the DB API, even if some are not currently used.
- MCP server CRUD capabilities must be configurable per operation.
  - Default: all CRUD operations enabled.
  - Must support selectively disabling any operation.
- Primary key for all tables (except join tables) must be an incrementing integer.
- Tables/columns are not limited to only those listed in the initial feature description.

## Collaboration Rule
- If a feature is ambiguous (methodology or edge cases), ask the developer before implementation.
