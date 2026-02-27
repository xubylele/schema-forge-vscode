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
 * Log a raw message to the Schema Forge output channel without formatting
 * Used for streaming CLI output that has its own formatting
 */
export function logToOutput(message: string): void {
  const channel = getOutputChannel();
  channel.appendLine(message);
}

/**
 * Log an info-level message with timestamp
 */
export function logInfo(message: string): void {
  const timestamp = new Date().toLocaleTimeString();
  logToOutput(`[${timestamp}] [INFO] ${message}`);
}

/**
 * Log a warning-level message with timestamp
 */
export function logWarn(message: string): void {
  const timestamp = new Date().toLocaleTimeString();
  logToOutput(`[${timestamp}] [WARN] ${message}`);
}

/**
 * Log an error-level message with timestamp
 */
export function logError(message: string): void {
  const timestamp = new Date().toLocaleTimeString();
  logToOutput(`[${timestamp}] [ERROR] ${message}`);
}

/**
 * Show the Schema Forge output channel and focus it
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
