#!/usr/bin/env tsx
import { normalizeError } from '@heyclaude/shared-runtime';

import { runGenerateChangelog } from '../commands/changelog.ts';
import { logger } from '../toolkit/logger.ts';

runGenerateChangelog().catch((error) => {
  logger.error('❌ Unhandled error in main', normalizeError(error, 'Changelog generation failed'), {
    command: 'changelog',
  });
  process.exit(1);
});
