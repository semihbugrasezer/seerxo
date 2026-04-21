import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, 'mcp-server.js');

describe('mcp-server CLI', () => {
  it('should print version with --version', () => {
    const output = execFileSync('node', [cliPath, '--version'], { encoding: 'utf8' });
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should print help with --help', () => {
    const output = execFileSync('node', [cliPath, '--help'], { encoding: 'utf8' });
    expect(output).toContain('Commands:');
    expect(output).toContain('seerxo login');
    expect(output).toContain('seerxo generate');
  });

  it('should require arguments for generate', () => {
    expect.assertions(2);
    try {
      execFileSync('node', [cliPath, 'generate'], { encoding: 'utf8' });
    } catch (err) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain('Missing argument: --product "Product name"');
    }
  });

  it('should print error for unknown commands', () => {
    expect.assertions(2);
    try {
      execFileSync('node', [cliPath, 'unknown-command'], { encoding: 'utf8' });
    } catch (err) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain('Unknown command: unknown-command');
    }
  });
});
