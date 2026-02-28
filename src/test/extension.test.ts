import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Integration Test Suite', () => {
	vscode.window.showInformationMessage('Running Schema Forge Extension Tests');

	test('Extension should be present', () => {
		const extension = vscode.extensions.getExtension('xubylele.schema-forge');
		assert.ok(extension, 'Extension should be installed');
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension('xubylele.schema-forge');
		assert.ok(extension);

		await extension?.activate();
		assert.strictEqual(extension?.isActive, true, 'Extension should be active');
	});

	test('Commands should be registered', async () => {
		const extension = vscode.extensions.getExtension('xubylele.schema-forge');
		await extension?.activate();

		const commands = await vscode.commands.getCommands(true);

		assert.ok(commands.includes('schemaForge.init'), 'Init command should be registered');
		assert.ok(commands.includes('schemaForge.generate'), 'Generate command should be registered');
		assert.ok(commands.includes('schemaForge.diff'), 'Diff command should be registered');
	});

	test('Extension should have correct metadata', () => {
		const extension = vscode.extensions.getExtension('xubylele.schema-forge');
		assert.ok(extension);

		const packageJSON = extension.packageJSON;
		assert.strictEqual(packageJSON.displayName, 'Schema Forge');
		assert.strictEqual(packageJSON.publisher, 'xubylele');
		assert.ok(packageJSON.version);
	});

	test('Language contribution should be registered', () => {
		const extension = vscode.extensions.getExtension('xubylele.schema-forge');
		assert.ok(extension);

		const packageJSON = extension.packageJSON;
		const languages = packageJSON.contributes?.languages || [];

		const schemaForgeLanguage = languages.find((lang: any) => lang.id === 'schema-forge');
		assert.ok(schemaForgeLanguage, 'schema-forge language should be registered');
		assert.ok(schemaForgeLanguage.extensions.includes('.sf'), '.sf extension should be registered');
	});

	test('Commands should have correct titles', () => {
		const extension = vscode.extensions.getExtension('xubylele.schema-forge');
		assert.ok(extension);

		const packageJSON = extension.packageJSON;
		const commands = packageJSON.contributes?.commands || [];

		const initCommand = commands.find((cmd: any) => cmd.command === 'schemaForge.init');
		assert.strictEqual(initCommand?.title, 'Schema Forge: Init');

		const generateCommand = commands.find((cmd: any) => cmd.command === 'schemaForge.generate');
		assert.strictEqual(generateCommand?.title, 'Schema Forge: Generate');

		const diffCommand = commands.find((cmd: any) => cmd.command === 'schemaForge.diff');
		assert.strictEqual(diffCommand?.title, 'Schema Forge: Diff');
	});
});
