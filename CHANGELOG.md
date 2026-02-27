# Changelog

## 0.1.1

### Patch Changes

- ce5019e: \* add author to package.json

## 0.1.0

### Minor Changes

- 2c24570: # feat(vscode): publishable MVP extension

  - Add `.sf` language support with TextMate syntax highlighting (tables, types, modifiers, braces)
  - Add DSL snippets (table, uuid pk, timestamps)
  - Add commands:
    - `Schema Forge: Init`
    - `Schema Forge: Generate` (optional migration name prompt)
    - `Schema Forge: Diff`
  - Execute Schema Forge CLI via `npx @xubylele/schema-forge` and stream logs to a dedicated Output Channel (`Schema Forge`)
  - Auto-detect missing `schemaforge/` project structure and offer to initialize
  - Prepare marketplace packaging (README, icon, metadata, activation events)

All notable changes to this project are documented in this file.

This changelog is managed by Changesets.

## [0.0.1] - 2026-02-27

### Added

- Official VS Code extension for Schema Forge with full language support for the `.sf` DSL
- Syntax highlighting and grammar support for Schema Forge language
- Code snippets for common Schema Forge patterns
- `Schema Forge: Init` command to initialize a new Schema Forge project
- `Schema Forge: Generate` command to generate SQL migrations
- `Schema Forge: Diff` command to diff schema changes
- Automatic prompt to initialize Schema Forge project when opening `.sf` files
- Language registration with proper file extension association
- Integrated output panel for command feedback and logging
