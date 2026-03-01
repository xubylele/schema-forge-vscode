import * as vscode from 'vscode';
import { parseSchemaContent } from '../../core/adapter';
import { ExtensionError, normalizeError } from '../../core/errors';

/**
 * Simple debounce utility function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds (250-400ms recommended)
 * @returns Debounced function
 */
function simplifyDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 250
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      void fn(...args);
      timeoutId = undefined;
    }, delay);
  };
}

/**
 * Extract error token from error message
 * Looks for quoted strings or identifiers that might be the source of the error
 * @param message - Error message to parse
 * @returns Token to search for on the error line, or undefined
 */
function extractErrorToken(message: string): string | undefined {
  // Look for quoted strings like 'xyz' or "xyz"
  const quotedMatch = message.match(/['"]([^'"]+)['"]/);
  if (quotedMatch) {
    return quotedMatch[1];
  }

  // Look for identifiers (could be invalid types, keywords, etc.)
  // e.g., "Invalid column type" or "Unknown tablename"
  const identifierMatch = message.match(/(?:type|column|keyword|identifier)\s+['"]?([a-zA-Z_][a-zA-Z0-9_]*)/i);
  if (identifierMatch) {
    return identifierMatch[1];
  }

  return undefined;
}

/**
 * Convert ExtensionError to VSCode Diagnostic
 * Estimates column range by searching for error token on the error line
 * @param error - Normalized extension error
 * @param document - VSCode text document for line content lookup
 * @returns Diagnostic ready for collection
 */
function errorToDiagnostic(error: ExtensionError, document: vscode.TextDocument): vscode.Diagnostic {
  let line = error.line ?? 0;
  let column = error.column ?? 0;
  let endColumn = column + 1;

  // Try to estimate column range by searching for error token
  if (line < document.lineCount) {
    const lineContent = document.lineAt(line).text;
    const token = extractErrorToken(error.message);

    if (token) {
      const foundIndex = lineContent.indexOf(token);
      if (foundIndex !== -1) {
        column = foundIndex;
        endColumn = foundIndex + token.length;
      }
    }

    // Fallback: highlight from current column to end of line if no token found
    if (endColumn === column + 1 && column < lineContent.length) {
      endColumn = Math.max(column + 1, lineContent.length);
    }
  }

  const range = new vscode.Range(line, column, line, endColumn);
  const diagnostic = new vscode.Diagnostic(
    range,
    error.message,
    vscode.DiagnosticSeverity.Error
  );
  diagnostic.source = 'Schema Forge';

  return diagnostic;
}

/**
 * Syntax Diagnostics Provider
 * Listens to document changes and saves, parses .sf documents, and displays syntax errors
 */
export class SyntaxDiagnosticsProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private debouncedUpdate: (uri: vscode.Uri, document: vscode.TextDocument) => void;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('schema-forge');

    // Create debounced update method with 250ms delay
    this.debouncedUpdate = simplifyDebounce(
      (uri: vscode.Uri, document: vscode.TextDocument) => {
        void this._updateDiagnostics(uri, document);
      },
      250
    );
  }

  /**
   * Internal method to update diagnostics for a document
   * @param uri - Document URI
   * @param document - Text document to parse
   */
  private async _updateDiagnostics(uri: vscode.Uri, document: vscode.TextDocument): Promise<void> {
    const source = document.getText();

    try {
      const result = await parseSchemaContent(source);

      if (result.ok) {
        // No errors, clear diagnostics for this document
        this.diagnosticCollection.set(uri, []);
      } else {
        // Convert error to diagnostic
        const diagnostic = errorToDiagnostic(result.error, document);
        this.diagnosticCollection.set(uri, [diagnostic]);
      }
    } catch (err) {
      // Handle unexpected parsing errors
      const error = normalizeError(err);
      const diagnostic = errorToDiagnostic(error, document);
      this.diagnosticCollection.set(uri, [diagnostic]);
    }
  }

  /**
   * Update diagnostics for a document with debounce
   * @param document - Text document to parse
   */
  updateDiagnostics(document: vscode.TextDocument): void {
    const uri = document.uri;
    const uriString = uri.toString();

    // Cancel previous debounce timer for this URI
    const existingTimer = this.debounceTimers.get(uriString);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.debounceTimers.delete(uriString);
    }

    // Schedule debounced update
    const timer = setTimeout(() => {
      this.debouncedUpdate(uri, document);
      this.debounceTimers.delete(uriString);
    }, 250);

    this.debounceTimers.set(uriString, timer);
  }

  /**
   * Update diagnostics immediately (for save events)
   * @param document - Text document to parse
   */
  async updateDiagnosticsImmediate(document: vscode.TextDocument): Promise<void> {
    const uriString = document.uri.toString();

    // Cancel any pending debounce timer and update immediately
    const existingTimer = this.debounceTimers.get(uriString);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.debounceTimers.delete(uriString);
    }

    await this._updateDiagnostics(document.uri, document);
  }

  /**
   * Register event listeners for document changes, saves, and closes
   */
  registerListeners(): void {
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === 'schema-forge') {
        this.updateDiagnostics(event.document);
      }
    });

    vscode.workspace.onDidSaveTextDocument((document) => {
      if (document.languageId === 'schema-forge') {
        this.updateDiagnosticsImmediate(document);
      }
    });

    vscode.workspace.onDidCloseTextDocument((document) => {
      if (document.languageId === 'schema-forge') {
        const uriString = document.uri.toString();

        // Clear pending debounce timer
        const timer = this.debounceTimers.get(uriString);
        if (timer) {
          clearTimeout(timer);
          this.debounceTimers.delete(uriString);
        }

        // Clear diagnostics for this document
        this.diagnosticCollection.delete(document.uri);
      }
    });
  }

  /**
   * Dispose of the diagnostics provider and clean up resources
   */
  dispose(): void {
    // Cancel all pending debounce timers
    this.debounceTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.debounceTimers.clear();

    // Dispose of the diagnostic collection
    this.diagnosticCollection.dispose();
  }
}
