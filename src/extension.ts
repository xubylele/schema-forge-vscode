// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { initCommand } from './commands/init';

export function activate(context: vscode.ExtensionContext) {
	console.log('Schema Forge extension activated');

	const disposable = vscode.commands.registerCommand('schemaForge.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Schema Forge.');
	});

	const initDisposable = vscode.commands.registerCommand('schemaForge.init', initCommand);

	context.subscriptions.push(disposable, initDisposable);
}

export function deactivate() { }
