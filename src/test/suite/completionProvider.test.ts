import * as assert from 'assert';
import * as vscode from 'vscode';
import {
	SchemaForgeCompletionProvider,
	createCompletionProvider,
} from '../../features/completion/completionProvider';

suite('Completion Provider Test Suite', () => {
	let provider: SchemaForgeCompletionProvider;

	setup(() => {
		provider = createCompletionProvider();
	});

	teardown(() => {
		provider.dispose();
	});

	function createMockDocument(content: string, languageId: string = 'schema-forge'): vscode.TextDocument {
		const lines = content.split('\n');
		return {
			uri: vscode.Uri.file('/test/schema.sf'),
			fileName: '/test/schema.sf',
			languageId,
			version: 1,
			isDirty: false,
			isUntitled: false,
			eol: vscode.EndOfLine.LF,
			getText: () => content,
			lineAt: (line: number) => ({
				text: lines[line] ?? '',
				range: new vscode.Range(line, 0, line, (lines[line] ?? '').length),
				rangeIncludingLineBreak: new vscode.Range(line, 0, line + 1, 0),
				firstNonWhitespaceCharacterIndex: (lines[line] ?? '').search(/\S/),
				isEmptyOrWhitespace: (lines[line] ?? '').trim().length === 0,
			}),
			lineCount: lines.length,
			getWordRangeAtPosition: () => undefined,
			validateRange: (r: vscode.Range) => r,
			validatePosition: (p: vscode.Position) => p,
			save: async () => true,
		} as unknown as vscode.TextDocument;
	}

	test('should return undefined for non-schema-forge language', async () => {
		const content = 'id uuid';
		const document = createMockDocument(content, 'plaintext');
		const position = new vscode.Position(0, 3);

		const result = await provider.provideCompletionItems(
			document,
			position,
			new vscode.CancellationTokenSource().token,
			{ triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
		);

		assert.strictEqual(result, undefined);
	});

	test('should provide type suggestions after column name', async () => {
		const content = 'id ';
		const document = createMockDocument(content);
		const position = new vscode.Position(0, 3);

		const result = await provider.provideCompletionItems(
			document,
			position,
			new vscode.CancellationTokenSource().token,
			{ triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
		);

		assert.ok(Array.isArray(result), 'Should return completion items');
		assert.ok(result!.length > 0, 'Should have at least one suggestion');
		const labels = result!.map((i) => i.label);
		assert.ok(labels.includes('uuid'), 'Should suggest uuid');
		assert.ok(labels.includes('text'), 'Should suggest text');
		assert.ok(labels.includes('timestamptz'), 'Should suggest timestamptz');
		assert.ok(labels.includes('varchar(255)'), 'Should suggest varchar(255)');
	});

	test('should provide type suggestions when cursor is in type token', async () => {
		const content = 'id uu';
		const document = createMockDocument(content);
		const position = new vscode.Position(0, 5);

		const result = await provider.provideCompletionItems(
			document,
			position,
			new vscode.CancellationTokenSource().token,
			{ triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
		);

		assert.ok(Array.isArray(result), 'Should return completion items');
		const labels = result!.map((i) => i.label);
		assert.ok(labels.includes('uuid'), 'Should suggest uuid');
	});

	test('should provide constraint suggestions after type', async () => {
		const content = 'id uuid ';
		const document = createMockDocument(content);
		const position = new vscode.Position(0, 8);

		const result = await provider.provideCompletionItems(
			document,
			position,
			new vscode.CancellationTokenSource().token,
			{ triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
		);

		assert.ok(Array.isArray(result), 'Should return completion items');
		const labels = result!.map((i) => i.label);
		assert.ok(labels.includes('pk'), 'Should suggest pk');
		assert.ok(labels.includes('unique'), 'Should suggest unique');
		assert.ok(labels.includes('default'), 'Should suggest default');
		assert.ok(labels.includes('not null'), 'Should suggest not null');
	});

	test('should not suggest already present constraints', async () => {
		const content = 'id uuid pk ';
		const document = createMockDocument(content);
		const position = new vscode.Position(0, 11);

		const result = await provider.provideCompletionItems(
			document,
			position,
			new vscode.CancellationTokenSource().token,
			{ triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
		);

		assert.ok(Array.isArray(result), 'Should return completion items');
		const labels = result!.map((i) => i.label);
		assert.ok(!labels.includes('pk'), 'Should not suggest pk again');
		assert.ok(labels.includes('unique'), 'Should still suggest unique');
	});

	test('should provide default value hints after default keyword', async () => {
		const content = 'id uuid default ';
		const document = createMockDocument(content);
		const position = new vscode.Position(0, 17);

		const result = await provider.provideCompletionItems(
			document,
			position,
			new vscode.CancellationTokenSource().token,
			{ triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
		);

		assert.ok(Array.isArray(result), 'Should return completion items');
		const insertTexts = result!.map((i) => i.insertText ?? i.label);
		assert.ok(insertTexts.includes('gen_random_uuid()'), 'Should suggest gen_random_uuid() for uuid');
		assert.ok(insertTexts.includes('now()'), 'Should suggest now()');
		assert.ok(insertTexts.includes('true'), 'Should suggest true');
		assert.ok(insertTexts.includes('false'), 'Should suggest false');
	});

	test('should provide type-aware default hints for uuid column', async () => {
		const content = '  id uuid default ';
		const document = createMockDocument(content);
		const position = new vscode.Position(0, 18);

		const result = await provider.provideCompletionItems(
			document,
			position,
			new vscode.CancellationTokenSource().token,
			{ triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
		);

		assert.ok(Array.isArray(result), 'Should return completion items');
		const insertTexts = result!.map((i) => i.insertText ?? i.label);
		assert.ok(insertTexts.includes('gen_random_uuid()'), 'Should suggest gen_random_uuid() for uuid');
	});

	test('should provide type-aware default hints for timestamptz column', async () => {
		const content = '  created_at timestamptz default ';
		const document = createMockDocument(content);
		const position = new vscode.Position(0, 31);

		const result = await provider.provideCompletionItems(
			document,
			position,
			new vscode.CancellationTokenSource().token,
			{ triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
		);

		assert.ok(Array.isArray(result), 'Should return completion items');
		const insertTexts = result!.map((i) => i.insertText ?? i.label);
		assert.ok(insertTexts.includes('now()'), 'Should suggest now() for timestamptz');
	});

	test('should not provide completions in comment', async () => {
		const content = '# comment only';
		const document = createMockDocument(content);
		const position = new vscode.Position(0, 5);

		const result = await provider.provideCompletionItems(
			document,
			position,
			new vscode.CancellationTokenSource().token,
			{ triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
		);

		assert.strictEqual(result, undefined);
	});

	test('completion items should have detail and documentation where applicable', async () => {
		const content = 'id ';
		const document = createMockDocument(content);
		const position = new vscode.Position(0, 3);

		const result = await provider.provideCompletionItems(
			document,
			position,
			new vscode.CancellationTokenSource().token,
			{ triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined }
		);

		const uuidItem = result!.find((i) => i.label === 'uuid');
		assert.ok(uuidItem, 'Should have uuid item');
		assert.ok(uuidItem.detail, 'Type item should have detail');
		assert.ok(uuidItem.documentation, 'Type item should have documentation');
	});
});
