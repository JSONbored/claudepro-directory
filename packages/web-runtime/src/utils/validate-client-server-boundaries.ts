#!/usr/bin/env tsx
/**
 * Validates client/server component boundaries at build time
 * 
 * This script catches issues that ESLint might miss, such as:
 * - Dynamic imports that bypass ESLint rules
 * - Runtime imports that only fail during build
 * - Next.js-specific boundary violations
 * 
 * Usage: pnpm exec tsx packages/web-runtime/src/utils/validate-client-server-boundaries.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, relative } from 'path';

const webSrcPath = resolve(process.cwd(), 'apps/web/src');
const violations: Array<{ file: string; line: number; issue: string }> = [];

// Server-only import patterns (same as ESLint rule)
const serverOnlyPatterns = [
  /packages\/web-runtime\/src\/data\/(?!config\/category|changelog\.shared|forms\/submission-form-fields)/,
  /packages\/web-runtime\/src\/cache\//,
  /packages\/web-runtime\/src\/supabase\/(server|server-anon)\.ts/,
  /packages\/web-runtime\/src\/server\.ts/,
  /\.server\.ts$/,
  /\.server\.tsx$/,
  /server-only/,
  /packages\/web-runtime\/src\/utils\/request-context\.ts/,
  /packages\/web-runtime\/src\/utils\/log-context\.ts/,
  /packages\/web-runtime\/src\/utils\/error-handler\.ts/,
  /@heyclaude\/web-runtime\/logging\/server/,
  /packages\/web-runtime\/src\/logging\/server\.ts/,
];

// Client-safe entry points (allowed in client components)
const clientSafePatterns = [
  /@heyclaude\/web-runtime\/data$/,
  /@heyclaude\/web-runtime\/data\//,
  /\/data-client/,
  /@heyclaude\/web-runtime\/logging\/client/,
  /\/logging\/client/,
];

function isClientComponent(content: string): boolean {
  return content.includes("'use client'") || content.includes('"use client"');
}

function checkFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const isClient = isClientComponent(content);
  
  if (!isClient) {
    return; // Only check client components
  }
  
  const lines = content.split('\n');
  const relativePath = relative(process.cwd(), filePath);
  
  // Check all import statements
  lines.forEach((line, index) => {
    // Match import statements
    const importMatch = line.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/);
    if (!importMatch) {
      return;
    }
    
    const importPath = importMatch[1];
    if (!importPath) {
      return;
    }
    
    // Skip client-safe imports
    if (clientSafePatterns.some(pattern => pattern.test(importPath))) {
      return;
    }
    
    // Check against server-only patterns
    const isServerOnly = serverOnlyPatterns.some(pattern => pattern.test(importPath));
    
    if (isServerOnly) {
      violations.push({
        file: relativePath,
        line: index + 1,
        issue: `Client component imports server-only module: ${importPath}`,
      });
    }
  });
  
  // Check for dynamic imports that might bypass static analysis
  lines.forEach((line, index) => {
    // Match dynamic import() statements
    const dynamicImportMatch = line.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (dynamicImportMatch) {
      const importPath = dynamicImportMatch[1];
      if (!importPath) {
        return;
      }
      const isServerOnly = serverOnlyPatterns.some(pattern => pattern.test(importPath));
      
      if (isServerOnly) {
        violations.push({
          file: relativePath,
          line: index + 1,
          issue: `Client component uses dynamic import of server-only module: ${importPath}`,
        });
      }
    }
  });
}

function walkDirectory(dir: string): void {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (entry === 'node_modules' || entry === '.next' || entry === '.git') {
        continue;
      }
      walkDirectory(fullPath);
    } else if (stat.isFile() && (entry.endsWith('.tsx') || entry.endsWith('.ts'))) {
      checkFile(fullPath);
    }
  }
}

console.log('🔍 Validating client/server component boundaries...');
console.log(`   Scanning: ${webSrcPath}\n`);

try {
  walkDirectory(webSrcPath);
  
  if (violations.length > 0) {
    console.error('❌ Client/server boundary violations found:\n');
    violations.forEach(({ file, line, issue }) => {
      console.error(`   ${file}:${line}`);
      console.error(`   ${issue}\n`);
    });
    console.error(`\n   Total violations: ${violations.length}`);
    console.error('   Fix these before committing.\n');
    process.exit(1);
  }
  
  console.log('✅ No client/server boundary violations found\n');
} catch (error) {
  console.error('❌ Failed to validate client/server boundaries:\n');
  if (error instanceof Error) {
    console.error(`   ${error.message}\n`);
  } else {
    console.error(`   ${String(error)}\n`);
  }
  process.exit(1);
}
