#!/usr/bin/env node

import { runLintDataLayer } from '../commands/lint-data-layer.js';
import { logger } from '../toolkit/logger.js';

runLintDataLayer().catch((error) => {
  logger.error(
    'Failed to run data layer lint',
    error instanceof Error ? error : new Error(String(error)),
    {
      script: 'check-data-layer',
    }
  );
  process.exit(1);
});
