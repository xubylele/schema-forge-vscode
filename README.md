# Schema Forge

Official VS Code extension for Schema Forge DSL (.sf).

## Features

- Language detection for `.sf`
- Syntax highlighting (coming in next milestone)
- Future support for validation, formatting, and visual tooling

## Development

1. Clone repository
2. Run `npm install`
3. Run `npm run watch`
4. Press F5 in VS Code to launch Extension Host

## Roadmap

- Syntax highlighting
- AST-based validation
- Formatter
- Visual schema graph

## Changesets Workflow

This repository uses Changesets for structured versioning and changelog generation.

Flow: Feature Branch → Changeset → Merge to `pre-release` → Pre-release publish (`--pre-release`) → Promote to `main` → Stable publish.

Run `npx changeset` in feature branches to create a release note entry.

Release channels:

- `pre-release` publishes prerelease versions (`X.Y.Z-next.N`)
- `main` publishes stable versions (`X.Y.Z`)

For full contributor and release details, see CONTRIBUTING.md.

## License

MIT
