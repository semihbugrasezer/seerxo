#!/usr/bin/env node

import crypto from 'node:crypto';
import { promises as fsPromises } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createRequire } from 'node:module';
import { execFileSync, spawn } from 'node:child_process';
import chalk from 'chalk';
import open from 'open';
import { DEFAULT_HOST, normalizeHost } from './utils.js';

function boxen(content, options = {}) {
  const title = options.title ? ` ${options.title} ` : '';
  const lines = String(content).split('\n');
  const visibleWidth = Math.max(
    title.length,
    ...lines.map((line) => line.replace(/\u001b\[[0-9;]*m/g, '').length)
  );
  const width = Math.max(visibleWidth + 4, 12);
  const top = `+${title}${'-'.repeat(Math.max(0, width - title.length - 2))}+`;
  const bottom = `+${'-'.repeat(width - 2)}+`;
  const body = lines.map((line) => `| ${line}${' '.repeat(Math.max(0, width - 3 - line.replace(/\u001b\[[0-9;]*m/g, '').length))}|`);
  return [top, ...body, bottom].join('\n');
}

function openUrlInBrowser(url) {
  try {
    open(url).catch(() => {
      // Fallback: try platform-specific commands
      const cmd = process.platform === 'darwin' ? 'open'
        : process.platform === 'win32' ? 'start'
        : 'xdg-open';
      spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
    });
  } catch {
    // Silent fail — URL is already printed to console
  }
}

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const CONFIG_DIR = path.join(os.homedir(), '.seerxo-mcp');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const clientVersion = process.env.SEERXO_CLIENT_VERSION || pkg.version;
const LOGIN_POLL_INTERVAL_MS = 4000;
const LOGIN_TIMEOUT_MS = 15 * 60 * 1000;
const isInteractiveSession = process.stdin.isTTY;
const MIN_API_KEY_SECRET_LENGTH = 16;
const UNEXPECTED_TOKEN_REGEX = /Unexpected token/;
const shouldSkipLiveQuota = () => process.env.SEERXO_SKIP_LIVE_QUOTA === '1';

if (process.env.NODE_ENV === 'test') {
  process.stdin.unref?.();
}

const loadLocalConfigAsync = async () => {
  try {
    const data = await fsPromises.readFile(CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
};

const saveLocalConfigAsync = async (configData) => {
  await fsPromises.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await fsPromises.writeFile(
    CONFIG_PATH,
    JSON.stringify(configData, null, 2),
    { encoding: 'utf8', mode: 0o600 }
  );
};

let localConfig = {};
let userEmail = null;
let rawApiKey = null;
let apiHost = DEFAULT_HOST;
let apiKeyParts = [];
let hasValidApiKey = false;
let apiKeySecret = null;
let apiKeyHeader = null;

export function resolveApiKeyState(rawValue) {
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';
  const parts = value ? value.split('.') : [];
  const [keyId = '', secret = ''] = parts;
  const isValid =
    parts.length === 2 &&
    Boolean(keyId) &&
    Boolean(secret) &&
    secret.length >= MIN_API_KEY_SECRET_LENGTH;

  return {
    parts,
    isValid,
    secret: isValid ? secret : null,
    header: isValid ? value : null,
  };
}

function looksLikeKeyIdOnly(rawValue) {
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';
  return Boolean(value) && !value.includes('.') && /^[a-zA-Z0-9_-]{8,64}$/.test(value);
}

function normalizeCommandName(command) {
  const value = typeof command === 'string' ? command.trim().toLowerCase() : '';
  if (value === 'signin' || value === 'sign-in') return 'login';
  if (value === 'signout' || value === 'sign-out') return 'logout';
  return value;
}

function syncApiKeyState() {
  const state = resolveApiKeyState(rawApiKey);
  apiKeyParts = state.parts;
  hasValidApiKey = state.isValid;
  apiKeySecret = state.secret;
  apiKeyHeader = state.header;
}

function printStatus() {
  const keyState = hasValidApiKey
    ? '✔ configured'
    : `✖ missing or invalid (expected keyId.secret with secret >= ${MIN_API_KEY_SECRET_LENGTH} chars)`;

  console.log(
    '\n' +
      chalk.bold('Status:') +
      '\n' +
      `  Email : ${userEmail || chalk.red('missing')}\n` +
      `  Host  : ${apiHost || chalk.red('missing')}\n` +
      `  Key   : ${keyState}\n`
  );
}

function clearCliScreen() {
  if (!process.stdout.isTTY) {
    return;
  }

  process.stdout.write('\u001bc');
}

const getQuotaEndpoint = () => `${apiHost}/mcp/quota`;

export function buildQuotaSummary(usage = {}) {
  const limitRaw = usage.limit;
  const remainingRaw = usage.remaining;
  const usedRaw = usage.current ?? usage.used;

  const hasFiniteLimit = Number.isFinite(Number(limitRaw));

  let limit = null;
  if (hasFiniteLimit) {
    limit = Number(limitRaw);
  }

  let remaining = null;
  if (Number.isFinite(Number(remainingRaw))) {
    remaining = Math.max(0, Number(remainingRaw));
  }

  let current = 0;
  if (Number.isFinite(Number(usedRaw))) {
    current = Math.max(0, Number(usedRaw));
  } else if (hasFiniteLimit && remaining !== null) {
    current = Math.max(0, limit - remaining);
  }

  if (hasFiniteLimit && remaining !== null) {
    return {
      headline: remaining === 0 ? 'No credits left' : `${remaining} credits left`,
      detail: `${current}/${limit} used`,
      tone: remaining === 0 ? 'danger' : remaining <= 2 ? 'warning' : 'info',
    };
  }

  return {
    headline: 'Unlimited credits',
    detail: `${current} used`,
    tone: 'success',
  };
}

function renderQuotaPanel(usage = {}, { title = 'Credits', compact = false } = {}) {
  const summary = buildQuotaSummary(usage);
  const accent =
    summary.tone === 'danger'
      ? 'red'
      : summary.tone === 'warning'
      ? 'yellow'
      : summary.tone === 'success'
      ? 'green'
      : 'cyan';

  const body = compact
    ? `${chalk.bold(summary.headline)}\n${chalk.gray(summary.detail)}`
    : [
        chalk.bold(summary.headline),
        chalk.gray(summary.detail),
      ].join('\n');

  return boxen(body, {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
    borderStyle: 'round',
    borderColor: accent,
    title,
    titleAlignment: 'left',
  });
}

async function fetchQuota() {
  if (!userEmail) {
    throw new Error('Email is not set. Run "seerxo configure" first.');
  }
  if (!apiKeyHeader || !apiKeySecret) {
    throw new Error('API key is not set. Run "seerxo configure" first.');
  }

  const payload = {};
  const { signature, timestamp } = generateSignature(payload);
  const data = await fetchJson(getQuotaEndpoint(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': `seerxo/${clientVersion}`,
      'X-MCP-Signature': signature,
      'X-MCP-Timestamp': timestamp.toString(),
      'X-MCP-Version': clientVersion,
      'X-MCP-API-Key': apiKeyHeader,
    },
  });

  return data.quota || null;
}

async function printStatusWithQuota() {
  printStatus();

  if (!hasValidApiKey || !userEmail || shouldSkipLiveQuota()) {
    return;
  }

  try {
    const quota = await fetchQuota();
    if (quota) {
      console.log(renderQuotaPanel(quota, { title: 'Live Credits' }));
    }
  } catch (error) {
    console.log(
      chalk.yellow(
        `Could not load live credits: ${error.message || 'unknown error'}`
      )
    );
  }
}

export function formatApiErrorMessage(message, status) {
  const normalizedMessage = typeof message === 'string' ? message : '';
  const looksLikeInvalidKey =
    status === 401 ||
    status === 403 ||
    /invalid api key|api key not found|api key.*inactive/i.test(
      normalizedMessage
    );

  if (looksLikeInvalidKey) {
    const detail = normalizedMessage ? ` (${normalizedMessage})` : '';
    return `Invalid API key${detail}. Run "seerxo login" to refresh credentials.`;
  }

  return normalizedMessage || 'Failed to generate Etsy SEO content';
}

export async function initConfig() {
  localConfig = await loadLocalConfigAsync();

  userEmail =
    process.env.SEERXO_EMAIL ||
    process.env.EMAIL ||
    localConfig.email ||
    null;

  rawApiKey =
    process.env.SEERXO_API_KEY ||
    process.env.MCP_API_KEY ||
    localConfig.apiKey ||
    null;

  apiHost = normalizeHost(
    process.env.SEERXO_HOST ||
      process.env.API_BASE ||
      localConfig.host ||
      DEFAULT_HOST
  );

  syncApiKeyState();
}

const args = process.argv.slice(2);
const invokedPath = process.argv[1] || '';
const invokedAs = path.basename(invokedPath);
const invokedAsMcp =
  invokedAs === 'seerxo-mcp' || invokedAs === 'seerxo';
const invokedAsSeerxo = invokedAs === 'seerxo';

function isSafeHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function setRuntimeConfig({ email, apiKey, host }) {
  if (email) userEmail = email;
  if (apiKey) rawApiKey = apiKey;
  if (host) apiHost = normalizeHost(host);

  syncApiKeyState();
}

const getApiEndpoint = () => `${apiHost}/mcp/generate`;

export const getFlagValue = (flag, list = []) => {
  const index = list.indexOf(`--${flag}`);
  if (index !== -1 && list[index + 1] && !list[index + 1].startsWith('--')) {
    return list[index + 1];
  }
  return null;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error || data?.message || `Request failed (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data || {};
};

const printUsage = () => {
  console.log(
    `seerxo ${clientVersion}\n\n` +
      `Commands:\n` +
      `  seerxo login [--email you@example.com --host https://api.seerxo.com]\n` +
      `  seerxo logout\n` +
      `  seerxo configure [--email you@example.com --api-key keyId.secret --host https://api.seerxo.com]\n` +
      `  seerxo quota        # show remaining credits\n` +
      `  seerxo generate --product \"...\" [--category \"...\"] [--json]\n` +
      `  seerxo skill add|remove|path [--project]   # Claude Code skill\n` +
      `  seerxo update|upgrade   # update CLI to latest\n` +
      `  seerxo --help           # show this message\n` +
      `  seerxo --version        # show version\n\n` +
      `MCP stdio server (Claude/OpenAI):\n` +
      `  seerxo (no args, non-TTY)      # JSON-RPC only\n`
  );
};

const printCliBanner = () => {
  const width = Math.min(process.stdout.columns || 80, 73);

  const header =
    chalk.cyanBright.bold('SEERXO') +
    chalk.gray(' • Etsy SEO Agent • ') +
    chalk.gray(`v${clientVersion}`);

  const body = [
    header,
    chalk.gray('Describe your Etsy product → get title, description & tags.'),
    '',
    chalk.bold('🧪 Interactive mode (help for all commands)'),
    chalk.white('• Type a short description of your product'),
    chalk.white('• Add a category with "|" (pipe) if you want'),
    chalk.cyan('  Boho bedroom wall art set | Wall Art'),
    '',
    chalk.bold('💡 Tip'),
    chalk.cyan('  Minimalist nursery wall art in black & white line art.'),
    chalk.cyan('  Set of 3 abstract line art prints | Wall Art'),
    '',
    chalk.bold('Quick commands'),
    `${chalk.cyan('help')}       ${chalk.gray('Show commands')}`,
    `${chalk.cyan('clear')}      ${chalk.gray('Clear the screen')}`,
    `${chalk.cyan('status')}     ${chalk.gray('Show config & key state')}`,
    `${chalk.cyan('quota')}      ${chalk.gray('Show remaining credits')}`,
    `${chalk.cyan('login')}      ${chalk.gray('Open approval link to sign in')}`,
    `${chalk.cyan('logout')}     ${chalk.gray('Clear saved local credentials')}`,
    `${chalk.cyan('configure')}  ${chalk.gray('Set email & API key')}`,
    `${chalk.cyan('generate')}   ${chalk.gray('Guided prompt (product/category)')}`,
    `${chalk.cyan('quit')}       ${chalk.gray('Exit interactive mode')}`,
  ].join('\n');

  console.log(
    boxen(body, {
      padding: { top: 1, bottom: 1, left: 2, right: 2 },
      margin: { top: 0, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'cyan',
      title: 'SEERXO',
      titleAlignment: 'center',
      width,
    })
  );
};

const SKILL_NAME = 'seerxo-etsy-seo';
const bundledSkillUrl = new URL('./skills/seerxo-etsy-seo/SKILL.md', import.meta.url);

const skillTargetDir = (projectScope) =>
  projectScope
    ? path.join(process.cwd(), '.claude', 'skills', SKILL_NAME)
    : path.join(os.homedir(), '.claude', 'skills', SKILL_NAME);

const printSkillUsage = () => {
  console.log(
    'Usage:\n' +
      '  seerxo skill add [--project]      # install the Claude Code skill\n' +
      '  seerxo skill remove [--project]   # remove it\n' +
      '  seerxo skill path [--project]     # print the install path\n\n' +
      'Default scope is your user config (~/.claude/skills). Use --project for the current repo.'
  );
};

const runSkillCommand = async (extraArgs = []) => {
  const action = normalizeCommandName(extraArgs[0]) || 'add';
  const projectScope = extraArgs.includes('--project');
  const targetDir = skillTargetDir(projectScope);
  const targetPath = path.join(targetDir, 'SKILL.md');
  const scopeLabel = projectScope ? 'project (.claude/skills)' : 'user (~/.claude/skills)';

  if (action === 'path') {
    console.log(targetPath);
    return;
  }

  if (action === 'remove' || action === 'rm' || action === 'uninstall') {
    try {
      await fsPromises.rm(targetDir, { recursive: true, force: true });
      console.log(`Removed Seerxo skill from ${scopeLabel}.`);
    } catch (error) {
      console.error(`Failed to remove skill: ${error.message}`);
      process.exitCode = 1;
    }
    return;
  }

  if (action === 'add' || action === 'install') {
    try {
      const contents = await fsPromises.readFile(bundledSkillUrl, 'utf8');
      await fsPromises.mkdir(targetDir, { recursive: true });
      await fsPromises.writeFile(targetPath, contents, 'utf8');
      console.log(`Installed Seerxo Etsy SEO skill to ${scopeLabel}.`);
      console.log(`  ${targetPath}`);
      console.log('Restart Claude Code, then ask: "Generate an Etsy listing for ...".');
      console.log('Tip: run "seerxo login" once so the skill can generate on your account.');
    } catch (error) {
      console.error(`Failed to install skill: ${error.message}`);
      process.exitCode = 1;
    }
    return;
  }

  printSkillUsage();
};

const runSelfUpdate = () => {
  console.log('Updating seerxo to the latest version...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  let prefix = '';
  try {
    prefix = execFileSync(npmCmd, ['config', 'get', 'prefix']).toString().trim();
  } catch {
    prefix = '';
  }
  try {
    const installArgs = ['install', '-g', 'seerxo@latest', '--force'];
    if (prefix) {
      installArgs.push('--prefix', prefix);
    }
    execFileSync(npmCmd, installArgs, { stdio: 'inherit' });
    console.log('Update complete. Run "seerxo --version" to verify.');
  } catch (error) {
    console.error('Update failed.');
    console.error(
      `Try manually: ${npmCmd} install -g seerxo@latest --force` +
        (prefix ? ` --prefix "${prefix}"` : '')
    );
    if (error?.message) {
      console.error(`Error: ${error.message}`);
    }
    process.exitCode = 1;
    return;
  }
};

const runConfigureCommand = async (extraArgs = [], options = {}) => {
  const { showBanner = isInteractiveSession } = options;

  if (showBanner) {
    printCliBanner();
  }

  let email = getFlagValue('email', extraArgs);
  let apiKey = getFlagValue('api-key', extraArgs);
  let host = apiHost;

  const rl = readline.createInterface({ input, output });
  try {
    if (!email) {
      email = (await rl.question('Enter your SEERXO account email: ')).trim();
    }
    if (!apiKey) {
      apiKey = (
        await rl.question('Enter Seerxo API key (keyId.secret): ')
      ).trim();
    }
  } finally {
    if (!rl.closed) { rl.close(); rl.closed = true; };
  }

  if (!email) {
    console.error('Email is required.');
    process.exitCode = 1;
    return;
  }

  if (!resolveApiKeyState(apiKey).isValid) {
    if (looksLikeKeyIdOnly(apiKey)) {
      console.error(
        'That value looks like a key ID only, not the full API key. Use the full "keyId.secret" value or run "seerxo login".'
      );
      process.exitCode = 1;
      return;
    }
    console.error(
      `API key must be in the format "keyId.secret" and the secret part must be at least ${MIN_API_KEY_SECRET_LENGTH} characters.`
    );
    process.exitCode = 1;
    return;
  }

  await saveLocalConfigAsync({ email, apiKey, host });

  setRuntimeConfig({ email, apiKey, host });

  console.log(`MCP config saved to: ${CONFIG_PATH}`);
  console.log('Claude config example:');
  console.log('{');
  console.log('  "command": "seerxo"');
  console.log('}');
};

const runLogoutCommand = async () => {
  let host = apiHost || DEFAULT_HOST;

  try {
    const existing = await loadLocalConfigAsync();
    host = normalizeHost(existing.host || host);
  } catch {}

  await saveLocalConfigAsync({ host });

  setRuntimeConfig({
    email: null,
    apiKey: null,
    host,
  });

  console.log(`Signed out. Local credentials cleared from ${CONFIG_PATH}.`);

  if (process.env.SEERXO_EMAIL || process.env.SEERXO_API_KEY) {
    console.log(
      'Environment variables are still set. Clear SEERXO_EMAIL / SEERXO_API_KEY if you want a fully clean session.'
    );
  }
};

const runLoginCommand = async (extraArgs = [], options = {}) => {
  const { showBanner = isInteractiveSession } = options;

  if (showBanner) {
    printCliBanner();
  }

  let email = getFlagValue('email', extraArgs) || userEmail || '';

  const host = normalizeHost(getFlagValue('host', extraArgs) || apiHost);

  try {
    console.log(`Requesting SEERXO CLI login...`);
    const data = await fetchJson(`${host}/auth/mcp/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    const pollUrl = `${host}/auth/mcp/login/${data.requestId}?token=${encodeURIComponent(
      data.pollToken
    )}`;
    const pollInterval =
      Number(getFlagValue('interval', extraArgs)) || LOGIN_POLL_INTERVAL_MS;
    const deadline = expiresAt
      ? expiresAt.getTime()
      : Date.now() + LOGIN_TIMEOUT_MS;

    if (!data.requestId || !data.pollToken) {
      throw new Error('Login request is missing requestId or pollToken.');
    }

    const approvalUrl =
      data.approvalUrl ||
      `${host}/auth/mcp/confirm?requestId=${data.requestId}&token=${encodeURIComponent(
        data.pollToken
      )}`;
    const safeApprovalUrl = isSafeHttpUrl(approvalUrl) ? approvalUrl : null;

    console.log('\nOpen this link in your browser to approve CLI login:\n');
    console.log(chalk.cyan(safeApprovalUrl || '(invalid approval URL)'));
    console.log('');
    if (safeApprovalUrl) {
      openUrlInBrowser(safeApprovalUrl);
    }

    console.log('Waiting for approval...\n');

    while (Date.now() < deadline) {
      const poll = await fetchJson(pollUrl);

      if (poll.status === 'approved' && poll.apiKey) {
        const resolvedHost = poll.host ? normalizeHost(poll.host) : host;
        await saveLocalConfigAsync({
          email: poll.email || email,
          apiKey: poll.apiKey,
          host: resolvedHost,
        });

        setRuntimeConfig({
          email: poll.email || email,
          apiKey: poll.apiKey,
          host: resolvedHost,
        });

        console.log(
          `Login approved. Credentials saved to ${CONFIG_PATH}.`
        );
        console.log('You can now run "seerxo" in Claude Desktop.');
        return;
      }

      if (poll.status === 'expired') {
        throw new Error('Request expired. Run "seerxo login" again.');
      }

      await sleep(pollInterval);
    }

    throw new Error('Timed out waiting for approval. Please try again.');
  } catch (error) {
    console.error(error.message || 'CLI login failed.');
    process.exitCode = 1; return;
  }
};

export function generateSignature(payload) {
  const timestamp = Date.now().toString();
  const message = JSON.stringify(payload) + timestamp;
  const signature = crypto
    .createHmac('sha256', apiKeySecret || '')
    .update(message)
    .digest('hex');
  return { signature, timestamp };
}

function openUpgradeLink(url = upgradeUrl) {
  if (!url) return;
  console.log(chalk.yellow(`
Usage limit reached. Opening upgrade page: ${url}
`));
  try {
    open(url).catch(() => {});
  } catch {}
}

const seoCache = new Map();

async function generateEtsySEO(productName, category = '') {
  if (!userEmail) {
    throw new Error('Email is not set. Run "seerxo configure" first.');
  }
  if (!apiKeyHeader || !apiKeySecret) {
    throw new Error('API key is not set. Run "seerxo configure" first.');
  }

  const cacheKey = `${productName.trim().toLowerCase()}|${(category || '').trim().toLowerCase()}`;
  if (seoCache.has(cacheKey)) {
    return await seoCache.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const payload = {
        product_name: productName,
        category: category || '',
        email: userEmail,
      };

      const { signature, timestamp } = generateSignature(payload);

      const response = await fetch(getApiEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `seerxo/${clientVersion}`,
          'X-MCP-Signature': signature,
          'X-MCP-Timestamp': timestamp.toString(),
          'X-MCP-Version': clientVersion,
          'X-MCP-API-Key': apiKeyHeader,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const rawMessage =
          data?.error || data?.message || `API error: ${response.status}`;
        const message = formatApiErrorMessage(rawMessage, response.status);
        const payload = {
          message,
          status: response.status,
          paymentLink: data?.upgrade?.paymentLink || data?.paymentLink || null,
        };
        const error = new Error(message);
        error.payload = payload;
        error.status = response.status;
        throw error;
      }

      if (!data.success) {
        const message = data.error || 'Content generation failed';
        const error = new Error(message);
        error.payload = {
          message,
        };
        throw error;
      }

      const result = {
        ...data.data,
        usage: data.usage,
      };

      return result;
    } catch (error) {
      seoCache.delete(cacheKey);
      throw new Error(error.message || 'Failed to generate Etsy SEO content', {
        cause: error,
      });
    }
  })();

  seoCache.set(cacheKey, promise);

  const result = await promise;
  seoCache.set(cacheKey, result);
  return result;
}

async function promptLoginIfNecessary() {
  if (!userEmail || !hasValidApiKey) {
    const rlLogin = readline.createInterface({ input, output });
    const answer = (
      await rlLogin.question(
        '\nNo Seerxo account linked. Start login now? [Y/n] '
      )
    )
      .trim()
      .toLowerCase();
    rlLogin.close();

    if (answer === '' || answer === 'y' || answer === 'yes') {
      await runLoginCommand([], { showBanner: false });
    } else {
      console.log(
        '\nYou can run ' +
          chalk.cyan('seerxo login') +
          ' or ' +
          chalk.cyan('seerxo configure') +
          ' later.'
      );
    }
  }
}

function printSeoResult(productName, result) {
  console.log(
    boxen(
      [
        chalk.bold(`✅ Etsy SEO for "${productName}"`),
        result.usage ? renderQuotaPanel(result.usage, { title: 'Credits', compact: true }) : '',
        '',
        chalk.bold('Title:'),
        result.title,
        '',
        chalk.bold('Description:'),
        result.description,
        '',
        chalk.bold('Tags:'),
        result.tags.join(', '),
      ].join('\n'),
      {
        padding: 1,
        borderColor: 'cyan',
        borderStyle: 'round',
        title: 'seerxo',
      }
    )
  );
}

export async function startInteractiveShell() {
  clearCliScreen();
  printCliBanner();

  await promptLoginIfNecessary();

  const promptLabel =
    chalk.gray('[') +
    chalk.cyanBright('seerxo') +
    chalk.gray(']') +
    ' ' +
    chalk.gray('› ');

  async function promptLoop() {
    const rl = readline.createInterface({ input, output });

    while (true) {
      const line = (await rl.question(promptLabel)).trim();
      if (!line) continue;

      const cmd = line.startsWith('/') ? line.slice(1) : line;

      if (cmd === 'quit' || cmd === 'exit') {
        if (!rl.closed) { rl.close(); rl.closed = true; };
        console.log('Bye 👋');
        return;
      }

      if (cmd === 'login') {
        if (!rl.closed) { rl.close(); rl.closed = true; };
        await runLoginCommand([], { showBanner: false });
        return promptLoop();
      }

      if (cmd === 'logout' || cmd === 'signout' || cmd === 'sign-out') {
        if (!rl.closed) { rl.close(); rl.closed = true; };
        await runLogoutCommand();
        return promptLoop();
      }

      if (cmd === 'configure') {
        if (!rl.closed) { rl.close(); rl.closed = true; };
        await runConfigureCommand([], { showBanner: false });
        return promptLoop();
      }

      if (cmd === 'help') {
        console.log(
          '\n' +
            chalk.bold('Commands') +
            '\n' +
            chalk.gray('  (prefix with "/" if you prefer, e.g. "/status")') +
            '\n' +
            `  ${chalk.cyan('help')}       ${chalk.gray('Show this help')}\n` +
            `  ${chalk.cyan('clear')}      ${chalk.gray('Clear the screen')}\n` +
            `  ${chalk.cyan('status')}     ${chalk.gray('Show config & key state')}\n` +
            `  ${chalk.cyan('quota')}      ${chalk.gray('Show remaining credits')}\n` +
            `  ${chalk.cyan('login')}      ${chalk.gray('Open approval link to sign in')}\n` +
            `  ${chalk.cyan('logout')}     ${chalk.gray('Clear saved local credentials')}\n` +
            `  ${chalk.cyan('configure')}  ${chalk.gray('Manual email + API key setup')}\n` +
            `  ${chalk.cyan('generate')}   ${chalk.gray(
              'Guided prompt for product + category'
            )}\n` +
            `  ${chalk.cyan('quit')}       ${chalk.gray('Exit interactive mode')}\n`
        );
        continue;
      }

      if (cmd === 'clear' || cmd === 'cls') {
        clearCliScreen();
        printCliBanner();
        continue;
      }

      if (cmd === 'status') {
        await printStatusWithQuota();
        continue;
      }

      if (cmd === 'quota') {
        try {
          const quota = await fetchQuota();
          console.log(renderQuotaPanel(quota, { title: 'Live Credits' }));
        } catch (error) {
          console.error(
            chalk.red(error.message || 'Failed to load remaining credits')
          );
        }
        continue;
      }

      if (cmd === 'generate') {
        const productName = (await rl.question('Product: ')).trim();
        const category = (await rl.question('Category (optional): ')).trim();
        if (!productName) {
          console.log('Product is required.');
          continue;
        }
      try {
        const result = await generateEtsySEO(productName, category);
        printSeoResult(productName, result);
        } catch (error) {
          console.error(
            chalk.red(
              error.message || 'Failed to generate Etsy SEO content'
            )
          );
        }
        continue;
      }

      let productName = line;
      let category = '';

      const parts = line.split('|');
      if (parts.length >= 2) {
        productName = parts[0].trim();
        category = parts.slice(1).join('|').trim();
      }

      try {
        const result = await generateEtsySEO(productName, category);
        printSeoResult(productName, result);
      } catch (error) {
        const message =
          error?.payload?.message ||
          error?.message ||
          'Failed to generate Etsy SEO content from prompt';

        console.error(chalk.red(message));
      }
    }
  }

  await promptLoop();
}

export async function handleCli(subArgs) {
  const sub = normalizeCommandName(subArgs[0]);

  if (!sub || sub === '--help' || sub === '-h') {
    printCliBanner();
    printUsage();
    return;
  }

  if (sub === '--version' || sub === '-v') {
    console.log(clientVersion);
    return;
  }

  if (sub === 'configure') {
    await runConfigureCommand(subArgs.slice(1));
    return;
  }

  if (sub === 'login') {
    await runLoginCommand(subArgs.slice(1));
    return;
  }

  if (sub === 'logout') {
    await runLogoutCommand();
    return;
  }

  if (sub === 'status') {
    await printStatusWithQuota();
    return;
  }

  if (sub === 'quota') {
    try {
      const quota = await fetchQuota();
      console.log(renderQuotaPanel(quota, { title: 'Live Credits' }));
    } catch (error) {
      console.error(error.message || 'Failed to load remaining credits');
      process.exitCode = 1; return;
    }
    return;
  }

  if (sub === 'generate') {
    if (isInteractiveSession) {
      printCliBanner();
    }
    const productIndex = subArgs.indexOf('--product');
    const categoryIndex = subArgs.indexOf('--category');
    const jsonOutput = subArgs.includes('--json');

    if (productIndex === -1 || !subArgs[productIndex + 1]) {
      console.error('Missing argument: --product "Product name"');
      process.exitCode = 1;
      return;
    }
    const productName = subArgs[productIndex + 1];
    const category =
      categoryIndex !== -1 && subArgs[categoryIndex + 1]
        ? subArgs[categoryIndex + 1]
        : '';

    try {
      const result = await generateEtsySEO(productName, category);
      if (jsonOutput) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(
          boxen(
            [
              chalk.bold(`✅ Etsy SEO for "${productName}"`),
              result.usage ? renderQuotaPanel(result.usage, { title: 'Credits', compact: true }) : '',
              '',
              chalk.bold('Title:'),
              result.title,
              '',
              chalk.bold('Description:'),
              result.description,
              '',
              chalk.bold('Tags:'),
              result.tags.join(', '),
            ].join('\n'),
            {
              padding: 1,
              borderColor: 'cyan',
              borderStyle: 'round',
              title: 'seerxo',
            }
          )
        );
      }
    } catch (error) {
      console.error(error.message || 'Content generation failed');
      process.exitCode = 1;
      return;
    }
    return;
  }

  if (sub === 'skill') {
    await runSkillCommand(subArgs.slice(1));
    return;
  }

  if (sub === 'update' || sub === 'upgrade') {
    runSelfUpdate();
    return;
  }

  console.error(`[seerxo] Unknown command: ${sub}`);
  printUsage();
  process.exitCode = 1;
}

export function startMcpServer() {
  if (!userEmail || !hasValidApiKey) {
    console.error(
      '[seerxo] Missing credentials. Run "seerxo login" or "seerxo configure" first.'
    );
    process.exitCode = 1; return;
  }

  process.stdin.setEncoding('utf8');
  let buffer = '';

  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const request = JSON.parse(line);

        if (request.method === 'initialize') {
          if (request.params?.initializationOptions?.email) {
            userEmail = request.params.initializationOptions.email;
          }

          if (!userEmail) {
            throw new Error('SEERXO_EMAIL is required. Run "seerxo configure".');
          }
          if (!apiKeyHeader) {
            throw new Error('SEERXO_API_KEY is required. Run "seerxo configure".');
          }

          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: 'seerxo',
                version: clientVersion,
              },
            },
          };

          console.log(JSON.stringify(response));
        } else if (request.method === 'tools/list') {
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              tools: [
                {
                  name: 'generate_etsy_seo',
                  description: 'Generate SEO-optimized Etsy product listings.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      product_name: {
                        type: 'string',
                        description: 'Name of the product to optimize.',
                      },
                      category: {
                        type: 'string',
                        description: 'Optional category (e.g., "Home & Living")',
                      },
                    },
                    required: ['product_name'],
                  },
                },
              ],
            },
          };

          console.log(JSON.stringify(response));
        } else if (request.method === 'tools/call') {
          const { name, arguments: toolArgs } = request.params;

          if (name === 'generate_etsy_seo') {
            const result = await generateEtsySEO(
              toolArgs.product_name,
              toolArgs.category || ''
            );

            const usageInfo = result.usage
              ? (() => {
                  const summary = buildQuotaSummary(result.usage);
                  return `\n\n---\n**Credits:** ${summary.headline} (${summary.detail})`;
                })()
              : '';

            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: `# Etsy SEO Results for "${toolArgs.product_name}"\n\n## 📝 SEO Title\n${result.title}\n\n## 📄 Product Description\n${result.description}\n\n## 🏷️ Tags (13)\n${result.tags.join(
                      ', '
                    )}${usageInfo}`,
                  },
                ],
              },
            };

            console.log(JSON.stringify(response));
          } else {
            throw new Error(`Unknown tool: ${name}`);
          }
        }
      } catch (error) {
        if (
          error instanceof SyntaxError ||
          UNEXPECTED_TOKEN_REGEX.test(error.message || '')
        ) {
          console.error(
            '[seerxo] Invalid JSON received, ignoring.'
          );
          continue;
        }
        const errorResponse = {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: error.message,
          },
        };

        console.log(JSON.stringify(errorResponse));
      }
    }
  });

  process.stdin.on('end', () => {
    return;
  });

  process.on('uncaughtException', (error) => {
    console.error('[seerxo] Uncaught error:', error);
    process.exitCode = 1; return;
  });

  console.error('Seerxo MCP Server started');
}

