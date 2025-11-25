#!/usr/bin/env node
import { verifyFlags } from '../commands/verify-flags.js';

verifyFlags().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
