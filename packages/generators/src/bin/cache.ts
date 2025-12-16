#!/usr/bin/env tsx

import { normalizeError } from '@heyclaude/shared-runtime';

import { runCacheCli, showCacheCliHelp } from '../commands/cache-cli.ts';
import { logger } from '../toolkit/logger.ts';

const args = process.argv.slice(2).filter((arg) => arg !== '--');
const [command, pattern] = args;

if (!command || command === 'help' || command === '--help' || command === '-h') {
  showCacheCliHelp();
  process.exit(0);
}

try {
  const options: Parameters<typeof runCacheCli>[0] = { command: command as 'clear' | 'info' };
  if (pattern) {
    options.pattern = pattern;
  }
  runCacheCli(options);
} catch (error) {
  const errorObj = normalizeError(error, 'Cache CLI error');
  logger.error('Cache CLI error', errorObj, { command, pattern });
  process.exit(1);
}
