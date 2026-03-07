import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
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

/**
 * Optional callback invoked when the diff process exits; used by the status bar to reflect drift without running a second diff.
 */
export async function diffCommand(onExitCode?: (code: number | null) => void): Promise<void> {
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
    command = `npx --yes @xubylele/schema-forge diff`;
    logInfo(`Using npx to run schema-forge diff`);
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
    onExitCode?.(code);

    if (code === 0) {
      vscode.window.showInformationMessage('Schema Forge diff completed successfully!');
    } else {
      vscode.window.showErrorMessage('Schema Forge diff failed. Check output for details.');
    }
  });

  // Handle spawn errors
  childProcess.on('error', (error: Error) => {
    logError('');
    logError(`${error.message}`);
    vscode.window.showErrorMessage(`Failed to execute Schema Forge CLI: ${error.message}`);
  });
}
