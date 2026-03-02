# Changelog

## 0.2.6

### Patch Changes

- # 🚑 hotfix: simplify VS Code publishing step by removing retry action and directly using VSIX filename

## 0.2.5

### Patch Changes

- # 🚑 hotfix: install vsce globally and remove unnecessary loglevel from publish command

## 0.2.4

### Patch Changes

- hotfix

## 0.2.3

### Patch Changes

- hotfix release 3

## 0.2.2

### Patch Changes

- # release hotfix

## 0.2.1

### Patch Changes

- # Hotfix release file

## 0.2.0

### Minor Changes

- 22f5331: # ✨ feat: implement syntax diagnostics provider for schema validation

  - Added diagnostics provider to validate schema syntax in real time
  - Integrated with VSCode diagnostics API to display errors and warnings inline
  - Improved developer experience with immediate feedback on schema issues

- 22f5331: # ✨ feat: add schema parsing functionality with Web Worker support

  - Introduced `parseSchemaContent` function in `adapter.ts` to handle schema parsing.
  - Implemented fallback to synchronous parsing if Web Worker is unavailable.
  - Created `parser.worker.ts` for handling parsing in a separate thread.
  - Added error normalization utilities in `errors.ts` for structured error handling.
  - Updated `package.json` to include new dependencies and scripts for testing.
  - Added comprehensive unit tests for schema parsing and error handling.
  - Enhanced test suite structure and documentation for better clarity.

- 22f5331: # ✨ feat: implement hover provider for Schema Forge DSL constructs with tests

  - Added hover provider for Schema Forge DSL constructs
  - Implemented contextual hover content for improved authoring experience
  - Added unit tests to cover hover behavior and expected outputs

- 22f5331: # ✨ feat: add semantic validation rules for schema diagnostics

  - Added semantic validation rules to enhance schema diagnostics
  - Improved error detection beyond syntax validation (e.g. logical inconsistencies)
  - Extended diagnostics provider to surface more meaningful validation feedback

- 22f5331: # ✨ feat: add Convert To UUID PK code action provider with tests

  - Added code action provider to convert primary keys to UUID
  - Enabled quick fix for standardizing primary key types
  - Integrated with diagnostics to suggest conversion where applicable
  - Added unit tests to ensure correct behavior of the code action

- 22f5331: # ✨ feat: add code action provider for adding primary keys to tables

  - Added code action provider to suggest adding primary keys to tables
  - Enabled quick fixes to improve schema completeness and correctness
  - Integrated with diagnostics to surface relevant code actions

### Patch Changes

- 22f5331: # ♻️ refactor: centralize diagnostic codes into a single module and update references

  - Moved diagnostic codes to a centralized module for better maintainability
  - Updated all references across diagnostics, providers, and tests
  - Improved consistency and readability of diagnostic handling

- 22f5331: # 🧪 Test: add comprehensive coverage for database schema validation rules

  - Added tests for supported types rule (base types, parameterized types, and invalid types)
  - Added tests for table has columns rule, including proper errors for zero-column tables
  - Added tests for table primary key rules (missing PK, multiple PKs, and edge cases)

- 22f5331: # ✨ feat: add unit tests for Add Primary Key code action provider

  - Added unit tests for the Add Primary Key code action provider
  - Improved test coverage and reliability of code actions

- 22f5331: # ♻️ refactor: update CI workflows to remove pre-release branch and adjust changeset validation

  - Removed pre-release branch handling from CI workflows
  - Updated changeset validation to align with new release flow
  - Simplified and improved consistency of CI configuration

## 0.1.3

### Patch Changes

- 414e794: # Patch Changes

  - Updated `.github/workflows/changesets.yml` to trigger on pull requests to `develop` only, removing `pre-release` and `main` branches from the trigger list.
  - Updated `.github/workflows/release-vsix.yml` to trigger on pushes to `master` only, removing `pre-release` from the trigger list.

## 0.1.2

### Patch Changes

- - Update README.md with clearer installation instructions and quick start guide.
  - Update CONTRIBUTING.md to emphasize branch policies and development setup.

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
