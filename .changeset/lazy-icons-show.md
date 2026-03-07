---
"schema-forge": minor
---

✨ add diff preview functionality and related commands

- Introduced a new command `schemaForge.diffPreview` for generating SQL diff previews.
- Updated `package.json` to include the new command and its title.
- Implemented the `diffPreviewCommand` in `src/commands/diffPreview.ts` to handle the logic for generating previews.
- Enhanced the UI with a new `sqlPreviewPanel` to display the diff results.
- Added tests for the new command and SQL preview utilities.
- Updated the main extension file to register the new command and its associated functionality.