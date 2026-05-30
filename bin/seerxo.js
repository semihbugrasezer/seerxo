#!/usr/bin/env node
import { initConfig, startMcpServer, startInteractiveShell, handleCli } from '../mcp-server.js';

async function main() {
  await initConfig();

  const args = process.argv.slice(2);

  // Check if we should enter MCP mode directly
  const isMcpMode = args.length === 0 && (!process.stdin.isTTY || !process.stdout.isTTY || process.env.SEERXO_MCP === '1');

  if (isMcpMode) {
    startMcpServer();
    return;
  }

  if (args.length === 0) {
    await startInteractiveShell();
    return;
  }

  await handleCli(args);
}

if (process.env.NODE_ENV !== 'test') {
  main().catch((err) => {
    console.error('[seerxo] Fatal error:', err);
    process.exit(1);
  });
}
