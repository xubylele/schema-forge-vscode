---
"schema-forge": minor
---

✨ feat: Add migration planning and preview workflows to the VS Code extension, plus clearer index/view diff UX.

- Add `Schema Forge: Plan` command to run CLI migration plan preview with human-readable operation lines.
- Add `Schema Forge: Preview` command as a migration preview alias flow.
- Register and expose the new commands in activation events, command contributions, and status bar action menu.
- Improve visual diff rendering for index, policy, and view operations with explicit operation descriptions.
- Update extension documentation to include the new commands and expanded index/view support messaging.
- Add test coverage for visual diff formatting of index/view operations.
