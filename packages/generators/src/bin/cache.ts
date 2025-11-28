#!/usr/bin/env node

import { runCacheCli, showCacheCliHelp } from '../commands/cache-cli.js';
import { logger } from '../toolkit/logger.js';

const args = process.argv.slice(2).filter((arg) => arg !== '--');
const [command, pattern] = args;

if (!command || command === 'help' || command === '--help' || command === '-h') {
  showCacheCliHelp();
  process.exit(0);
}

try {
  const options: Parameters<typeof runCacheCli>[0] = { command: command as 'info' | 'clear' };
  if (pattern) {
    options.pattern = pattern;
  }
  runCacheCli(options);
} catch (error) {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  logger.error('Cache CLI error', errorObj, { command, pattern });
  process.exit(1);
}
