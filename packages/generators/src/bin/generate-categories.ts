#!/usr/bin/env node

import { runGenerateCategoryConfig } from '../commands/generate-category-config.js';
import { logger } from '../toolkit/logger.js';

runGenerateCategoryConfig().catch((error) => {
  logger.error(
    '💥 Category config generation failed',
    error instanceof Error ? error : new Error(String(error)),
    {
      script: 'generate-category-config',
    }
  );
  process.exit(1);
});
