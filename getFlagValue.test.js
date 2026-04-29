import test from 'node:test';
import assert from 'node:assert/strict';
import { getFlagValue } from './mcp-server.js';

test('getFlagValue returns value when flag exists with valid value', () => {
  const list = ['--email', 'test@example.com', '--host', 'localhost'];
  assert.strictEqual(getFlagValue('email', list), 'test@example.com');
  assert.strictEqual(getFlagValue('host', list), 'localhost');
});

test('getFlagValue returns null when flag is at the end of the list', () => {
  const list = ['--email', 'test@example.com', '--host'];
  assert.strictEqual(getFlagValue('host', list), null);
});

test('getFlagValue returns null when flag is followed by another flag', () => {
  const list = ['--email', '--host', 'localhost'];
  assert.strictEqual(getFlagValue('email', list), null);
});

test('getFlagValue returns null when flag does not exist', () => {
  const list = ['--email', 'test@example.com'];
  assert.strictEqual(getFlagValue('host', list), null);
});

test('getFlagValue returns null when list is empty', () => {
  assert.strictEqual(getFlagValue('email', []), null);
});

test('getFlagValue returns value of first occurrence when flag appears multiple times', () => {
  const list = ['--email', 'first@example.com', '--email', 'second@example.com'];
  assert.strictEqual(getFlagValue('email', list), 'first@example.com');
});
