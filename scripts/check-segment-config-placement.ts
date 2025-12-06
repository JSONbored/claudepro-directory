#!/usr/bin/env tsx
/**
 * Checks if segment configs have comment blocks between imports and the config export
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, relative } from 'path';

const appDir = resolve(process.cwd(), 'apps/web/src/app');
const issues: Array<{ file: string; line: number; issue: string }> = [];

const segmentConfigExports = [
  'dynamic',
  'revalidate',
  'dynamicParams',
  'runtime',
  'preferredRegion',
  'maxDuration',
  'fetchCache',
] as const;

function analyzeFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const relativePath = relative(process.cwd(), filePath);
  const lines = content.split('\n');
  
  // Find the last import line
  let lastImportLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s+/.test(lines[i]) || /^import\s+type\s+/.test(lines[i])) {
      lastImportLine = i;
    }
  }
  
  if (lastImportLine === -1) return; // No imports found
  
  // Find segment config exports
  for (const config of segmentConfigExports) {
    const regex = new RegExp(`^\\s*export\\s+const\\s+${config}\\s*=`);
    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        const configLine = i + 1;
        
        // Check if there's a comment block between last import and config
        if (configLine > lastImportLine + 1) {
          const linesBetween = lines.slice(lastImportLine + 1, i);
          const hasCommentBlock = linesBetween.some(line => 
            /^\s*\/\*\*/.test(line) || // Start of block comment
            /^\s*\*/.test(line) || // Continuation of block comment
            /^\s*\/\//.test(line) // Single line comment
          );
          
          if (hasCommentBlock) {
            issues.push({
              file: relativePath,
              line: configLine,
              issue: `Segment config \`${config}\` has comment blocks between imports (line ${lastImportLine + 1}) and config export. Next.js may require segment configs to be immediately after imports with only blank lines allowed.`,
            });
          }
        }
        break; // Only check first occurrence
      }
    }
  }
}

function walkDirectory(dir: string): void {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkDirectory(fullPath);
    } else if (
      (entry === 'page.tsx' || entry === 'layout.tsx' || entry === 'route.ts' || entry === 'route.tsx') &&
      (entry.endsWith('.ts') || entry.endsWith('.tsx'))
    ) {
      analyzeFile(fullPath);
    }
  }
}

console.log('🔍 Checking segment config placement relative to imports...\n');
walkDirectory(appDir);

if (issues.length === 0) {
  console.log('✅ No placement issues found!');
  process.exit(0);
} else {
  console.log(`⚠️  Found ${issues.length} potential issue(s):\n`);
  for (const issue of issues) {
    console.log(`  ${issue.file}:${issue.line}`);
    console.log(`    ${issue.issue}\n`);
  }
  process.exit(1);
}
