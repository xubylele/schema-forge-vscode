/**
 * Rule: DUPLICATE_COLUMN_NAME
 * Column names must be unique within a table
 */

import { DatabaseSchema } from '@xubylele/schema-forge-core';
import * as vscode from 'vscode';
import { DIAGNOSTIC_CODES } from '../codes';
import { findColumnRange, findTableEndLine, findTableRange } from './ranges';
import { SemanticFinding } from './types';

export function validateDuplicateColumns(
  ast: DatabaseSchema,
  source: string
): SemanticFinding[] {
  const findings: SemanticFinding[] = [];

  for (const [tableName, table] of Object.entries(ast.tables)) {
    // Find duplicate column names
    const seenNames = new Set<string>();
    const duplicates = new Set<string>();

    for (const col of table.columns) {
      if (seenNames.has(col.name)) {
        duplicates.add(col.name);
      }
      seenNames.add(col.name);
    }

    // For each duplicate, report its location
    if (duplicates.size > 0) {
      const tableRange = findTableRange(source, tableName);
      const tableEndLine = findTableEndLine(source, tableRange.line);

      for (const dupName of duplicates) {
        const colRange = findColumnRange(source, dupName, tableRange.line, tableEndLine);

        findings.push({
          code: DIAGNOSTIC_CODES.SF_DUPLICATE_COLUMN,
          message: `Duplicate column name '${dupName}' in table '${tableName}'.`,
          severity: vscode.DiagnosticSeverity.Error,
          line: colRange.line,
          startColumn: colRange.startColumn,
          endColumn: colRange.endColumn,
        });
      }
    }
  }

  return findings;
}
