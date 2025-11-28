#!/usr/bin/env tsx
/**
 * Validates that next.config.mjs can be loaded without syntax errors
 * 
 * This script catches build-time errors that TypeScript and ESLint don't catch,
 * such as:
 * - Syntax errors in config files
 * - Invalid async/await usage
 * - Module import errors
 * 
 * Usage: pnpm exec tsx packages/web-runtime/src/utils/validate-next-config.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { spawn } from 'child_process';

const configPath = resolve(process.cwd(), 'apps/web/next.config.mjs');

console.log('🔍 Validating next.config.mjs...');
console.log(`   Path: ${configPath}\n`);

try {
  // Read the file to check for basic syntax issues
  const configContent = readFileSync(configPath, 'utf-8');
  
  // Check for common issues that cause build failures
  const issues: string[] = [];
  
  // Check for await in non-async IIFE (the exact issue we just fixed)
  const lines = configContent.split('\n');
  let inIIFE = false;
  let iifeStartLine = 0;
  let foundAsync = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      continue;
    }
    
    // Detect IIFE start: (() => { or (async () => {
    if (line.match(/\(\(\)\s*=>\s*\{/) || line.match(/\(async\s*\(\)\s*=>\s*\{/)) {
      inIIFE = true;
      iifeStartLine = i + 1;
      foundAsync = line.includes('async');
    }
    
    // Check for await inside IIFE
    if (inIIFE && line.includes('await')) {
      if (!foundAsync) {
        issues.push(`Line ${i + 1}: await used in non-async IIFE (started at line ${iifeStartLine})`);
      }
    }
    
    // Detect IIFE end: })( or })(),
    if (inIIFE && (line.match(/\}\)\(\)/) || line.match(/\}\)\(\)\s*,/))) {
      inIIFE = false;
      foundAsync = false;
    }
  }
  
  // Use Node.js to actually check if the file can be loaded
  // This catches real syntax errors that static analysis might miss
  await new Promise<void>((resolvePromise, reject) => {
    const nodeProcess = spawn('node', ['--check', configPath], {
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    
    let stderr = '';
    nodeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    nodeProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Node.js syntax check failed:\n${stderr}`));
      } else {
        resolvePromise();
      }
    });
    
    nodeProcess.on('error', (error) => {
      reject(new Error(`Failed to run Node.js syntax check: ${error.message}`));
    });
  });
  
  if (issues.length > 0) {
    console.error('❌ Validation failed:\n');
    issues.forEach(issue => console.error(`   - ${issue}`));
    console.error('\n');
    process.exit(1);
  }
  
  console.log('✅ next.config.mjs is valid\n');
} catch (error) {
  console.error('❌ Failed to validate next.config.mjs:\n');
  if (error instanceof Error) {
    console.error(`   ${error.message}\n`);
    if (error.stack && !error.message.includes('Node.js syntax check')) {
      console.error('   Stack trace:');
      console.error(error.stack.split('\n').slice(0, 5).map(line => `   ${line}`).join('\n'));
    }
  } else {
    console.error(`   ${String(error)}\n`);
  }
  process.exit(1);
}
