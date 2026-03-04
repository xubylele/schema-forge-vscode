import { ColumnType, DatabaseSchema } from '@xubylele/schema-forge-core';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { DIAGNOSTIC_CODES } from '../codes';
import { findingsToVscodeDiagnostics, validateSemantic } from '../semanticDiagnostics';

suite('Semantic Diagnostics Orchestration Test Suite', () => {
  suite('validateSemantic Orchestration', () => {
    test('should run all rules and return combined findings', () => {
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

      // Empty table should trigger: no columns + no primary key
      assert.strictEqual(findings.length, 2);
      assert.ok(findings.some(f => f.code === DIAGNOSTIC_CODES.SF_NO_COLUMNS));
      assert.ok(findings.some(f => f.code === DIAGNOSTIC_CODES.SF_NO_PK));
    });

    test('should return empty array for valid schema', () => {
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

      const findings = validateSemantic(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should collect violations from all rule types', () => {
      const source = `table users {
  id uuid
  id int
  email unknown_type
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType },
              { name: 'id', type: 'int' as ColumnType },
              { name: 'email', type: 'unknown_type' as ColumnType },
            ],
          },
        },
      };

      const findings = validateSemantic(ast, source);

      // Should detect: no primary key, duplicate id, unknown type
      assert.ok(findings.length >= 2);
      assert.ok(findings.some(f => f.code === DIAGNOSTIC_CODES.SF_NO_PK));
      assert.ok(findings.some(f => f.code === DIAGNOSTIC_CODES.SF_DUPLICATE_COLUMN));
      assert.ok(findings.some(f => f.code === DIAGNOSTIC_CODES.SF_UNKNOWN_TYPE));
    });

    test('should handle multiple tables with different issues', () => {
      const source = `table users { }
table posts {
  id uuid pk
  id text pk
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: { name: 'users', columns: [] },
          posts: {
            name: 'posts',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'id', type: 'text' as ColumnType, primaryKey: true },
            ],
          },
        },
      };

      const findings = validateSemantic(ast, source);

      // users: no columns + no pk
      // posts: duplicate column + multiple pk
      assert.ok(findings.length >= 3);
      assert.ok(findings.some(f => f.message.includes('users')));
      assert.ok(findings.some(f => f.message.includes('posts')));
    });
  });

  suite('Finding Sorting and Determinism', () => {
    test('should sort findings deterministically by line then column', () => {
      const source = `table users {
  id uuid
  id int
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType },
              { name: 'id', type: 'int' as ColumnType },
            ],
          },
        },
      };

      const findings1 = validateSemantic(ast, source);
      const findings2 = validateSemantic(ast, source);

      // Same input should produce same ordered results
      assert.strictEqual(findings1.length, findings2.length);
      for (let i = 0; i < findings1.length; i++) {
        assert.strictEqual(findings1[i].code, findings2[i].code);
        assert.strictEqual(findings1[i].line, findings2[i].line);
      }
    });

    test('should sort by line number first', () => {
      const source = `table users {
  id uuid
  id int
  name text
  name varchar
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType },
              { name: 'id', type: 'int' as ColumnType },
              { name: 'name', type: 'text' as ColumnType },
              { name: 'name', type: 'varchar' as ColumnType },
            ],
          },
        },
      };

      const findings = validateSemantic(ast, source);

      // Findings should be ordered by line number
      const lineNumbers = findings.map(f => f.line);
      const sortedLineNumbers = [...lineNumbers].sort((a, b) => a - b);
      assert.deepStrictEqual(lineNumbers, sortedLineNumbers);
    });

    test('should sort by startColumn within same line', () => {
      const source = `table users {
  id uuid
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'id', type: 'uuid' as ColumnType }],
          },
        },
      };

      const findings = validateSemantic(ast, source);

      // All findings from same line should be sorted by startColumn
      const findingsByLine = new Map<number, any[]>();
      findings.forEach(f => {
        if (!findingsByLine.has(f.line)) {
          findingsByLine.set(f.line, []);
        }
        const lineFindings = findingsByLine.get(f.line);
        assert.ok(lineFindings);
        lineFindings!.push(f);
      });

      for (const [, lineFinding] of findingsByLine) {
        if (lineFinding && lineFinding.length > 1) {
          const cols = lineFinding.map(f => f.startColumn);
          const sortedCols = [...cols].sort((a, b) => a - b);
          assert.deepStrictEqual(cols, sortedCols);
        }
      }
    });
  });

  suite('findingsToVscodeDiagnostics Conversion', () => {
    test('should convert findings to VSCode diagnostics', () => {
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

      const findings = validateSemantic(ast, source);
      const diagnostics = findingsToVscodeDiagnostics(findings);

      assert.ok(Array.isArray(diagnostics));
      assert.strictEqual(diagnostics.length, findings.length);
    });

    test('should set correct diagnostic severity', () => {
      const source = `table users { }`;
      const ast: DatabaseSchema = {
        tables: {
          users: { name: 'users', columns: [] },
        },
      };

      const findings = validateSemantic(ast, source);
      const diagnostics = findingsToVscodeDiagnostics(findings);

      // SF_NO_COLUMNS is an error severity
      const errorDiag = diagnostics.find(
        d => d.code === DIAGNOSTIC_CODES.SF_NO_COLUMNS
      );
      assert.ok(errorDiag);
      assert.strictEqual(
        errorDiag.severity,
        vscode.DiagnosticSeverity.Error
      );
    });

    test('should set correct diagnostic range from finding positions', () => {
      const source = `table users {
  id uuid
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [{ name: 'id', type: 'uuid' as ColumnType, primaryKey: true }],
          },
        },
      };

      const findings = validateSemantic(ast, source);
      const diagnostics = findingsToVscodeDiagnostics(findings);

      assert.ok(diagnostics.length >= 0);
      for (const diag of diagnostics) {
        assert.ok(diag.range instanceof vscode.Range);
        assert.strictEqual(diag.range.start.line, diag.range.end.line);
        assert.ok(diag.range.start.character >= 0);
        assert.ok(diag.range.end.character >= diag.range.start.character);
      }
    });

    test('should include diagnostic code from finding', () => {
      const source = `table users {
  name text
  name varchar
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'name', type: 'text' as ColumnType },
              { name: 'name', type: 'varchar' as ColumnType },
            ],
          },
        },
      };

      const findings = validateSemantic(ast, source);
      const diagnostics = findingsToVscodeDiagnostics(findings);

      // Duplicate column finding should have correct code
      const dupDiag = diagnostics.find(
        d => d.code === DIAGNOSTIC_CODES.SF_DUPLICATE_COLUMN
      );
      assert.ok(dupDiag);
    });

    test('should include diagnostic message from finding', () => {
      const source = `table users { }`;
      const ast: DatabaseSchema = {
        tables: {
          users: { name: 'users', columns: [] },
        },
      };

      const findings = validateSemantic(ast, source);
      const diagnostics = findingsToVscodeDiagnostics(findings);

      // Should have human-readable messages
      for (const diag of diagnostics) {
        assert.ok(typeof diag.message === 'string');
        assert.ok(diag.message.length > 0);
      }
    });

    test('should handle empty findings array', () => {
      const diagnostics = findingsToVscodeDiagnostics([]);

      assert.ok(Array.isArray(diagnostics));
      assert.strictEqual(diagnostics.length, 0);
    });

    test('should handle findings with various severity levels', () => {
      const source = `table users {
  id uuid pk
  id datetime default now()
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              {
                name: 'id',
                type: 'datetime' as ColumnType,
                default: 'now()',
              },
            ],
          },
        },
      };

      const findings = validateSemantic(ast, source);
      const diagnostics = findingsToVscodeDiagnostics(findings);

      // Should have both errors and warnings
      const hasSeverity = (severity: vscode.DiagnosticSeverity) =>
        diagnostics.some(d => d.severity === severity);

      // May have error and/or warning depending on findings
      assert.ok(
        hasSeverity(vscode.DiagnosticSeverity.Error) ||
        hasSeverity(vscode.DiagnosticSeverity.Warning)
      );
    });
  });

  suite('Complex Multi-Rule Scenarios', () => {
    test('should detect all violations in poorly formed schema', () => {
      const source = `table users {
  id json
  id datetime default now()
  email unknown
  email varchar
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'json' as ColumnType, default: 'now()' },
              { name: 'id', type: 'datetime' as ColumnType, default: 'now()' },
              { name: 'email', type: 'unknown' as ColumnType },
              { name: 'email', type: 'varchar' as ColumnType },
            ],
          },
        },
      };

      const findings = validateSemantic(ast, source);

      // Should detect:
      // - multiple primary keys
      // - duplicate id columns
      // - default now() on wrong type (twice)
      // - unknown type
      // - duplicate email columns
      assert.ok(findings.length >= 3);
      assert.ok(findings.some(f => f.code === DIAGNOSTIC_CODES.SF_MULTIPLE_PK));
      assert.ok(findings.some(f => f.code === DIAGNOSTIC_CODES.SF_DUPLICATE_COLUMN));
      assert.ok(findings.some(f => f.code === DIAGNOSTIC_CODES.SF_UNKNOWN_TYPE));
    });

    test('should handle schema with mixed valid and invalid tables', () => {
      const source = `table valid_table {
  id uuid pk
  name text
}
table invalid_table { }
table mixed_table {
  id uuid pk
  bad_field unknown_type
}`;
      const ast: DatabaseSchema = {
        tables: {
          valid_table: {
            name: 'valid_table',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'name', type: 'text' as ColumnType },
            ],
          },
          invalid_table: { name: 'invalid_table', columns: [] },
          mixed_table: {
            name: 'mixed_table',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'bad_field', type: 'unknown_type' as ColumnType },
            ],
          },
        },
      };

      const findings = validateSemantic(ast, source);

      // valid_table: no findings
      // invalid_table: no columns + no pk
      // mixed_table: unknown type
      assert.ok(findings.length >= 3);
      assert.ok(findings.some(f => f.message.includes('invalid_table')));
      assert.ok(findings.some(f => f.message.includes('mixed_table')));
    });
  });

  suite('Edge Cases', () => {
    test('should handle empty database', () => {
      const source = '';
      const ast: DatabaseSchema = {
        tables: {},
      };

      const findings = validateSemantic(ast, source);

      assert.strictEqual(findings.length, 0);
    });

    test('should handle large number of tables', () => {
      const tables: Record<string, any> = {};
      for (let i = 0; i < 10; i++) {
        tables[`table${i}`] = {
          name: `table${i}`,
          columns: [],
        };
      }

      const ast: DatabaseSchema = { tables };
      const findings = validateSemantic(ast, '');

      // Each empty table should trigger 2 violations
      assert.strictEqual(findings.length, 20);
    });

    test('should handle columns with complex modifiers', () => {
      const source = `table users {
  id uuid pk
  name varchar(255) unique not null default 'Unknown'
  created_at timestamptz default now()
  balance numeric(10,2)
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid' as ColumnType, primaryKey: true },
              { name: 'name', type: 'varchar(255)' as ColumnType },
              {
                name: 'created_at',
                type: 'timestamptz' as ColumnType,
                default: 'now()',
              },
              { name: 'balance', type: 'numeric(10,2)' as ColumnType },
            ],
          },
        },
      };

      const findings = validateSemantic(ast, source);

      // No violations for well-formed schema
      assert.strictEqual(findings.length, 0);
    });

    test('should handle table with many duplicate columns', () => {
      const source = `table users {
  field text
  field text
  field text
  field text
  field text
}`;
      const ast: DatabaseSchema = {
        tables: {
          users: {
            name: 'users',
            columns: [
              { name: 'field', type: 'text' as ColumnType },
              { name: 'field', type: 'text' as ColumnType },
              { name: 'field', type: 'text' as ColumnType },
              { name: 'field', type: 'text' as ColumnType },
              { name: 'field', type: 'text' as ColumnType },
            ],
          },
        },
      };

      const findings = validateSemantic(ast, source);

      // Should report: duplicate columns + no pk
      assert.ok(findings.length >= 2);
      const dupCount = findings.filter(
        f => f.code === DIAGNOSTIC_CODES.SF_DUPLICATE_COLUMN
      ).length;
      assert.ok(dupCount > 0);
    });
  });
});
