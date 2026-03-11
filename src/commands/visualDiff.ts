import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import {
  diffSchemas,
  loadState,
  parseSchema,
  validateSchemaChanges,
} from '@xubylele/schema-forge-core';
import type { Finding, Operation } from '@xubylele/schema-forge-core';
import { showVisualDiffPanel } from '../ui/visualDiffPanel';
import type { VisualDiffPayload } from '../ui/visualDiffPanel';
import { getWorkspaceFolder } from '../utils/workspace';

interface ConfigShape {
  schemaFile?: string;
  stateFile?: string;
}

export async function visualDiffCommand(): Promise<void> {
  const workspaceFolder = await getWorkspaceFolder();
  if (!workspaceFolder) {
    return;
  }

  const root = workspaceFolder.uri.fsPath;
  const configPath = path.join(root, 'schemaforge', 'config.json');

  let config: ConfigShape;
  try {
    const raw = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(raw) as ConfigShape;
  } catch {
    showVisualDiffPanel({
      summary: '',
      operations: [],
      findings: [],
      error: 'Schema Forge project not initialized or config not found. Run "Schema Forge: Init" first.',
    });
    return;
  }

  const schemaFile = config.schemaFile;
  const stateFile = config.stateFile;
  if (!schemaFile || !stateFile) {
    showVisualDiffPanel({
      summary: '',
      operations: [],
      findings: [],
      error: 'Invalid config: schemaFile and stateFile are required.',
    });
    return;
  }

  const schemaPath = path.isAbsolute(schemaFile) ? schemaFile : path.join(root, schemaFile);
  const statePath = path.isAbsolute(stateFile) ? stateFile : path.join(root, stateFile);

  let schemaSource: string;
  const activeDoc = vscode.window.activeTextEditor?.document;
  const schemaUri = vscode.Uri.file(schemaPath);
  if (activeDoc?.uri.fsPath === schemaUri.fsPath && activeDoc.languageId === 'schema-forge') {
    schemaSource = activeDoc.getText();
  } else {
    try {
      schemaSource = await fs.readFile(schemaPath, 'utf-8');
    } catch {
      showVisualDiffPanel({
        summary: '',
        operations: [],
        findings: [],
        error: `Could not read schema file: ${schemaPath}`,
      });
      return;
    }
  }

  let previousState;
  try {
    previousState = await loadState(statePath);
  } catch {
    showVisualDiffPanel({
      summary: '',
      operations: [],
      findings: [],
      error: `Could not load state file: ${statePath}`,
    });
    return;
  }

  let currentSchema;
  try {
    currentSchema = parseSchema(schemaSource);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    showVisualDiffPanel({
      summary: '',
      operations: [],
      findings: [],
      error: `Schema parse error: ${message}`,
    });
    return;
  }

  const diff = diffSchemas(previousState, currentSchema);
  const findings: Finding[] = validateSchemaChanges(previousState, currentSchema);

  const operations: Operation[] = diff.operations;
  const errors = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity === 'warning');

  let summary: string;
  if (operations.length === 0 && findings.length === 0) {
    summary = 'No changes. Schema is in sync with state.';
  } else if (operations.length === 0) {
    summary = `${errors.length} destructive, ${warnings.length} warning(s).`;
  } else {
    const parts = [`${operations.length} change(s)`];
    if (errors.length > 0) parts.push(`${errors.length} destructive`);
    if (warnings.length > 0) parts.push(`${warnings.length} warning(s)`);
    summary = parts.join(' — ');
  }

  const payload: VisualDiffPayload = {
    summary,
    operations,
    findings,
  };
  showVisualDiffPanel(payload);
}
