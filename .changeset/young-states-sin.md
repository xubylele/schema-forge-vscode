---
"schema-forge": minor
---

✨ feat(vscode): implement completion provider for Schema Forge DSL

- Added `SchemaForgeCompletionProvider` to provide autocomplete suggestions for the Schema Forge DSL.
- Implemented a completion catalog including:
  - Base types
  - Parameterized types
  - Constraint modifiers
  - Default value suggestions
- Registered the completion provider during extension activation.
- Added unit tests to validate suggestion accuracy and provider behavior.