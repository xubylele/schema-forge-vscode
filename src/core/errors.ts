import { DatabaseSchema } from '@xubylele/schema-forge-core';
import * as vscode from 'vscode';

/**
 * Normalized extension error with structured information
 */
export interface ExtensionError {
  message: string;
  line?: number;
  column?: number;
  range?: vscode.Range;
}

/**
 * Discriminated union result type for parse operations
 */
export type ParseResult =
  | {
    ok: true;
    ast: DatabaseSchema;
  }
  | {
    ok: false;
    error: ExtensionError;
  };

/**
 * Parse error message to extract line and column information
 * @param message - Error message possibly containing "Line N:" pattern
 * @returns Tuple of [line, column] or [undefined, undefined] if not found
 */
function parseErrorLocation(message: string): [number | undefined, number | undefined] {
  const lineMatch = message.match(/^Line (\d+):/);
  if (lineMatch) {
    const line = parseInt(lineMatch[1], 10);
    // Default column to 0, could be extended to parse column if pattern includes it
    const columnMatch = message.match(/Column (\d+):/);
    const column = columnMatch ? parseInt(columnMatch[1], 10) : 0;
    return [line, column];
  }
  return [undefined, undefined];
}

/**
 * Create a VS Code Range object from line and column information
 * @param line - Line number (0-indexed)
 * @param column - Column number (0-indexed), defaults to 0
 * @returns VS Code Range object
 */
function createRange(line: number | undefined, column: number | undefined): vscode.Range | undefined {
  if (line === undefined) {
    return undefined;
  }

  const startLine = Math.max(0, line);
  const startColumn = Math.max(0, column ?? 0);
  const endLine = startLine;
  const endColumn = startColumn + 1;

  return new vscode.Range(startLine, startColumn, endLine, endColumn);
}

/**
 * Normalize any thrown error into a structured ExtensionError
 * @param err - Unknown error to normalize
 * @returns Normalized ExtensionError with message, line, column, and range
 */
export function normalizeError(err: unknown): ExtensionError {
  let message = 'Unknown error during parsing';
  let line: number | undefined;
  let column: number | undefined;

  if (err instanceof Error) {
    message = err.message;
    [line, column] = parseErrorLocation(message);
  } else if (typeof err === 'string') {
    message = err;
    [line, column] = parseErrorLocation(message);
  } else if (typeof err === 'object' && err !== null && 'message' in err) {
    const obj = err as Record<string, unknown>;
    if (typeof obj.message === 'string') {
      message = obj.message;
      [line, column] = parseErrorLocation(message);
    }
  }

  // Convert 1-indexed line numbers from error messages to 0-indexed for VS Code
  const zeroIndexedLine = line !== undefined ? line - 1 : undefined;
  const range = createRange(zeroIndexedLine, column);

  return {
    message,
    line: zeroIndexedLine,
    column,
    range,
  };
}
