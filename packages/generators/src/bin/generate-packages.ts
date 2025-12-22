#!/usr/bin/env tsx

import { normalizeError } from '@heyclaude/shared-runtime';

import { runGeneratePackages } from '../commands/generate-packages.ts';
import { logger } from '../toolkit/logger.ts';

runGeneratePackages().catch((error: unknown) => {
  logger.error(
    '💥 Package generation failed',
    normalizeError(error, 'Package generation failed'),
    {
      script: 'generate-packages',
    }
  );
  process.exit(1);
});

