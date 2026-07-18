import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_HOST, normalizeHost } from '../utils.js';

test('normalizeHost uses the default for empty or invalid values', () => {
  for (const value of [undefined, null, '', 0, 'not a url', 'http://']) {
    assert.equal(normalizeHost(value), DEFAULT_HOST);
  }
});

test('normalizeHost accepts HTTP URLs and removes trailing metadata', () => {
  const cases = [
    ['http://example.com', 'http://example.com'],
    ['https://example.com/', 'https://example.com'],
    ['  https://example.com/api/  ', 'https://example.com/api'],
    ['https://example.com?query=1', 'https://example.com'],
    ['https://example.com#hash', 'https://example.com'],
    ['https://example.com/api/?query=1#hash', 'https://example.com/api'],
  ];

  for (const [input, expected] of cases) {
    assert.equal(normalizeHost(input), expected);
  }
});

test('normalizeHost rejects unsupported protocols and credentials', () => {
  for (const value of [
    'ftp://example.com',
    'ws://example.com',
    'file:///tmp/file',
    'https://user:pass@example.com',
    'http://user@example.com',
  ]) {
    assert.equal(normalizeHost(value), DEFAULT_HOST);
  }
});
