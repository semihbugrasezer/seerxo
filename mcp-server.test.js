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
