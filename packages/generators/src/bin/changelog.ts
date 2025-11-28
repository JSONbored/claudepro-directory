#!/usr/bin/env node
import { runGenerateChangelog } from '../commands/changelog.js';
import { logger } from '../toolkit/logger.js';

runGenerateChangelog().catch((error) => {
  logger.error(
    '❌ Unhandled error in main',
    error instanceof Error ? error : new Error(String(error)),
    {
      script: 'changelog-generate-entry',
    }
  );
  process.exit(1);
});
