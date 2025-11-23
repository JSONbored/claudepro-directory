#!/usr/bin/env node

import { runGenerateSkillPackages } from '../commands/generate-skills.js';
import { logger } from '../toolkit/logger.js';

runGenerateSkillPackages()
  .then(() => {
    logger.info('✅ Skills generation complete', {
      script: 'generate-skills',
    });
    process.exit(0);
  })
  .catch((error) => {
    logger.error(
      '💥 Skills generation failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        script: 'generate-skills',
      }
    );
    process.exit(1);
  });
