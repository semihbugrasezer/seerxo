import { test } from 'node:test';
import assert from 'node:assert';
import { getFlagValue } from './mcp-server.js';

test('getFlagValue returns value when flag is present and followed by a valid value', () => {
  const list = ['--foo', 'bar'];
  assert.strictEqual(getFlagValue('foo', list), 'bar');
});

test('getFlagValue returns null when flag is missing', () => {
  const list = ['--bar', 'baz'];
  assert.strictEqual(getFlagValue('foo', list), null);
});

test('getFlagValue returns null when flag is the last item', () => {
  const list = ['--foo'];
  assert.strictEqual(getFlagValue('foo', list), null);
});

test('getFlagValue returns null when value starts with --', () => {
  const list = ['--foo', '--bar'];
  assert.strictEqual(getFlagValue('foo', list), null);
});

test('getFlagValue returns null with an empty list', () => {
  const list = [];
  assert.strictEqual(getFlagValue('foo', list), null);
});

test('getFlagValue returns null when list is not provided (tests default argument)', () => {
  assert.strictEqual(getFlagValue('foo'), null);
});
