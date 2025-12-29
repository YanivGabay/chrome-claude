#!/usr/bin/env node

/**
 * Chrome Claude CLI wrapper
 *
 * Uses tsx to run the CLI so it can load TypeScript workflow files.
 */

import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = join(__dirname, '..', 'src', 'cli.ts');

// Run the CLI with tsx
const result = spawnSync(
  'npx',
  ['tsx', cliPath, ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    cwd: process.cwd(),
  }
);

process.exit(result.status ?? 1);
