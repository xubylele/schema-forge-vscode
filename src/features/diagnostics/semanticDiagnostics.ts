/**
 * Semantic Diagnostics Validator
 * Orchestrates all rules to validate Schema AST semantic structure
 * Pure functions: no mutations, deterministic output
 */

import * as vscode from 'vscode';
import { DatabaseSchema } from '@xubylele/schema-forge-core';
import { validateTableHasColumns } from './rules/tableHasColumnsRule';
import { validateTablePrimaryKey } from './rules/tablePrimaryKeyRules';
import { validateDuplicateColumns } from './rules/duplicateColumnsRule';
import { validateSupportedTypes } from './rules/supportedTypesRule';
import { validateDefaultNowType } from './rules/defaultNowTypeRule';
import { SemanticFinding } from './rules/types';

/**
 * Validate semantic structure of parsed schema AST
 * Runs all semantic rules and returns aggregated findings
 * Output is deterministically sorted for stable ordering
 *
 * @param ast - Parsed DatabaseSchema AST
 * @param source - Original DSL source text (for range computation)
 * @returns Array of findings, sorted deterministically
 */
export function validateSemantic(
  ast: DatabaseSchema,
  source: string
): SemanticFinding[] {
  const findings: SemanticFinding[] = [];

  // Run all validation rules
  findings.push(...validateTableHasColumns(ast, source));
  findings.push(...validateTablePrimaryKey(ast, source));
  findings.push(...validateDuplicateColumns(ast, source));
  findings.push(...validateSupportedTypes(ast, source));
  findings.push(...validateDefaultNowType(ast, source));

  // Sort findings deterministically:
  // 1. By table name (alphabetical)
  // 2. By line number (ascending)
  // 3. By column number (ascending)
  // 4. By code (alphabetical)
  findings.sort((a, b) => {
    if (a.line !== b.line) {
      return a.line - b.line;
    }
    if (a.startColumn !== b.startColumn) {
      return a.startColumn - b.startColumn;
    }
    return a.code.localeCompare(b.code);
  });

  return findings;
}

/**
 * Convert semantic findings to VS Code diagnostics
 * @param findings - Array of semantic findings
 * @returns Array of VS Code Diagnostic objects
 */
export function findingsToVscodeDiagnostics(
  findings: SemanticFinding[]
): vscode.Diagnostic[] {
  return findings.map((finding) => {
    const range = new vscode.Range(
      finding.line,
      finding.startColumn,
      finding.line,
      finding.endColumn
    );

    const diagnostic = new vscode.Diagnostic(range, finding.message, finding.severity);
    diagnostic.code = finding.code;
    diagnostic.source = 'Schema Forge';

    return diagnostic;
  });
}
