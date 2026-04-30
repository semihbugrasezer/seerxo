import { test } from 'node:test';
import assert from 'node:assert';
import { normalizeHost, DEFAULT_HOST } from './utils.js';

test('normalizeHost', async (t) => {
  await t.test('removes trailing slash', () => {
    assert.strictEqual(normalizeHost('https://api.example.com/'), 'https://api.example.com');
  });

  await t.test('does not remove slash if not at the end', () => {
    assert.strictEqual(normalizeHost('https://api.example.com/v1'), 'https://api.example.com/v1');
  });

  await t.test('returns value if no trailing slash', () => {
    assert.strictEqual(normalizeHost('https://api.example.com'), 'https://api.example.com');
  });

  await t.test('allows http localhost URLs', () => {
    assert.strictEqual(normalizeHost('http://localhost:3000'), 'http://localhost:3000');
  });

  await t.test('removes query strings and hashes', () => {
    assert.strictEqual(
      normalizeHost('https://api.example.com/v1?token=secret#frag'),
      'https://api.example.com/v1'
    );
  });

  await t.test('rejects non-http protocols', () => {
    assert.strictEqual(normalizeHost('file:///etc/passwd'), DEFAULT_HOST);
    assert.strictEqual(normalizeHost('javascript:alert(1)'), DEFAULT_HOST);
  });

  await t.test('rejects URLs with embedded credentials', () => {
    assert.strictEqual(normalizeHost('https://user:pass@api.example.com'), DEFAULT_HOST);
  });

  await t.test('returns DEFAULT_HOST for invalid URLs', () => {
    assert.strictEqual(normalizeHost('api.example.com'), DEFAULT_HOST);
  });

  await t.test('returns DEFAULT_HOST for empty string', () => {
    assert.strictEqual(normalizeHost(''), DEFAULT_HOST);
  });

  await t.test('returns DEFAULT_HOST for null', () => {
    assert.strictEqual(normalizeHost(null), DEFAULT_HOST);
  });

  await t.test('returns DEFAULT_HOST for undefined', () => {
    assert.strictEqual(normalizeHost(undefined), DEFAULT_HOST);
  });
});
