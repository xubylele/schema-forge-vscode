# Schema Forge VS Code

Official VS Code extension for Schema Forge DSL (`.sf`).

- Extension repo: <https://github.com/xubylele/schema-forge-vscode>
- SchemaForge CLI repo: <https://github.com/xubylele/schema-forge>
- SchemaForge CLI npm package: <https://www.npmjs.com/package/@xubylele/schema-forge>

## Features

- **`.sf` Language Registration** - Detects Schema Forge files in VS Code
- **Command Integration** - Contributes a command to the Command Palette
- **Extension Scaffolding** - TypeScript + esbuild setup for fast extension iteration
- **Changesets-Ready Releases** - Structured versioning and changelog workflow

## Installation

### From source (current recommended path)

```bash
git clone https://github.com/xubylele/schema-forge-vscode.git
cd schema-forge-vscode
npm install
npm run build
```

Then press `F5` in VS Code to launch an Extension Development Host with the extension loaded.

### Package as VSIX

```bash
npx @vscode/vsce package
```

Install the generated `.vsix` file in VS Code using **Extensions: Install from VSIX...**.

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/xubylele/schema-forge-vscode.git
cd schema-forge-vscode
npm install
```

Build the extension:

```bash
npm run build
```

Run in watch mode:

```bash
npm run watch
```

Lint the project:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

## Getting Started

Here's a quick walkthrough to get started with Schema Forge VS Code development:

### 1. Open the extension project

```bash
code .
```

### 2. Build once

```bash
npm run build
```

This produces the bundled extension output in `dist/`.

### 3. Launch Extension Development Host

Press `F5` in VS Code.

This opens a new VS Code window with the extension enabled.

### 4. Create or open a `.sf` file

Example:

```sql
table users {
  id uuid pk
  email varchar unique not null
  created_at timestamptz default now()
}
```

The file should be recognized as Schema Forge language (`schema-forge`).

### 5. Run the contributed command

Open the Command Palette and run:

```text
Schema Forge: Run Placeholder Command
```

You should see an information message confirming command execution.

### 6. Iterate with watch mode

```bash
npm run watch
```

Reload the Extension Development Host after changes to validate updates quickly.

## Commands

### `Schema Forge: Run Placeholder Command`

Runs the extension placeholder command registered as:

```text
schema-forge-vscode.runPlaceholder
```

Current behavior:

- Displays an information message in VS Code

## Language Support

This extension currently contributes:

- Language ID: `schema-forge`
- File extension: `.sf`
- Aliases: `Schema Forge`, `schema-forge`

## Project Structure

```bash
schema-forge-vscode/
+-- src/
|   +-- extension.ts         # Extension activation and command registration
|   \-- test/                # Extension tests
+-- syntaxes/                # TextMate grammar files (planned)
+-- dist/                    # Build output
+-- package.json             # Extension manifest and scripts
+-- esbuild.config.js        # Bundling config
+-- tsconfig.json            # TypeScript config
+-- CHANGELOG.md
\-- CONTRIBUTING.md
```

## Configuration

Core extension metadata lives in `package.json`:

```json
{
  "name": "schema-forge",
  "displayName": "Schema Forge",
  "main": "./dist/extension.js",
  "activationEvents": [
    "onLanguage:schema-forge",
    "onCommand:schema-forge-vscode.runPlaceholder"
  ]
}
```

## Roadmap

Planned milestones include:

- Syntax highlighting for `.sf`
- Schema validation diagnostics
- Formatting support
- Additional Schema Forge tooling in-editor

## Development Workflow

A typical workflow for extension contributions:

1. **Create branch** - Start from `main` (or active prerelease branch strategy)
2. **Implement changes** - Update extension code in `src/`
3. **Build and verify** - Run `npm run build`, `npm run lint`, and validate via `F5`
4. **Add changeset** - Run `npx changeset` for user-facing changes
5. **Open PR** - Include summary, validation notes, and release impact

## Tips

- Keep `npm run watch` running while iterating on extension behavior
- Validate command registration via Command Palette in Extension Development Host
- Commit `.changeset/*` files with feature changes that should be released
- Keep README/CHANGELOG updates aligned with behavior shipped in `src/extension.ts`

## Releasing

Schema Forge VS Code uses automated release workflows with [Changesets](https://github.com/changesets/changesets).

Create a changeset when your work should affect the next release:

```bash
npx changeset
```

Release channels:

- `pre-release` publishes prerelease versions (`X.Y.Z-next.N`)
- `main` publishes stable versions (`X.Y.Z`)

Summary flow:

- Feature branch -> changeset -> merge to `pre-release` -> prerelease publish -> promote to `main` -> stable publish

For full process details, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Related Projects

- SchemaForge CLI repository: <https://github.com/xubylele/schema-forge>
- SchemaForge CLI npm package: <https://www.npmjs.com/package/@xubylele/schema-forge>

## License

MIT
