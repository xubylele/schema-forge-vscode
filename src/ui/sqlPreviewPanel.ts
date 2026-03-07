import * as vscode from 'vscode';

const PANEL_VIEW_TYPE = 'schemaForge.diffPreviewPanel';
const PANEL_TITLE = 'Schema Forge: Diff Preview';
const DEFAULT_PREVIEW_CHAR_LIMIT = 500_000;

let panelInstance: vscode.WebviewPanel | undefined;
let latestFullSql = '';

export interface SqlPreviewPayload {
  workspacePath: string;
  command: string;
  sql: string;
  exitCode: number | null;
  startedAt: Date;
  endedAt: Date;
}

export interface SqlPreviewResult {
  displaySql: string;
  totalChars: number;
  shownChars: number;
  isTruncated: boolean;
}

export function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildSqlPreviewResult(sql: string, previewCharLimit = DEFAULT_PREVIEW_CHAR_LIMIT): SqlPreviewResult {
  const totalChars = sql.length;
  const shownChars = Math.min(totalChars, previewCharLimit);
  const isTruncated = shownChars < totalChars;

  return {
    displaySql: sql.slice(0, shownChars),
    totalChars,
    shownChars,
    isTruncated
  };
}

export async function copyLatestDiffPreviewSql(): Promise<void> {
  if (!latestFullSql) {
    await vscode.window.showWarningMessage('No diff preview SQL available to copy yet.');
    return;
  }

  await vscode.env.clipboard.writeText(latestFullSql);
  await vscode.window.showInformationMessage('Copied full diff preview SQL to clipboard.');
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

function formatDurationMs(startedAt: Date, endedAt: Date): string {
  const duration = endedAt.getTime() - startedAt.getTime();
  return duration >= 0 ? `${duration} ms` : 'n/a';
}

export function showDiffSqlPreview(payload: SqlPreviewPayload): void {
  latestFullSql = payload.sql;
  const panel = getPanel();
  const preview = buildSqlPreviewResult(payload.sql);
  const escapedSql = escapeHtml(preview.displaySql);
  const status = payload.exitCode === 0 ? 'Success' : `Failed (exit code: ${payload.exitCode ?? 'unknown'})`;
  const truncatedNotice = preview.isTruncated
    ? `<p class="notice">Preview truncated to ${preview.shownChars.toLocaleString()} of ${preview.totalChars.toLocaleString()} characters for performance.</p>`
    : '';

  panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${PANEL_TITLE}</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-editor-foreground);
      background-color: var(--vscode-editor-background);
      margin: 0;
      padding: 16px;
      line-height: 1.5;
    }
    h1 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
    }
    .meta {
      margin-bottom: 12px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .meta p {
      margin: 2px 0;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .notice {
      border-left: 3px solid var(--vscode-editorWarning-foreground);
      padding: 8px 10px;
      background-color: var(--vscode-editorWarning-background);
      margin: 10px 0 12px;
    }
    .actions {
      margin-bottom: 12px;
      font-size: 12px;
    }
    .actions a {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
      margin-right: 12px;
    }
    .actions a:hover {
      color: var(--vscode-textLink-activeForeground);
      text-decoration: underline;
    }
    pre {
      margin: 0;
      white-space: pre;
      overflow: auto;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      padding: 12px;
      max-height: calc(100vh - 240px);
      background-color: var(--vscode-textCodeBlock-background);
    }
  </style>
</head>
<body>
  <h1>${PANEL_TITLE}</h1>
  <div class="meta">
    <p>Status: ${escapeHtml(status)}</p>
    <p>Workspace: ${escapeHtml(payload.workspacePath)}</p>
    <p>Command: ${escapeHtml(payload.command)}</p>
    <p>Started: ${escapeHtml(payload.startedAt.toISOString())}</p>
    <p>Ended: ${escapeHtml(payload.endedAt.toISOString())}</p>
    <p>Duration: ${escapeHtml(formatDurationMs(payload.startedAt, payload.endedAt))}</p>
  </div>
  ${truncatedNotice}
  <div class="actions">
    <a href="command:schemaForge.copyDiffPreviewSql">Copy full SQL</a>
    <a href="command:workbench.action.output.toggleOutput">Open Output panel</a>
  </div>
  <pre><code>${escapedSql}</code></pre>
</body>
</html>`;
}
