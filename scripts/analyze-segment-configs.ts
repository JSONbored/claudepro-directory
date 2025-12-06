#!/usr/bin/env tsx
/**
 * Analyzes Next.js segment configuration exports to detect invalid patterns
 * 
 * This script identifies:
 * - Client components with segment config exports (invalid)
 * - Files with both `dynamic` and `revalidate` (conflicting)
 * - Multiple exports of the same segment config option
 * - Segment configs in route.ts files (may be invalid depending on context)
 * 
 * Usage: pnpm exec tsx scripts/analyze-segment-configs.ts
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

type SegmentConfig = (typeof segmentConfigExports)[number];

function isClientComponent(content: string): boolean {
  return content.includes("'use client'") || content.includes('"use client"');
}

function findSegmentConfigExports(content: string): Map<SegmentConfig, number[]> {
  const exports = new Map<SegmentConfig, number[]>();
  const lines = content.split('\n');
  
  // Track if we're inside a function/conditional
  let braceDepth = 0;
  let inFunction = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Track brace depth to detect if we're inside a function/conditional
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;
    braceDepth += openBraces - closeBraces;
    
    // Detect function declarations
    if (/^\s*(export\s+)?(async\s+)?function\s+\w+\s*\(/.test(line) || 
        /^\s*const\s+\w+\s*=\s*(async\s+)?\(/.test(line) ||
        /^\s*const\s+\w+\s*=\s*(async\s+)?function/.test(line)) {
      inFunction = true;
    }
    
    // Check if we're back at top level
    if (braceDepth === 0 && closeBraces > 0) {
      inFunction = false;
    }
    
    for (const config of segmentConfigExports) {
      // Match: export const config = ... (must be at top level)
      const regex = new RegExp(`^\\s*export\\s+const\\s+${config}\\s*=`, 'm');
      if (regex.test(line)) {
        if (!exports.has(config)) {
          exports.set(config, []);
        }
        exports.get(config)!.push(i + 1);
        
        // Warn if export is inside a function/conditional
        if (inFunction || braceDepth > 0) {
          issues.push({
            file: 'current', // Will be set in analyzeFile
            line: i + 1,
            issue: `Segment config export \`${config}\` appears to be inside a function or conditional (must be at top level)`,
          });
        }
      }
    }
  }
  
  return exports;
}

function analyzeFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const relativePath = relative(process.cwd(), filePath);
  const isClient = isClientComponent(content);
  const exports = findSegmentConfigExports(content);
  
  // Check 1: Client components cannot export segment config
  if (isClient && exports.size > 0) {
    for (const [config, lines] of exports.entries()) {
      for (const line of lines) {
        issues.push({
          file: relativePath,
          line,
          issue: `Client component cannot export segment config: export const ${config}`,
        });
      }
    }
  }
  
  // Check 2: Cannot have both dynamic and revalidate
  if (exports.has('dynamic') && exports.has('revalidate')) {
    const dynamicLines = exports.get('dynamic')!;
    const revalidateLines = exports.get('revalidate')!;
    issues.push({
      file: relativePath,
      line: Math.min(...dynamicLines, ...revalidateLines),
      issue: 'Cannot export both `dynamic` and `revalidate` in the same file (they are mutually exclusive)',
    });
  }
  
  // Check 3: Multiple exports of the same config
  for (const [config, lines] of exports.entries()) {
    if (lines.length > 1) {
      issues.push({
        file: relativePath,
        line: lines[0],
        issue: `Multiple exports of \`${config}\` found (lines: ${lines.join(', ')})`,
      });
    }
  }
  
  // Check 4: Invalid dynamic values
  const dynamicMatch = content.match(/export\s+const\s+dynamic\s*=\s*['"]([^'"]+)['"]/);
  if (dynamicMatch) {
    const value = dynamicMatch[1];
    const validValues = ['auto', 'force-dynamic', 'error', 'force-static'];
    if (!validValues.includes(value)) {
      const line = content.substring(0, dynamicMatch.index).split('\n').length;
      issues.push({
        file: relativePath,
        line,
        issue: `Invalid \`dynamic\` value: "${value}". Must be one of: ${validValues.join(', ')}`,
      });
    }
  }
  
  // Check 5: Invalid revalidate values (must be number, 0, or false)
  const revalidateMatch = content.match(/export\s+const\s+revalidate\s*=\s*([^\n;]+)/);
  if (revalidateMatch) {
    const value = revalidateMatch[1].trim();
    const isValid = 
      value === 'false' || 
      value === '0' || 
      /^\d+$/.test(value) ||
      /^\d+_\d+$/.test(value); // Allow numeric separators like 86_400
    
    if (!isValid) {
      const line = content.substring(0, revalidateMatch.index).split('\n').length;
      issues.push({
        file: relativePath,
        line,
        issue: `Invalid \`revalidate\` value: ${value}. Must be a number, 0, or false`,
      });
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
      entry.endsWith('.ts') || entry.endsWith('.tsx')
    ) {
      analyzeFile(fullPath);
    }
  }
}

console.log('🔍 Analyzing Next.js segment configuration exports...\n');
walkDirectory(appDir);

if (issues.length === 0) {
  console.log('✅ No segment configuration issues found!');
  process.exit(0);
} else {
  console.log(`❌ Found ${issues.length} issue(s):\n`);
  for (const issue of issues) {
    console.log(`  ${issue.file}:${issue.line}`);
    console.log(`    ${issue.issue}\n`);
  }
  process.exit(1);
}
