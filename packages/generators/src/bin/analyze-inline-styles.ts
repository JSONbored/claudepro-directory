#!/usr/bin/env tsx

import { runAnalyzeInlineStyles } from '../commands/analyze-inline-styles.js';

runAnalyzeInlineStyles().catch((error) => {
  console.error('Analysis failed:', error);
  process.exit(1);
});
