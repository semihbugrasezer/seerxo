#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import boxen from 'boxen';
import chalk from 'chalk';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const CONFIG_DIR = path.join(os.homedir(), '.seerxo-mcp');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const DEFAULT_HOST = 'https://api.seerxo.com';
const clientVersion = process.env.SEERXO_CLIENT_VERSION || pkg.version;
const LOGIN_POLL_INTERVAL_MS = 4000;
const LOGIN_TIMEOUT_MS = 15 * 60 * 1000;
const isInteractiveSession = process.stdin.isTTY;
const resolveDefaultUpgradeUrl = (host) =>
  `${host.replace(/\/$/, '')}/app/billing/redirect/premium`;
let upgradeUrl =
  process.env.SEERXO_UPGRADE_URL ||
  resolveDefaultUpgradeUrl(
    process.env.SEERXO_HOST || process.env.API_BASE || DEFAULT_HOST
  );

const loadLocalConfig = () => {
  try {
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
};

const localConfig = loadLocalConfig();

let userEmail =
  process.env.SEERXO_EMAIL ||
  process.env.EMAIL ||
  localConfig.email ||
  null;

let rawApiKey =
  process.env.SEERXO_API_KEY ||
  process.env.MCP_API_KEY ||
  localConfig.apiKey ||
  null;

let apiHost = normalizeHost(
  process.env.SEERXO_HOST ||
    process.env.API_BASE ||
    localConfig.host ||
    DEFAULT_HOST
);

let apiKeyParts = rawApiKey ? rawApiKey.split('.') : [];
let hasValidApiKey = apiKeyParts.length === 2 && apiKeyParts.every(Boolean);
let apiKeySecret = hasValidApiKey ? apiKeyParts[1] : null;
let apiKeyHeader = hasValidApiKey ? rawApiKey : null;

const args = process.argv.slice(2);
const invokedPath = process.argv[1] || '';
const invokedAs = path.basename(invokedPath);
const invokedAsMcp =
  invokedAs === 'seerxo-mcp' || invokedAs === 'etsy-seo-mcp' || invokedAs === 'seerxo';
const invokedAsSeerxo = invokedAs === 'seerxo';

function normalizeHost(value) {
  return value ? value.replace(/\/$/, '') : DEFAULT_HOST;
}

function isSafeHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function setRuntimeConfig({ email, apiKey, host }) {
  if (email) userEmail = email;
  if (apiKey) rawApiKey = apiKey;
  if (host) apiHost = normalizeHost(host);

  apiKeyParts = rawApiKey ? rawApiKey.split('.') : [];
  hasValidApiKey = apiKeyParts.length === 2 && apiKeyParts.every(Boolean);
  apiKeySecret = hasValidApiKey ? apiKeyParts[1] : null;
  apiKeyHeader = hasValidApiKey ? rawApiKey : null;
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

const fetchJson = async (url, options = {}) => {
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

const promptForEmail = async (
  message = 'Enter your SEERXO account email: '
) => {
  if (!process.stdin.isTTY) return null;
  const rl = readline.createInterface({ input, output });
  try {
    const answer = (await rl.question(message)).trim();
    return answer || null;
  } finally {
    rl.close();
  }
};

const printUsage = () => {
  console.log(
    `seerxo ${clientVersion}\n\n` +
      `Commands:\n` +
      `  seerxo login [--email you@example.com --host https://api.seerxo.com]\n` +
      `  seerxo configure [--email you@example.com --api-key keyId.secret --host https://api.seerxo.com]\n` +
      `  seerxo generate --product \"...\" [--category \"...\"] [--json]\n` +
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
    `${chalk.cyan('status')}     ${chalk.gray('Show config & key state')}`,
    `${chalk.cyan('login')}      ${chalk.gray('Open approval link to sign in')}`,
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

const runSelfUpdate = () => {
  console.log('Updating seerxo to the latest version...');
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  let prefix = '';
  try {
    prefix = execSync(`${npmCmd} config get prefix`).toString().trim();
  } catch {
    prefix = '';
  }
  try {
    const prefixArg = prefix ? ` --prefix "${prefix}"` : '';
    execSync(
      `${npmCmd} install -g seerxo@latest --force${prefixArg}`,
      { stdio: 'inherit' }
    );
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
    process.exit(1);
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
    rl.close();
  }

  if (!email) {
    console.error('Email is required.');
    process.exit(1);
  }

  if (!apiKey || apiKey.split('.').length !== 2) {
    console.error('API key must be in the format "keyId.secret".');
    process.exit(1);
  }

  await fsPromises.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await fsPromises.writeFile(
    CONFIG_PATH,
    JSON.stringify({ email, apiKey, host }, null, 2),
    { encoding: 'utf8', mode: 0o600 }
  );

  setRuntimeConfig({ email, apiKey, host });

  console.log(`MCP config saved to: ${CONFIG_PATH}`);
  console.log('Claude config example:');
  console.log('{');
  console.log('  "command": "seerxo"');
  console.log('}');
};

const runLoginCommand = async (extraArgs = [], options = {}) => {
  const { showBanner = isInteractiveSession } = options;

  if (showBanner) {
    printCliBanner();
  }

  let email = getFlagValue('email', extraArgs) || userEmail;
  if (!email) {
    console.error(
      'Email is required for CLI login. Set it once with "seerxo configure --email you@example.com".'
    );
    process.exit(1);
  }

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
      try {
        const openCommand =
          process.platform === 'darwin'
            ? { cmd: 'open', args: [safeApprovalUrl] }
            : process.platform === 'win32'
            ? { cmd: 'cmd', args: ['/c', 'start', '', safeApprovalUrl] }
            : { cmd: 'xdg-open', args: [safeApprovalUrl] };

        const opener = spawn(openCommand.cmd, openCommand.args, {
          stdio: 'ignore',
          detached: true,
        });
        opener.unref();
      } catch {
      }
    }

    console.log('Waiting for approval...\n');

    while (Date.now() < deadline) {
      const poll = await fetchJson(pollUrl);

      if (poll.status === 'approved' && poll.apiKey) {
        const resolvedHost = poll.host ? normalizeHost(poll.host) : host;
        await fsPromises.mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
        await fsPromises.writeFile(
          CONFIG_PATH,
          JSON.stringify(
            {
              email: poll.email || email,
              apiKey: poll.apiKey,
              host: resolvedHost,
            },
            null,
            2
          ),
          { encoding: 'utf8', mode: 0o600 }
        );

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
    process.exit(1);
  }
};

function generateSignature(payload) {
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
    const openCommand =
      process.platform === 'darwin'
        ? { cmd: 'open', args: [url] }
        : process.platform === 'win32'
        ? { cmd: 'cmd', args: ['/c', 'start', '', url] }
        : { cmd: 'xdg-open', args: [url] };
    const opener = spawn(openCommand.cmd, openCommand.args, {
      stdio: 'ignore',
      detached: true,
    });
    opener.unref();
  } catch {}
}

async function generateEtsySEO(productName, category = '') {
  if (!userEmail) {
    throw new Error('Email is not set. Run "seerxo configure" first.');
  }
  if (!apiKeyHeader || !apiKeySecret) {
    throw new Error('API key is not set. Run "seerxo configure" first.');
  }

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
      const message =
        data?.error || data?.message || `API error: ${response.status}`;
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

    return {
      ...data.data,
      usage: data.usage,
    };
  } catch (error) {
    throw new Error(error.message || 'Failed to generate Etsy SEO content', {
      cause: error,
    });
  }
}

async function startInteractiveShell() {
  console.clear();
  printCliBanner();

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
        rl.close();
        console.log('Bye 👋');
        return;
      }

      if (cmd === 'login') {
        rl.close();
        await runLoginCommand([], { showBanner: false });
        return promptLoop();
      }

      if (cmd === 'configure') {
        rl.close();
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
            `  ${chalk.cyan('status')}     ${chalk.gray('Show config & key state')}\n` +
            `  ${chalk.cyan('login')}      ${chalk.gray('Open approval link to sign in')}\n` +
            `  ${chalk.cyan('configure')}  ${chalk.gray('Manual email + API key setup')}\n` +
            `  ${chalk.cyan('generate')}   ${chalk.gray(
              'Guided prompt for product + category'
            )}\n` +
            `  ${chalk.cyan('quit')}       ${chalk.gray('Exit interactive mode')}\n`
        );
        continue;
      }

      if (cmd === 'status') {
      console.log(
        '\n' +
          chalk.bold('Status:') +
          '\n' +
          `  Email : ${userEmail || chalk.red('missing')}\n` +
          `  Key   : ${hasValidApiKey ? '✔ configured' : '✖ missing'}\n`
      );
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
        const usageInfo = result.usage
          ? `(${result.usage.current}/${result.usage.limit} used, ${result.usage.remaining} remaining)`
          : '';
        console.log(
          boxen(
            [
              chalk.bold(`✅ Etsy SEO for "${productName}"`),
              '',
                chalk.bold('Title:'),
                result.title,
                '',
                chalk.bold('Description:'),
                result.description,
                '',
                chalk.bold('Tags:'),
                result.tags.join(', '),
                '',
                chalk.bold('Suggested Price:'),
                result.suggested_price_range,
                usageInfo ? `\nUsage: ${usageInfo}` : '',
              ].join('\n'),
              {
                padding: 1,
                borderColor: 'cyan',
                borderStyle: 'round',
                title: 'seerxo',
              }
            )
          );
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

        const usageInfo = result.usage
          ? `(${result.usage.current}/${result.usage.limit} used, ${result.usage.remaining} remaining)`
          : '';

        console.log(
          boxen(
            [
              chalk.bold(`✅ Etsy SEO for "${productName}"`),
              '',
              chalk.bold('Title:'),
              result.title,
              '',
              chalk.bold('Description:'),
              result.description,
              '',
              chalk.bold('Tags:'),
              result.tags.join(', '),
              '',
              chalk.bold('Suggested Price:'),
              result.suggested_price_range,
              usageInfo ? `\nUsage: ${usageInfo}` : '',
            ].join('\n'),
            {
              padding: 1,
              borderColor: 'cyan',
              borderStyle: 'round',
              title: 'seerxo',
            }
          )
        );
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

async function handleCli(subArgs) {
  const sub = subArgs[0];

  if (!sub || sub === '--help' || sub === '-h') {
    printCliBanner();
    printUsage();
    process.exit(0);
  }

  if (sub === '--version' || sub === '-v') {
    console.log(clientVersion);
    process.exit(0);
  }

  if (sub === 'configure') {
    await runConfigureCommand(subArgs.slice(1));
    process.exit(0);
  }

  if (sub === 'login') {
    await runLoginCommand(subArgs.slice(1));
    process.exit(0);
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
      process.exit(1);
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
        const usageInfo = result.usage
          ? `(${result.usage.current}/${result.usage.limit} used, ${result.usage.remaining} remaining)`
          : '';
        console.log(
          boxen(
            [
              chalk.bold(`✅ Etsy SEO for "${productName}"`),
              '',
              chalk.bold('Title:'),
              result.title,
              '',
              chalk.bold('Description:'),
              result.description,
              '',
              chalk.bold('Tags:'),
              result.tags.join(', '),
              '',
              chalk.bold('Suggested Price:'),
              result.suggested_price_range,
              usageInfo ? `\nUsage: ${usageInfo}` : '',
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
      process.exit(1);
    }
    process.exit(0);
  }

  if (sub === 'update' || sub === 'upgrade') {
    runSelfUpdate();
    process.exit(0);
  }

  console.error(`[seerxo] Unknown command: ${sub}`);
  printUsage();
  process.exit(1);
}

function startMcpServer() {
  if (!userEmail || !hasValidApiKey) {
    console.error(
      '[seerxo] Missing credentials. Run "seerxo login" or "seerxo configure" first.'
    );
    process.exit(1);
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
              ? `\n\n---\n**Usage:** ${result.usage.current}/${result.usage.limit} generations used (${result.usage.remaining} remaining)`
              : '';

            const response = {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: `# Etsy SEO Results for "${toolArgs.product_name}"\n\n## 📝 SEO Title\n${result.title}\n\n## 📄 Product Description\n${result.description}\n\n## 🏷️ Tags (15)\n${result.tags.join(
                      ', '
                    )}\n\n## 💰 Suggested Price\n${
                      result.suggested_price_range
                    }${usageInfo}`,
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
          /Unexpected token/.test(error.message || '')
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
    process.exit(0);
  });

  process.on('uncaughtException', (error) => {
    console.error('[seerxo] Uncaught error:', error);
    process.exit(1);
  });

  console.error('Seerxo MCP Server started');
}

async function main() {
  if (invokedAsSeerxo) {
    if (args.length === 0) {
      await startInteractiveShell();
      return;
    }
    await handleCli(args);
    return;
  }

  if (invokedAsMcp) {
    const cliSubcommands = [
      'login',
      'configure',
      'generate',
      'update',
      'upgrade',
      '--help',
      '-h',
      '--version',
      '-v',
    ];
    if (args.length > 0 && cliSubcommands.includes(args[0])) {
      await handleCli(args);
      return;
    }

    startMcpServer();
    return;
  }

  await handleCli(args);
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((err) => {
    console.error('[seerxo] Fatal error:', err);
    process.exit(1);
  });
}
