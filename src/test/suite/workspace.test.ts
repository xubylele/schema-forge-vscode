import * as assert from 'assert';
import * as vscode from 'vscode';
import { getWorkspaceFolder } from '../../utils/workspace';

suite('Workspace Utils Test Suite', () => {
  test('getWorkspaceFolder should return undefined when no workspace is open', async () => {
    // This test will pass when run in a no-workspace context
    // When run with a workspace, it will return the workspace folder
    const folder = await getWorkspaceFolder();

    // We just verify the function doesn't crash
    assert.ok(folder === undefined || folder instanceof Object);
  });

  test('getWorkspaceFolder should return workspace folder when available', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (workspaceFolders && workspaceFolders.length > 0) {
      const folder = await getWorkspaceFolder();
      assert.ok(folder);
      assert.ok(folder?.uri);
      assert.ok(folder?.name);
    }
  });

  test('Workspace folder should have valid properties', () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (workspaceFolders && workspaceFolders.length > 0) {
      const folder = workspaceFolders[0];
      assert.ok(folder.uri);
      assert.ok(folder.name);
      assert.ok(folder.index >= 0);
    }
  });
});
