#!/usr/bin/env tsx

// Import generateOpenAPI directly to avoid dependency on built packages
import { generateOpenAPI } from '../commands/generate-openapi.ts';

generateOpenAPI()
  .then(() => {
    console.log('✅ OpenAPI spec generation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 OpenAPI generation failed:', error);
    process.exit(1);
  });
