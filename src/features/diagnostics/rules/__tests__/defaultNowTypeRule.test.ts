import { ColumnType, DatabaseSchema } from '@xubylele/schema-forge-core';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { DIAGNOSTIC_CODES } from '../../codes';
import { validateDefaultNowType } from '../defaultNowTypeRule';

suite('Default Now Type Rule Test Suite', () => {
  suite('Valid Usage - timestamptz with default now()', () => {
    test('should allow default now() on timestamptz', () => {
      const source = `table users {
  created_at timestamptz default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'created_at', type: 'timestamptz' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should allow multiple timestamptz columns with default now()', () => {
      const source = `table audit_log {
  created_at timestamptz default now()
  updated_at timestamptz default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          audit_log: {
            name: 'audit_log',
            columns: [
              { name: 'created_at', type: 'timestamptz' as ColumnType, default: 'now()' },
              { name: 'updated_at', type: 'timestamptz' as ColumnType, default: 'now()' },
            ],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should allow default now() with extra whitespace', () => {
      const source = `table users {
  created_at timestamptz default now  ()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'created_at', type: 'timestamptz' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should allow default now() case insensitive', () => {
      const source = `table users {
  created_at timestamptz default NOW()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'created_at', type: 'timestamptz' as ColumnType, default: 'NOW()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 0);
    });
  });

  suite('Invalid Usage - default now() on non-timestamptz', () => {
    test('should reject default now() on text column', () => {
      const source = `table users {
  name text default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'name', type: 'text' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].code, DIAGNOSTIC_CODES.SF_INVALID_DEFAULT_NOW);
      assert.strictEqual(findings[0].severity, vscode.DiagnosticSeverity.Warning);
    });

    test('should reject default now() on int column', () => {
      const source = `table users {
  counter int default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'counter', type: 'int' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].code, DIAGNOSTIC_CODES.SF_INVALID_DEFAULT_NOW);
    });

    test('should reject default now() on uuid column', () => {
      const source = `table users {
  id uuid default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'id', type: 'uuid' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 1);
    });

    test('should reject default now() on varchar column', () => {
      const source = `table users {
  field varchar(255) default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'field', type: 'varchar(255)' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 1);
    });

    test('should reject default now() on date column', () => {
      const source = `table users {
  start_date date default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'start_date', type: 'date' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 1);
    });

    test('should reject default now() on boolean column', () => {
      const source = `table users {
  active boolean default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'active', type: 'boolean' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 1);
    });

    test('should reject default now() on numeric column', () => {
      const source = `table products {
  price numeric(10,2) default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          products: {
            name: 'products',
            columns: [{ name: 'price', type: 'numeric(10,2)' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 1);
    });
  });

  suite('Error Messages and Context', () => {
    test('should include column name in error message', () => {
      const source = `table users {
  created_at int default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'created_at', type: 'int' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.ok(findings[0].message.includes('created_at'));
    });

    test('should include column type in error message', () => {
      const source = `table users {
  created_at int default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'created_at', type: 'int' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.ok(findings[0].message.includes('int'));
    });

    test('should mention timestamptz as the correct type', () => {
      const source = `table users {
  timestamp_field text default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'timestamp_field', type: 'text' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.ok(findings[0].message.includes('timestamptz'));
    });
  });

  suite('Mixed Scenarios', () => {
    test('should handle mix of valid and invalid defaults', () => {
      const source = `table users {
  created_at timestamptz default now()
  name text default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'created_at', type: 'timestamptz' as ColumnType, default: 'now()' },
              { name: 'name', type: 'text' as ColumnType, default: 'now()' },
            ],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      // Only the text column should be flagged
      assert.strictEqual(findings.length, 1);
      assert.ok(findings[0].message.includes('name'));
    });

    test('should handle multiple invalid defaults in one table', () => {
      const source = `table audit {
  created_at int default now()
  updated_at text default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          audit: {
            name: 'audit',
            columns: [
              { name: 'created_at', type: 'int' as ColumnType, default: 'now()' },
              { name: 'updated_at', type: 'text' as ColumnType, default: 'now()' },
            ],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 2);
    });

    test('should handle invalid defaults across multiple tables', () => {
      const source = `table users {
  created_at int default now()
}
table posts {
  published_at text default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'created_at', type: 'int' as ColumnType, default: 'now()' }],
          },
          posts: {
            name: 'posts',
            columns: [{ name: 'published_at', type: 'text' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 2);
      assert.ok(findings.some(f => f.message.includes('users')));
      assert.ok(findings.some(f => f.message.includes('posts')));
    });

    test('should only report columns with now() and wrong type', () => {
      const source = `table users {
  id uuid pk
  name text
  created_at timestamptz default now()
  counter int
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'name', type: 'text' as ColumnType },
              { name: 'created_at', type: 'timestamptz' as ColumnType, default: 'now()' },
              { name: 'counter', type: 'int' as ColumnType },
            ],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      // No violations
      assert.strictEqual(findings.length, 0);
    });
  });

  suite('Default Value Variations', () => {
    test('should handle now() in default value', () => {
      const source = `table users {
  created_at timestamptz default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'created_at', type: 'timestamptz' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should ignore columns without default values', () => {
      const source = `table users {
  created_at int
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'created_at', type: 'int' as ColumnType }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should ignore other default values', () => {
      const source = `table users {
  name text default 'John'
  counter int default 0
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'name', type: 'text' as ColumnType, default: "'John'" },
              { name: 'counter', type: 'int' as ColumnType, default: '0' },
            ],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should detect now() regardless of quote style', () => {
      const source = `table users {
  created_at int default nOw()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'created_at', type: 'int' as ColumnType, default: 'nOw()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 1);
    });
  });

  suite('Edge Cases', () => {
    test('should handle empty table', () => {
      const source = `table users { }`;
      const ast: DatabaseSchema = {
        tables: {
          users: { name: 'users', columns: [] },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should handle empty database', () => {
      const source = '';
      const ast: DatabaseSchema = {
        tables: {},
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should report warning not error level', () => {
      const source = `table users {
  created_at int default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'created_at', type: 'int' as ColumnType, default: 'now()' }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      assert.strictEqual(findings[0].severity, vscode.DiagnosticSeverity.Warning);
    });

    test('should only report columns with now() function', () => {
      const source = `table users {
  created_at int default 'now()'
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'created_at', type: 'int' as ColumnType, default: "'now()'" }],
          },
        },
      };

      const findings = validateDefaultNowType(ast, source);

      // String containing 'now()' should still match the regex pattern
      assert.strictEqual(findings.length, 1);
    });
  });
});
