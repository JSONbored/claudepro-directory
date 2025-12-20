#!/usr/bin/env tsx

import { normalizeError } from '@heyclaude/shared-runtime';

import { runGenerateReadme } from '../commands/generate-readme.ts';
import { logger } from '../toolkit/logger.ts';

runGenerateReadme()
  .then(() => {
    logger.info('✅ README generation complete', {
      script: 'generate-readme',
    });
    process.exit(0);
  })
  .catch((error) => {
    logger.error('💥 README generation failed', normalizeError(error, 'README generation failed'), {
      script: 'generate-readme',
    });
    process.exit(1);
  });
