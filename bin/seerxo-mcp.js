#!/usr/bin/env node
import { initConfig, startMcpServer } from '../mcp-server.js';

if (process.env.NODE_ENV !== 'test') {
  initConfig()
    .then(() => startMcpServer())
    .catch((err) => {
      console.error('[seerxo] Fatal error:', err);
      process.exit(1);
    });
}
