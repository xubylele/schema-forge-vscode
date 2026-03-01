import * as vscode from 'vscode';

/**
 * Hover documentation for Schema Forge DSL constructs
 * Each entry contains Markdown-formatted documentation (3–6 lines)
 * with optional code examples
 */
const HOVER_CATALOG: Record<string, vscode.MarkdownString> = {
  table: new vscode.MarkdownString(
    `**table** — Declares a database table.\n\n` +
    `Contains columns with types and modifiers.\n` +
    `Example: \`table users { id uuid pk }\``
  ),
  uuid: new vscode.MarkdownString(
    `**uuid** — Universally unique identifier type.\n\n` +
    `A 128-bit identifier for primary keys.\n` +
    `Pairs well with \`default gen_random_uuid()\`.`
  ),
  text: new vscode.MarkdownString(
    `**text** — Variable-length character data.\n\n` +
    `Unbounded character string.\n` +
    `Use when length is variable or very large.`
  ),
  varchar: new vscode.MarkdownString(
    `**varchar** — Variable-length character string.\n\n` +
    `Use \`varchar(255)\` to enforce a maximum length.\n` +
    `Without limit, behaves like \`text\`.`
  ),
  timestamptz: new vscode.MarkdownString(
    `**timestamptz** — Timestamp with timezone.\n\n` +
    `Stores a moment in time with timezone.\n` +
    `Use with \`default now()\` for creation timestamps.`
  ),
  pk: new vscode.MarkdownString(
    `**pk** — Primary key modifier.\n\n` +
    `Marks a column as the unique identifier.\n` +
    `Each table should have exactly one primary key.`
  ),
  unique: new vscode.MarkdownString(
    `**unique** — Unique constraint modifier.\n\n` +
    `All values must be distinct.\n` +
    `Primary keys are unique by default.`
  ),
  default: new vscode.MarkdownString(
    `**default** — Default value modifier.\n\n` +
    `Sets a value when inserting rows without providing one.\n` +
    `Example: \`default now()\` or \`default true\`.`
  ),
};

/**
 * Token matcher for hover resolution
 * Detects keywords and types at cursor position using line-level regex
 */
interface TokenMatch {
  token: string;
  start: number;
  end: number;
}

/**
 * Find a token at the cursor position in a line
 * Supports keywords, identifiers, and parameterized types (e.g., varchar(255))
 * @param line - Line content
 * @param column - Cursor column position
 * @returns Token match with position, or null if no match
 */
function findTokenAtCursor(line: string, column: number): TokenMatch | null {
  // Pattern for keywords, types, modifiers, and parameterized types
  // Includes: table, uuid, text, varchar, varchar(n), timestamptz, pk, unique, default
  const tokenPattern = /\b(table|uuid|text|varchar(?:\s*\(\s*\d+\s*\))?|timestamptz|pk|unique|default)\b/gi;

  let match: RegExpExecArray | null;

  // Reset lastIndex for global regex
  tokenPattern.lastIndex = 0;

  while ((match = tokenPattern.exec(line)) !== null) {
    const tokenStart = match.index;
    const tokenEnd = match.index + match[0].length;

    // Check if cursor is within this token
    if (column >= tokenStart && column < tokenEnd) {
      // For varchar(n), extract base type only
      const token = match[1].toLowerCase().replace(/\s*\(\s*\d+\s*\)/g, '');
      return { token, start: tokenStart, end: tokenEnd };
    }
  }

  return null;
}

/**
 * Find all tokens of a specific type on a line
 * Used for detecting parameterized types like varchar(255)
 * @param line - Line content
 * @param baseToken - Base token to search for (e.g., 'varchar')
 * @returns Array of all matches for the base token with their ranges
 */
function findAllTokensByName(line: string, baseToken: string): TokenMatch[] {
  const matches: TokenMatch[] = [];

  // Pattern for parameterized and non-parameterized variants
  const pattern = baseToken === 'varchar'
    ? /varchar(?:\s*\(\s*\d+\s*\))?/gi
    : new RegExp(`\\b${baseToken}\\b`, 'gi');

  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    matches.push({
      token: baseToken.toLowerCase(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return matches;
}

/**
 * Schema Forge Hover Provider
 * Provides contextual hover documentation for DSL constructs:
 * - Keywords: table
 * - Types: uuid, text, varchar, timestamptz
 * - Modifiers: pk, unique, default
 */
export class HoverProvider implements vscode.HoverProvider {
  // Cache for parsed AST by document version
  // Maps documentUri -> { version: number, ast: any }
  private astCache: Map<string, { version: number; ast: any }> = new Map();

  /**
   * Provide hover information for a position in a document
   * @param document - The VS Code text document
   * @param position - The cursor position
   * @returns Hover object or null if no hover available
   */
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Hover | null> {
    // Only provide hover for schema-forge language
    if (document.languageId !== 'schema-forge') {
      return null;
    }

    // Get the line at cursor position
    const line = document.lineAt(position.line);
    const lineText = line.text;
    const column = position.character;

    // Find token at cursor position
    const tokenMatch = findTokenAtCursor(lineText, column);

    if (!tokenMatch) {
      // For varchar specifically, check if cursor is anywhere in parameterized variant
      const varcharMatches = findAllTokensByName(lineText, 'varchar');
      const varcharHover = varcharMatches.find(
        (m) => column >= m.start && column < m.end
      );

      if (varcharHover) {
        return this.createHover(varcharHover.token, tokenMatch || varcharHover);
      }

      return null;
    }

    // Create and return hover
    return this.createHover(tokenMatch.token, tokenMatch);
  }

  /**
   * Create a Hover object from a token match
   * @param token - Normalized token name
   * @param match - Token match with position
   * @returns Hover object with markdown content
   */
  private createHover(token: string, match: TokenMatch): vscode.Hover {
    const markdown = HOVER_CATALOG[token];

    if (!markdown) {
      return new vscode.Hover('No documentation available');
    }

    // Create range for the hover highlight
    const range = new vscode.Range(
      new vscode.Position(0, match.start),
      new vscode.Position(0, match.end)
    );

    return new vscode.Hover(markdown, range);
  }

  /**
   * Dispose of resources
   * Clears the AST cache
   */
  dispose(): void {
    this.astCache.clear();
  }
}

/**
 * Factory function to create and return a HoverProvider instance
 * Simplifies registration in extension.ts
 */
export function createHoverProvider(): HoverProvider {
  return new HoverProvider();
}
