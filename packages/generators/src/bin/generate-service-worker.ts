#!/usr/bin/env tsx

import { normalizeError } from '@heyclaude/shared-runtime';

import { runGenerateServiceWorker } from '../commands/generate-service-worker.js';
import { logger } from '../toolkit/logger.js';

runGenerateServiceWorker().catch((error) => {
  logger.error(
    '💥 Service Worker generation failed',
    normalizeError(error, 'Service Worker generation failed'),
    {
      script: 'generate-service-worker',
    }
  );
  process.exit(1);
});
