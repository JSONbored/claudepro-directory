#!/usr/bin/env node
import { normalizeError } from '@heyclaude/shared-runtime';

import { runGenerateChangelog } from '../commands/changelog.js';
import { logger } from '../toolkit/logger.js';

runGenerateChangelog().catch((error) => {
  logger.error(
    '❌ Unhandled error in main',
    normalizeError(error, 'Changelog generation failed'),
    { command: 'changelog' }
  );
  process.exit(1);
});
