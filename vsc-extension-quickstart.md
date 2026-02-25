# Schema Forge VS Code Quickstart

Use this quick bootstrap flow for local smoke testing and packaging.

## Local development

1. Install dependencies:

```bash
npm install
```

1. Build once:

```bash
npm run build
```

1. Press `F5` to launch the Extension Development Host.

2. Run command **Schema Forge: Hello World** from the Command Palette.

## Packaging and publish

- Package VSIX:

```bash
npm run package:vsix
```

- Publish stable:

```bash
npm run publish:stable
```

- Publish pre-release:

```bash
npm run publish:pre-release
```

See `README.md` and `CONTRIBUTING.md` for full CI and branch-channel workflow details.
