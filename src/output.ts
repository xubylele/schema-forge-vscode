import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | undefined;

/**
 * Get or create the Schema Forge output channel
 */
export function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('Schema Forge');
  }
  return outputChannel;
}

/**
 * Log a message to the Schema Forge output channel
 */
export function logToOutput(message: string): void {
  const channel = getOutputChannel();
  channel.appendLine(message);
}

/**
 * Show the Schema Forge output channel
 */
export function showOutput(): void {
  const channel = getOutputChannel();
  channel.show();
}

/**
 * Clear the Schema Forge output channel
 */
export function clearOutput(): void {
  const channel = getOutputChannel();
  channel.clear();
}
