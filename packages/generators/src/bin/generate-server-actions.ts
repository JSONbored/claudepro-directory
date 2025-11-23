#!/usr/bin/env node
import { runGenerateServerActions } from '../commands/generate-server-actions.js';

const args = process.argv.slice(2);
const targetAction = args[0];

runGenerateServerActions(targetAction).catch((err) => {
  console.error(err);
  process.exit(1);
});
