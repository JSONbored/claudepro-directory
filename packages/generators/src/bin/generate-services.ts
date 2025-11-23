#!/usr/bin/env node
import { runGenerateServices } from '../commands/generate-services.js';

const args = process.argv.slice(2);
const target = args[0];

runGenerateServices(target).catch((err) => {
  console.error(err);
  process.exit(1);
});
