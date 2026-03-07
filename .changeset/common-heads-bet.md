---
"schema-forge": minor
---

✨ feat(vscode): add schema drift status bar and improve diff command integration

- Introduced `SchemaStatusBar` class to manage status updates for schema drift detection.
- Integrated status bar updates with `diffCommand` so drift results update the UI without rerunning the diff.
- Registered the status bar during extension activation.
- Refactored `diffCommand` to support an optional callback for exit code handling.
- Added `runDiff` utility to execute schema diff checks headlessly for reuse across commands and UI components.
- Added tests to validate status updates and diff execution flow.
