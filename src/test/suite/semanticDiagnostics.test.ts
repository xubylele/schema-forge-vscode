import { ColumnType, DatabaseSchema } from '@xubylele/schema-forge-core';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { SEMANTIC_CODES } from '../../features/diagnostics/rules/codes';
import { findingsToVscodeDiagnostics, validateSemantic } from '../../features/diagnostics/semanticDiagnostics';

suite('Semantic Diagnostics Test Suite', () => {
  function createMockDocument(source: string) {
    return {
      uri: vscode.Uri.file('/test/schema.sf'),
      languageId: 'schema-forge',
      getText: () => source,
      lineAt: (line: number) => ({
        text: source.split('\n')[line] || '',
        lineNumber: line,
      }),
      lineCount: source.split('\n').length,
    } as any;
  }

  test('should detect table with zero columns', () => {
    const source = `table users { }`;
    const document = createMockDocument(source);

    // We would normally parse this, but for semantic testing, we'll mock the AST
    // In real usage: const ast = parseSchema(source);
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [],
        },
      },
    };

    const findings = validateSemantic(ast, source);

    // Table with zero columns triggers both "no columns" and "no primary key" rules
    assert.strictEqual(findings.length, 2);
    const noColumnsFind = findings.find((f) => f.code === SEMANTIC_CODES.TABLE_NO_COLUMNS);
    assert.ok(noColumnsFind);
    assert.strictEqual(noColumnsFind.severity, vscode.DiagnosticSeverity.Error);
  });

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

    const findings = validateSemantic(ast, source);

    const noPkFinding = findings.find((f) => f.code === SEMANTIC_CODES.TABLE_NO_PRIMARY_KEY);
    assert.ok(noPkFinding);
    assert.strictEqual(noPkFinding.severity, vscode.DiagnosticSeverity.Error);
  });

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

    const findings = validateSemantic(ast, source);

    const multiplePkFinding = findings.find((f) => f.code === SEMANTIC_CODES.TABLE_MULTIPLE_PRIMARY_KEYS);
    assert.ok(multiplePkFinding);
    assert.strictEqual(multiplePkFinding.severity, vscode.DiagnosticSeverity.Warning);
  });

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
          primaryKey: 'id',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'name', type: 'text' as ColumnType },
            { name: 'name', type: 'varchar(255)' as ColumnType },
          ],
        },
      },
    };

    const findings = validateSemantic(ast, source);

    const dupFinding = findings.find((f) => f.code === SEMANTIC_CODES.DUPLICATE_COLUMN_NAME);
    assert.ok(dupFinding);
    assert.strictEqual(dupFinding.severity, vscode.DiagnosticSeverity.Error);
    assert.match(dupFinding.message, /Duplicate column name 'name'/);
  });

  test('should detect unknown/unsupported types', () => {
    const source = `table users {
  id uuid pk
  data json
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          primaryKey: 'id',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'data', type: 'json' as ColumnType },
          ],
        },
      },
    };

    const findings = validateSemantic(ast, source);

    const unknownTypeFinding = findings.find((f) => f.code === SEMANTIC_CODES.UNKNOWN_TYPE);
    assert.ok(unknownTypeFinding);
    assert.strictEqual(unknownTypeFinding.severity, vscode.DiagnosticSeverity.Error);
    assert.match(unknownTypeFinding.message, /Unknown or unsupported column type 'json'/);
  });

  test('should accept valid varchar(n) type', () => {
    const source = `table users {
  id uuid pk
  name varchar(255)
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          primaryKey: 'id',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'name', type: 'varchar(255)' as ColumnType },
          ],
        },
      },
    };

    const findings = validateSemantic(ast, source);

    const unknownTypeFindings = findings.filter((f) => f.code === SEMANTIC_CODES.UNKNOWN_TYPE);
    assert.strictEqual(unknownTypeFindings.length, 0);
  });

  test('should accept valid numeric(m,n) type', () => {
    const source = `table products {
  id uuid pk
  price numeric(10,2)
}`;
    const ast: DatabaseSchema = {
      tables: {
        products: {
          name: 'products',
          primaryKey: 'id',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'price', type: 'numeric(10,2)' as ColumnType },
          ],
        },
      },
    };

    const findings = validateSemantic(ast, source);

    const unknownTypeFindings = findings.filter((f) => f.code === SEMANTIC_CODES.UNKNOWN_TYPE);
    assert.strictEqual(unknownTypeFindings.length, 0);
  });

  test('should detect default now() on non-timestamptz', () => {
    const source = `table users {
  id uuid pk
  created_at text default now()
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          primaryKey: 'id',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'created_at', type: 'text' as ColumnType, default: 'now()' },
          ],
        },
      },
    };

    const findings = validateSemantic(ast, source);

    const nowTypeFinding = findings.find((f) => f.code === SEMANTIC_CODES.DEFAULT_NOW_WRONG_TYPE);
    assert.ok(nowTypeFinding);
    assert.strictEqual(nowTypeFinding.severity, vscode.DiagnosticSeverity.Warning);
  });

  test('should allow default now() on timestamptz', () => {
    const source = `table users {
  id uuid pk
  created_at timestamptz default now()
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          primaryKey: 'id',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'created_at', type: 'timestamptz' as ColumnType, default: 'now()' },
          ],
        },
      },
    };

    const findings = validateSemantic(ast, source);

    const nowTypeFindings = findings.filter((f) => f.code === SEMANTIC_CODES.DEFAULT_NOW_WRONG_TYPE);
    assert.strictEqual(nowTypeFindings.length, 0);
  });

  test('should convert findings to vscode diagnostics with codes', () => {
    const source = `table users { }`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [],
        },
      },
    };

    const findings = validateSemantic(ast, source);
    const diagnostics = findingsToVscodeDiagnostics(findings);

    assert.strictEqual(diagnostics.length, findings.length);
    assert.ok(diagnostics[0].code);
    assert.strictEqual(diagnostics[0].code, SEMANTIC_CODES.TABLE_NO_COLUMNS);
    assert.strictEqual(diagnostics[0].source, 'Schema Forge');
  });

  test('should produce deterministic ordering of findings', () => {
    const source = `table a {
  id uuid
}
table b {
  id uuid pk
  name text
  name varchar(100)
}`;
    const ast: DatabaseSchema = {
      tables: {
        a: {
          name: 'a',
          columns: [{ name: 'id', type: 'uuid' as ColumnType }],
        },
        b: {
          name: 'b',
          primaryKey: 'id',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'name', type: 'text' as ColumnType },
            { name: 'name', type: 'varchar(100)' as ColumnType },
          ],
        },
      },
    };

    // Run multiple times to ensure deterministic output
    const findings1 = validateSemantic(ast, source);
    const findings2 = validateSemantic(ast, source);

    assert.strictEqual(findings1.length, findings2.length);
    for (let i = 0; i < findings1.length; i++) {
      assert.strictEqual(findings1[i].code, findings2[i].code);
      assert.strictEqual(findings1[i].line, findings2[i].line);
      assert.strictEqual(findings1[i].startColumn, findings2[i].startColumn);
    }
  });

  test('should include all finding types in multi-issue schema', () => {
    const source = `table users {
  id uuid
  created_at text default now()
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType },
            { name: 'created_at', type: 'text' as ColumnType, default: 'now()' },
          ],
        },
      },
    };

    const findings = validateSemantic(ast, source);

    // Should find: no primary key, wrong type for now()
    const noPk = findings.find((f) => f.code === SEMANTIC_CODES.TABLE_NO_PRIMARY_KEY);
    const wrongNowType = findings.find((f) => f.code === SEMANTIC_CODES.DEFAULT_NOW_WRONG_TYPE);

    assert.ok(noPk, 'Should have TABLE_NO_PRIMARY_KEY finding');
    assert.ok(wrongNowType, 'Should have DEFAULT_NOW_WRONG_TYPE finding');
  });

  test('should return empty findings for valid schema', () => {
    const source = `table users {
  id uuid pk
  name text not null
  email text unique
  created_at timestamptz default now()
}`;
    const ast: DatabaseSchema = {
      tables: {
        users: {
          name: 'users',
          primaryKey: 'id',
          columns: [
            { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
            { name: 'name', type: 'text' as ColumnType, nullable: false },
            { name: 'email', type: 'text' as ColumnType, unique: true },
            { name: 'created_at', type: 'timestamptz' as ColumnType, default: 'now()' },
          ],
        },
      },
    };

    const findings = validateSemantic(ast, source);

    assert.strictEqual(findings.length, 0, 'Valid schema should have no findings');
  });
});
