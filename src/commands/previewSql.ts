import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as vscode from 'vscode';
import { logError, logInfo, logToOutput, showOutput } from '../output';
import { getWorkspaceFolder } from '../utils/workspace';

function getLocalCliPath(): string | null {
  const possiblePaths = [
    path.join(__dirname, '../../../schema-forge/dist/cli.js'),
    path.join(__dirname, '../../../../schema-forge/dist/cli.js'),
  ];

  for (const cliPath of possiblePaths) {
    if (fs.existsSync(cliPath)) {
      return cliPath;
    }
  }

  return null;
}

/**
 * Run schema-forge diff with --force (no interactive prompts), capture stdout/stderr.
 * No files are written; SQL is only returned.
 */
function runDiffForPreview(workspaceFolder: vscode.WorkspaceFolder): Promise<{
  stdout: string;
  stderr: string;
  code: number | null;
  error?: Error;
}> {
  const localCliPath = getLocalCliPath();
  const command = localCliPath
    ? `node "${localCliPath}" diff --force`
    : 'npx --yes @xubylele/schema-forge diff --force';

  return new Promise((resolve) => {
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];

    const childProcess = spawn(command, [], {
      cwd: workspaceFolder.uri.fsPath,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    childProcess.stdout?.on('data', (data: Buffer) => {
      stdoutChunks.push(data.toString());
    });

    childProcess.stderr?.on('data', (data: Buffer) => {
      stderrChunks.push(data.toString());
    });

    childProcess.on('close', (code: number | null) => {
      resolve({
        stdout: stdoutChunks.join(''),
        stderr: stderrChunks.join(''),
        code,
      });
    });

    childProcess.on('error', (error: Error) => {
      resolve({
        stdout: stdoutChunks.join(''),
        stderr: stderrChunks.join(''),
        code: null,
        error,
      });
    });
  });
}

export async function previewSqlCommand(): Promise<void> {
  const workspaceFolder = await getWorkspaceFolder();
  if (!workspaceFolder) {
    return;
  }

  showOutput();
  logInfo('Schema Forge: Preview SQL');
  logInfo(`Working directory: ${workspaceFolder.uri.fsPath}`);
  logInfo('Running schema-forge diff --force...');
  logInfo('');

  const result = await runDiffForPreview(workspaceFolder);

  if (result.error) {
    logError(result.error.message);
    void vscode.window.showErrorMessage(
      `Failed to execute Schema Forge CLI: ${result.error.message}`
    );
    return;
  }

  const sql = result.stdout.trim().length > 0
    ? result.stdout.trim()
    : result.stderr.trim();

  logToOutput(result.stdout);
  if (result.stderr) {
    logToOutput(result.stderr);
  }
  logInfo('');
  logInfo(`Process exited with code: ${result.code}`);

  if (result.code !== 0) {
    void vscode.window.showErrorMessage(
      'Schema Forge diff failed. Check output for details.'
    );
    return;
  }

  if (!sql) {
    void vscode.window.showInformationMessage(
      'No SQL generated (no schema changes detected).'
    );
    return;
  }

  const doc = await vscode.workspace.openTextDocument({
    content: sql,
    language: 'sql',
  });
  await vscode.window.showTextDocument(doc, {
    viewColumn: vscode.ViewColumn.Beside,
    preserveFocus: false,
  });
  void vscode.window.showInformationMessage(
    'Schema Forge SQL preview opened in editor.'
  );
}
