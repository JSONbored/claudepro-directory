#!/usr/bin/env node
import { runGenerateChangelog } from '../commands/changelog.js';
import { logger } from '../toolkit/logger.js';
import { normalizeError } from '@heyclaude/shared-runtime';

runGenerateChangelog().catch((error) => {
  logger.error(
    '❌ Unhandled error in main',
    normalizeError(error, 'Changelog generation failed'),
    {
      script: 'changelog-generate-entry',
    }
  );
  process.exit(1);
});
