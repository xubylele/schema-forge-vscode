import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { initCommand } from './commands/init';
import { generateCommand } from './commands/generate';
import { diffCommand } from './commands/diff';
import { logToOutput } from './output';

/**
 * Check if schemaforge/ folder exists in the given workspace folder path
 */
async function schemaForgeProjectExists(workspaceFolder: vscode.WorkspaceFolder): Promise<boolean> {
	try {
		const schemaForgePath = path.join(workspaceFolder.uri.fsPath, 'schemaforge');
		await fs.stat(schemaForgePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Prompt user to initialize project if schemaforge/ folder is missing
 */
async function promptMissingProjectStructure(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
	const exists = await schemaForgeProjectExists(workspaceFolder);

	if (exists) {
		return;
	}

	logToOutput(`Schema Forge project folder missing in ${workspaceFolder.name}. Prompting user to initialize.`);

	const action = await vscode.window.showInformationMessage(
		'Schema Forge project not found. Would you like to initialize it now?',
		'Initialize Project',
		'Dismiss'
	);

	if (action === 'Initialize Project') {
		logToOutput('User chose to initialize Schema Forge project.');
		await vscode.commands.executeCommand('schemaForge.init');
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Schema Forge extension activated');

	const disposable = vscode.commands.registerCommand('schemaForge.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Schema Forge.');
	});

	const initDisposable = vscode.commands.registerCommand('schemaForge.init', initCommand);
	const generateDisposable = vscode.commands.registerCommand('schemaForge.generate', generateCommand);
	const diffDisposable = vscode.commands.registerCommand('schemaForge.diff', diffCommand);

	// Auto-detect missing project structure on .sf file open
	const documentOpenDisposable = vscode.workspace.onDidOpenTextDocument(async (document) => {
		if (document.languageId === 'schema-forge') {
			const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
			if (workspaceFolder) {
				await promptMissingProjectStructure(workspaceFolder);
			}
		}
	});

	context.subscriptions.push(
		disposable,
		initDisposable,
		generateDisposable,
		diffDisposable,
		documentOpenDisposable
	);
}

export function deactivate() { }
