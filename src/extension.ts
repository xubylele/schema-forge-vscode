// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Schema Forge extension activated');

	const disposable = vscode.commands.registerCommand('schemaForge.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Schema Forge.');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
