import type { Table } from '@xubylele/schema-forge-core';
import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  buildConvertedColumnLine,
  ConvertToUuidPkCodeActionProvider,
  hasDuplicateIdConflict,
  resolveSelectedColumnNameFromLine,
} from '../convertToUuidPkFix';

/**
 * Comprehensive tests for ConvertToUuidPkCodeActionProvider
 * Tests both provider interface and helper function behavior with text verification
 */
suite('Convert To UUID PK Fix Test Suite', () => {
  suite('Provider Interface', () => {
    test('should have correct code action kinds', () => {
      assert.ok(ConvertToUuidPkCodeActionProvider.providedCodeActionKinds);
      assert.strictEqual(
        ConvertToUuidPkCodeActionProvider.providedCodeActionKinds.length,
        1
      );
      assert.strictEqual(
        ConvertToUuidPkCodeActionProvider.providedCodeActionKinds[0],
        vscode.CodeActionKind.QuickFix
      );
    });
  });

  suite('buildConvertedColumnLine Text Transformation', () => {
    test('should convert simple column to id uuid pk', () => {
      const input = '  user_id int';
      const output = buildConvertedColumnLine(input);

      assert.strictEqual(output, '  id uuid unique pk');
    });

    test('should preserve indentation and comments', () => {
      const input = '    user_id int unique default 1  // keep comment';
      const output = buildConvertedColumnLine(input);

      assert.strictEqual(
        output,
        '    id uuid unique default 1 pk  // keep comment'
      );
    });

    test('should preserve complex comments with multiple slashes', () => {
      const input = '  email varchar(255) unique  // https://example.com';
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      // Should preserve the comment exactly
      assert.ok(output!.includes('// https://example.com'));
    });

    test('should remove existing pk modifier and normalize position', () => {
      const input = '  legacy_id bigint pk unique';
      const output = buildConvertedColumnLine(input);

      assert.strictEqual(output, '  id uuid unique pk');
    });

    test('should remove multiple pk modifiers if present', () => {
      const input = '  old_id int pk pk';
      const output = buildConvertedColumnLine(input);

      // Should remove all pk occurrences except the final normalized one
      assert.strictEqual(output, '  id uuid pk');
    });

    test('should preserve all non-pk modifiers', () => {
      const input = '  user_id int unique not null default 123';
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      assert.ok(output!.includes('unique'));
      assert.ok(output!.includes('not'));
      assert.ok(output!.includes('null'));
      assert.ok(output!.includes('default'));
      assert.ok(output!.includes('123'));
    });

    test('should handle very long indentation', () => {
      const input = '                  user_id text';
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      assert.ok(output!.startsWith('                  '));
    });

    test('should handle tabs as indentation', () => {
      const input = '\t\tuser_id int';
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      assert.ok(output!.startsWith('\t\t'));
    });

    test('should handle mixed tabs and spaces', () => {
      const input = '\t  user_id int';
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      assert.ok(output!.startsWith('\t  '));
    });

    test('should handle hash comments in addition to slashes', () => {
      const input = '  user_id int  # this is a comment';
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      assert.ok(output!.includes('# this is a comment'));
    });

    test('should preserve spacing before comment', () => {
      const input = '  user_id int   // comment with spaces';
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      // Should preserve spacing pattern before comment
      assert.ok(output!.includes('  //') || output!.includes('   //'));
    });

    test('should handle column without modifiers', () => {
      const input = '  user_id uuid';
      const output = buildConvertedColumnLine(input);

      assert.strictEqual(output, '  id uuid pk');
    });

    test('should normalize whitespace between tokens', () => {
      const input = '  user_id   int   ';
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      // Tokens should be normalized with single spaces
      assert.ok(!output!.includes('    '));
    });

    test('should handle quoted strings without processing them', () => {
      const input = '  user_id varchar(255) default "now()"';
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      assert.ok(output!.includes('"now()"'));
    });

    test('should handle single-quoted strings', () => {
      const input = "  user_id int default 'test'";
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      assert.ok(output!.includes("'test'"));
    });

    test('should handle escaped quotes in strings', () => {
      const input = '  user_id text default "test\\"quote"';
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      assert.ok(output!.includes('"'));
    });

    test('should return null for empty line', () => {
      const input = '   ';
      const output = buildConvertedColumnLine(input);

      assert.strictEqual(output, null);
    });

    test('should return null for line with only comment', () => {
      const input = '  // just a comment';
      const output = buildConvertedColumnLine(input);

      assert.strictEqual(output, null);
    });

    test('should return null for line with only opening brace', () => {
      const input = '  {';
      const output = buildConvertedColumnLine(input);

      assert.strictEqual(output, null);
    });

    test('should return null for line with only closing brace', () => {
      const input = '  }';
      const output = buildConvertedColumnLine(input);

      assert.strictEqual(output, null);
    });

    test('should return null for line with single token', () => {
      const input = '  user_id';
      const output = buildConvertedColumnLine(input);

      assert.strictEqual(output, null);
    });

    test('should handle nullable modifier', () => {
      const input = '  user_id int nullable';
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      assert.ok(output!.includes('nullable'));
    });

    test('should transform uuid column properly', () => {
      const input = '  user_id uuid';
      const output = buildConvertedColumnLine(input);

      assert.strictEqual(output, '  id uuid pk');
    });

    test('should preserve comment spacing variations', () => {
      const input = '  user_id int  //comment no space';
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      assert.ok(output!.includes('//comment no space'));
    });
  });

  suite('resolveSelectedColumnNameFromLine', () => {
    test('should resolve valid column from table', () => {
      const table: Table = {
        name: 'users',
        columns: [
          { name: 'name', type: 'text' },
          { name: 'email', type: 'text' },
        ],
      };

      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  name text', table),
        'name'
      );
      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  email text', table),
        'email'
      );
    });

    test('should return null for comment-only line', () => {
      const table: Table = {
        name: 'users',
        columns: [{ name: 'name', type: 'text' }],
      };

      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  // comment', table),
        null
      );
      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  # hash comment', table),
        null
      );
    });

    test('should return null for brace-only line', () => {
      const table: Table = {
        name: 'users',
        columns: [{ name: 'name', type: 'text' }],
      };

      assert.strictEqual(resolveSelectedColumnNameFromLine('  }', table), null);
      assert.strictEqual(resolveSelectedColumnNameFromLine('  {', table), null);
    });

    test('should return null for unknown column name', () => {
      const table: Table = {
        name: 'users',
        columns: [
          { name: 'name', type: 'text' },
          { name: 'email', type: 'text' },
        ],
      };

      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  unknown text', table),
        null
      );
    });

    test('should handle column with various indentation', () => {
      const table: Table = {
        name: 'users',
        columns: [{ name: 'id', type: 'uuid' }],
      };

      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  id uuid pk', table),
        'id'
      );
      assert.strictEqual(
        resolveSelectedColumnNameFromLine('    id uuid pk', table),
        'id'
      );
      assert.strictEqual(
        resolveSelectedColumnNameFromLine('\tid uuid pk', table),
        'id'
      );
    });

    test('should handle column name with underscores', () => {
      const table: Table = {
        name: 'users',
        columns: [{ name: 'user_id', type: 'uuid' }],
      };

      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  user_id uuid', table),
        'user_id'
      );
    });

    test('should handle column name with numbers', () => {
      const table: Table = {
        name: 'users',
        columns: [{ name: 'field1', type: 'text' }],
      };

      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  field1 text', table),
        'field1'
      );
    });

    test('should handle column with trailing comment', () => {
      const table: Table = {
        name: 'users',
        columns: [{ name: 'name', type: 'text' }],
      };

      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  name text  // user name', table),
        'name'
      );
    });

    test('should ignore column type in resolution', () => {
      const table: Table = {
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid' },
          { name: 'name', type: 'text' },
        ],
      };

      // Type doesn't matter for resolution
      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  id bigint', table),
        'id'
      );
    });

    test('should return null for empty line', () => {
      const table: Table = {
        name: 'users',
        columns: [{ name: 'name', type: 'text' }],
      };

      assert.strictEqual(
        resolveSelectedColumnNameFromLine('   ', table),
        null
      );
    });

    test('should handle case sensitivity', () => {
      const table: Table = {
        name: 'users',
        columns: [{ name: 'Name', type: 'text' }],
      };

      // Column names are case-sensitive
      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  name text', table),
        null
      );
      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  Name text', table),
        'Name'
      );
    });

    test('should handle line with only type token', () => {
      const table: Table = {
        name: 'users',
        columns: [{ name: 'text', type: 'text' }],
      };

      // Even if 'text' is a column name AND a type, first token is column name
      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  text', table),
        null
      );
    });
  });

  suite('hasDuplicateIdConflict', () => {
    test('should detect id column exists when converting another column', () => {
      const table: Table = {
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true },
          { name: 'email', type: 'text' },
        ],
      };

      assert.strictEqual(hasDuplicateIdConflict(table, 'email'), true);
    });

    test('should return false when converting id column itself', () => {
      const table: Table = {
        name: 'users',
        columns: [{ name: 'id', type: 'uuid' }],
      };

      assert.strictEqual(hasDuplicateIdConflict(table, 'id'), false);
    });

    test('should detect multiple id columns (duplicate conflict)', () => {
      const table: Table = {
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid' },
          { name: 'id', type: 'uuid' },
        ],
      };

      assert.strictEqual(hasDuplicateIdConflict(table, 'id'), true);
    });

    test('should return false when no id column exists', () => {
      const table: Table = {
        name: 'users',
        columns: [
          { name: 'user_id', type: 'uuid' },
          { name: 'email', type: 'text' },
        ],
      };

      assert.strictEqual(hasDuplicateIdConflict(table, 'email'), false);
    });

    test('should handle empty table', () => {
      const table: Table = {
        name: 'users',
        columns: [],
      };

      assert.strictEqual(hasDuplicateIdConflict(table, 'any_column'), false);
    });

    test('should be case sensitive for column name matching', () => {
      const table: Table = {
        name: 'users',
        columns: [
          { name: 'ID', type: 'uuid' },
          { name: 'email', type: 'text' },
        ],
      };

      // 'id' (lowercase) is different from 'ID' (uppercase)
      assert.strictEqual(hasDuplicateIdConflict(table, 'email'), false);
    });

    test('should work with many columns', () => {
      const table: Table = {
        name: 'users',
        columns: [
          { name: 'name', type: 'text' },
          { name: 'email', type: 'text' },
          { name: 'id', type: 'uuid', primaryKey: true },
          { name: 'phone', type: 'text' },
          { name: 'address', type: 'text' },
        ],
      };

      assert.strictEqual(hasDuplicateIdConflict(table, 'email'), true);
      assert.strictEqual(hasDuplicateIdConflict(table, 'id'), false);
    });
  });

  suite('Integration: Text Transformations', () => {
    test('should transform typical user_id column to id uuid pk', () => {
      const beforeText = '  user_id uuid';
      const afterText = buildConvertedColumnLine(beforeText);

      assert.strictEqual(afterText, '  id uuid pk');
    });

    test('should handle email_id with multiple modifiers', () => {
      const beforeText = '  email_id varchar(36) unique not null';
      const afterText = buildConvertedColumnLine(beforeText);

      assert.ok(afterText);
      assert.ok(afterText!.startsWith('  id uuid'));
      assert.ok(afterText!.includes('unique'));
      assert.ok(afterText!.includes('not'));
      assert.ok(afterText!.includes('null'));
      assert.ok(afterText!.endsWith('pk'));
    });

    test('should transform column preserving inline comment', () => {
      const beforeText = '  record_id int  // Primary identifier';
      const afterText = buildConvertedColumnLine(beforeText);

      assert.ok(afterText);
      assert.ok(afterText!.includes('id uuid'));
      assert.ok(afterText!.includes('// Primary identifier'));
      assert.ok(afterText!.includes('pk'));
    });

    test('should handle conversion with varied spacing', () => {
      const beforeText = '    product_id    bigint    unique     pk    // prod';
      const afterText = buildConvertedColumnLine(beforeText);

      assert.ok(afterText);
      assert.ok(afterText!.startsWith('    '));
      assert.ok(afterText!.includes('id uuid'));
      assert.ok(afterText!.includes('unique'));
      assert.ok(afterText!.includes('pk'));
      assert.ok(afterText!.includes('// prod'));
    });
  });

  suite('Error Cases and Edge Cases', () => {
    test('should return null for malformed column lines', () => {
      assert.strictEqual(buildConvertedColumnLine(''), null);
      assert.strictEqual(buildConvertedColumnLine('   '), null);
    });

    test('should resolve column from table with special characters in names', () => {
      const table: Table = {
        name: 'users',
        columns: [{ name: 'user_id_v2', type: 'uuid' }],
      };

      assert.strictEqual(
        resolveSelectedColumnNameFromLine('  user_id_v2 uuid', table),
        'user_id_v2'
      );
    });

    test('should handle very long column definitions', () => {
      const longDefault =
        "default 'very long string value that spans many characters'";
      const input = `  column_name varchar(255) ${longDefault}`;
      const output = buildConvertedColumnLine(input);

      assert.ok(output);
      assert.ok(output.includes('id uuid'));
      assert.ok(output.includes(longDefault));
    });
  });
});
