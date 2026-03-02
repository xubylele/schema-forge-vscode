import { ColumnType, DatabaseSchema } from '@xubylele/schema-forge-core';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { DIAGNOSTIC_CODES } from '../../codes';
import { validateTableHasColumns } from '../tableHasColumnsRule';

suite('Table Has Columns Rule Test Suite', () => {
  test('should detect table with zero columns', () => {
    const source = `table users { }`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [],
        },
      },
    };

    const findings = validateTableHasColumns(ast, source);

    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].code, DIAGNOSTIC_CODES.SF_NO_COLUMNS);
    assert.strictEqual(findings[0].severity, vscode.DiagnosticSeverity.Error);
  });

  test('should not report table with at least one column', () => {
    const source = `table users {
  id uuid pk
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [{ name: 'id', type: 'uuid' as ColumnType, primaryKey: true }],
        },
      },
    };

    const findings = validateTableHasColumns(ast, source);

    assert.strictEqual(findings.length, 0);
  });

  test('should detect multiple tables with zero columns', () => {
    const source = `table users { }
table posts { }`;
    const ast: DatabaseSchema = {
      tables: {
        users: { name: 'users', columns: [] },
        posts: { name: 'posts', columns: [] },
      },
    };

    const findings = validateTableHasColumns(ast, source);

    assert.strictEqual(findings.length, 2);
    assert.ok(findings.some(f => f.message.includes('users')));
    assert.ok(findings.some(f => f.message.includes('posts')));
  });

  test('should only report tables with zero columns', () => {
    const source = `table users { }
table posts {
  title text
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: { name: 'users', columns: [] },
        posts: {
          name: 'posts',
          columns: [{ name: 'title', type: 'text' as ColumnType }],
        },
      },
    };

    const findings = validateTableHasColumns(ast, source);

    assert.strictEqual(findings.length, 1);
    assert.ok(findings[0].message.includes('users'));
  });

  test('should report correct position for empty table with indentation', () => {
    const source = `  table users { }`;
    const ast: DatabaseSchema = {
      tables: {
        users: { name: 'users', columns: [] },
      },
    };

    const findings = validateTableHasColumns(ast, source);

    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].line, 0);
    assert.ok(findings[0].startColumn >= 2); // After indentation
  });

  test('should provide clear error message for empty table', () => {
    const source = `table products { }`;
    const ast: DatabaseSchema = {
      tables: {
        products: { name: 'products', columns: [] },
      },
    };

    const findings = validateTableHasColumns(ast, source);

    assert.strictEqual(findings.length, 1);
    assert.ok(findings[0].message.includes('products'));
    assert.ok(findings[0].message.includes('no columns'));
    assert.ok(findings[0].message.includes('at least one column'));
  });

  test('should handle table names with underscores and numbers', () => {
    const source = `table user_profiles_v2 { }`;
    const ast: DatabaseSchema = {
      tables: {
        user_profiles_v2: { name: 'user_profiles_v2', columns: [] },
      },
    };

    const findings = validateTableHasColumns(ast, source);

    assert.strictEqual(findings.length, 1);
    assert.ok(findings[0].message.includes('user_profiles_v2'));
  });

  test('should detect empty table with comment inside', () => {
    const source = `table users {
  // Comments but no columns
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: { name: 'users', columns: [] },
      },
    };

    const findings = validateTableHasColumns(ast, source);

    // Still should report empty table (comments don't count as columns)
    assert.strictEqual(findings.length, 1);
  });

  test('should detect empty table with newlines', () => {
    const source = `table users {

}`;
    const ast: DatabaseSchema = {
      tables: {
        users: { name: 'users', columns: [] },
      },
    };

    const findings = validateTableHasColumns(ast, source);

    assert.strictEqual(findings.length, 1);
  });

  test('should report correct error code', () => {
    const source = `table empty_table { }`;
    const ast: DatabaseSchema = {
      tables: {
        empty_table: { name: 'empty_table', columns: [] },
      },
    };

    const findings = validateTableHasColumns(ast, source);

    assert.strictEqual(findings[0].code, DIAGNOSTIC_CODES.SF_NO_COLUMNS);
  });

  test('should not report severity higher than Error', () => {
    const source = `table users { }`;
    const ast: DatabaseSchema = {
      tables: {
        users: { name: 'users', columns: [] },
      },
    };

    const findings = validateTableHasColumns(ast, source);

    assert.strictEqual(findings[0].severity, vscode.DiagnosticSeverity.Error);
  });

  test('should handle tables with many columns', () => {
    const source = `table users {
  id uuid pk
  name text
  email text
  created_at timestamptz
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'name', type: 'text' as ColumnType },
            { name: 'email', type: 'text' as ColumnType },
            { name: 'created_at', type: 'timestamptz' as ColumnType },
          ],
        },
      },
    };

    const findings = validateTableHasColumns(ast, source);

    assert.strictEqual(findings.length, 0);
  });

  test('should handle empty database schema', () => {
    const source = '';
    const ast: DatabaseSchema = {
      tables: {},
    };

    const findings = validateTableHasColumns(ast, source);

    assert.strictEqual(findings.length, 0);
  });
});
