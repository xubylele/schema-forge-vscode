---
"schema-forge": patch
---

# Patch Changes

- Updated `.github/workflows/changesets.yml` to trigger on pull requests to `develop` only, removing `pre-release` and `main` branches from the trigger list.
- Updated `.github/workflows/release-vsix.yml` to trigger on pushes to `master` only, removing `pre-release` from the trigger list.
