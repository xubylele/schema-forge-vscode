import { ColumnType, DatabaseSchema } from '@xubylele/schema-forge-core';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { DIAGNOSTIC_CODES } from '../../codes';
import { validateTablePrimaryKey } from '../tablePrimaryKeyRules';

suite('Table Primary Key Rules Test Suite', () => {
  suite('No Primary Key Detection (SF_NO_PK)', () => {
    test('should detect table with no primary key', () => {
      const source = `table users {
  id uuid
  name text
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, nullable: false },
              { name: 'name', type: 'text' as ColumnType, nullable: false },
            ],
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      const noPkFinding = findings.find(f => f.code === DIAGNOSTIC_CODES.SF_NO_PK);
      assert.ok(noPkFinding);
      assert.strictEqual(noPkFinding!.severity, vscode.DiagnosticSeverity.Error);
    });

    test('should not report table with exactly one primary key', () => {
      const source = `table users {
  id uuid pk
  name text
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'name', type: 'text' as ColumnType },
            ],
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      assert.ok(!findings.some(f => f.code === DIAGNOSTIC_CODES.SF_NO_PK));
    });

    test('should report table with zero columns as no primary key', () => {
      const source = `table empty { }`;
      const ast: DatabaseSchema = {
        tables: {
          empty: { name: 'empty', columns: [] },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      const noPkFinding = findings.find(f => f.code === DIAGNOSTIC_CODES.SF_NO_PK);
      assert.ok(noPkFinding);
    });

    test('should include table name in error message for no primary key', () => {
      const source = `table products {
  name text
}`;
      const ast: DatabaseSchema = {
        tables: {
          products: {
            name: 'products',
            columns: [{ name: 'name', type: 'text' as ColumnType }],
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      const noPkFinding = findings.find(f => f.code === DIAGNOSTIC_CODES.SF_NO_PK);
      assert.ok(noPkFinding);
      assert.ok(noPkFinding!.message.includes('products'));
      assert.ok(noPkFinding!.message.includes('no primary key'));
    });
  });

  suite('Multiple Primary Keys Detection (SF_MULTIPLE_PK)', () => {
    test('should detect table with multiple primary keys', () => {
      const source = `table users {
  id uuid pk
  email text pk
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'email', type: 'text' as ColumnType, primaryKey: true },
            ],
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      const multiplePkFinding = findings.find(f => f.code === DIAGNOSTIC_CODES.SF_MULTIPLE_PK);
      assert.ok(multiplePkFinding);
      assert.strictEqual(multiplePkFinding!.severity, vscode.DiagnosticSeverity.Warning);
    });

    test('should not report table with exactly one primary key', () => {
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

      const findings = validateTablePrimaryKey(ast, source);

      assert.ok(!findings.some(f => f.code === DIAGNOSTIC_CODES.SF_MULTIPLE_PK));
    });

    test('should detect three primary keys', () => {
      const source = `table composite {
  id1 uuid pk
  id2 uuid pk
  id3 uuid pk
}`;
      const ast: DatabaseSchema = {
        tables: {
          composite: {
            name: 'composite',
            columns: [
              { name: 'id1', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'id2', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'id3', type: 'uuid' as ColumnType, primaryKey: true },
            ],
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      const multiplePkFinding = findings.find(f => f.code === DIAGNOSTIC_CODES.SF_MULTIPLE_PK);
      assert.ok(multiplePkFinding);
      assert.ok(multiplePkFinding.message.includes('3'));
    });

    test('should include table name in error message for multiple primary keys', () => {
      const source = `table orders {
  order_id uuid pk
  user_id uuid pk
}`;
      const ast: DatabaseSchema = {
        tables: {
          orders: {
            name: 'orders',
            columns: [
              { name: 'order_id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'user_id', type: 'uuid' as ColumnType, primaryKey: true },
            ],
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      const multiplePkFinding = findings.find(f => f.code === DIAGNOSTIC_CODES.SF_MULTIPLE_PK);
      assert.ok(multiplePkFinding);
      assert.ok(multiplePkFinding!.message.includes('orders'));
      assert.ok(multiplePkFinding!.message.includes('2'));
    });

    test('should be warning not error level', () => {
      const source = `table users {
  id uuid pk
  email text pk
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'email', type: 'text' as ColumnType, primaryKey: true },
            ],
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      const multiplePkFinding = findings.find(f => f.code === DIAGNOSTIC_CODES.SF_MULTIPLE_PK);
      assert.ok(multiplePkFinding);
      assert.strictEqual(multiplePkFinding!.severity, vscode.DiagnosticSeverity.Warning);
    });
  });

  suite('Mixed Scenarios', () => {
    test('should not report table with exactly one primary key among many columns', () => {
      const source = `table users {
  id uuid pk
  name text
  email text
  phone text
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
              { name: 'phone', type: 'text' as ColumnType },
              { name: 'created_at', type: 'timestamptz' as ColumnType },
            ],
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should handle multiple tables with different primary key issues', () => {
      const source = `table users {
  name text
}
table posts {
  id uuid pk
  email uuid pk
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'name', type: 'text' as ColumnType }],
          },
          posts: {
            name: 'posts',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'email', type: 'uuid' as ColumnType, primaryKey: true },
            ],
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      assert.strictEqual(findings.length, 2);
      assert.ok(findings.some(f => f.code === DIAGNOSTIC_CODES.SF_NO_PK));
      assert.ok(findings.some(f => f.code === DIAGNOSTIC_CODES.SF_MULTIPLE_PK));
    });

    test('should report correct diagnostic code for no primary key', () => {
      const source = `table users {
  name text
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'name', type: 'text' as ColumnType }],
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      assert.strictEqual(findings[0].code, DIAGNOSTIC_CODES.SF_NO_PK);
    });

    test('should report correct diagnostic code for multiple primary keys', () => {
      const source = `table users {
  id uuid pk
  email text pk
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'email', type: 'text' as ColumnType, primaryKey: true },
            ],
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      assert.strictEqual(findings[0].code, DIAGNOSTIC_CODES.SF_MULTIPLE_PK);
    });

    test('should handle table names with special patterns', () => {
      const source = `table user_profiles_v2 {
  id uuid pk
  id2 uuid pk
}`;
      const ast: DatabaseSchema = {
        tables: {
          user_profiles_v2: {
            name: 'user_profiles_v2',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'id2', type: 'uuid' as ColumnType, primaryKey: true },
            ],
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      const multiplePkFinding = findings.find(f => f.code === DIAGNOSTIC_CODES.SF_MULTIPLE_PK);
      assert.ok(multiplePkFinding);
      assert.ok(multiplePkFinding!.message.includes('user_profiles_v2'));
    });
  });

  suite('Edge Cases', () => {
    test('should handle undefined primaryKey property (defaults to false)', () => {
      const source = `table users {
  id uuid
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'id', type: 'uuid' as ColumnType }], // primaryKey not set
          },
        },
      };

      const findings = validateTablePrimaryKey(ast, source);

      // Should report as no primary key
      assert.ok(findings.some(f => f.code === DIAGNOSTIC_CODES.SF_NO_PK));
    });

    test('should handle empty database', () => {
      const source = '';
      const ast: DatabaseSchema = {
        tables: {},
      };

      const findings = validateTablePrimaryKey(ast, source);

      assert.strictEqual(findings.length, 0);
    });
  });
});
