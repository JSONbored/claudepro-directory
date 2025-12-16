#!/usr/bin/env tsx

import { normalizeError } from '@heyclaude/shared-runtime';

import { runGenerateServiceWorker } from '../commands/generate-service-worker.ts';
import { logger } from '../toolkit/logger.ts';

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
