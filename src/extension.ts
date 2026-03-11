import * as fs from 'fs/promises';
import * as path from 'path';
import * as vscode from 'vscode';
import { diffCommand } from './commands/diff';
import { diffPreviewCommand } from './commands/diffPreview';
import { generateCommand } from './commands/generate';
import { initCommand } from './commands/init';
import { previewSqlCommand } from './commands/previewSql';
import { visualDiffCommand } from './commands/visualDiff';
import { AddPrimaryKeyCodeActionProvider } from './features/codeActions/addPrimaryKeyAction';
import {
	ConvertToUuidPkCodeActionProvider,
	registerConvertToUuidPkCommand,
} from './features/codeActions/convertToUuidPkFix';
import { createCompletionProvider } from './features/completion/completionProvider';
import { SyntaxDiagnosticsProvider } from './features/diagnostics/syntaxDiagnostics';
import { createHoverProvider } from './features/hover/hoverProvider';
import { SchemaStatusBar } from './features/statusBar/schemaStatusBar';
import { logToOutput } from './output';
import { copyLatestDiffPreviewSql } from './ui/sqlPreviewPanel';

const STATUS_BAR_ACTIONS = [
  { label: 'Run Diff Preview', command: 'schemaForge.diffPreview' },
  { label: 'Open Visual Diff', command: 'schemaForge.visualDiff' },
  { label: 'Schema Forge: Generate', command: 'schemaForge.generate' },
] as const;

async function statusBarClickCommand(): Promise<void> {
  const picked = await vscode.window.showQuickPick(STATUS_BAR_ACTIONS, {
    placeHolder: 'Schema Forge actions',
    matchOnDescription: true,
  });
  if (picked) {
    await vscode.commands.executeCommand(picked.command);
  }
}

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

/**
 * Check if extension was updated and open README if so
 */
async function checkExtensionUpdate(context: vscode.ExtensionContext): Promise<void> {
	const currentVersion = context.extension.packageJSON.version;
	const previousVersion = context.globalState.get<string>('schemaForge.version');

	// If there's a previous version and it's different from current, the extension was updated
	if (previousVersion && previousVersion !== currentVersion) {
		logToOutput(`Schema Forge extension updated from ${previousVersion} to ${currentVersion}`);

		// Open README to show what's new
		const extensionPath = context.extensionPath;
		const readmePath = path.join(extensionPath, 'README.md');

		try {
			const readmeUri = vscode.Uri.file(readmePath);
			await vscode.commands.executeCommand('markdown.showPreview', readmeUri);
			logToOutput('Opened README to show update information');
		} catch (error) {
			logToOutput(`Failed to open README: ${error}`);
		}
	}

	// Store the current version
	await context.globalState.update('schemaForge.version', currentVersion);
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Schema Forge extension activated');

	// Check if extension was updated and show README
	checkExtensionUpdate(context);

	const schemaStatusBar = new SchemaStatusBar();
	schemaStatusBar.register();

	const initDisposable = vscode.commands.registerCommand('schemaForge.init', initCommand);
	const generateDisposable = vscode.commands.registerCommand('schemaForge.generate', generateCommand);
	const diffDisposable = vscode.commands.registerCommand('schemaForge.diff', () =>
		diffCommand((code) => schemaStatusBar.setDriftResultFromExitCode(code))
	);
	const diffPreviewDisposable = vscode.commands.registerCommand('schemaForge.diffPreview', diffPreviewCommand);
	const previewSqlDisposable = vscode.commands.registerCommand('schemaForge.previewSql', previewSqlCommand);
	const visualDiffDisposable = vscode.commands.registerCommand('schemaForge.visualDiff', visualDiffCommand);
	const statusBarClickDisposable = vscode.commands.registerCommand('schemaForge.statusBarClick', statusBarClickCommand);
	const copyDiffPreviewDisposable = vscode.commands.registerCommand(
		'schemaForge.copyDiffPreviewSql',
		copyLatestDiffPreviewSql
	);
	const convertToUuidPkCommandDisposable = registerConvertToUuidPkCommand(context);

	// Initialize syntax diagnostics provider
	const syntaxDiagnosticsProvider = new SyntaxDiagnosticsProvider();
	syntaxDiagnosticsProvider.registerListeners();

	// Initialize hover provider
	const hoverProvider = createHoverProvider();

	// Initialize completion provider for types, constraints, default value hints
	const completionProvider = createCompletionProvider();

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
		schemaStatusBar,
		initDisposable,
		generateDisposable,
		diffDisposable,
		diffPreviewDisposable,
		previewSqlDisposable,
		visualDiffDisposable,
		statusBarClickDisposable,
		copyDiffPreviewDisposable,
		convertToUuidPkCommandDisposable,
		documentOpenDisposable,
		syntaxDiagnosticsProvider,
		vscode.languages.registerHoverProvider({ language: 'schema-forge' }, hoverProvider),
		hoverProvider,
		vscode.languages.registerCompletionItemProvider(
			{ language: 'schema-forge' },
			completionProvider
		),
		completionProvider,
		vscode.languages.registerCodeActionsProvider(
			{ language: 'schema-forge' },
			new AddPrimaryKeyCodeActionProvider(),
			{ providedCodeActionKinds: AddPrimaryKeyCodeActionProvider.providedCodeActionKinds }
		),
		vscode.languages.registerCodeActionsProvider(
			{ language: 'schema-forge' },
			new ConvertToUuidPkCodeActionProvider(),
			{ providedCodeActionKinds: ConvertToUuidPkCodeActionProvider.providedCodeActionKinds }
		)
	);
}

export function deactivate() { }
