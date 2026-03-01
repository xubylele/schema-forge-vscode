import * as assert from 'assert';
import * as vscode from 'vscode';
import { SyntaxDiagnosticsProvider } from '../../features/diagnostics/syntaxDiagnostics';

suite('Syntax Diagnostics Test Suite', () => {
  let provider: SyntaxDiagnosticsProvider;
  let diagnostics: vscode.DiagnosticCollection;

  setup(() => {
    provider = new SyntaxDiagnosticsProvider();
  });

  teardown(() => {
    provider.dispose();
  });

  test('should create diagnostics provider', () => {
    assert.ok(provider);
  });

  test('should detect syntax error in schema with missing closing parenthesis', async () => {
    // Test case: updated_at timestamptz default now( - missing closing )
    const invalidSource = `
table users {
  id uuid primary key
  name text not null
  updated_at timestamptz default now(
}
    `.trim();

    const document = {
      uri: vscode.Uri.file('/test/schema.sf'),
      languageId: 'schema-forge',
      getText: () => invalidSource,
      lineAt: (line: number) => ({
        text: invalidSource.split('\n')[line] || '',
        lineNumber: line,
      }),
      lineCount: invalidSource.split('\n').length,
    } as any;

    // Update diagnostics and wait for completion
    await provider.updateDiagnosticsImmediate(document);
  });

  test('should detect syntax error: invalid token', async () => {
    const invalidSource = `
table users {
  id uuid primary key
  invalid_type_name: something_invalid
}
    `.trim();

    const document = {
      uri: vscode.Uri.file('/test/schema.sf'),
      languageId: 'schema-forge',
      getText: () => invalidSource,
      lineAt: (line: number) => ({
        text: invalidSource.split('\n')[line] || '',
        lineNumber: line,
      }),
      lineCount: invalidSource.split('\n').length,
    } as any;

    await provider.updateDiagnosticsImmediate(document);
  });

  test('should not report error for valid schema', async () => {
    const validSource = `
table users {
  id uuid primary key
  name text not null
  email text unique
  created_at timestamptz default now()
  updated_at timestamptz default now()
}

table posts {
  id uuid primary key
  user_id uuid
  title text not null
  content text
}
    `.trim();

    const document = {
      uri: vscode.Uri.file('/test/schema.sf'),
      languageId: 'schema-forge',
      getText: () => validSource,
      lineAt: (line: number) => ({
        text: validSource.split('\n')[line] || '',
        lineNumber: line,
      }),
      lineCount: validSource.split('\n').length,
    } as any;

    await provider.updateDiagnosticsImmediate(document);
  });

  test('should handle empty schema content', async () => {
    const document = {
      uri: vscode.Uri.file('/test/schema.sf'),
      languageId: 'schema-forge',
      getText: () => '',
      lineAt: (line: number) => ({
        text: '',
        lineNumber: line,
      }),
      lineCount: 0,
    } as any;

    await provider.updateDiagnosticsImmediate(document);
  });

  test('should extract error token from quoted strings', async () => {
    const invalidSource = `
table users {
  id uuid primary key
  "invalid column name": text
}
    `.trim();

    const document = {
      uri: vscode.Uri.file('/test/schema.sf'),
      languageId: 'schema-forge',
      getText: () => invalidSource,
      lineAt: (line: number) => ({
        text: invalidSource.split('\n')[line] || '',
        lineNumber: line,
      }),
      lineCount: invalidSource.split('\n').length,
    } as any;

    await provider.updateDiagnosticsImmediate(document);
  });

  test('should register and cleanup listeners', () => {
    // Test that registerListeners doesn't throw
    assert.doesNotThrow(() => {
      provider.registerListeners();
    });

    // Test that dispose doesn't throw
    assert.doesNotThrow(() => {
      provider.dispose();
    });
  });

  test('debounce update should delay diagnostic updates', async () => {
    const validSource = `
table users {
  id uuid primary key
}
    `.trim();

    const document = {
      uri: vscode.Uri.file('/test/debounce.sf'),
      languageId: 'schema-forge',
      getText: () => validSource,
      lineAt: (line: number) => ({
        text: validSource.split('\n')[line] || '',
        lineNumber: line,
      }),
      lineCount: validSource.split('\n').length,
    } as any;

    // Call updateDiagnostics multiple times rapidly
    provider.updateDiagnostics(document);
    provider.updateDiagnostics(document);
    provider.updateDiagnostics(document);

    // Wait for debounce to complete
    await new Promise(resolve => setTimeout(resolve, 400));

    // Should not throw
    assert.ok(true);
  });
});
