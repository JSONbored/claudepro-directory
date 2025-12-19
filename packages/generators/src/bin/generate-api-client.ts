#!/usr/bin/env tsx

// Import generateApiClient directly to avoid dependency on built packages
import { generateApiClient } from '../commands/generate-api-client.ts';

generateApiClient()
  .then(() => {
    console.log('✅ API client generation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 API client generation failed:', error);
    process.exit(1);
  });
