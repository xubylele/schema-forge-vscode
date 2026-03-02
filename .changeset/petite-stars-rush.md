---
"schema-forge": patch
---

# 🧪 Test: add comprehensive coverage for database schema validation rules

- Added tests for supported types rule (base types, parameterized types, and invalid types)
- Added tests for table has columns rule, including proper errors for zero-column tables
- Added tests for table primary key rules (missing PK, multiple PKs, and edge cases)
