/**
 * Rule: TABLE_NO_COLUMNS
 * A table must have at least one column
 */

import { DatabaseSchema } from '@xubylele/schema-forge-core';
import * as vscode from 'vscode';
import { DIAGNOSTIC_CODES } from '../codes';
import { findTableRange } from './ranges';
import { SemanticFinding } from './types';

export function validateTableHasColumns(
  ast: DatabaseSchema,
  source: string
): SemanticFinding[] {
  const findings: SemanticFinding[] = [];

  for (const [tableName, table] of Object.entries(ast.tables)) {
    if (table.columns.length === 0) {
      // Find the table header position
      const range = findTableRange(source, tableName);

      findings.push({
        code: DIAGNOSTIC_CODES.SF_NO_COLUMNS,
        message: `Table '${tableName}' has no columns. A table must define at least one column.`,
        severity: vscode.DiagnosticSeverity.Error,
        line: range.line,
        startColumn: range.startColumn,
        endColumn: range.endColumn,
      });
    }
  }

  return findings;
}
