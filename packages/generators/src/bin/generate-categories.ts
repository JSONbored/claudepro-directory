#!/usr/bin/env tsx

import { normalizeError } from '@heyclaude/shared-runtime';

import { runGenerateCategoryConfig } from '../commands/generate-category-config.js';
import { logger } from '../toolkit/logger.js';

runGenerateCategoryConfig().catch((error) => {
  logger.error(
    '💥 Category config generation failed',
    normalizeError(error, 'Category config generation failed'),
    {
      script: 'generate-category-config',
    }
  );
  process.exit(1);
});
