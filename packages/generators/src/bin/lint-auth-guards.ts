#!/usr/bin/env node

import { runLintAuthGuards } from '../commands/lint-auth-guards.js';
import { logger } from '../toolkit/logger.js';

try {
  runLintAuthGuards();
} catch (error) {
  logger.error(
    'Auth guard lint failed',
    error instanceof Error ? error : new Error(String(error)),
    {
      script: 'check-auth-guards',
    }
  );
  process.exit(1);
}
