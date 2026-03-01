import type { DatabaseSchema, Table } from '@xubylele/schema-forge-core';
import * as vscode from 'vscode';
import { parseSchemaContent } from '../../core/adapter';
import { SEMANTIC_CODES } from '../diagnostics/rules/codes';
import { findTableRange } from '../diagnostics/rules/ranges';

/**
 * Provides Quick Fix code action for tables missing primary keys
 * Offers to insert a primary key column (id uuid pk) at the beginning of the table
 */
export class AddPrimaryKeyCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeAction[]> {
    // Filter for TABLE_NO_PRIMARY_KEY diagnostics
    const noPkDiagnostics = context.diagnostics.filter(
      d => d.code === SEMANTIC_CODES.TABLE_NO_PRIMARY_KEY
    );

    if (noPkDiagnostics.length === 0) {
      return [];
    }

    // Parse AST to get table info
    const source = document.getText();

    try {
      const parseResult = await parseSchemaContent(source);

      if (!parseResult.ok) {
        // Silently fail - parser couldn't parse the schema
        return [];
      }

      // Generate code actions for each diagnostic
      const actions: vscode.CodeAction[] = [];
      for (const diagnostic of noPkDiagnostics) {
        const action = this.createAddPrimaryKeyAction(document, diagnostic, parseResult.ast);
        if (action) {
          actions.push(action);
        }
      }

      return actions;
    } catch (error) {
      // Catch any parser errors and fail gracefully
      return [];
    }
  }

  private createAddPrimaryKeyAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    ast: DatabaseSchema
  ): vscode.CodeAction | null {
    const source = document.getText();

    // Extract table name from diagnostic message
    // Format: "Table '<tableName>' has no primary key..."
    const tableNameMatch = diagnostic.message.match(/Table '([^']+)'/);
    if (!tableNameMatch) {
      return null;
    }

    const tableName = tableNameMatch[1];
    const table = ast.tables[tableName];

    if (!table) {
      return null;
    }

    // Generate unique column name (avoid conflicts)
    const columnName = generatePrimaryKeyColumnName(table);

    // Find insertion position (first line after opening brace)
    const insertPosition = findTableBodyInsertPosition(source, tableName);
    if (!insertPosition) {
      return null;
    }

    // Detect indentation from existing columns or use default
    const tableRange = findTableRange(source, tableName);
    const tableEndLine = findTableEndLine(source, tableRange.line);
    const indentation = detectIndentation(source, tableRange.line, tableEndLine);

    // Create the text to insert
    const columnSpec = `${columnName} uuid pk`;
    const textToInsert = `${indentation}${columnSpec}\n`;

    // Create WorkspaceEdit
    const edit = new vscode.WorkspaceEdit();
    edit.insert(document.uri, insertPosition, textToInsert);

    // Create CodeAction
    const action = new vscode.CodeAction(
      `Add primary key column '${columnName}'`,
      vscode.CodeActionKind.QuickFix
    );
    action.edit = edit;
    action.diagnostics = [diagnostic];
    action.isPreferred = true;

    return action;
  }
}

/**
 * Generate a unique primary key column name that doesn't conflict with existing columns
 * Tries: id → pk_id → {tableName}_id
 */
function generatePrimaryKeyColumnName(table: Table): string {
  const existingNames = new Set(table.columns.map(col => col.name));

  // Try 'id' first
  if (!existingNames.has('id')) {
    return 'id';
  }

  // Try 'pk_id'
  if (!existingNames.has('pk_id')) {
    return 'pk_id';
  }

  // Try '{tableName}_id'
  const tableIdName = `${table.name}_id`;
  if (!existingNames.has(tableIdName)) {
    return tableIdName;
  }

  // Fallback: id_pk (should rarely happen)
  return 'id_pk';
}

/**
 * Find the position where the primary key column should be inserted
 * Returns position of the first line after the opening brace
 */
function findTableBodyInsertPosition(
  source: string,
  tableName: string
): vscode.Position | null {
  const lines = source.split('\n');

  // Find the table declaration line
  const tableRange = findTableRange(source, tableName);
  const startLine = tableRange.line;

  // Search for the opening brace starting from the table declaration
  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    const braceIndex = line.indexOf('{');

    if (braceIndex !== -1) {
      // Check if there's content after the brace on the same line
      const afterBrace = line.substring(braceIndex + 1).trim();

      if (afterBrace && !afterBrace.startsWith('#') && !afterBrace.startsWith('//')) {
        // Content on same line (e.g., "table users { name text }")
        // Insert before the content (after the opening brace and any whitespace)
        const insertCol = braceIndex + 1 + (line.substring(braceIndex + 1).length - line.substring(braceIndex + 1).trimStart().length);
        return new vscode.Position(i, insertCol);
      } else {
        // No content or only comment on same line
        // Insert on next line
        return new vscode.Position(i + 1, 0);
      }
    }
  }

  return null;
}

/**
 * Detect indentation from existing columns in the table
 * Falls back to 2 spaces if no columns exist
 */
function detectIndentation(
  source: string,
  tableStartLine: number,
  tableEndLine: number
): string {
  const lines = source.split('\n');

  // Scan lines within table for first non-empty, non-comment column line
  for (let i = tableStartLine + 1; i < tableEndLine; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines, comments, and lines with only braces
    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('//') ||
      trimmed === '{' ||
      trimmed === '}'
    ) {
      continue;
    }

    // This should be a column line - extract indentation
    const leadingWhitespaceMatch = line.match(/^(\s*)/);
    if (leadingWhitespaceMatch && leadingWhitespaceMatch[1].length > 0) {
      return leadingWhitespaceMatch[1];
    }
  }

  // Default: 2 spaces (matches snippets/schemaforge.json)
  return '  ';
}

/**
 * Find the line number where a table's closing brace appears
 * Tracks brace depth to handle nested structures
 */
function findTableEndLine(source: string, startLine: number): number {
  const lines = source.split('\n');
  let braceDepth = 0;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
      if (char === '{') {
        braceDepth++;
      }
      if (char === '}') {
        braceDepth--;
        if (braceDepth === 0 && i > startLine) {
          return i;
        }
      }
    }
  }

  // Fallback: reasonable guess
  return Math.min(startLine + 10, lines.length - 1);
}
