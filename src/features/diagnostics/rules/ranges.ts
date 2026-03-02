/**
 * Utilities to compute stable diagnostic ranges for semantic findings
 * These functions search document source text to find token positions
 * Necessary because the AST has no location metadata
 */

/**
 * Find the range of a table header (e.g., "table users {")
 * Returns the position of the "table" keyword and table name
 * Falls back to line start if not found
 */
export function findTableRange(
  source: string,
  tableName: string,
  startLineHint: number = 0
): { line: number; startColumn: number; endColumn: number } {
  const lines = source.split('\n');

  // Search from hint onwards for the table declaration
  for (let i = startLineHint; i < lines.length; i++) {
    const line = lines[i];
    const tableMatch = /\btable\s+([A-Za-z_][A-Za-z0-9_]*)/i.exec(line);

    if (tableMatch && tableMatch[1] === tableName) {
      // Found the table header
      const startCol = tableMatch.index;
      const endCol = tableMatch.index + tableMatch[0].length;
      return { line: i, startColumn: startCol, endColumn: endCol };
    }
  }

  // Fallback: use hint line from start
  return { line: startLineHint, startColumn: 0, endColumn: 1 };
}

/**
 * Find the range of a column name within a given line range
 * Searches for the column identifier token starting from a given line
 */
export function findColumnRange(
  source: string,
  columnName: string,
  startLine: number,
  endLine: number
): { line: number; startColumn: number; endColumn: number } {
  const lines = source.split('\n');

  // Search within the line range for the column name
  for (let i = startLine; i <= Math.min(endLine, lines.length - 1); i++) {
    const line = lines[i];
    // Match column name as a word boundary (identifier or quoted)
    const colMatch = new RegExp(
      `\\b${escapeRegExp(columnName)}\\b|"${escapeRegExp(columnName)}"|'${escapeRegExp(columnName)}'`
    ).exec(line);

    if (colMatch) {
      // Remove quotes from the match to get actual start/end
      const rawText = colMatch[0];
      const startCol = colMatch.index;
      let endCol = colMatch.index + rawText.length;

      if (rawText.startsWith('"') || rawText.startsWith("'")) {
        // Quoted identifier: advance to content after quotes
        return { line: i, startColumn: startCol, endColumn: endCol };
      } else {
        return { line: i, startColumn: startCol, endColumn: endCol };
      }
    }
  }

  // Fallback: return start line
  return { line: startLine, startColumn: 0, endColumn: 1 };
}

/**
 * Find the range of "now()" within a given line range
 * Used for default value diagnostics
 */
export function findDefaultNowRange(
  source: string,
  startLine: number,
  endLine: number
): { line: number; startColumn: number; endColumn: number } {
  const lines = source.split('\n');

  for (let i = startLine; i <= Math.min(endLine, lines.length - 1); i++) {
    const line = lines[i];
    const nowMatch = /\bnow\s*\(\s*\)/i.exec(line);

    if (nowMatch) {
      return {
        line: i,
        startColumn: nowMatch.index,
        endColumn: nowMatch.index + nowMatch[0].length,
      };
    }
  }

  // Fallback: search for "default" keyword
  for (let i = startLine; i <= Math.min(endLine, lines.length - 1); i++) {
    const line = lines[i];
    const defaultMatch = /\bdefault\b/i.exec(line);

    if (defaultMatch) {
      return {
        line: i,
        startColumn: defaultMatch.index,
        endColumn: defaultMatch.index + defaultMatch[0].length,
      };
    }
  }

  return { line: startLine, startColumn: 0, endColumn: 1 };
}

/**
 * Find the range of a table closing brace
 * Returns the line number where the closing } appears (for table-level findings)
 */
export function findTableEndLine(
  source: string,
  startLine: number
): number {
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
      }
      if (braceDepth === 0 && i > startLine) {
        return i;
      }
    }
  }

  return Math.min(startLine + 10, lines.length - 1);
}

/**
 * Helper to escape regex special characters
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
