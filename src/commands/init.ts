import { spawn } from 'child_process';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { clearOutput, logToOutput, showOutput } from '../output';
import { getWorkspaceFolder } from '../utils/workspace';

/**
 * Check if we're in a development workspace with local schema-forge
 */
function getLocalCliPath(): string | null {
  // Check if there's a sibling schema-forge folder (development setup)
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
 * Execute the Schema Forge init command
 */
export async function initCommand(): Promise<void> {
  // Get workspace folder
  const workspaceFolder = await getWorkspaceFolder();
  if (!workspaceFolder) {
    return; // Error already shown by getWorkspaceFolder
  }

  // Clear output and show channel
  clearOutput();
  showOutput();

  const timestamp = new Date().toLocaleTimeString();

  // Try to use local CLI first (for development)
  const localCliPath = getLocalCliPath();
  let command: string;

  if (localCliPath) {
    command = `node "${localCliPath}" init`;
    logToOutput(`[${timestamp}] Using local CLI: ${localCliPath}`);
  } else {
    command = 'npx --yes @xubylele/schema-forge init';
    logToOutput(`[${timestamp}] Using npx to run schema-forge init`);
  }

  logToOutput(`[${timestamp}] Working directory: ${workspaceFolder.uri.fsPath}`);
  logToOutput('');

  // Use spawn with the full command in shell mode
  const childProcess = spawn(command, [], {
    cwd: workspaceFolder.uri.fsPath,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '0' }
  });

  // Stream stdout
  childProcess.stdout?.on('data', (data: Buffer) => {
    logToOutput(data.toString());
  });

  // Stream stderr
  childProcess.stderr?.on('data', (data: Buffer) => {
    logToOutput(data.toString());
  });

  // Handle process completion
  childProcess.on('close', (code: number | null) => {
    const timestamp = new Date().toLocaleTimeString();
    logToOutput('');
    logToOutput(`[${timestamp}] Process exited with code: ${code}`);

    if (code === 0) {
      vscode.window.showInformationMessage('Schema Forge project initialized successfully!');
    } else {
      vscode.window.showErrorMessage('Schema Forge init failed. Check output for details.');
    }
  });

  // Handle spawn errors
  childProcess.on('error', (error: Error) => {
    const timestamp = new Date().toLocaleTimeString();
    logToOutput('');
    logToOutput(`[${timestamp}] Error: ${error.message}`);
    vscode.window.showErrorMessage(`Failed to execute Schema Forge CLI: ${error.message}`);
  });
}
