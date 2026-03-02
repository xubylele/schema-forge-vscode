/**
 * Centralized diagnostic codes for Schema Forge
 * 
 * All diagnostics (syntax and semantic) must include a code field.
 * Code actions filter diagnostics using these predefined constants.
 * 
 * @module codes
 */

/**
 * Diagnostic codes used throughout the Schema Forge extension.
 * 
 * Syntax codes identify parsing errors.
 * Semantic codes identify structural/logical violations in valid schemas.
 */
export const DIAGNOSTIC_CODES = {
  /** Syntax error in schema file */
  SF_SYNTAX_ERROR: 'SF_SYNTAX_ERROR',

  /** Table has no columns defined */
  SF_NO_COLUMNS: 'SF_NO_COLUMNS',

  /** Table is missing a primary key */
  SF_NO_PK: 'SF_NO_PK',

  /** Table has multiple primary key columns */
  SF_MULTIPLE_PK: 'SF_MULTIPLE_PK',

  /** Table has duplicate column names */
  SF_DUPLICATE_COLUMN: 'SF_DUPLICATE_COLUMN',

  /** Column uses an unknown or unsupported type */
  SF_UNKNOWN_TYPE: 'SF_UNKNOWN_TYPE',

  /** Column uses 'default now()' with invalid type */
  SF_INVALID_DEFAULT_NOW: 'SF_INVALID_DEFAULT_NOW',
} as const;

/**
 * Type-safe diagnostic code type derived from DIAGNOSTIC_CODES constant.
 * Use this type for code fields in diagnostic objects.
 */
export type DiagnosticCode = (typeof DIAGNOSTIC_CODES)[keyof typeof DIAGNOSTIC_CODES];
