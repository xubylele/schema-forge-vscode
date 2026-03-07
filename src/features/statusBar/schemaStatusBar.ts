import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { DRIFT_EXIT_CODE, runDiff } from '../../utils/runDiff';

export type DriftResult = 'unknown' | 'clean' | 'drift';

async function schemaForgeProjectExists(workspaceFolder: vscode.WorkspaceFolder): Promise<boolean> {
	try {
		const schemaForgePath = path.join(workspaceFolder.uri.fsPath, 'schemaforge');
		await fs.stat(schemaForgePath);
		return true;
	} catch {
		return false;
	}
}

async function hasSchemaForgeWorkspace(): Promise<boolean> {
	const folders = vscode.workspace.workspaceFolders;
	if (!folders?.length) {
		return false;
	}
	for (const folder of folders) {
		if (await schemaForgeProjectExists(folder)) {
			return true;
		}
	}
	return false;
}

function hasPendingSchemaForgeDocuments(): boolean {
	return vscode.workspace.textDocuments.some(
		(doc) => doc.languageId === 'schema-forge' && doc.isDirty
	);
}

export class SchemaStatusBar implements vscode.Disposable {
	private statusBarItem: vscode.StatusBarItem;
	private hasPendingChanges = false;
	private lastDriftResult: DriftResult = 'unknown';
	private diffRunPromise: Promise<number | null> | null = null;
	private disposables: vscode.Disposable[] = [];

	constructor() {
		this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	}

	register(): void {
		this.disposables.push(
			vscode.workspace.onDidChangeTextDocument((event) => {
				if (event.document.languageId === 'schema-forge') {
					this.updatePendingAndRefresh();
				}
			}),
			vscode.workspace.onDidSaveTextDocument((document) => {
				if (document.languageId !== 'schema-forge') {
					return;
				}
				this.updatePendingAndRefresh();
				this.runDriftCheckAfterSave();
			}),
			vscode.workspace.onDidChangeWorkspaceFolders(() => {
				this.updateVisibilityAndRefresh();
			})
		);
		// Initial state and visibility
		this.updateVisibilityAndRefresh();
	}

	/**
	 * Call when the user runs Schema Forge: Diff so the status bar can reflect the result without running a second diff.
	 */
	setDriftResultFromExitCode(code: number | null): void {
		if (code === DRIFT_EXIT_CODE) {
			this.lastDriftResult = 'drift';
		} else if (code !== null) {
			this.lastDriftResult = 'clean';
		}
		this.refresh();
	}

	private async updateVisibilityAndRefresh(): Promise<void> {
		const visible = await hasSchemaForgeWorkspace();
		if (visible) {
			this.updatePendingAndRefresh();
		} else {
			this.statusBarItem.hide();
		}
	}

	private updatePendingAndRefresh(): void {
		this.hasPendingChanges = hasPendingSchemaForgeDocuments();
		this.refresh();
	}

	private refresh(): void {
		if (!this.statusBarItem) {
			return;
		}

		const visible = vscode.workspace.workspaceFolders?.length;
		if (!visible) {
			this.statusBarItem.hide();
			return;
		}

		hasSchemaForgeWorkspace().then((hasProject) => {
			if (!hasProject) {
				this.statusBarItem.hide();
				return;
			}

			let text: string;
			let tooltip: string;
			let backgroundColor: vscode.ThemeColor | undefined;
			let color: string | vscode.ThemeColor | undefined;

			if (this.hasPendingChanges) {
				text = 'Schema Forge: pending';
				tooltip = 'Schema Forge: unsaved changes in .sf file(s)';
				backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
				color = undefined;
			} else if (this.lastDriftResult === 'drift') {
				text = 'Schema Forge: drift';
				tooltip = 'Schema Forge: drift detected. Run "Schema Forge: Diff" for details.';
				backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
				color = undefined;
			} else {
				text = 'Schema Forge: clean';
				tooltip = 'Schema Forge: schema in sync';
				backgroundColor = undefined;
				color = '#4ec9b0';
			}

			this.statusBarItem.text = text;
			this.statusBarItem.tooltip = tooltip;
			this.statusBarItem.backgroundColor = backgroundColor;
			this.statusBarItem.color = color;
			this.statusBarItem.show();
		});
	}

	private runDriftCheckAfterSave(): void {
		// Avoid overlapping runs
		if (this.diffRunPromise) {
			return;
		}
		this.diffRunPromise = runDiff();
		this.diffRunPromise.then((code) => {
			this.diffRunPromise = null;
			if (code === DRIFT_EXIT_CODE) {
				this.lastDriftResult = 'drift';
			} else if (code !== null) {
				this.lastDriftResult = 'clean';
			}
			this.refresh();
		});
	}

	dispose(): void {
		this.statusBarItem?.dispose();
		for (const d of this.disposables) {
			d.dispose();
		}
		this.disposables.length = 0;
	}
}
