#!/usr/bin/env node

import { runGenerateSkillPackages } from '../commands/generate-skill-packages.js';
import { logger } from '../toolkit/logger.js';
import { normalizeError } from '@heyclaude/shared-runtime';

runGenerateSkillPackages()
  .then(() => {
    logger.info('✅ Skills generation complete', {
      script: 'generate-skills',
    });
    process.exit(0);
  })
  .catch((error: unknown) => {
    logger.error(
      '💥 Skills generation failed',
      normalizeError(error, 'Skills generation failed'),
      {
        script: 'generate-skills',
      }
    );
    process.exit(1);
  });
