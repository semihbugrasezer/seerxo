import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const runCli = (args, env) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['bin/seerxo.js', ...args], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, NODE_ENV: 'development', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.once('error', reject);
  child.once('exit', (code) => resolve({ code, stdout, stderr }));
});

const listen = async (handler) => {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
};

describe('CLI login polling', () => {
  it('stores approved credentials with restrictive local config flow', async () => {
    let polls = 0;
    let baseUrl;
    const { server, baseUrl: listeningUrl } = await listen((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      if (req.method === 'POST' && req.url === '/auth/mcp/login') {
        res.end(JSON.stringify({
          requestId: 'login-success',
          pollToken: 'poll-secret',
          approvalUrl: `${baseUrl}/approve`,
          expiresAt: new Date(Date.now() + 5000).toISOString(),
        }));
        return;
      }
      if (req.url === '/auth/mcp/login/login-success?token=poll-secret') {
        polls += 1;
        res.end(JSON.stringify(polls === 1
          ? { status: 'pending' }
          : {
            status: 'approved',
            email: 'login@seerxo.test',
            apiKey: 'approved-key.0123456789abcdef',
            host: baseUrl,
          }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    });
    baseUrl = listeningUrl;
    const configDir = await mkdtemp(path.join(os.tmpdir(), 'seerxo-login-success-'));

    try {
      const result = await runCli([
        'login',
        '--email', 'login@seerxo.test',
        '--host', baseUrl,
        '--interval', '1',
      ], {
        SEERXO_CONFIG_DIR: configDir,
        SEERXO_DISABLE_BROWSER: '1',
      });

      assert.equal(result.code, 0, result.stderr);
      assert.match(result.stdout, /Login approved/);
      const saved = JSON.parse(await readFile(path.join(configDir, 'config.json'), 'utf8'));
      assert.deepEqual(saved, {
        email: 'login@seerxo.test',
        apiKey: 'approved-key.0123456789abcdef',
        host: baseUrl,
      });
    } finally {
      await new Promise((resolve) => server.close(resolve));
      await rm(configDir, { recursive: true, force: true });
    }
  });

  it('exits non-zero when approval polling expires', async () => {
    let baseUrl;
    const { server, baseUrl: listeningUrl } = await listen((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      if (req.method === 'POST' && req.url === '/auth/mcp/login') {
        res.end(JSON.stringify({
          requestId: 'login-timeout',
          pollToken: 'poll-secret',
          approvalUrl: `${baseUrl}/approve`,
          expiresAt: new Date(Date.now() + 20).toISOString(),
        }));
        return;
      }
      res.end(JSON.stringify({ status: 'pending' }));
    });
    baseUrl = listeningUrl;
    const configDir = await mkdtemp(path.join(os.tmpdir(), 'seerxo-login-timeout-'));

    try {
      const result = await runCli([
        'login',
        '--email', 'timeout@seerxo.test',
        '--host', baseUrl,
        '--interval', '2',
      ], {
        SEERXO_CONFIG_DIR: configDir,
        SEERXO_DISABLE_BROWSER: '1',
      });

      assert.equal(result.code, 1);
      assert.match(result.stderr, /Timed out waiting for approval/);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      await rm(configDir, { recursive: true, force: true });
    }
  });
});
