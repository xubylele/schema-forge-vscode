import { spawn } from 'child_process';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { clearOutput, logInfo, logError, logToOutput, showOutput } from '../output';
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

export async function generateCommand(): Promise<void> {
  const workspaceFolder = await getWorkspaceFolder();
  if (!workspaceFolder) {
    return;
  }

  // Prompt for optional migration name
  const migrationName = await vscode.window.showInputBox({
    prompt: 'Enter migration name (optional)',
    placeHolder: 'migration',
    value: ''
  });

  // Treat both undefined (ESC/cancel) and empty string as default
  const nameArg = migrationName && migrationName.trim() !== ''
    ? `--name "${migrationName.trim()}"`
    : '';

  clearOutput();
  showOutput();

  const localCliPath = getLocalCliPath();
  let command: string;

  if (localCliPath) {
    command = `node "${localCliPath}" generate ${nameArg}`.trim();
    logInfo(`Using local CLI: ${localCliPath}`);
  } else {
    command = `npx --yes @xubylele/schema-forge generate ${nameArg}`.trim();
    logInfo(`Using npx to run schema-forge generate`);
  }

  logInfo(`Working directory: ${workspaceFolder.uri.fsPath}`);
  logInfo('');

  const childProcess = spawn(command, [], {
    cwd: workspaceFolder.uri.fsPath,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0' }
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
      vscode.window.showInformationMessage('Schema Forge migration generated successfully!');
    } else {
      vscode.window.showErrorMessage('Schema Forge generate failed. Check output for details.');
    }
  });

  // Handle spawn errors
  childProcess.on('error', (error: Error) => {
    logError('');
    logError(`${error.message}`);
    vscode.window.showErrorMessage(`Failed to execute Schema Forge CLI: ${error.message}`);
  });
}
