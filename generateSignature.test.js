import test, { afterEach, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { generateSignature, setRuntimeConfig } from './mcp-server.js';
import crypto from 'node:crypto';

const FIXED_DATE = new Date('2024-01-01T00:00:00.000Z');
let dateNowMock;

beforeEach(() => {
  dateNowMock = mock.method(Date, 'now', () => FIXED_DATE.getTime());
});

afterEach(() => {
  dateNowMock?.mock?.restore();
});

test('generateSignature generates signature correctly', () => {
  setRuntimeConfig({ apiKey: 'someKeyId.someSecretKey123' });
  const payload = { test: 'data' };

  const { signature, timestamp } = generateSignature(payload);

  const expectedTimestamp = Date.now().toString();
  const message = JSON.stringify(payload) + expectedTimestamp;
  const expectedSignature = crypto
    .createHmac('sha256', 'someSecretKey123')
    .update(message)
    .digest('hex');

  assert.strictEqual(timestamp, expectedTimestamp);
  assert.strictEqual(signature, expectedSignature);
});

test('generateSignature falls back to empty secret for invalid api keys', () => {
  setRuntimeConfig({ apiKey: 'valid.key' });
  const payload = { test: 'data' };

  const { signature, timestamp } = generateSignature(payload);

  const expectedTimestamp = Date.now().toString();
  const message = JSON.stringify(payload) + expectedTimestamp;
  const expectedSignature = crypto
    .createHmac('sha256', '')
    .update(message)
    .digest('hex');

  assert.strictEqual(timestamp, expectedTimestamp);
  assert.strictEqual(signature, expectedSignature);
});
