#!/usr/bin/env node

import { runGenerateReadme } from '../commands/generate-readme.js';
import { logger } from '../toolkit/logger.js';

runGenerateReadme()
  .then(() => {
    logger.info('✅ README generation complete', {
      script: 'generate-readme',
    });
    process.exit(0);
  })
  .catch((error) => {
    logger.error(
      '💥 README generation failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        script: 'generate-readme',
      }
    );
    process.exit(1);
  });
