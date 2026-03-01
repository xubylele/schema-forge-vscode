/**
 * Rule: UNKNOWN_TYPE
 * Column types must be supported by Schema Forge
 * Mirrors validation from @xubylele/schema-forge-core parser
 */

import { DatabaseSchema } from '@xubylele/schema-forge-core';
import * as vscode from 'vscode';
import { SEMANTIC_CODES } from './codes';
import { findColumnRange, findTableEndLine, findTableRange } from './ranges';
import { SemanticFinding } from './types';

/**
 * Supported base column types
 * Must match parser.ts validBaseColumnTypes from core
 */
const SUPPORTED_BASE_TYPES = new Set([
  'uuid',
  'varchar',
  'text',
  'int',
  'bigint',
  'boolean',
  'timestamptz',
  'date',
]);

/**
 * Check if a type is valid (base type, varchar(n), or numeric(m,n))
 */
function isValidType(type: string): boolean {
  const normalized = type
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\s*/g, '(')
    .replace(/\s*,\s*/g, ',')
    .replace(/\s*\)\s*/g, ')');

  // Check if it's a base type
  if (SUPPORTED_BASE_TYPES.has(normalized)) {
    return true;
  }

  // Check varchar(n) pattern
  const varcharMatch = normalized.match(/^varchar\((\d+)\)$/);
  if (varcharMatch) {
    const length = Number(varcharMatch[1]);
    return Number.isInteger(length) && length > 0;
  }

  // Check numeric(m,n) pattern
  const numericMatch = normalized.match(/^numeric\((\d+),(\d+)\)$/);
  if (numericMatch) {
    const precision = Number(numericMatch[1]);
    const scale = Number(numericMatch[2]);
    return (
      Number.isInteger(precision) &&
      Number.isInteger(scale) &&
      precision > 0 &&
      scale >= 0 &&
      scale <= precision
    );
  }

  return false;
}

export function validateSupportedTypes(
  ast: DatabaseSchema,
  source: string
): SemanticFinding[] {
  const findings: SemanticFinding[] = [];

  for (const [tableName, table] of Object.entries(ast.tables)) {
    const tableRange = findTableRange(source, tableName);
    const tableEndLine = findTableEndLine(source, tableRange.line);

    for (const col of table.columns) {
      if (!isValidType(col.type)) {
        const colRange = findColumnRange(source, col.name, tableRange.line, tableEndLine);

        findings.push({
          code: SEMANTIC_CODES.UNKNOWN_TYPE,
          message: `Unknown or unsupported column type '${col.type}' in column '${col.name}'. Supported types are: uuid, varchar, varchar(n), text, int, bigint, numeric(m,n), boolean, timestamptz, date.`,
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
