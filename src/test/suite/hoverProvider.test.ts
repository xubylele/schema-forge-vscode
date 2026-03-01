import * as assert from 'assert';
import * as vscode from 'vscode';
import { HoverProvider, createHoverProvider } from '../../features/hover/hoverProvider';

suite('Hover Provider Test Suite', () => {
  let provider: HoverProvider;

  setup(() => {
    provider = createHoverProvider();
  });

  teardown(() => {
    provider.dispose();
  });

  /**
   * Helper to create a mock document
   * @param content - Document text content
   * @returns Mock VSCode TextDocument
   */
  function createMockDocument(content: string): any {
    const lines = content.split('\n');
    return {
      uri: vscode.Uri.file('/test/schema.sf'),
      languageId: 'schema-forge',
      getText: () => content,
      lineAt: (line: number) => ({
        text: lines[line] || '',
        lineNumber: line,
      }),
      lineCount: lines.length,
    };
  }

  // ==================== Keyword Tests ====================

  test('should provide hover for table keyword', async () => {
    const content = 'table users {';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 2); // Cursor on 'table'

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Hover should be provided');
    assert.ok(hover.contents, 'Hover should have contents');
    assert.ok(hover.contents[0], 'Hover should have markdown content');

    const markdownStr = hover.contents[0] as vscode.MarkdownString;
    assert.ok(markdownStr.value, 'Hover markdown should have value');
    assert.ok(markdownStr.value.includes('table'), 'Hover should mention "table"');
  });

  // ==================== Type Tests ====================

  test('should provide hover for uuid type', async () => {
    const content = 'id uuid primary key';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 5); // Cursor on 'uuid'

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Hover should be provided');
    const markdownStr = hover.contents[0] as vscode.MarkdownString;
    assert.ok(markdownStr.value.includes('uuid'), 'Hover should mention "uuid"');
  });

  test('should provide hover for text type', async () => {
    const content = 'description text';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 13); // Cursor on 'text'

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Hover should be provided');
    const markdownStr = hover.contents[0] as vscode.MarkdownString;
    assert.ok(markdownStr.value.includes('text'), 'Hover should mention "text"');
  });

  test('should provide hover for timestamptz type', async () => {
    const content = 'created_at timestamptz';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 15); // Cursor on 'timestamptz'

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Hover should be provided');
    const markdownStr = hover.contents[0] as vscode.MarkdownString;
    assert.ok(
      markdownStr.value.includes('timestamptz'),
      'Hover should mention "timestamptz"'
    );
  });

  // ==================== Varchar Tests ====================

  test('should provide hover for varchar keyword', async () => {
    const content = 'name varchar(255)';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 7); // Cursor on 'varchar'

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Hover should be provided for varchar keyword');
    const markdownStr = hover.contents[0] as vscode.MarkdownString;
    assert.ok(markdownStr.value.includes('varchar'), 'Hover should mention "varchar"');
  });

  test('should provide hover for varchar with parameter length span', async () => {
    const content = 'email varchar(255)';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 9); // Cursor on '255'

    const hover = await provider.provideHover(document, position);

    assert.ok(
      hover,
      'Hover should be provided for position inside varchar(255) span'
    );
    const markdownStr = hover.contents[0] as vscode.MarkdownString;
    assert.ok(markdownStr.value.includes('varchar'), 'Hover should mention "varchar"');
  });

  test('should handle varchar without parameter', async () => {
    const content = 'bio varchar';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 7); // Cursor on 'varchar'

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Hover should be provided for varchar without parameter');
    const markdownStr = hover.contents[0] as vscode.MarkdownString;
    assert.ok(markdownStr.value.includes('varchar'), 'Hover should mention "varchar"');
  });

  // ==================== Modifier Tests ====================

  test('should provide hover for pk modifier', async () => {
    const content = 'id uuid pk';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 8); // Cursor on 'pk'

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Hover should be provided');
    const markdownStr = hover.contents[0] as vscode.MarkdownString;
    assert.ok(markdownStr.value.includes('Primary key'), 'Hover should mention primary key');
  });

  test('should provide hover for unique modifier', async () => {
    const content = 'email text unique';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 13); // Cursor on 'unique'

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Hover should be provided');
    const markdownStr = hover.contents[0] as vscode.MarkdownString;
    assert.ok(
      markdownStr.value.includes('Unique'),
      'Hover should mention "Unique constraint"'
    );
  });

  test('should provide hover for default modifier', async () => {
    const content = 'active boolean default true';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 18); // Cursor on 'default'

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Hover should be provided for default keyword');
    const markdownStr = hover.contents[0] as vscode.MarkdownString;
    assert.ok(
      markdownStr.value.includes('Default'),
      'Hover should mention "Default value"'
    );
  });

  // ==================== Markdown Format Tests ====================

  test('should return markdown formatted hover content', async () => {
    const content = 'table users {';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 2);

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Hover should be provided');
    const markdownStr = hover.contents[0] as vscode.MarkdownString;
    assert.ok(markdownStr instanceof vscode.MarkdownString, 'Content should be MarkdownString');
    assert.ok(markdownStr.value.length > 0, 'Markdown content should not be empty');
    assert.ok(
      markdownStr.value.includes('**'),
      'Markdown should contain bold formatting'
    );

    // Verify 3-6 lines: split by newline and count non-empty lines
    const lines = markdownStr.value.split('\n').filter((line) => line.trim().length > 0);
    assert.ok(
      lines.length >= 3,
      `Hover content should have at least 3 lines, got ${lines.length}`
    );
    assert.ok(
      lines.length <= 6,
      `Hover content should have at most 6 lines, got ${lines.length}`
    );
  });

  // ==================== No-Hover Tests ====================

  test('should not provide hover for non-DSL content', async () => {
    const content = 'some random text';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 5);

    const hover = await provider.provideHover(document, position);

    assert.strictEqual(hover, null, 'No hover should be provided for non-DSL content');
  });

  test('should not provide hover for non-schema-forge language', async () => {
    const content = 'table users {';
    const document = {
      ...createMockDocument(content),
      languageId: 'javascript', // Non-schema-forge language
    };
    const position = new vscode.Position(0, 2);

    const hover = await provider.provideHover(document, position);

    assert.strictEqual(
      hover,
      null,
      'No hover should be provided for non-schema-forge language'
    );
  });

  test('should not provide hover outside token boundary', async () => {
    const content = 'table users {';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 12); // Position after tokens

    const hover = await provider.provideHover(document, position);

    assert.strictEqual(
      hover,
      null,
      'No hover should be provided outside token boundaries'
    );
  });

  // ==================== Multi-line Tests ====================

  test('should handle content across multiple lines', async () => {
    const content = `table users {
  id uuid pk
  email text unique
  created_at timestamptz default now()
}`;
    const document = createMockDocument(content);

    // Test hover on line 1 (uuid)
    const hoverUuid = await provider.provideHover(
      document,
      new vscode.Position(1, 6)
    );
    assert.ok(hoverUuid, 'Should find uuid on line 1');

    // Test hover on line 2 (unique)
    const hoverUnique = await provider.provideHover(
      document,
      new vscode.Position(2, 18)
    );
    assert.ok(hoverUnique, 'Should find unique on line 2');

    // Test hover on line 3 (timestamptz)
    const hoverTimestamp = await provider.provideHover(
      document,
      new vscode.Position(3, 14)
    );
    assert.ok(hoverTimestamp, 'Should find timestamptz on line 3');

    // Test hover on line 3 (default)
    const hoverDefault = await provider.provideHover(
      document,
      new vscode.Position(3, 30)
    );
    assert.ok(hoverDefault, 'Should find default on line 3');
  });

  // ==================== Edge Cases ====================

  test('should handle cursor at token start', async () => {
    const content = 'table users {';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 0); // Start of 'table'

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Should provide hover at token start');
  });

  test('should handle cursor at token end', async () => {
    const content = 'table users {';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 4); // End of 'table'

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Should provide hover at token boundary');
  });

  test('should handle whitespace variations in varchar', async () => {
    const content = 'field varchar ( 255 )';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 6); // On 'varchar'

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Should handle whitespace in varchar(n)');
  });

  test('should create valid hover range', async () => {
    const content = 'table users {';
    const document = createMockDocument(content);
    const position = new vscode.Position(0, 2);

    const hover = await provider.provideHover(document, position);

    assert.ok(hover, 'Hover should be provided');
    assert.ok(hover.range, 'Hover should have a range');
    assert.ok(hover.range instanceof vscode.Range, 'Hover range should be VSCode Range');
  });
});
