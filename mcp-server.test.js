import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeHttpUrl } from './mcp-server.js';

test('isSafeHttpUrl', async (t) => {
  await t.test('should return true for valid http URLs', () => {
    assert.equal(isSafeHttpUrl('http://example.com'), true);
    assert.equal(isSafeHttpUrl('http://localhost:3000'), true);
  });

  await t.test('should return true for valid https URLs', () => {
    assert.equal(isSafeHttpUrl('https://example.com'), true);
    assert.equal(isSafeHttpUrl('https://google.com/path?query=1'), true);
  });

  await t.test('should return false for invalid protocols', () => {
    assert.equal(isSafeHttpUrl('ftp://example.com'), false);
    assert.equal(isSafeHttpUrl('file:///etc/passwd'), false);
    assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  });

  await t.test('should return false for malformed URLs and trigger the catch block', () => {
    // These will throw in the URL constructor
    assert.equal(isSafeHttpUrl('not-a-url'), false);
    assert.equal(isSafeHttpUrl('example.com'), false);
    assert.equal(isSafeHttpUrl(''), false);
    assert.equal(isSafeHttpUrl(null), false);
    assert.equal(isSafeHttpUrl(undefined), false);
    assert.equal(isSafeHttpUrl(123), false);
    assert.equal(isSafeHttpUrl({}), false);
  });
});
