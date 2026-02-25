# Changesets

This repository uses Changesets for versioning and changelog management.

## Contributor flow

1. Create a feature branch.
2. Implement your changes.
3. Run `npx changeset` and follow the prompts.
4. Commit the generated file in `.changeset/` with your feature changes.
5. Open a pull request.

When changesets land on `main`, automation creates or updates a **Version Packages** PR that applies version bumps and changelog updates.
