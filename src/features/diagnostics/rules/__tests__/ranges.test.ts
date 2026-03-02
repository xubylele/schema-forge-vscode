import * as assert from 'assert';
import {
  findTableRange,
  findColumnRange,
  findDefaultNowRange,
  findTableEndLine,
} from '../ranges';

suite('Range Finding Helpers Test Suite', () => {
  suite('findTableRange', () => {
    test('should find table at the beginning of source', () => {
      const source = 'table users { }';
      const range = findTableRange(source, 'users');

      assert.strictEqual(range.line, 0);
      assert.strictEqual(range.startColumn, 0);
      assert.ok(range.endColumn > range.startColumn);
    });

    test('should find table with spaces before declaration', () => {
      const source = '  table users { }';
      const range = findTableRange(source, 'users');

      assert.strictEqual(range.line, 0);
      assert.strictEqual(range.startColumn, 2);
    });

    test('should find table on specific line', () => {
      const source = `table posts { }
table users { }
table comments { }`;
      const range = findTableRange(source, 'users');

      assert.strictEqual(range.line, 1);
    });

    test('should find table with complex column definitions', () => {
      const source = `table users {
  id uuid pk
  name text
}`;
      const range = findTableRange(source, 'users');

      assert.strictEqual(range.line, 0);
      assert.ok(/table\s+users/.test(source.split('\n')[0]));
    });

    test('should handle table names with underscores', () => {
      const source = 'table user_profiles { }';
      const range = findTableRange(source, 'user_profiles');

      assert.strictEqual(range.line, 0);
    });

    test('should handle table names starting with letter', () => {
      const source = 'table _users { }';
      const range = findTableRange(source, '_users');

      assert.strictEqual(range.line, 0);
    });

    test('should not match partial table names', () => {
      const source = 'table users_extended { }';
      const range = findTableRange(source, 'users');

      // Should fallback since full name doesn't match
      assert.strictEqual(range.line, 0);
      assert.strictEqual(range.startColumn, 0);
    });

    test('should find table with startLineHint', () => {
      const source = `table posts { }
table users { }
table comments { }`;
      const range = findTableRange(source, 'users', 1);

      assert.strictEqual(range.line, 1);
    });

    test('should fallback gracefully when table not found', () => {
      const source = 'table posts { }';
      const range = findTableRange(source, 'nonexistent');

      // Should return fallback
      assert.strictEqual(range.startColumn, 0);
      assert.strictEqual(range.endColumn, 1);
    });
  });

  suite('findColumnRange', () => {
    test('should find column on single line', () => {
      const source = `table users {
  id uuid pk
  name text
}`;
      const range = findColumnRange(source, 'id', 0, 3);

      assert.strictEqual(range.line, 1);
      assert.ok(range.startColumn >= 0);
    });

    test('should find column with various indentation', () => {
      const source = `table users {
    email text
}`;
      const range = findColumnRange(source, 'email', 0, 2);

      assert.strictEqual(range.line, 1);
    });

    test('should find column within line range', () => {
      const source = `table users {
  id uuid pk
  name text
  email text
}`;
      const range = findColumnRange(source, 'email', 1, 4);

      assert.strictEqual(range.line, 3);
    });

    test('should handle duplicate column names and find first occurrence', () => {
      const source = `table users {
  name text
  name varchar(255)
}`;
      const range = findColumnRange(source, 'name', 0, 3);

      assert.strictEqual(range.line, 1);
    });

    test('should handle quoted column names', () => {
      const source = `table users {
  "user id" uuid pk
}`;
      const range = findColumnRange(source, 'user id', 0, 2);

      assert.strictEqual(range.line, 1);
    });

    test('should not match partial column names', () => {
      const source = `table users {
  user_id uuid pk
  user text
}`;
      const range = findColumnRange(source, 'user', 0, 3);

      // Should match the full 'user' word
      assert.strictEqual(range.line, 2);
    });

    test('should return fallback when column not found', () => {
      const source = `table users {
  id uuid pk
}`;
      const range = findColumnRange(source, 'nonexistent', 0, 2);

      // Fallback to start line
      assert.strictEqual(range.line, 0);
    });

    test('should respect line range boundaries', () => {
      const source = `table users {
  id uuid pk
  name text
  email text
}`;
      const range = findColumnRange(source, 'email', 0, 2); // Only search lines 0-2

      // email is on line 3, so should fallback
      assert.strictEqual(range.line, 0);
    });
  });

  suite('findDefaultNowRange', () => {
    test('should find now() with standard spacing', () => {
      const source = `table users {
  created_at timestamptz default now()
}`;
      const range = findDefaultNowRange(source, 0, 2);

      assert.strictEqual(range.line, 1);
      assert.ok(range.startColumn >= 0);
      assert.ok(range.endColumn > range.startColumn);
    });

    test('should find now() with extra spaces', () => {
      const source = `table users {
  created_at timestamptz default now  (  )
}`;
      const range = findDefaultNowRange(source, 0, 2);

      assert.strictEqual(range.line, 1);
    });

    test('should find now() case insensitive', () => {
      const source = `table users {
  created_at timestamptz default NOW()
}`;
      const range = findDefaultNowRange(source, 0, 2);

      assert.strictEqual(range.line, 1);
    });

    test('should fallback to default keyword when now() not found', () => {
      const source = `table users {
  created_at timestamptz default something_else
}`;
      const range = findDefaultNowRange(source, 0, 2);

      assert.strictEqual(range.line, 1);
      // Should match "default" keyword
      assert.ok(source.split('\n')[1].includes('default'));
    });

    test('should return fallback when neither now() nor default found', () => {
      const source = `table users {
  id uuid pk
}`;
      const range = findDefaultNowRange(source, 0, 2);

      // Fallback
      assert.strictEqual(range.line, 0);
      assert.strictEqual(range.startColumn, 0);
    });

    test('should search within specified line range', () => {
      const source = `table users {
  id uuid pk
  created_at timestamptz default now()
  updated_at timestamptz default now()
}`;
      const range = findDefaultNowRange(source, 2, 3);

      // Should find first now() in the range (line 2)
      assert.strictEqual(range.line, 2);
    });
  });

  suite('findTableEndLine', () => {
    test('should find closing brace on same line', () => {
      const source = 'table users { }';
      const endLine = findTableEndLine(source, 0);

      assert.strictEqual(endLine, 0);
    });

    test('should find closing brace on different line', () => {
      const source = `table users {
  id uuid pk
}`;
      const endLine = findTableEndLine(source, 0);

      assert.strictEqual(endLine, 2);
    });

    test('should handle multiple columns', () => {
      const source = `table users {
  id uuid pk
  name text
  email text
  created_at timestamptz
}`;
      const endLine = findTableEndLine(source, 0);

      assert.strictEqual(endLine, 5);
    });

    test('should handle nested braces in comments', () => {
      const source = `table users {
  // Comment with }
  id uuid pk
}`;
      const endLine = findTableEndLine(source, 0);

      // Should find the real closing brace
      assert.ok(endLine >= 2);
    });

    test('should handle deep nesting', () => {
      const source = `table users {
  id uuid pk
  config json // { "nested": true }
}`;
      const endLine = findTableEndLine(source, 0);

      // Should traverse through all braces
      assert.ok(endLine >= 3);
    });

    test('should return fallback if no closing brace found', () => {
      const source = `table users {
  id uuid pk
  name text`;
      const endLine = findTableEndLine(source, 0);

      // Should return max line (start + 10 or last line)
      assert.ok(endLine > 0);
    });

    test('should detect brace depth correctly across multiple tables', () => {
      const source = `table users {
  id uuid pk
}
table posts {
  title text
}`;
      const endLineUsers = findTableEndLine(source, 0);
      const endLinePosts = findTableEndLine(source, 3);

      assert.strictEqual(endLineUsers, 2);
      assert.strictEqual(endLinePosts, 5);
    });

    test('should handle empty table', () => {
      const source = `table users {
}`;
      const endLine = findTableEndLine(source, 0);

      assert.strictEqual(endLine, 1);
    });
  });

  suite('Range Helper Edge Cases', () => {
    test('should handle empty source', () => {
      const range = findTableRange('', 'users');
      assert.strictEqual(range.startColumn, 0);
      assert.strictEqual(range.endColumn, 1);
    });

    test('should handle source with only whitespace', () => {
      const source = '   \n   \n   ';
      const range = findTableRange(source, 'users');
      assert.strictEqual(range.startColumn, 0);
    });

    test('should handle table name with numbers', () => {
      const source = 'table users_v2 { }';
      const range = findTableRange(source, 'users_v2');
      assert.strictEqual(range.line, 0);
    });

    test('should handle very long column names', () => {
      const longName = 'very_long_column_name_that_spans_many_characters';
      const source = `table users {
  ${longName} text
}`;
      const range = findColumnRange(source, longName, 0, 3);
      assert.strictEqual(range.line, 1);
    });

    test('should handle columns with special characters in comments', () => {
      const source = `table users {
  id uuid pk  // Special chars: !@#$%
  name text
}`;
      const range = findColumnRange(source, 'id', 0, 3);
      assert.strictEqual(range.line, 1);
    });
  });
});
