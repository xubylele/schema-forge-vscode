---
"schema-forge": minor
---

# feat(vscode): publishable MVP extension

* Add `.sf` language support with TextMate syntax highlighting (tables, types, modifiers, braces)
* Add DSL snippets (table, uuid pk, timestamps)
* Add commands:
  * `Schema Forge: Init`
  * `Schema Forge: Generate` (optional migration name prompt)
  * `Schema Forge: Diff`
* Execute Schema Forge CLI via `npx @xubylele/schema-forge` and stream logs to a dedicated Output Channel (`Schema Forge`)
* Auto-detect missing `schemaforge/` project structure and offer to initialize
* Prepare marketplace packaging (README, icon, metadata, activation events)
