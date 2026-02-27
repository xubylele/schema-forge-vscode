# Schema Forge for VS Code

Official VS Code extension for the Schema Forge DSL (`.sf`).

Build and manage Schema Forge projects directly in your editor with native language support and command integration.

👉 [Install from Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Xubylele.schema-forge)

## Why use this extension

- Native support for `.sf` files
- Built-in snippets for faster schema authoring
- Command Palette actions for core workflows
- Automatic prompt to initialize missing Schema Forge project structure

## Commands

Open the Command Palette and run:

- `Schema Forge: Init`
- `Schema Forge: Generate`
- `Schema Forge: Diff`

## Language Support

The extension contributes:

- Language ID: `schema-forge`
- File extension: `.sf`
- Scope name: `source.schemaforge`

## Installation

### Marketplace (recommended)

Install directly from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Xubylele.schema-forge).

### Build from source

```bash
git clone https://github.com/xubylele/schema-forge-vscode.git
cd schema-forge-vscode
npm install
npm run build
```

Then press `F5` in VS Code to launch an Extension Development Host.

### Install as VSIX

```bash
npm run package:vsix
```

In VS Code, run **Extensions: Install from VSIX...** and choose the generated file.

## Quick Start

1. Open a workspace.
2. Create or open a `.sf` file.
3. Run `Schema Forge: Init` if your `schemaforge/` folder does not exist.
4. Use `Schema Forge: Generate` and `Schema Forge: Diff` from the Command Palette.

## Development

```bash
npm install
npm run watch
```

Useful scripts:

- `npm run build`
- `npm run lint`
- `npm test`

## Contributing

Contributions are welcome. Please follow [CONTRIBUTING.md](CONTRIBUTING.md).

All contributor pull requests must target the `develop` branch.

## Release Channels

- `pre-release`: publishes prerelease versions (`X.Y.Z-next.N`)
- `master`: publishes stable versions (`X.Y.Z`)

## Related Packages

- [@xubylele/schema-forge](https://www.npmjs.com/package/@xubylele/schema-forge)
- [@xubylele/schema-forge-core](https://www.npmjs.com/package/@xubylele/schema-forge-core)

## License

MIT
