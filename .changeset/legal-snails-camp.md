---
"schema-forge": minor
---

✨ feat(vscode): add `previewSql` command for SQL generation preview

- Introduced new `schemaForge.previewSql` command to generate SQL previews based on schema differences.
- Registered the command in `package.json` with its title and metadata.
- Implemented command logic in `src/commands/previewSql.ts`.
- Updated extension activation to register and expose the new command.
- Added integration tests to validate command registration and execution behavior.