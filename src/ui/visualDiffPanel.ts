import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import type { Finding } from '@xubylele/schema-forge-core';
import type { Operation } from '@xubylele/schema-forge-core';

const PANEL_VIEW_TYPE = 'schemaForge.visualDiffPanel';
const PANEL_TITLE = 'Schema Forge: Visual Diff';

let panelInstance: vscode.WebviewPanel | undefined;

export interface VisualDiffPayload {
  summary: string;
  operations: Operation[];
  findings: Finding[];
  error?: string;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatOperation(op: Operation): string {
  const strong = (s: string) => `<strong>${escapeHtml(s)}</strong>`;
  switch (op.kind) {
    case 'create_table':
      return `Add table ${strong(op.table.name)}`;
    case 'drop_table':
      return `Remove table ${strong(op.tableName)}`;
    case 'add_column':
      return `Add ${strong(`${op.tableName}.${op.column.name}`)}`;
    case 'drop_column':
      return `Remove ${strong(`${op.tableName}.${op.columnName}`)}`;
    case 'column_type_changed':
      return `Change ${strong(`${op.tableName}.${op.columnName}`)} type: ${escapeHtml(String(op.fromType))} → ${escapeHtml(String(op.toType))}`;
    case 'column_nullability_changed':
      return `Change ${strong(`${op.tableName}.${op.columnName}`)} nullability: ${op.from ? 'nullable' : 'not null'} → ${op.to ? 'nullable' : 'not null'}`;
    case 'column_default_changed':
      return `Change ${strong(`${op.tableName}.${op.columnName}`)} default`;
    case 'column_unique_changed':
      return `Change ${strong(`${op.tableName}.${op.columnName}`)} unique: ${op.from} → ${op.to}`;
    case 'add_primary_key_constraint':
      return `Add primary key ${strong(`${op.tableName}.${op.columnName}`)}`;
    case 'drop_primary_key_constraint':
      return `Drop primary key ${strong(op.tableName)}`;
    default:
      return escapeHtml(JSON.stringify(op));
  }
}

function getPanel(): vscode.WebviewPanel {
  if (panelInstance) {
    panelInstance.reveal(vscode.ViewColumn.Beside, true);
    return panelInstance;
  }

  panelInstance = vscode.window.createWebviewPanel(
    PANEL_VIEW_TYPE,
    PANEL_TITLE,
    vscode.ViewColumn.Beside,
    {
      enableScripts: false,
      enableCommandUris: true
    }
  );

  panelInstance.onDidDispose(() => {
    panelInstance = undefined;
  });

  return panelInstance;
}

function buildVisualDiffHtml(payload: VisualDiffPayload): string {
  const { summary, operations, findings, error } = payload;

  if (error) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${PANEL_TITLE}</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-editor-foreground); background-color: var(--vscode-editor-background); margin: 0; padding: 16px; line-height: 1.5; }
    h1 { margin: 0 0 12px 0; font-size: 16px; font-weight: 600; }
    .error { color: var(--vscode-errorForeground); background: var(--vscode-inputValidation-errorBackground); border-left: 4px solid var(--vscode-errorForeground); padding: 12px; margin: 12px 0; }
    .actions { margin-top: 16px; font-size: 12px; }
    .actions a { color: var(--vscode-textLink-foreground); text-decoration: none; margin-right: 12px; }
    .actions a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${PANEL_TITLE}</h1>
  <div class="error">${escapeHtml(error)}</div>
  <div class="actions">
    <a href="command:schemaForge.diffPreview">Run Diff Preview</a>
  </div>
</body>
</html>`;
  }

  const operationsList =
    operations.length === 0
      ? '<p class="muted">No schema changes.</p>'
      : `<ul class="ops">${operations.map((op) => `<li>${formatOperation(op)}</li>`).join('')}</ul>`;

  const errors = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity === 'warning');
  const safetySection =
    findings.length === 0
      ? ''
      : `
  <h2 class="section">Safety</h2>
  <ul class="findings">
    ${errors.map((f) => `<li class="error-finding"><strong>${escapeHtml(f.code)}</strong> ${escapeHtml(f.table)}${f.column ? '.' + escapeHtml(f.column) : ''} — ${escapeHtml(f.message)}</li>`).join('')}
    ${warnings.map((f) => `<li class="warning-finding"><strong>${escapeHtml(f.code)}</strong> ${escapeHtml(f.table)}${f.column ? '.' + escapeHtml(f.column) : ''} — ${escapeHtml(f.message)}</li>`).join('')}
  </ul>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${PANEL_TITLE}</title>
  <style>
    body { font-family: var(--vscode-font-family); color: var(--vscode-editor-foreground); background-color: var(--vscode-editor-background); margin: 0; padding: 16px; line-height: 1.5; }
    h1 { margin: 0 0 12px 0; font-size: 16px; font-weight: 600; }
    h2.section { font-size: 14px; font-weight: 600; margin: 16px 0 8px 0; }
    .summary { margin-bottom: 16px; font-size: 13px; }
    .muted { color: var(--vscode-descriptionForeground); margin: 8px 0; }
    .ops, .findings { margin: 8px 0; padding-left: 20px; }
    .ops li, .findings li { margin: 4px 0; }
    .error-finding { color: var(--vscode-errorForeground); }
    .warning-finding { color: var(--vscode-editorWarning-foreground); }
    .actions { margin-top: 16px; font-size: 12px; }
    .actions a { color: var(--vscode-textLink-foreground); text-decoration: none; margin-right: 12px; }
    .actions a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${PANEL_TITLE}</h1>
  <div class="summary">${escapeHtml(summary)}</div>
  <h2 class="section">Changes</h2>
  ${operationsList}
  ${safetySection}
  <div class="actions">
    <a href="command:schemaForge.diffPreview">Open SQL Preview</a>
    <a href="command:schemaForge.copyDiffPreviewSql">Copy SQL</a>
  </div>
</body>
</html>`;
}

export function showVisualDiffPanel(payload: VisualDiffPayload): void {
  const panel = getPanel();
  panel.webview.html = buildVisualDiffHtml(payload);
}
