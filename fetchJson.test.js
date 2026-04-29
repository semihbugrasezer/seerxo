import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchJson } from './mcp-server.js';

test('fetchJson', async (t) => {
  const originalFetch = global.fetch;

  t.afterEach(() => {
    global.fetch = originalFetch;
  });

  await t.test('returns data on successful response', async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ success: true, data: 'test' }),
    });

    const result = await fetchJson('http://example.com');
    assert.deepEqual(result, { success: true, data: 'test' });
  });

  await t.test('returns empty object if no data on successful response', async () => {
    global.fetch = async () => ({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); },
    });

    const result = await fetchJson('http://example.com');
    assert.deepEqual(result, {});
  });

  await t.test('throws error with data.error on non-ok response', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad Request Error' }),
    });

    await assert.rejects(
      () => fetchJson('http://example.com'),
      (err) => {
        assert.strictEqual(err.message, 'Bad Request Error');
        assert.strictEqual(err.status, 400);
        assert.deepEqual(err.payload, { error: 'Bad Request Error' });
        return true;
      }
    );
  });

  await t.test('throws error with data.message on non-ok response', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized Access' }),
    });

    await assert.rejects(
      () => fetchJson('http://example.com'),
      (err) => {
        assert.strictEqual(err.message, 'Unauthorized Access');
        assert.strictEqual(err.status, 401);
        assert.deepEqual(err.payload, { message: 'Unauthorized Access' });
        return true;
      }
    );
  });

  await t.test('throws default error message on non-ok response with invalid JSON', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Invalid JSON'); },
    });

    await assert.rejects(
      () => fetchJson('http://example.com'),
      (err) => {
        assert.strictEqual(err.message, 'Request failed (500)');
        assert.strictEqual(err.status, 500);
        assert.strictEqual(err.payload, null);
        return true;
      }
    );
  });
});
