import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiKeyState } from './mcp-server.js';

test('resolveApiKeyState handles valid inputs', () => {
  const result = resolveApiKeyState('keyid.1234567890123456');
  assert.equal(result.isValid, true);
  assert.equal(result.secret, '1234567890123456');
  assert.equal(result.header, 'keyid.1234567890123456');
  assert.deepEqual(result.parts, ['keyid', '1234567890123456']);
});

test('resolveApiKeyState handles valid inputs with leading/trailing spaces', () => {
  const result = resolveApiKeyState('  keyid.1234567890123456  ');
  assert.equal(result.isValid, true);
  assert.equal(result.secret, '1234567890123456');
  assert.equal(result.header, 'keyid.1234567890123456');
  assert.deepEqual(result.parts, ['keyid', '1234567890123456']);
});

test('resolveApiKeyState handles short secret length', () => {
  const result = resolveApiKeyState('keyid.short');
  assert.equal(result.isValid, false);
  assert.equal(result.secret, null);
  assert.equal(result.header, null);
  assert.deepEqual(result.parts, ['keyid', 'short']);
});

test('resolveApiKeyState handles missing parts', () => {
  const result = resolveApiKeyState('keyid');
  assert.equal(result.isValid, false);
  assert.equal(result.secret, null);
  assert.equal(result.header, null);
  assert.deepEqual(result.parts, ['keyid']);
});

test('resolveApiKeyState handles non-string inputs', () => {
  const result = resolveApiKeyState(null);
  assert.equal(result.isValid, false);
  assert.equal(result.secret, null);
  assert.equal(result.header, null);
  assert.deepEqual(result.parts, []);
});

test('resolveApiKeyState handles empty string', () => {
  const result = resolveApiKeyState('');
  assert.equal(result.isValid, false);
  assert.equal(result.secret, null);
  assert.equal(result.header, null);
  assert.deepEqual(result.parts, []);
});

test('resolveApiKeyState handles missing secret', () => {
  const result = resolveApiKeyState('keyid.');
  assert.equal(result.isValid, false);
  assert.equal(result.secret, null);
  assert.equal(result.header, null);
  assert.deepEqual(result.parts, ['keyid', '']);
});

test('resolveApiKeyState handles missing keyid', () => {
  const result = resolveApiKeyState('.1234567890123456');
  assert.equal(result.isValid, false);
  assert.equal(result.secret, null);
  assert.equal(result.header, null);
  assert.deepEqual(result.parts, ['', '1234567890123456']);
});

test('resolveApiKeyState handles multiple dots', () => {
  const result = resolveApiKeyState('keyid.1234567890123456.extra');
  assert.equal(result.isValid, false);
  assert.equal(result.secret, null);
  assert.equal(result.header, null);
  assert.deepEqual(result.parts, ['keyid', '1234567890123456', 'extra']);
});
