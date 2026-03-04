import { ColumnType, DatabaseSchema } from '@xubylele/schema-forge-core';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { DIAGNOSTIC_CODES } from '../../codes';
import { validateSupportedTypes } from '../supportedTypesRule';

suite('Supported Types Rule Test Suite', () => {
  suite('Valid Base Types', () => {
    test('should accept uuid type', () => {
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

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should accept varchar type', () => {
      const source = `table users {
  name varchar
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'name', type: 'varchar' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should accept text type', () => {
      const source = `table users {
  bio text
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'bio', type: 'text' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should accept int type', () => {
      const source = `table users {
  age int
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'age', type: 'int' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should accept bigint type', () => {
      const source = `table users {
  counter bigint
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'counter', type: 'bigint' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should accept boolean type', () => {
      const source = `table users {
  is_active boolean
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'is_active', type: 'boolean' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should accept timestamptz type', () => {
      const source = `table users {
  created_at timestamptz
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'created_at', type: 'timestamptz' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should accept date type', () => {
      const source = `table users {
  birth_date date
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'birth_date', type: 'date' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });
  });

  suite('Parameterized Types - varchar(n)', () => {
    test('should accept varchar(1)', () => {
      const source = `table users {
  code varchar(1)
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'code', type: 'varchar(1)' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should accept varchar(255)', () => {
      const source = `table users {
  name varchar(255)
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'name', type: 'varchar(255)' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should accept varchar with large length', () => {
      const source = `table users {
  data varchar(10000)
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'data', type: 'varchar(10000)' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should reject varchar(0)', () => {
      const source = `table users {
  invalid varchar(0)
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'invalid', type: 'varchar(0)' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].code, DIAGNOSTIC_CODES.SF_UNKNOWN_TYPE);
    });

    test('should reject varchar(negative)', () => {
      const source = `table users {
  invalid varchar(-1)
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'invalid', type: 'varchar(-1)' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 1);
    });
  });

  suite('Parameterized Types - numeric(m,n)', () => {
    test('should accept numeric(10,2)', () => {
      const source = `table products {
  price numeric(10,2)
}`;
      const ast: DatabaseSchema = {
        tables: {
          products: {
            name: 'products',
            columns: [{ name: 'price', type: 'numeric(10,2)' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should accept numeric(5,0)', () => {
      const source = `table products {
  quantity numeric(5,0)
}`;
      const ast: DatabaseSchema = {
        tables: {
          products: {
            name: 'products',
            columns: [{ name: 'quantity', type: 'numeric(5,0)' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should accept numeric(19,4)', () => {
      const source = `table products {
  amount numeric(19,4)
}`;
      const ast: DatabaseSchema = {
        tables: {
          products: {
            name: 'products',
            columns: [{ name: 'amount', type: 'numeric(19,4)' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should reject numeric with scale > precision', () => {
      const source = `table products {
  invalid numeric(2,5)
}`;
      const ast: DatabaseSchema = {
        tables: {
          products: {
            name: 'products',
            columns: [{ name: 'invalid', type: 'numeric(2,5)' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].code, DIAGNOSTIC_CODES.SF_UNKNOWN_TYPE);
    });

    test('should reject numeric with zero precision', () => {
      const source = `table products {
  invalid numeric(0,0)
}`;
      const ast: DatabaseSchema = {
        tables: {
          products: {
            name: 'products',
            columns: [{ name: 'invalid', type: 'numeric(0,0)' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 1);
    });

    test('should reject numeric with negative scale', () => {
      const source = `table products {
  invalid numeric(10,-1)
}`;
      const ast: DatabaseSchema = {
        tables: {
          products: {
            name: 'products',
            columns: [{ name: 'invalid', type: 'numeric(10,-1)' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 1);
    });
  });

  suite('Invalid Types', () => {
    test('should reject unknown type', () => {
      const source = `table users {
  field unknown_type
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'field', type: 'unknown_type' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 1);
      assert.strictEqual(findings[0].code, DIAGNOSTIC_CODES.SF_UNKNOWN_TYPE);
      assert.strictEqual(findings[0].severity, vscode.DiagnosticSeverity.Error);
    });

    test('should reject json type', () => {
      const source = `table users {
  data json
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'data', type: 'json' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 1);
    });

    test('should reject string type (use text or varchar)', () => {
      const source = `table users {
  name string
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'name', type: 'string' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 1);
    });

    test('should reject float type', () => {
      const source = `table products {
  price float
}`;
      const ast: DatabaseSchema = {
        tables: {
          products: {
            name: 'products',
            columns: [{ name: 'price', type: 'float' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 1);
    });

    test('should reject double type', () => {
      const source = `table products {
  price double
}`;
      const ast: DatabaseSchema = {
        tables: {
          products: {
            name: 'products',
            columns: [{ name: 'price', type: 'double' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 1);
    });
  });

  suite('Mixed Scenarios', () => {
    test('should handle multiple columns with mixed types', () => {
      const source = `table users {
  id uuid pk
  name varchar(255)
  email text
  age int
  balance numeric(10,2)
  active boolean
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'name', type: 'varchar(255)' as ColumnType },
              { name: 'email', type: 'text' as ColumnType },
              { name: 'age', type: 'int' as ColumnType },
              { name: 'balance', type: 'numeric(10,2)' as ColumnType },
              { name: 'active', type: 'boolean' as ColumnType },
            ],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should detect multiple invalid types in one table', () => {
      const source = `table users {
  id json
  name string
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'json' as ColumnType },
              { name: 'name', type: 'string' as ColumnType },
            ],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 2);
      assert.ok(findings.every(f => f.code === DIAGNOSTIC_CODES.SF_UNKNOWN_TYPE));
    });

    test('should detect invalid types across multiple tables', () => {
      const source = `table users {
  data json
}
table posts {
  content xml
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'data', type: 'json' as ColumnType }],
          },
          posts: {
            name: 'posts',
            columns: [{ name: 'content', type: 'xml' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 2);
    });

    test('should include table and column names in error message', () => {
      const source = `table users {
  status unknown_type
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'status', type: 'unknown_type' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 1);
      assert.ok(findings[0].message.includes('status'));
      assert.ok(findings[0].message.includes('unknown_type'));
    });

    test('should report correct error severity', () => {
      const source = `table users {
  field invalid_type
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'field', type: 'invalid_type' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings[0].severity, vscode.DiagnosticSeverity.Error);
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

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should handle empty database', () => {
      const source = '';
      const ast: DatabaseSchema = {
        tables: {},
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should be case insensitive for types', () => {
      // Types should be matched/validated consistently
      const source = `table users {
  name TEXT
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'name', type: 'TEXT' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      // Should accept uppercase text
      assert.strictEqual(findings.length, 0);
    });

    test('should handle types with extra spaces', () => {
      const source = `table users {
  name  text
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'name', type: 'text' as ColumnType }],
          },
        },
      };

      const findings = validateSupportedTypes(ast, source);

      assert.strictEqual(findings.length, 0);
    });
  });
});
