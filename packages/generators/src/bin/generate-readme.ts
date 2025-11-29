#!/usr/bin/env node

import { runGenerateReadme } from '../commands/generate-readme.js';
import { logger } from '../toolkit/logger.js';
import { normalizeError } from '@heyclaude/shared-runtime';

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
      normalizeError(error, 'README generation failed'),
      {
        script: 'generate-readme',
      }
    );
    process.exit(1);
  });
