#!/usr/bin/env tsx

import { normalizeError } from '@heyclaude/shared-runtime';

import { generateOpenAPI } from '../commands/generate-openapi.ts';
import { logger } from '../toolkit/logger.ts';

generateOpenAPI()
  .then(() => {
    logger.info('✅ OpenAPI spec generation complete', {
      script: 'generate-openapi',
    });
    process.exit(0);
  })
  .catch((error) => {
    logger.error(
      '💥 OpenAPI generation failed',
      normalizeError(error, 'OpenAPI generation failed'),
      {
        script: 'generate-openapi',
      }
    );
    process.exit(1);
  });
