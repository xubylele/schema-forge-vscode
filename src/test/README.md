# Testing Schema Forge VSCode Extension

This directory contains the test suite for the Schema Forge VSCode extension.

## Test Structure

```
src/test/
├── runTest.ts              # Test runner entry point
├── extension.test.ts       # Extension integration tests
└── suite/
    ├── index.ts            # Mocha test suite loader
    ├── adapter.test.ts     # Tests for schema parsing adapter
    ├── errors.test.ts      # Tests for error normalization
    ├── output.test.ts      # Tests for output channel
    └── workspace.test.ts   # Tests for workspace utilities
```

## Running Tests

### From Command Line

```bash
# Run all tests
npm test

# Or using the alias
npm run test:unit
```

### From VSCode

1. Open the Run and Debug panel (⇧⌘D or Ctrl+Shift+D)
2. Select "Extension Tests" from the dropdown
3. Click the green play button or press F5
4. A new VSCode window will open and tests will run automatically

## Writing Tests

Tests use the Mocha framework with the `tdd` interface. Here's how to add a new test:

### Unit Test Example

```typescript
import * as assert from 'assert';

suite('My Test Suite', () => {
  test('should do something', () => {
    const result = myFunction();
    assert.strictEqual(result, 'expected');
  });

  test('should handle errors', async () => {
    const result = await myAsyncFunction();
    assert.ok(result);
  });
});
```

### Integration Test Example

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Integration', () => {
  test('command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('schemaForge.init'));
  });
});
```

## Test Coverage

Current test coverage includes:

- **Core Modules**
  - Error normalization and parsing
  - Schema parsing adapter
  - Output channel management
  - Workspace utilities

- **Integration Tests**
  - Extension activation
  - Command registration
  - Language contributions
  - Extension metadata

## Dependencies

- `@vscode/test-electron` - VSCode extension testing framework
- `mocha` - Test framework
- `@types/mocha` - TypeScript types for Mocha

## Notes

- Tests are compiled with the main build process via esbuild
- The test runner uses the VSCode Extension Test Runner
- Tests run in an isolated VSCode instance with extensions disabled
- Use `--disable-extensions` flag to ensure clean test environment
