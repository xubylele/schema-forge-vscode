import * as assert from 'assert';
import type { Operation } from '@xubylele/schema-forge-core';
import { formatOperationForDisplay } from '../../ui/visualDiffPanel';

suite('Visual Diff Panel Formatting', () => {
  test('formats create_index operations', () => {
    const operation: Operation = {
      kind: 'create_index',
      tableName: 'users',
      index: {
        name: 'idx_users_email',
        table: 'users',
        columns: ['email'],
        unique: false,
      },
    };

    const line = formatOperationForDisplay(operation);
    assert.ok(line.includes('Add index'));
    assert.ok(line.includes('idx_users_email'));
    assert.ok(line.includes('users'));
  });

  test('formats replace_view operations', () => {
    const operation: Operation = {
      kind: 'replace_view',
      view: {
        name: 'active_users',
        query: 'select id from users',
        hash: 'h1',
      },
    };

    const line = formatOperationForDisplay(operation);
    assert.ok(line.includes('Replace view'));
    assert.ok(line.includes('active_users'));
  });
});
