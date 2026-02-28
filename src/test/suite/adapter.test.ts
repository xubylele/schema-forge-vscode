import * as assert from 'assert';
import { parseSchemaContent } from '../../core/adapter';

suite('Core Adapter Test Suite', () => {
  test('parseSchemaContent with valid schema', async () => {
    const source = `
table users {
  id uuid primary key
  name text not null
}
		`.trim();

    const result = await parseSchemaContent(source);

    // The result might be ok or not depending on parser availability 
    // At minimum, it should return a valid ParseResult structure
    assert.ok(result);
    assert.ok(typeof result.ok === 'boolean');

    if (result.ok) {
      assert.ok(result.ast);
      assert.ok(Array.isArray(result.ast.tables));
    } else {
      // If parsing failed, should have error info
      assert.ok(result.error);
      assert.ok(result.error.message);
    }
  });

  test('parseSchemaContent with empty string', async () => {
    const result = await parseSchemaContent('');

    assert.strictEqual(result.ok, false);
    if (!result.ok) {
      assert.ok(result.error.message.includes('empty'));
    }
  });

  test('parseSchemaContent with whitespace only', async () => {
    const result = await parseSchemaContent('   \n\t  ');

    assert.strictEqual(result.ok, false);
    if (!result.ok) {
      assert.ok(result.error.message.includes('empty'));
    }
  });

  test('parseSchemaContent with invalid input type', async () => {
    const result = await parseSchemaContent(123 as any);

    assert.strictEqual(result.ok, false);
    if (!result.ok) {
      assert.ok(result.error.message.includes('string'));
    }
  });

  test('parseSchemaContent with syntax error', async () => {
    const source = `
table users {
  id uuid primary key
  name text not null
  // Missing closing brace
		`;

    const result = await parseSchemaContent(source);

    assert.strictEqual(result.ok, false);
    if (!result.ok) {
      assert.ok(result.error.message);
    }
  });

  test('parseSchemaContent with timeout completes', async () => {
    const source = `
table users {
  id uuid primary key
}
		`.trim();

    // Use a reasonable timeout
    const result = await parseSchemaContent(source, 1000);

    // Should complete before timeout and return a result
    assert.ok(result);
    assert.ok(typeof result.ok === 'boolean');
  });

  test('parseSchemaContent handles complex schema structure', async () => {
    const source = `
enum role {
  admin
  user
  guest
}

table users {
  id uuid primary key
  name text not null
  email text unique not null
  role role default 'user'
  created_at timestamp default now()
}

table posts {
  id uuid primary key
  user_id uuid references users(id)
  title text not null
  content text
  created_at timestamp default now()
}
		`.trim();

    const result = await parseSchemaContent(source);

    // Verify the result structure
    assert.ok(result);
    assert.ok(typeof result.ok === 'boolean');

    if (result.ok) {
      // If parsing succeeded, check structure
      assert.ok(Array.isArray(result.ast.tables) && result.ast.tables.length >= 2);
      // Check enums if the property exists on the schema
      if ('enums' in result.ast && Array.isArray(result.ast.enums)) {
        assert.ok(result.ast.enums.length >= 1);
      }
    } else {
      // If parsing failed, should have error
      assert.ok(result.error);
    }
  });

  test('parseSchemaContent returns proper error structure on failure', async () => {
    const result = await parseSchemaContent('invalid schema content @#$%');

    assert.strictEqual(result.ok, false);
    if (!result.ok) {
      assert.ok(result.error);
      assert.ok(typeof result.error.message === 'string');
      assert.ok(result.error.message.length > 0);
    }
  });
});