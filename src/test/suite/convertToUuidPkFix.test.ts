import type { Table } from '@xubylele/schema-forge-core';
import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  buildConvertedColumnLine,
  ConvertToUuidPkCodeActionProvider,
  hasDuplicateIdConflict,
  resolveSelectedColumnNameFromLine,
} from '../../features/codeActions/convertToUuidPkFix';

suite('Convert To UUID PK Fix Test Suite', () => {
  test('provider should have correct code action kinds', () => {
    assert.ok(ConvertToUuidPkCodeActionProvider.providedCodeActionKinds);
    assert.strictEqual(ConvertToUuidPkCodeActionProvider.providedCodeActionKinds.length, 1);
    assert.strictEqual(
      ConvertToUuidPkCodeActionProvider.providedCodeActionKinds[0],
      vscode.CodeActionKind.QuickFix
    );
  });

  test('buildConvertedColumnLine should preserve indentation and comments', () => {
    const input = '    user_id int unique default 1  // keep comment';
    const output = buildConvertedColumnLine(input);

    assert.strictEqual(output, '    id uuid unique default 1 pk  // keep comment');
  });

  test('buildConvertedColumnLine should remove existing pk and normalize', () => {
    const input = '  legacy_id bigint pk unique';
    const output = buildConvertedColumnLine(input);

    assert.strictEqual(output, '  id uuid unique pk');
  });

  test('resolveSelectedColumnNameFromLine should resolve valid column from table', () => {
    const table: Table = {
      name: 'users',
      columns: [
        { name: 'name', type: 'text' },
        { name: 'email', type: 'text' },
      ],
    };

    assert.strictEqual(resolveSelectedColumnNameFromLine('  name text', table), 'name');
    assert.strictEqual(resolveSelectedColumnNameFromLine('  // comment', table), null);
    assert.strictEqual(resolveSelectedColumnNameFromLine('  }', table), null);
    assert.strictEqual(resolveSelectedColumnNameFromLine('  unknown text', table), null);
  });

  test('hasDuplicateIdConflict should detect id conflicts correctly', () => {
    const tableWithId: Table = {
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'email', type: 'text' },
      ],
    };

    const tableWithDuplicateId: Table = {
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid' },
        { name: 'id', type: 'uuid' },
      ],
    };

    assert.strictEqual(hasDuplicateIdConflict(tableWithId, 'email'), true);
    assert.strictEqual(hasDuplicateIdConflict(tableWithId, 'id'), false);
    assert.strictEqual(hasDuplicateIdConflict(tableWithDuplicateId, 'id'), true);
  });
});
