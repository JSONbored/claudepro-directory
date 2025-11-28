#!/usr/bin/env node

import { runGenerateServiceWorker } from '../commands/generate-service-worker.js';
import { logger } from '../toolkit/logger.js';

runGenerateServiceWorker().catch((error) => {
  logger.error(
    '💥 Service Worker generation failed',
    error instanceof Error ? error : new Error(String(error)),
    {
      script: 'generate-service-worker',
    }
  );
  process.exit(1);
});
