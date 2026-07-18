// Verifies the files referenced by docs/SYSTEM_MAP.md still exist.
import { access } from 'node:fs/promises';

const requiredFiles = [
  'docs/SYSTEM_MAP.md',
  'bin/seerxo.js',
  'bin/seerxo-mcp.js',
  'mcp-server.js',
  'utils.js',
  'skills/seerxo-etsy-seo/SKILL.md'
];

const missing = [];

for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    missing.push(file);
  }
}

if (missing.length > 0) {
  console.error('System map references missing files:');

  for (const file of missing) {
    console.error(`- ${file}`);
  }

  process.exit(1);
}

console.log('System map references are valid.');
