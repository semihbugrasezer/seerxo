import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

describe('stdio MCP process', () => {
  let apiServer;
  let apiBase;
  let configDir;
  let generationFixture;

  before(async () => {
    generationFixture = JSON.parse(await readFile(
      new URL('./fixtures/generation-success.json', import.meta.url),
      'utf8'
    ));
    configDir = await mkdtemp(path.join(os.tmpdir(), 'seerxo-stdio-'));
    await mkdir(configDir, { recursive: true });
    await writeFile(path.join(configDir, 'config.json'), JSON.stringify({
      email: 'stdio@seerxo.test',
      apiKey: 'fixture-key.0123456789abcdef',
    }));

    apiServer = createServer(async (req, res) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const body = Buffer.concat(chunks).toString() || '{}';
      const timestamp = req.headers['x-mcp-timestamp'];
      const expected = crypto
        .createHmac('sha256', '0123456789abcdef')
        .update(body)
        .update(timestamp)
        .digest('hex');

      assert.equal(req.headers['x-mcp-signature'], expected);
      assert.equal(req.headers['x-mcp-api-key'], 'fixture-key.0123456789abcdef');

      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/v1/generate') {
        res.end(JSON.stringify(generationFixture));
        return;
      }
      if (req.url === '/mcp/quota') {
        res.end(JSON.stringify({
          success: true,
          quota: {
            current: 1,
            ...generationFixture.usage,
          },
          upgrade: null,
        }));
        return;
      }
      res.statusCode = 404;
      res.end(JSON.stringify({ success: false, error: 'Not found' }));
    });
    await new Promise((resolve) => apiServer.listen(0, '127.0.0.1', resolve));
    const address = apiServer.address();
    apiBase = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise((resolve) => apiServer.close(resolve));
    await rm(configDir, { recursive: true, force: true });
  });

  it('negotiates, lists parity tools, calls tools, and keeps stdout JSON-only', async () => {
    const child = spawn(process.execPath, ['bin/seerxo.js'], {
      cwd: new URL('..', import.meta.url),
      env: {
        ...process.env,
        NODE_ENV: 'development',
        SEERXO_CONFIG_DIR: configDir,
        SEERXO_HOST: apiBase,
        SEERXO_MCP: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const stdoutLines = [];
    const pending = new Map();
    let stdoutBuffer = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk;
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        stdoutLines.push(line);
        const message = JSON.parse(line);
        pending.get(message.id)?.(message);
        pending.delete(message.id);
      }
    });

    const request = (message) => new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timed out waiting for MCP response ${message.id}`)), 5000);
      pending.set(message.id, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });
      child.stdin.write(`${JSON.stringify(message)}\n`);
    });

    const initialized = await request({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'seerxo-test', version: '1.0.0' },
      },
    });
    assert.equal(initialized.result.protocolVersion, '2025-11-25');

    child.stdin.write(`${JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    })}\n`);

    const listed = await request({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    assert.deepEqual(listed.result.tools.map((tool) => tool.name).sort(), [
      'generate_etsy_seo',
      'seerxo_analyze_listing',
      'seerxo_optimize_listing',
      'seerxo_quota',
      'seerxo_suggest_keywords',
    ]);

    const generated = await request({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'generate_etsy_seo',
        arguments: {
          product_name: 'Handmade ceramic coffee mug',
          category: 'Home & Living',
        },
      },
    });
    assert.equal(generated.result.structuredContent.title, generationFixture.data.title);
    assert.equal(generated.result.structuredContent.tags.length, 13);

    const quota = await request({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'seerxo_quota', arguments: {} },
    });
    assert.equal(quota.result.structuredContent.remaining, 9);

    child.stdin.end();
    await new Promise((resolve, reject) => {
      child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`MCP process exited ${code}: ${stderr}`)));
      child.once('error', reject);
    });

    assert.ok(stderr.includes('Seerxo MCP Server started'));
    for (const line of stdoutLines) {
      assert.doesNotThrow(() => JSON.parse(line));
    }
  });
});
