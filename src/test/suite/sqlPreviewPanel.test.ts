import * as assert from 'assert';
import { buildSqlPreviewResult, escapeHtml } from '../../ui/sqlPreviewPanel';

suite('SQL Preview Panel Utilities', () => {
  test('escapeHtml escapes special HTML characters', () => {
    const input = `<script>alert("xss")</script> & 'quoted'`;
    const escaped = escapeHtml(input);

    assert.strictEqual(
      escaped,
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;quoted&#39;'
    );
  });

  test('buildSqlPreviewResult does not truncate short text', () => {
    const sql = 'SELECT 1;';
    const result = buildSqlPreviewResult(sql, 100);

    assert.strictEqual(result.isTruncated, false);
    assert.strictEqual(result.totalChars, sql.length);
    assert.strictEqual(result.shownChars, sql.length);
    assert.strictEqual(result.displaySql, sql);
  });

  test('buildSqlPreviewResult truncates large text at limit', () => {
    const sql = 'A'.repeat(200);
    const result = buildSqlPreviewResult(sql, 50);

    assert.strictEqual(result.isTruncated, true);
    assert.strictEqual(result.totalChars, 200);
    assert.strictEqual(result.shownChars, 50);
    assert.strictEqual(result.displaySql.length, 50);
    assert.strictEqual(result.displaySql, 'A'.repeat(50));
  });
});
