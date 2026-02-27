import * as vscode from 'vscode';

/**
 * Get the active workspace folder. If multiple folders exist, prompts the user to choose.
 * Returns undefined if no workspace folder is open or if user cancels selection.
 */
export async function getWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
  const workspaceFolders = vscode.workspace.workspaceFolders;

  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder is open. Please open a folder first.');
    return undefined;
  }

  if (workspaceFolders.length === 1) {
    return workspaceFolders[0];
  }

  // Multiple folders - ask user to choose
  const selected = await vscode.window.showWorkspaceFolderPick({
    placeHolder: 'Select workspace folder for Schema Forge initialization'
  });

  return selected;
}
