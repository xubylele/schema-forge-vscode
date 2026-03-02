import { ColumnType, DatabaseSchema } from '@xubylele/schema-forge-core';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { DIAGNOSTIC_CODES } from '../../codes';
import { validateDuplicateColumns } from '../duplicateColumnsRule';

suite('Duplicate Columns Rule Test Suite', () => {
  test('should detect duplicate column names', () => {
    const source = `table users {
  id uuid pk
  name text
  name varchar(255)
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'name', type: 'text' as ColumnType },
            { name: 'name', type: 'varchar(255)' as ColumnType },
          ],
        },
      },
    };

    const findings = validateDuplicateColumns(ast, source);

    // Should report duplicate 'name' column
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].code, DIAGNOSTIC_CODES.SF_DUPLICATE_COLUMN);
    assert.strictEqual(findings[0].severity, vscode.DiagnosticSeverity.Error);
  });

  test('should not report table with unique column names', () => {
    const source = `table users {
  id uuid pk
  name text
  email text
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'name', type: 'text' as ColumnType },
            { name: 'email', type: 'text' as ColumnType },
          ],
        },
      },
    };

    const findings = validateDuplicateColumns(ast, source);

    assert.strictEqual(findings.length, 0);
  });

  test('should detect multiple different duplicate columns', () => {
    const source = `table users {
  id uuid pk
  id uuid
  name text
  name text
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'id', type: 'uuid' as ColumnType },
            { name: 'name', type: 'text' as ColumnType },
            { name: 'name', type: 'text' as ColumnType },
          ],
        },
      },
    };

    const findings = validateDuplicateColumns(ast, source);

    // Should report both duplicate columns
    assert.strictEqual(findings.length, 2);
    assert.ok(findings.some(f => f.message.includes('id')));
    assert.ok(findings.some(f => f.message.includes('name')));
  });

  test('should report duplicate column with correct table context', () => {
    const source = `table users {
  email text
  email text
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [
            { name: 'email', type: 'text' as ColumnType },
            { name: 'email', type: 'text' as ColumnType },
          ],
        },
      },
    };

    const findings = validateDuplicateColumns(ast, source);

    assert.strictEqual(findings.length, 1);
    assert.ok(findings[0].message.includes('email'));
    assert.ok(findings[0].message.includes('users'));
  });

  test('should detect duplicates across multiple tables', () => {
    const source = `table users {
  id uuid pk
  id int
}
table posts {
  title text
  title text
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'id', type: 'int' as ColumnType },
          ],
        },
        posts: {
          name: 'posts',
          columns: [
            { name: 'title', type: 'text' as ColumnType },
            { name: 'title', type: 'text' as ColumnType },
          ],
        },
      },
    };

    const findings = validateDuplicateColumns(ast, source);

    // Each table should be reported separately
    assert.strictEqual(findings.length, 2);
    assert.ok(findings.some(f => f.message.includes('users')));
    assert.ok(findings.some(f => f.message.includes('posts')));
  });

  test('should report correct error severity', () => {
    const source = `table users {
  id uuid pk
  id text
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'id', type: 'text' as ColumnType },
          ],
        },
      },
    };

    const findings = validateDuplicateColumns(ast, source);

    assert.strictEqual(findings[0].severity, vscode.DiagnosticSeverity.Error);
  });

  test('should handle three or more duplicate columns', () => {
    const source = `table users {
  name text
  name text
  name text
  name text
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [
            { name: 'name', type: 'text' as ColumnType },
            { name: 'name', type: 'text' as ColumnType },
            { name: 'name', type: 'text' as ColumnType },
            { name: 'name', type: 'text' as ColumnType },
          ],
        },
      },
    };

    const findings = validateDuplicateColumns(ast, source);

    // All duplicates of 'name' should be reported
    assert.ok(findings.length >= 1);
    assert.ok(findings.every(f => f.message.includes('name')));
  });

  test('should handle table with many columns and one duplicate', () => {
    const source = `table users {
  id uuid pk
  name text
  email text
  phone text
  address text
  nickname text
  nickname text
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'name', type: 'text' as ColumnType },
            { name: 'email', type: 'text' as ColumnType },
            { name: 'phone', type: 'text' as ColumnType },
            { name: 'address', type: 'text' as ColumnType },
            { name: 'nickname', type: 'text' as ColumnType },
            { name: 'nickname', type: 'text' as ColumnType },
          ],
        },
      },
    };

    const findings = validateDuplicateColumns(ast, source);

    assert.strictEqual(findings.length, 1);
    assert.ok(findings[0].message.includes('nickname'));
  });

  test('should handle column names with underscores', () => {
    const source = `table users {
  first_name text
  first_name text
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [
            { name: 'first_name', type: 'text' as ColumnType },
            { name: 'first_name', type: 'text' as ColumnType },
          ],
        },
      },
    };

    const findings = validateDuplicateColumns(ast, source);

    assert.strictEqual(findings.length, 1);
    assert.ok(findings[0].message.includes('first_name'));
  });

  test('should report correct diagnostic code', () => {
    const source = `table users {
  id uuid pk
  id text
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'id', type: 'text' as ColumnType },
          ],
        },
      },
    };

    const findings = validateDuplicateColumns(ast, source);

    assert.strictEqual(findings[0].code, DIAGNOSTIC_CODES.SF_DUPLICATE_COLUMN);
  });

  suite('Edge Cases', () => {
    test('should handle table with no columns', () => {
      const source = `table users { }`;
      const ast: DatabaseSchema = {
        tables: {
          users: { name: 'users', columns: [] },
        },
      };

      const findings = validateDuplicateColumns(ast, source);

      // No duplicates in empty table
      assert.strictEqual(findings.length, 0);
    });

    test('should handle table with single column', () => {
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

      const findings = validateDuplicateColumns(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should handle empty database schema', () => {
      const source = '';
      const ast: DatabaseSchema = {
        tables: {},
      };

      const findings = validateDuplicateColumns(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should detect duplicates regardless of column type', () => {
      const source = `table users {
  id uuid pk
  id int
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'id', type: 'int' as ColumnType },
            ],
          },
        },
      };

      const findings = validateDuplicateColumns(ast, source);

      // Duplicate name is still detected even though types differ
      assert.strictEqual(findings.length, 1);
    });

    test('should detect duplicates regardless of primary key status', () => {
      const source = `table users {
  id uuid pk
  id uuid
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'id', type: 'uuid' as ColumnType },
            ],
          },
        },
      };

      const findings = validateDuplicateColumns(ast, source);

      assert.strictEqual(findings.length, 1);
    });

    test('should handle special characters in table names', () => {
      const source = `table user_profiles_v2 {
  field text
  field text
}`;
      const ast: DatabaseSchema = {
        tables: {
          user_profiles_v2: {
            name: 'user_profiles_v2',
            columns: [
              { name: 'field', type: 'text' as ColumnType },
              { name: 'field', type: 'text' as ColumnType },
            ],
          },
        },
      };

      const findings = validateDuplicateColumns(ast, source);

      assert.strictEqual(findings.length, 1);
      assert.ok(findings[0].message.includes('user_profiles_v2'));
    });
  });
});
