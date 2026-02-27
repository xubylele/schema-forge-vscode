import * as vscode from 'vscode';
import { initCommand } from './commands/init';
import { generateCommand } from './commands/generate';

export function activate(context: vscode.ExtensionContext) {
	console.log('Schema Forge extension activated');

	const disposable = vscode.commands.registerCommand('schemaForge.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Schema Forge.');
	});

	const initDisposable = vscode.commands.registerCommand('schemaForge.init', initCommand);
	const generateDisposable = vscode.commands.registerCommand('schemaForge.generate', generateCommand);

	context.subscriptions.push(disposable, initDisposable, generateDisposable);
}

export function deactivate() { }
