import type { DatabaseSchema, Table } from '@xubylele/schema-forge-core';
import * as vscode from 'vscode';
import { parseSchemaContent } from '../../core/adapter';
import { DIAGNOSTIC_CODES } from '../diagnostics/codes';
import { findTableEndLine, findTableRange } from '../diagnostics/rules/ranges';

export const CONVERT_TO_UUID_PK_COMMAND = 'schemaForge.convertColumnToUuidPk';

export class ConvertToUuidPkCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): Promise<vscode.CodeAction[]> {
    const noPkDiagnostics = context.diagnostics.filter(
      d => d.code === DIAGNOSTIC_CODES.SF_NO_PK
    );

    if (noPkDiagnostics.length === 0) {
      return [];
    }

    const source = document.getText();

    try {
      const parseResult = await parseSchemaContent(source);
      if (!parseResult.ok) {
        return [];
      }

      const actions: vscode.CodeAction[] = [];
      for (const diagnostic of noPkDiagnostics) {
        const action = this.createConvertAction(
          document,
          diagnostic,
          parseResult.ast,
          range.start.line,
          source
        );

        if (action) {
          actions.push(action);
        }
      }

      return actions;
    } catch {
      return [];
    }
  }

  private createConvertAction(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    ast: DatabaseSchema,
    selectedLine: number,
    source: string
  ): vscode.CodeAction | null {
    const tableName = extractTableNameFromDiagnostic(diagnostic.message);
    if (!tableName) {
      return null;
    }

    const table = ast.tables[tableName];
    if (!table) {
      return null;
    }

    const tableRange = findTableRange(source, tableName);
    const tableEndLine = findTableEndLine(source, tableRange.line);

    if (!isLineInsideTableBody(selectedLine, tableRange.line, tableEndLine)) {
      return null;
    }

    const lineText = document.lineAt(selectedLine).text;
    const selectedColumnName = resolveSelectedColumnNameFromLine(lineText, table);
    if (!selectedColumnName) {
      return null;
    }

    const action = new vscode.CodeAction(
      `Convert '${selectedColumnName}' to 'id uuid pk'`,
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      command: CONVERT_TO_UUID_PK_COMMAND,
      title: "Convert to 'id uuid pk'",
      arguments: [document.uri, tableName, selectedLine],
    };
    action.diagnostics = [diagnostic];
    action.isPreferred = true;

    return action;
  }
}

export function registerConvertToUuidPkCommand(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const disposable = vscode.commands.registerCommand(
    CONVERT_TO_UUID_PK_COMMAND,
    async (uri: vscode.Uri, tableName: string, selectedLine: number) => {
      const document = await vscode.workspace.openTextDocument(uri);
      const source = document.getText();
      const parseResult = await parseSchemaContent(source);

      if (!parseResult.ok) {
        vscode.window.showErrorMessage('Could not parse schema. Fix syntax errors and try again.');
        return;
      }

      const table = parseResult.ast.tables[tableName];
      if (!table) {
        vscode.window.showErrorMessage(`Table '${tableName}' no longer exists.`);
        return;
      }

      const tableRange = findTableRange(source, tableName);
      const tableEndLine = findTableEndLine(source, tableRange.line);

      if (!isLineInsideTableBody(selectedLine, tableRange.line, tableEndLine)) {
        vscode.window.showErrorMessage('Select a column line inside the target table and try again.');
        return;
      }

      const lineText = document.lineAt(selectedLine).text;
      const selectedColumnName = resolveSelectedColumnNameFromLine(lineText, table);
      if (!selectedColumnName) {
        vscode.window.showErrorMessage('Selected line is not a valid column inside the target table.');
        return;
      }

      if (hasDuplicateIdConflict(table, selectedColumnName)) {
        vscode.window.showErrorMessage("Cannot convert: table already has an 'id' column.");
        return;
      }

      const replacementLine = buildConvertedColumnLine(lineText);
      if (!replacementLine) {
        vscode.window.showErrorMessage('Could not transform selected column line.');
        return;
      }

      const lineRange = document.lineAt(selectedLine).range;
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, lineRange, replacementLine);

      await vscode.workspace.applyEdit(edit);
    }
  );

  context.subscriptions.push(disposable);
  return disposable;
}

function extractTableNameFromDiagnostic(message: string): string | null {
  const match = message.match(/Table '([^']+)'/);
  return match ? match[1] : null;
}

function isLineInsideTableBody(line: number, tableStartLine: number, tableEndLine: number): boolean {
  return line > tableStartLine && line < tableEndLine;
}

export function resolveSelectedColumnNameFromLine(lineText: string, table: Table): string | null {
  const { codePart } = splitLineComment(lineText);
  const trimmed = codePart.trim();

  if (!trimmed || trimmed === '{' || trimmed === '}') {
    return null;
  }

  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 2) {
    return null;
  }

  const candidateName = tokens[0];
  return table.columns.some(col => col.name === candidateName) ? candidateName : null;
}

export function hasDuplicateIdConflict(table: Table, selectedColumnName: string): boolean {
  const idColumns = table.columns.filter(col => col.name === 'id');

  if (selectedColumnName === 'id') {
    return idColumns.length > 1;
  }

  return idColumns.length > 0;
}

export function buildConvertedColumnLine(lineText: string): string | null {
  const leadingWhitespace = lineText.match(/^(\s*)/)?.[1] ?? '';
  const { codePart, commentPart, spacingBeforeComment } = splitLineComment(lineText);
  const trimmed = codePart.trim();

  if (!trimmed) {
    return null;
  }

  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 2) {
    return null;
  }

  const modifiers = tokens.slice(2).filter(token => token.toLowerCase() !== 'pk');
  const normalizedTokens = ['id', 'uuid', ...modifiers, 'pk'];
  const rewritten = `${leadingWhitespace}${normalizedTokens.join(' ')}`;

  if (!commentPart) {
    return rewritten;
  }

  return `${rewritten}${spacingBeforeComment || ' '}${commentPart}`;
}

function splitLineComment(lineText: string): {
  codePart: string;
  commentPart: string;
  spacingBeforeComment: string;
} {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let commentStart = -1;

  for (let i = 0; i < lineText.length; i++) {
    const char = lineText[i];
    const next = lineText[i + 1];

    if (char === "'" && !inDoubleQuote) {
      if (inSingleQuote && next === "'") {
        i++;
        continue;
      }

      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      if (inDoubleQuote && next === '"') {
        i++;
        continue;
      }

      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (inSingleQuote || inDoubleQuote) {
      continue;
    }

    if (char === '#') {
      commentStart = i;
      break;
    }

    if (char === '/' && next === '/') {
      commentStart = i;
      break;
    }
  }

  if (commentStart === -1) {
    return {
      codePart: lineText,
      commentPart: '',
      spacingBeforeComment: '',
    };
  }

  const leftPart = lineText.slice(0, commentStart);
  const trimmedLeft = leftPart.trimEnd();

  return {
    codePart: trimmedLeft,
    commentPart: lineText.slice(commentStart),
    spacingBeforeComment: leftPart.slice(trimmedLeft.length),
  };
}
