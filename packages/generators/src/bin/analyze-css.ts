#!/usr/bin/env tsx

import { runAnalyzeCSS } from '../commands/analyze-css.ts';

runAnalyzeCSS().catch((error) => {
  console.error('Analysis failed:', error);
  process.exit(1);
});
