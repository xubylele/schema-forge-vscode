---
"schema-forge": minor
---

# ✨ feat: add schema parsing functionality with Web Worker support

- Introduced `parseSchemaContent` function in `adapter.ts` to handle schema parsing.
- Implemented fallback to synchronous parsing if Web Worker is unavailable.
- Created `parser.worker.ts` for handling parsing in a separate thread.
- Added error normalization utilities in `errors.ts` for structured error handling.
- Updated `package.json` to include new dependencies and scripts for testing.
- Added comprehensive unit tests for schema parsing and error handling.
- Enhanced test suite structure and documentation for better clarity.
