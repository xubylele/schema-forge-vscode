/**
 * Rules: TABLE_NO_PRIMARY_KEY, TABLE_MULTIPLE_PRIMARY_KEYS
 * - A table must have exactly one primary key
 */

import { DatabaseSchema } from '@xubylele/schema-forge-core';
import * as vscode from 'vscode';
import { DIAGNOSTIC_CODES } from '../codes';
import { findTableRange } from './ranges';
import { SemanticFinding } from './types';

export function validateTablePrimaryKey(
  ast: DatabaseSchema,
  source: string
): SemanticFinding[] {
  const findings: SemanticFinding[] = [];

  for (const [tableName, table] of Object.entries(ast.tables)) {
    // Count primary key columns
    const pkColumns = table.columns.filter((col) => col.primaryKey === true);

    if (pkColumns.length === 0) {
      // Error: no primary key
      const range = findTableRange(source, tableName);

      findings.push({
        code: DIAGNOSTIC_CODES.SF_NO_PK,
        message: `Table '${tableName}' has no primary key. Every table must define exactly one primary key.`,
        severity: vscode.DiagnosticSeverity.Error,
        line: range.line,
        startColumn: range.startColumn,
        endColumn: range.endColumn,
      });
    } else if (pkColumns.length > 1) {
      // Warning: multiple primary keys
      const range = findTableRange(source, tableName);

      findings.push({
        code: DIAGNOSTIC_CODES.SF_MULTIPLE_PK,
        message: `Table '${tableName}' has ${pkColumns.length} columns marked as primary key. Only one primary key per table is allowed.`,
        severity: vscode.DiagnosticSeverity.Warning,
        line: range.line,
        startColumn: range.startColumn,
        endColumn: range.endColumn,
      });
    }
  }

  return findings;
}
