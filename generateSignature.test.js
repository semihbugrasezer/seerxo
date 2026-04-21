import { jest } from '@jest/globals';
import { generateSignature, setRuntimeConfig } from './mcp-server.js';
import crypto from 'node:crypto';

describe('generateSignature', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should generate signature correctly', () => {
    setRuntimeConfig({ apiKey: 'someKeyId.someSecretKey' });
    const payload = { test: 'data' };

    const { signature, timestamp } = generateSignature(payload);

    const expectedTimestamp = Date.now().toString();
    const message = JSON.stringify(payload) + expectedTimestamp;
    const expectedSignature = crypto
      .createHmac('sha256', 'someSecretKey')
      .update(message)
      .digest('hex');

    expect(timestamp).toBe(expectedTimestamp);
    expect(signature).toBe(expectedSignature);
  });

  it('should handle missing apiKeySecret', () => {
    setRuntimeConfig({ apiKey: 'invalid_format' });
    const payload = { test: 'data' };

    const { signature, timestamp } = generateSignature(payload);

    const expectedTimestamp = Date.now().toString();
    const message = JSON.stringify(payload) + expectedTimestamp;
    const expectedSignature = crypto
      .createHmac('sha256', '')
      .update(message)
      .digest('hex');

    expect(timestamp).toBe(expectedTimestamp);
    expect(signature).toBe(expectedSignature);
  });
});
