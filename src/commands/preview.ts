import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import * as vscode from 'vscode';
import { clearOutput, logError, logInfo, logToOutput, showOutput } from '../output';
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

export async function previewCommand(): Promise<void> {
  const workspaceFolder = await getWorkspaceFolder();
  if (!workspaceFolder) {
    return;
  }

  clearOutput();
  showOutput();

  const localCliPath = getLocalCliPath();
  const command = localCliPath
    ? `node "${localCliPath}" preview --force`
    : 'npx --yes @xubylele/schema-forge preview --force';

  if (localCliPath) {
    logInfo(`Using local CLI: ${localCliPath}`);
  } else {
    logInfo('Using npx to run schema-forge preview');
  }

  logInfo(`Working directory: ${workspaceFolder.uri.fsPath}`);
  logInfo('Starting migration preview...');
  logInfo('');

  const childProcess = spawn(command, [], {
    cwd: workspaceFolder.uri.fsPath,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  childProcess.stdout?.on('data', (data: Buffer) => {
    logToOutput(data.toString());
  });

  childProcess.stderr?.on('data', (data: Buffer) => {
    logToOutput(data.toString());
  });

  childProcess.on('close', (code: number | null) => {
    logInfo('');
    logInfo(`Process exited with code: ${code}`);

    if (code === 0) {
      void vscode.window.showInformationMessage('Schema Forge migration preview generated successfully!');
    } else {
      void vscode.window.showErrorMessage('Schema Forge migration preview failed. Check output for details.');
    }
  });

  childProcess.on('error', (error: Error) => {
    logError(error.message);
    void vscode.window.showErrorMessage(`Failed to execute Schema Forge CLI: ${error.message}`);
  });
}
