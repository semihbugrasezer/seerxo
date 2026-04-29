import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, 'mcp-server.js');

test('mcp-server prints version with --version', () => {
  const output = execFileSync('node', [cliPath, '--version'], {
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'cli-test' },
  });
  assert.match(output.trim(), /^\d+\.\d+\.\d+$/);
});

test('mcp-server prints help with --help', () => {
  const output = execFileSync('node', [cliPath, '--help'], {
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'cli-test' },
  });
  assert.match(output, /Commands:/);
  assert.match(output, /seerxo login/);
  assert.match(output, /seerxo generate/);
});

test('mcp-server prints status with configured credentials', () => {
  const output = execFileSync('node', [cliPath, 'status'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'cli-test',
      SEERXO_EMAIL: 'semih@example.com',
      SEERXO_API_KEY:
        'keyid.someVeryLongSecret1234567890',
      SEERXO_HOST: 'https://api.seerxo.com',
    },
  });
  assert.match(output, /Status:/);
  assert.match(output, /semih@example.com/);
  assert.match(output, /https:\/\/api\.seerxo\.com/);
  assert.match(output, /configured/);
});

test('mcp-server requires arguments for generate', () => {
  assert.throws(
    () => execFileSync('node', [cliPath, 'generate'], {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'cli-test' },
    }),
    (err) => {
      assert.strictEqual(err.status, 1);
      assert.match(err.stderr, /Missing argument: --product "Product name"/);
      return true;
    }
  );
});

test('mcp-server prints error for unknown commands', () => {
  assert.throws(
    () => execFileSync('node', [cliPath, 'unknown-command'], {
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'cli-test' },
    }),
    (err) => {
      assert.strictEqual(err.status, 1);
      assert.match(err.stderr, /Unknown command: unknown-command/);
      return true;
    }
  );
});

// buildQuotaSummary tests
import { buildQuotaSummary } from './mcp-server.js';

test('buildQuotaSummary returns correct summary for unlimited usage (empty object)', () => {
  const summary = buildQuotaSummary({});
  assert.deepEqual(summary, {
    headline: 'Unlimited credits',
    detail: '0 used',
    tone: 'success'
  });
});

test('buildQuotaSummary returns correct summary for usage with finite limit and remaining > 2', () => {
  const summary = buildQuotaSummary({ limit: 100, remaining: 50, used: 50 });
  assert.deepEqual(summary, {
    headline: '50 credits left',
    detail: '50/100 used',
    tone: 'info'
  });
});

test('buildQuotaSummary returns correct summary for usage with finite limit and remaining <= 2', () => {
  const summary = buildQuotaSummary({ limit: 100, remaining: 2, used: 98 });
  assert.deepEqual(summary, {
    headline: '2 credits left',
    detail: '98/100 used',
    tone: 'warning'
  });
});

test('buildQuotaSummary returns correct summary for usage with finite limit and 0 remaining', () => {
  const summary = buildQuotaSummary({ limit: 100, remaining: 0, used: 100 });
  assert.deepEqual(summary, {
    headline: 'No credits left',
    detail: '100/100 used',
    tone: 'danger'
  });
});

test('buildQuotaSummary handles usage with "current" instead of "used"', () => {
  const summary = buildQuotaSummary({ limit: 50, remaining: 10, current: 40 });
  assert.deepEqual(summary, {
    headline: '10 credits left',
    detail: '40/50 used',
    tone: 'info'
  });
});

test('buildQuotaSummary calculates used if current/used are missing', () => {
  const summary = buildQuotaSummary({ limit: 50, remaining: 10 });
  assert.deepEqual(summary, {
    headline: '10 credits left',
    detail: '40/50 used',
    tone: 'info'
  });
});

test('buildQuotaSummary handles invalid limit/remaining values gracefully', () => {
  const summary = buildQuotaSummary({ limit: 'invalid', remaining: 'invalid' });
  assert.deepEqual(summary, {
    headline: 'Unlimited credits',
    detail: '0 used',
    tone: 'success'
  });
});

test('buildQuotaSummary handles negative remaining/used values gracefully', () => {
  const summary = buildQuotaSummary({ limit: 50, remaining: -10, used: -5 });
  assert.deepEqual(summary, {
    headline: 'No credits left',
    detail: '0/50 used',
    tone: 'danger'
  });
});

test('buildQuotaSummary handles string numbers', () => {
  const summary = buildQuotaSummary({ limit: '100', remaining: '20', used: '80' });
  assert.deepEqual(summary, {
    headline: '20 credits left',
    detail: '80/100 used',
    tone: 'info'
  });
});
