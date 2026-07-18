import { describe, it } from 'node:test';
import assert from 'node:assert';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  MCP_TOOLS,
  LISTING_TOOLS,
  buildListingPayload,
  formatAnalyzeResult,
  formatOptimizeResult,
  formatKeywordsResult,
  fetchJson,
  generateSignature,
  getGenerateEndpoint,
  getRuntimeConfigState,
  handleCli,
  setRuntimeConfig,
} from '../mcp-server.js';

describe('listing tool definitions', () => {
  it('publishes output schemas and safety annotations for every MCP tool', () => {
    assert.deepStrictEqual(MCP_TOOLS.map((t) => t.name), [
      'generate_etsy_seo',
      'seerxo_suggest_keywords',
      'seerxo_analyze_listing',
      'seerxo_optimize_listing',
      'seerxo_quota',
    ]);
    for (const tool of MCP_TOOLS) {
      assert.strictEqual(tool.outputSchema.type, 'object', `${tool.name} output schema`);
      assert.ok(tool.outputSchema.required.length > 0, `${tool.name} required output fields`);
      assert.strictEqual(typeof tool.annotations.title, 'string', `${tool.name} annotation title`);
      for (const hint of ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint']) {
        assert.strictEqual(typeof tool.annotations[hint], 'boolean', `${tool.name} ${hint}`);
      }
    }
  });

  it('exposes the listing tools with agent-usable schemas', () => {
    const names = LISTING_TOOLS.map((t) => t.name);
    assert.deepStrictEqual(names, ['seerxo_suggest_keywords', 'seerxo_analyze_listing', 'seerxo_optimize_listing']);
    for (const tool of LISTING_TOOLS) {
      assert.ok(tool.description.length > 50, 'description should tell the agent when/how to call');
      assert.strictEqual(tool.inputSchema.type, 'object');
      for (const key of ['title', 'description', 'tags', 'product_name', 'url']) {
        assert.ok(tool.inputSchema.properties[key], `missing schema property ${key}`);
      }
    }
  });

  it('exposes a mode enum on seerxo_optimize_listing', () => {
    const optimizeTool = LISTING_TOOLS.find((t) => t.name === 'seerxo_optimize_listing');
    assert.deepStrictEqual(optimizeTool.inputSchema.properties.mode.enum, [
      'full',
      'title_only',
      'description_only',
      'tags_only',
    ]);
  });
});

describe('buildListingPayload', () => {
  it('maps tool args onto the /v1 request body', () => {
    assert.deepStrictEqual(
      buildListingPayload({
        product_name: 'ceramic mug',
        title: 'T',
        description: 'D',
        tags: ['a', 'b'],
        url: 'https://www.etsy.com/listing/1/x',
        junk: 'dropped',
      }),
      {
        productName: 'ceramic mug',
        title: 'T',
        description: 'D',
        tags: ['a', 'b'],
        url: 'https://www.etsy.com/listing/1/x',
      }
    );
  });

  it('omits missing fields instead of sending empties', () => {
    assert.deepStrictEqual(buildListingPayload({ title: 'T', tags: 'not-array' }), { title: 'T' });
  });
});

describe('versioned API contract', () => {
  it('uses the canonical generation endpoint', () => {
    setRuntimeConfig({ host: 'https://api.seerxo.com' });
    assert.strictEqual(getGenerateEndpoint(), 'https://api.seerxo.com/v1/generate');
  });

  it('matches the backend HMAC fixture byte-for-byte', async () => {
    const fixturePath = new URL('./fixtures/hmac-signature.json', import.meta.url);
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
    setRuntimeConfig({ apiKey: fixture.apiKey });

    assert.deepStrictEqual(generateSignature(fixture.payload, fixture.timestamp), {
      signature: fixture.signature,
      timestamp: fixture.timestamp,
    });
  });

  it('preserves backend correlation IDs on failed calls', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      headers: new Headers({ 'x-request-id': 'req-cli-fixture' }),
      json: async () => ({
        success: false,
        error: 'Internal server error',
        code: 'internal_error',
        requestId: 'req-cli-fixture',
      }),
    });

    try {
      await assert.rejects(fetchJson('https://api.seerxo.test/failure'), (error) => {
        assert.strictEqual(error.requestId, 'req-cli-fixture');
        assert.strictEqual(error.code, 'internal_error');
        assert.match(error.message, /request req-cli-fixture/);
        return true;
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('clears in-process credentials during logout', () => {
    setRuntimeConfig({ email: 'user@example.com', apiKey: 'fixture.0123456789abcdef' });
    assert.strictEqual(getRuntimeConfigState().hasValidApiKey, true);

    setRuntimeConfig({ email: null, apiKey: null });

    assert.deepStrictEqual(getRuntimeConfigState(), {
      email: null,
      host: 'https://api.seerxo.com',
      hasValidApiKey: false,
    });
  });
});

describe('formatters', () => {
  const audit = {
    seoScore: 62,
    subScores: { title: 80, tags: 40, description: 100, completeness: 66 },
    weakPoints: [
      { id: 'tags_count', field: 'tags', severity: 'high', reason: 'Exactly 13 tags', fix: 'Use all 13 tag slots.' },
    ],
    missingKeywords: ['12oz'],
    tagUtilization: { used: 7, max: 13, duplicates: ['mug'], tooBroad: ['mug'], overLong: [] },
  };

  it('renders an audit as readable markdown with score, fixes, and tag slots', () => {
    const text = formatAnalyzeResult(audit);
    assert.ok(text.includes('62/100'));
    assert.ok(text.includes('[high] (tags) Exactly 13 tags — fix: Use all 13 tag slots.'));
    assert.ok(text.includes('12oz'));
    assert.ok(text.includes('7/13 used'));
    assert.ok(text.includes('duplicates: mug'));
  });

  it('renders an optimize result with before/after and the rewritten fields', () => {
    const text = formatOptimizeResult({
      before: { seoScore: 40 },
      after: { seoScore: 95 },
      optimized: { title: 'New Title', description: 'New description.', tags: ['a b', 'c d'] },
      resolved: ['tags_count', 'desc_present'],
      unresolved: ['tags_multiword'],
      fallback: false,
    });
    assert.ok(text.includes('40 → 95'));
    assert.ok(text.includes('resolved 2 finding(s)'));
    assert.ok(text.includes('still open: tags_multiword'));
    assert.ok(text.includes('New Title'));
    assert.ok(text.includes('a b, c d'));
  });

  it('renders keyword suggestions with rank, placement, and confidence', () => {
    const text = formatKeywordsResult({
      seed: 'ceramic mug',
      confidence: 'medium',
      keywords: [
        { keyword: 'ceramic mug set', demandRank: 1, placement: 'title', inListing: false },
        { keyword: 'ceramic mug handmade', demandRank: 2, placement: 'description', inListing: true },
      ],
    });
    assert.ok(text.includes('"ceramic mug"'));
    assert.ok(text.includes('confidence: medium'));
    assert.ok(text.includes('1. **ceramic mug set** → title'));
    assert.ok(text.includes('(already in listing)'));
  });

  it('maps seed onto the keywords payload', () => {
    assert.deepStrictEqual(buildListingPayload({ seed: 'ceramic mug' }), { seed: 'ceramic mug' });
  });

  it('notes when only a single field was rewritten', () => {
    const text = formatOptimizeResult({
      before: { seoScore: 62 },
      after: { seoScore: 88 },
      optimized: { title: 'New Title', description: 'Same description.', tags: ['a', 'b'] },
      resolved: ['title_length'],
      unresolved: [],
      fallback: false,
      mode: 'title_only',
    });
    assert.ok(text.includes('only the title was rewritten'));
  });

  it('flags the fallback case honestly', () => {
    const text = formatOptimizeResult({
      before: { seoScore: 90 },
      after: { seoScore: 90 },
      optimized: { title: 't', description: 'd', tags: [] },
      resolved: [],
      unresolved: [],
      fallback: true,
    });
    assert.ok(text.includes('original fields were kept'));
  });
});

describe('cli listing commands', () => {
  const captureError = async (args) => {
    const original = console.error;
    const lines = [];
    console.error = (...parts) => lines.push(parts.join(' '));
    const exitBefore = process.exitCode;
    try {
      await handleCli(args);
    } finally {
      console.error = original;
    }
    const failed = process.exitCode === 1;
    process.exitCode = exitBefore;
    return { lines, failed };
  };

  it('rejects analyze without any listing input', async () => {
    const { lines, failed } = await captureError(['analyze']);
    assert.ok(failed);
    assert.ok(lines.join(' ').includes('--title'));
  });

  it('rejects optimize --mode with no listing fields instead of calling the API', async () => {
    const { lines, failed } = await captureError(['optimize', '--mode', 'title_only']);
    assert.ok(failed);
    assert.ok(lines.join(' ').includes('--title'));
  });

  it('treats audit as an alias for analyze', async () => {
    const { lines, failed } = await captureError(['audit']);
    assert.ok(failed);
    assert.ok(lines.join(' ').includes('--title'));
  });

  it('rejects keywords without a seed', async () => {
    const { lines, failed } = await captureError(['keywords']);
    assert.ok(failed);
    assert.ok(lines.join(' ').includes('--seed'));
  });

  it('treats bare "help" the same as --help', async () => {
    const original = console.log;
    const lines = [];
    console.log = (...parts) => lines.push(parts.join(' '));
    const exitBefore = process.exitCode;
    try {
      await handleCli(['help']);
    } finally {
      console.log = original;
    }
    const failed = process.exitCode === 1;
    process.exitCode = exitBefore;

    assert.ok(!failed);
    assert.ok(lines.join('\n').includes('seerxo optimize'));
  });

  it('installs the complete Claude Code skill bundle', async () => {
    const originalCwd = process.cwd();
    const originalLog = console.log;
    const projectDir = await mkdtemp(path.join(os.tmpdir(), 'seerxo-skill-'));

    try {
      process.chdir(projectDir);
      console.log = () => {};
      await handleCli(['skill', 'add', '--project']);

      const skillDir = path.join(projectDir, '.claude', 'skills', 'seerxo-etsy-seo');
      await Promise.all([
        access(path.join(skillDir, 'SKILL.md')),
        access(path.join(skillDir, 'references', 'remote-mcp.md')),
        access(path.join(skillDir, 'assets', 'seerxo.svg')),
        access(path.join(skillDir, 'assets', 'seerxo-banner.svg')),
      ]);
    } finally {
      console.log = originalLog;
      process.chdir(originalCwd);
      await rm(projectDir, { recursive: true, force: true });
    }
  });
});
