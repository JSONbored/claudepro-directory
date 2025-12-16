#!/usr/bin/env tsx

import { runAnalyzeInlineStyles } from '../commands/analyze-inline-styles.ts';

runAnalyzeInlineStyles().catch((error) => {
  console.error('Analysis failed:', error);
  process.exit(1);
});
