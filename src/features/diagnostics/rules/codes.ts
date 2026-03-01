/**
 * Semantic diagnostic codes for Schema Forge
 * Used to identify specific kinds of structural/semantic violations
 */

export const SEMANTIC_CODES = {
  TABLE_NO_COLUMNS: 'SF_SEM_001',
  TABLE_NO_PRIMARY_KEY: 'SF_SEM_002',
  TABLE_MULTIPLE_PRIMARY_KEYS: 'SF_SEM_003',
  DUPLICATE_COLUMN_NAME: 'SF_SEM_004',
  UNKNOWN_TYPE: 'SF_SEM_005',
  DEFAULT_NOW_WRONG_TYPE: 'SF_SEM_006',
} as const;

export type SemanticCode = (typeof SEMANTIC_CODES)[keyof typeof SEMANTIC_CODES];
