import * as vscode from 'vscode';
import { DiagnosticCode } from '../codes';

/**
 * Represents a semantic validation finding
 * Pure data structure, no dependencies on AST or document
 */
export interface SemanticFinding {
  code: DiagnosticCode;
  message: string;
  severity: vscode.DiagnosticSeverity;
  /**
   * Line number (0-indexed)
   */
  line: number;
  /**
   * Start column (0-indexed)
   */
  startColumn: number;
  /**
   * End column (0-indexed), exclusive
   */
  endColumn: number;
}
