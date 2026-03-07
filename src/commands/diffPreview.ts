import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as vscode from 'vscode';
import { clearOutput, logError, logInfo, logToOutput, showOutput } from '../output';
import { showDiffSqlPreview } from '../ui/sqlPreviewPanel';
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

export async function diffPreviewCommand(): Promise<void> {
  const workspaceFolder = await getWorkspaceFolder();
  if (!workspaceFolder) {
    return;
  }

  clearOutput();
  showOutput();

  const localCliPath = getLocalCliPath();
  let command: string;
  if (localCliPath) {
    command = `node "${localCliPath}" diff`;
    logInfo(`Using local CLI: ${localCliPath}`);
  } else {
    command = 'npx --yes @xubylele/schema-forge diff';
    logInfo('Using npx to run schema-forge diff');
  }

  logInfo(`Working directory: ${workspaceFolder.uri.fsPath}`);
  logInfo('Starting SQL diff preview...');
  logInfo('');

  const startedAt = new Date();
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  const childProcess = spawn(command, [], {
    cwd: workspaceFolder.uri.fsPath,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0' }
  });

  childProcess.stdout?.on('data', (data: Buffer) => {
    const text = data.toString();
    stdoutChunks.push(text);
    logToOutput(text);
  });

  childProcess.stderr?.on('data', (data: Buffer) => {
    const text = data.toString();
    stderrChunks.push(text);
    logToOutput(text);
  });

  childProcess.on('close', (code: number | null) => {
    const endedAt = new Date();
    const stdoutText = stdoutChunks.join('');
    const stderrText = stderrChunks.join('');
    const combined = [stdoutText, stderrText].filter(Boolean).join('\n');
    const sqlOutput = stdoutText.trim().length > 0 ? stdoutText : combined;

    logInfo('');
    logInfo(`Process exited with code: ${code}`);

    showDiffSqlPreview({
      workspacePath: workspaceFolder.uri.fsPath,
      command,
      sql: sqlOutput,
      exitCode: code,
      startedAt,
      endedAt
    });

    if (code === 0) {
      void vscode.window.showInformationMessage('Schema Forge diff preview generated successfully!');
    } else {
      void vscode.window.showErrorMessage('Schema Forge diff preview failed. Check output and preview for details.');
    }
  });

  childProcess.on('error', (error: Error) => {
    logError('');
    logError(`${error.message}`);
    void vscode.window.showErrorMessage(`Failed to execute Schema Forge CLI: ${error.message}`);
  });
}
