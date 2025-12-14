#!/usr/bin/env tsx

import { runAnalyzeCSS } from '../commands/analyze-css.js';

runAnalyzeCSS().catch((error) => {
  console.error('Analysis failed:', error);
  process.exit(1);
});
