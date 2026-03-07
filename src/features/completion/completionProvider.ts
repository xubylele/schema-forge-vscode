import * as vscode from 'vscode';
import { parseSchemaContent } from '../../core/adapter';
import {
	BASE_TYPES,
	CONSTRAINT_MODIFIERS,
	DEFAULT_VALUE_HINTS,
	GENERIC_DEFAULT_HINTS,
	normalizeTypeForDefault,
	PARAMETERIZED_TYPES,
	TYPE_ENTRIES,
} from './catalog';

/** Completion context: where the cursor is in a column line */
type CompletionSlot = 'type' | 'constraint' | 'defaultValue' | null;

/** Strip line comment (// or # to EOL) for parsing */
function stripLineComment(line: string): string {
	const trimmed = line.trim();
	const hash = trimmed.indexOf('#');
	const slash = trimmed.indexOf('//');
	let cut = trimmed.length;
	if (hash !== -1) {
		cut = Math.min(cut, hash);
	}
	if (slash !== -1) {
		cut = Math.min(cut, slash);
	}
	return trimmed.slice(0, cut).trim();
}

/** Token with start/end character offsets on the line */
interface LineToken {
	text: string;
	start: number;
	end: number;
}

function tokenizeLine(line: string): LineToken[] {
	const tokens: LineToken[] = [];
	const regex = /\S+/g;
	let m: RegExpExecArray | null;
	while ((m = regex.exec(line)) !== null) {
		tokens.push({ text: m[0], start: m.index, end: m.index + m[0].length });
	}
	return tokens;
}

/** True if cursor is in the default value slot (at or after end of "default") */
function inDefaultValueSlot(line: string, cursorColumn: number): boolean {
	const match = line.match(/\bdefault\s*/i);
	if (!match || match.index === undefined) {
		return false;
	}
	const slotStart = match.index + 'default'.length - 1;
	return cursorColumn >= slotStart;
}

/** Detect which completion slot the cursor is in */
function getCompletionSlot(line: string, cursorColumn: number): CompletionSlot {
	const cleaned = stripLineComment(line);
	const tokens = tokenizeLine(cleaned);
	if (tokens.length === 0) {
		return null;
	}

	if (inDefaultValueSlot(cleaned, cursorColumn)) {
		return 'defaultValue';
	}

	// After column name only -> type slot
	if (tokens.length === 1) {
		return cursorColumn >= tokens[0].end ? 'type' : null;
	}

	// Second token (type) or later
	const typeToken = tokens[1];
	const inTypeToken = cursorColumn >= typeToken.start && cursorColumn <= typeToken.end;
	const afterTypeToken = cursorColumn > typeToken.end;

	if (inTypeToken) {
		return 'type';
	}
	if (afterTypeToken) {
		return 'constraint';
	}

	return null;
}

/** Set of modifier keywords already present on the line (lowercase) */
function getPresentModifiers(line: string): Set<string> {
	const cleaned = stripLineComment(line);
	const tokens = tokenizeLine(cleaned);
	const present = new Set<string>();
	for (let i = 2; i < tokens.length; i++) {
		const t = tokens[i].text.toLowerCase();
		if (t === 'not' && i + 1 < tokens.length && tokens[i + 1].text.toLowerCase() === 'null') {
			present.add('not null');
			i++;
		} else if (t === 'default') {
			present.add('default');
			break;
		} else {
			present.add(t);
		}
	}
	return present;
}

/** Get current column type from line (token after column name) for default hints */
function getColumnTypeFromLine(line: string): string | null {
	const cleaned = stripLineComment(line);
	const tokens = tokenizeLine(cleaned);
	if (tokens.length < 2) {
		return null;
	}
	const typeToken = tokens[1].text;
	const normalized = typeToken.toLowerCase().replace(/\s+/g, '');
	const varcharMatch = normalized.match(/^varchar\s*\(\s*(\d+)\s*\)$/);
	if (varcharMatch) {
		return 'varchar';
	}
	const numericMatch = normalized.match(/^numeric\s*\(\s*\d+\s*,\s*\d+\s*\)$/);
	if (numericMatch) {
		return 'numeric';
	}
	return normalized;
}

/**
 * Schema Forge Completion Provider
 * Provides type suggestions, constraint suggestions, and default value hints.
 */
export class SchemaForgeCompletionProvider implements vscode.CompletionItemProvider {
	private astCache: Map<string, { version: number; ast: import('@xubylele/schema-forge-core').DatabaseSchema | null }> = new Map();

	async provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		_token: vscode.CancellationToken,
		_context: vscode.CompletionContext
	): Promise<vscode.CompletionItem[] | null | undefined> {
		if (document.languageId !== 'schema-forge') {
			return undefined;
		}

		const line = document.lineAt(position.line).text;
		const slot = getCompletionSlot(line, position.character);
		if (!slot) {
			return undefined;
		}

		if (slot === 'type') {
			return this.provideTypeCompletions();
		}
		if (slot === 'constraint') {
			return this.provideConstraintCompletions(line);
		}
		if (slot === 'defaultValue') {
			const columnType = await this.getColumnType(document, position, line);
			return this.provideDefaultValueCompletions(columnType);
		}

		return undefined;
	}

	private provideTypeCompletions(): vscode.CompletionItem[] {
		const items: vscode.CompletionItem[] = [];

		for (const type of BASE_TYPES) {
			const entry = TYPE_ENTRIES[type];
			const item = new vscode.CompletionItem(entry?.label ?? type, vscode.CompletionItemKind.Keyword);
			item.detail = entry?.detail;
			item.documentation = entry?.documentation ? new vscode.MarkdownString(entry.documentation) : undefined;
			item.insertText = entry?.label ?? type;
			items.push(item);
		}

		for (const type of PARAMETERIZED_TYPES) {
			const entry = TYPE_ENTRIES[type];
			const item = new vscode.CompletionItem(entry?.label ?? type, vscode.CompletionItemKind.Keyword);
			item.detail = entry?.detail;
			item.documentation = entry?.documentation ? new vscode.MarkdownString(entry.documentation) : undefined;
			item.insertText = entry?.label ?? type;
			items.push(item);
		}

		return items;
	}

	private provideConstraintCompletions(line: string): vscode.CompletionItem[] {
		const present = getPresentModifiers(line);
		const items: vscode.CompletionItem[] = [];

		for (const mod of CONSTRAINT_MODIFIERS) {
			const key = mod.label.toLowerCase();
			if (present.has(key)) {
				continue;
			}
			const item = new vscode.CompletionItem(mod.label, vscode.CompletionItemKind.Keyword);
			item.detail = mod.detail;
			item.documentation = new vscode.MarkdownString(mod.documentation);
			item.insertText = mod.label === 'fk' ? 'fk ' : mod.label;
			items.push(item);
		}

		return items;
	}

	private provideDefaultValueCompletions(columnType: string | null): vscode.CompletionItem[] {
		const typeHints = columnType
			? DEFAULT_VALUE_HINTS.filter(
					(h) => h.forTypes && h.forTypes.includes(normalizeTypeForDefault(columnType))
			  )
			: [];

		const seen = new Set<string>();
		const items: vscode.CompletionItem[] = [];
		for (const h of typeHints.length > 0 ? typeHints : GENERIC_DEFAULT_HINTS) {
			if (seen.has(h.insertText)) {
				continue;
			}
			seen.add(h.insertText);
			items.push(toDefaultCompletionItem(h));
		}
		for (const h of GENERIC_DEFAULT_HINTS) {
			if (seen.has(h.insertText)) {
				continue;
			}
			seen.add(h.insertText);
			items.push(toDefaultCompletionItem(h));
		}
		return items;
	}

	/** Resolve column type from line (token after column name) or from AST when line is incomplete */
	private async getColumnType(
		document: vscode.TextDocument,
		position: vscode.Position,
		line: string
	): Promise<string | null> {
		const fromLine = getColumnTypeFromLine(line);
		if (fromLine) {
			return fromLine;
		}

		const cacheKey = document.uri.toString();
		const cached = this.astCache.get(cacheKey);
		if (cached && cached.version === document.version && cached.ast) {
			return getColumnTypeAtPosition(cached.ast, document, position);
		}

		const source = document.getText();
		const result = await parseSchemaContent(source, 2000);
		if (!result.ok) {
			this.astCache.set(cacheKey, { version: document.version, ast: null });
			return null;
		}

		this.astCache.set(cacheKey, { version: document.version, ast: result.ast });
		return getColumnTypeAtPosition(result.ast, document, position);
	}

	dispose(): void {
		this.astCache.clear();
	}
}

function toDefaultCompletionItem(h: { insertText: string; detail: string; documentation: string }): vscode.CompletionItem {
	const item = new vscode.CompletionItem(h.insertText, vscode.CompletionItemKind.Function);
	item.detail = h.detail;
	item.documentation = new vscode.MarkdownString(h.documentation);
	item.insertText = h.insertText;
	return item;
}

/** Find column type at position by mapping line to table/column in AST */
function getColumnTypeAtPosition(
	ast: import('@xubylele/schema-forge-core').DatabaseSchema,
	document: vscode.TextDocument,
	position: vscode.Position
): string | null {
	const line = position.line;
	const source = document.getText();
	const lines = source.split('\n');

	let currentTable: string | null = null;
	for (let i = 0; i < lines.length; i++) {
		const trimmed = lines[i].trim();
		const tableMatch = trimmed.match(/^table\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{/);
		if (tableMatch) {
			currentTable = tableMatch[1];
			continue;
		}
		if (trimmed === '}' && currentTable) {
			if (i === line) {
				return null;
			}
			currentTable = null;
			continue;
		}
		if (i === line && currentTable) {
			const table = ast.tables[currentTable];
			if (!table) {
				return null;
			}
			const colMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+(\S+)/);
			if (colMatch) {
				return colMatch[2].toLowerCase().replace(/\s+/g, '');
			}
			return null;
		}
	}
	return null;
}

export function createCompletionProvider(): SchemaForgeCompletionProvider {
	return new SchemaForgeCompletionProvider();
}
