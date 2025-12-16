#!/usr/bin/env tsx

import { normalizeError } from '@heyclaude/shared-runtime';

import { runGenerateSkillPackages } from '../commands/generate-skill-packages.ts';
import { logger } from '../toolkit/logger.ts';

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
