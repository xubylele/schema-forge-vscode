/**
 * Rule: DEFAULT_NOW_WRONG_TYPE
 * default now() should only be used on timestamptz columns
 */

import { DatabaseSchema } from '@xubylele/schema-forge-core';
import * as vscode from 'vscode';
import { SEMANTIC_CODES } from './codes';
import { findDefaultNowRange, findTableEndLine, findTableRange } from './ranges';
import { SemanticFinding } from './types';

export function validateDefaultNowType(
  ast: DatabaseSchema,
  source: string
): SemanticFinding[] {
  const findings: SemanticFinding[] = [];

  for (const [tableName, table] of Object.entries(ast.tables)) {
    const tableRange = findTableRange(source, tableName);
    const tableEndLine = findTableEndLine(source, tableRange.line);

    for (const col of table.columns) {
      // Check if default contains "now()"
      if (col.default && /\bnow\s*\(\s*\)/i.test(col.default)) {
        // Check if type is timestamptz
        if (col.type !== 'timestamptz') {
          const range = findDefaultNowRange(source, tableRange.line, tableEndLine);

          findings.push({
            code: SEMANTIC_CODES.DEFAULT_NOW_WRONG_TYPE,
            message: `Column '${col.name}' has type '${col.type}' but uses 'default now()'. The 'now()' function returns a timestamp and should only be used with 'timestamptz' columns.`,
            severity: vscode.DiagnosticSeverity.Warning,
            line: range.line,
            startColumn: range.startColumn,
            endColumn: range.endColumn,
          });
        }
      }
    }
  }

  return findings;
}
