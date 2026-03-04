import * as assert from 'assert';
import * as vscode from 'vscode';
import { normalizeError, ParseResult } from '../../core/errors';

suite('Core Errors Test Suite', () => {
  test('normalizeError with Error instance containing line info', () => {
    const error = new Error('Line 5: Syntax error: unexpected token');
    const normalized = normalizeError(error);

    assert.strictEqual(normalized.message, 'Line 5: Syntax error: unexpected token');
    assert.strictEqual(normalized.line, 4); // Should be 0-indexed
    assert.strictEqual(normalized.column, 0);
    assert.ok(normalized.range);
    assert.strictEqual(normalized.range?.start.line, 4);
    assert.strictEqual(normalized.range?.start.character, 0);
  });

  test('normalizeError with Error instance without line info', () => {
    const error = new Error('Generic error message');
    const normalized = normalizeError(error);

    assert.strictEqual(normalized.message, 'Generic error message');
    assert.strictEqual(normalized.line, undefined);
    assert.strictEqual(normalized.column, undefined);
    assert.strictEqual(normalized.range, undefined);
  });

  test('normalizeError with string containing line and column', () => {
    const error = 'Line 10: Column 5: Type error';
    const normalized = normalizeError(error);

    assert.strictEqual(normalized.message, 'Line 10: Column 5: Type error');
    assert.strictEqual(normalized.line, 9); // Should be 0-indexed
    assert.strictEqual(normalized.column, 5);
    assert.ok(normalized.range);
  });

  test('normalizeError with plain string', () => {
    const error = 'Simple error message';
    const normalized = normalizeError(error);

    assert.strictEqual(normalized.message, 'Simple error message');
    assert.strictEqual(normalized.line, undefined);
    assert.strictEqual(normalized.column, undefined);
  });

  test('normalizeError with object containing message', () => {
    const error = { message: 'Line 3: Parse error' };
    const normalized = normalizeError(error);

    assert.strictEqual(normalized.message, 'Line 3: Parse error');
    assert.strictEqual(normalized.line, 2);
  });

  test('normalizeError with unknown type', () => {
    const error = 123;
    const normalized = normalizeError(error);

    assert.strictEqual(normalized.message, 'Unknown error during parsing');
    assert.strictEqual(normalized.line, undefined);
  });

  test('normalizeError creates valid VS Code Range', () => {
    const error = new Error('Line 1: Test error');
    const normalized = normalizeError(error);

    assert.ok(normalized.range instanceof vscode.Range);
    assert.strictEqual(normalized.range?.start.line, 0);
    assert.strictEqual(normalized.range?.end.line, 0);
    assert.strictEqual(normalized.range?.end.character, 1);
  });

  test('ParseResult discriminated union - success case', () => {
    const result: ParseResult = {
      ok: true,
      ast: {
        tables: {},
      },
    };

    assert.strictEqual(result.ok, true);
    if (result.ok) {
      assert.ok(result.ast);
      assert.ok(typeof result.ast.tables === 'object' && !Array.isArray(result.ast.tables));
    }
  });

  test('ParseResult discriminated union - error case', () => {
    const result: ParseResult = {
      ok: false,
      error: {
        message: 'Test error',
        line: 5,
        column: 10,
      },
    };

    assert.strictEqual(result.ok, false);
    if (!result.ok) {
      assert.strictEqual(result.error.message, 'Test error');
      assert.strictEqual(result.error.line, 5);
      assert.strictEqual(result.error.column, 10);
    }
  });
});
