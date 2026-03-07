/**
 * Completion catalog for Schema Forge DSL: types, constraints, default value hints.
 * Single source of truth for completion and optional reuse by diagnostics/hover.
 */

/** Base column types supported by the parser (no parameters) */
export const BASE_TYPES = [
	'uuid',
	'varchar',
	'text',
	'int',
	'bigint',
	'boolean',
	'timestamptz',
	'date',
	'numeric',
] as const;

/** Parameterized type suggestions (convenience completions) */
export const PARAMETERIZED_TYPES = ['varchar(255)', 'numeric(10,2)'] as const;

export interface TypeEntry {
	label: string;
	detail: string;
	documentation: string;
}

/** Type labels and short docs for completion items */
export const TYPE_ENTRIES: Record<string, TypeEntry> = {
	uuid: {
		label: 'uuid',
		detail: 'UUID type',
		documentation: '**uuid** — Universally unique identifier. A 128-bit identifier for primary keys. Pairs well with `default gen_random_uuid()`.',
	},
	varchar: {
		label: 'varchar',
		detail: 'Variable-length string',
		documentation: '**varchar** — Variable-length character string. Use `varchar(255)` to enforce a maximum length. Without limit, behaves like `text`.',
	},
	text: {
		label: 'text',
		detail: 'Unbounded text',
		documentation: '**text** — Variable-length character data. Unbounded character string. Use when length is variable or very large.',
	},
	int: {
		label: 'int',
		detail: '32-bit integer',
		documentation: '**int** — 32-bit integer type.',
	},
	bigint: {
		label: 'bigint',
		detail: '64-bit integer',
		documentation: '**bigint** — 64-bit integer type.',
	},
	boolean: {
		label: 'boolean',
		detail: 'Boolean',
		documentation: '**boolean** — True/false. Use `default true` or `default false`.',
	},
	timestamptz: {
		label: 'timestamptz',
		detail: 'Timestamp with timezone',
		documentation: '**timestamptz** — Timestamp with timezone. Use with `default now()` for creation timestamps.',
	},
	date: {
		label: 'date',
		detail: 'Date',
		documentation: '**date** — Date type (no time).',
	},
	numeric: {
		label: 'numeric',
		detail: 'Exact numeric',
		documentation: '**numeric** — Exact numeric. Use `numeric(precision, scale)` e.g. `numeric(10,2)`.',
	},
	'varchar(255)': {
		label: 'varchar(255)',
		detail: 'Varchar with max length 255',
		documentation: '**varchar(255)** — Variable-length string with maximum length 255.',
	},
	'numeric(10,2)': {
		label: 'numeric(10,2)',
		detail: 'Numeric precision 10, scale 2',
		documentation: '**numeric(10,2)** — Exact numeric with 10 total digits, 2 decimal places.',
	},
};

/** Constraint/modifier keywords */
export const CONSTRAINT_MODIFIERS = [
	{ label: 'pk', detail: 'Primary key', documentation: '**pk** — Primary key modifier. Marks column as unique identifier. Each table should have exactly one.' },
	{ label: 'unique', detail: 'Unique constraint', documentation: '**unique** — All values must be distinct. Primary keys are unique by default.' },
	{ label: 'not null', detail: 'Not null', documentation: '**not null** — Column does not accept NULL.' },
	{ label: 'nullable', detail: 'Nullable', documentation: '**nullable** — Column accepts NULL (default for most types).' },
	{ label: 'default', detail: 'Default value', documentation: '**default** — Sets a value when inserting rows without providing one. Example: `default now()` or `default true`.' },
	{ label: 'fk', detail: 'Foreign key', documentation: '**fk** — Foreign key reference. Use `fk table_name.column_name` e.g. `fk users.id`.' },
] as const;

/** Default value suggestion for completion (insertText + doc) */
export interface DefaultValueHint {
	insertText: string;
	detail: string;
	documentation: string;
	/** Normalized type(s) this hint applies to (e.g. "uuid", "timestamptz") */
	forTypes?: string[];
}

/** Default value hints; forTypes = which column types this is appropriate for */
export const DEFAULT_VALUE_HINTS: DefaultValueHint[] = [
	{ insertText: 'gen_random_uuid()', detail: 'UUID default', documentation: 'Use with `uuid` columns.', forTypes: ['uuid'] },
	{ insertText: 'now()', detail: 'Current timestamp', documentation: 'Use with `timestamptz` columns.', forTypes: ['timestamptz'] },
	{ insertText: 'true', detail: 'Boolean true', documentation: 'Use with `boolean` columns.', forTypes: ['boolean'] },
	{ insertText: 'false', detail: 'Boolean false', documentation: 'Use with `boolean` columns.', forTypes: ['boolean'] },
	{ insertText: '0', detail: 'Zero', documentation: 'Use with numeric columns.', forTypes: ['int', 'bigint', 'numeric'] },
	{ insertText: "''", detail: 'Empty string', documentation: 'Use with text/varchar columns.', forTypes: ['text', 'varchar'] },
	{ insertText: 'current_date', detail: 'Current date', documentation: 'Use with `date` columns.', forTypes: ['date'] },
];

/** Generic defaults to show when type is unknown (subset of above) */
export const GENERIC_DEFAULT_HINTS: DefaultValueHint[] = [
	{ insertText: 'gen_random_uuid()', detail: 'UUID default', documentation: 'Use with `uuid` columns.' },
	{ insertText: 'now()', detail: 'Current timestamp', documentation: 'Use with `timestamptz` columns.' },
	{ insertText: 'true', detail: 'Boolean true', documentation: 'Use with `boolean` columns.' },
	{ insertText: 'false', detail: 'Boolean false', documentation: 'Use with `boolean` columns.' },
];

/**
 * Normalize column type for matching (base type only, e.g. "varchar(255)" -> "varchar")
 */
export function normalizeTypeForDefault(type: string): string {
	const t = type.toLowerCase().trim();
	const varcharMatch = t.match(/^varchar\s*\(\s*\d+\s*\)$/);
	if (varcharMatch) return 'varchar';
	const numericMatch = t.match(/^numeric\s*\(\s*\d+\s*,\s*\d+\s*\)$/);
	if (numericMatch) return 'numeric';
	return t;
}
