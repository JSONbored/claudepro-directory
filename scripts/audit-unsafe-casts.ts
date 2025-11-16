#!/usr/bin/env tsx
/**
 * Audit script to find unsafe type casts in the codebase
 * Detects patterns like: as unknown as, as any, as never (except in specific contexts)
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const UNSAFE_PATTERNS = [
  /as\s+unknown\s+as/gi,
  /as\s+any\b/gi,
  // as never is acceptable in specific contexts (Args: never RPCs)
  // but we'll flag it for review
  /as\s+never\b/gi,
];

const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /dist/,
  /out/,
  /generated/,
  /database\.types\.ts$/, // Auto-generated file
];

const ACCEPTABLE_CONTEXTS = [
  // Args: never RPCs - acceptable
  /undefined\s+as\s+never/,
  // Supabase client type workaround - acceptable but should be documented
  /supabase\s+as\s+unknown\s+as\s+RpcClient/,
];

interface Finding {
  file: string;
  line: number;
  column: number;
  pattern: string;
  context: string;
  isAcceptable: boolean;
}

function shouldExcludeFile(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isAcceptableContext(line: string): boolean {
  return ACCEPTABLE_CONTEXTS.some((pattern) => pattern.test(line));
}

function findUnsafeCasts(filePath: string): Finding[] {
  const findings: Finding[] = [];

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      UNSAFE_PATTERNS.forEach((pattern) => {
        const matches = [...line.matchAll(pattern)];
        matches.forEach((match) => {
          if (match.index !== undefined) {
            const isAcceptable = isAcceptableContext(line);
            findings.push({
              file: filePath,
              line: index + 1,
              column: match.index + 1,
              pattern: match[0],
              context: line.trim(),
              isAcceptable,
            });
          }
        });
      });
    });
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }

  return findings;
}

function scanDirectory(dir: string, findings: Finding[] = []): Finding[] {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);

    if (shouldExcludeFile(fullPath)) {
      continue;
    }

    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath, findings);
    } else if (stat.isFile() && /\.(ts|tsx)$/.test(entry)) {
      findings.push(...findUnsafeCasts(fullPath));
    }
  }

  return findings;
}

function main() {
  const srcDir = join(process.cwd(), 'src');
  const supabaseDir = join(process.cwd(), 'supabase');

  console.log('🔍 Scanning for unsafe type casts...\n');

  const findings = [...scanDirectory(srcDir), ...scanDirectory(supabaseDir)];

  const acceptable = findings.filter((f) => f.isAcceptable);
  const unacceptable = findings.filter((f) => !f.isAcceptable);

  console.log('\n📊 Summary:');
  console.log(`   Total findings: ${findings.length}`);
  console.log(`   Acceptable: ${acceptable.length}`);
  console.log(`   ⚠️  Needs review: ${unacceptable.length}\n`);

  if (unacceptable.length > 0) {
    console.log('⚠️  Unsafe casts that need review:\n');
    unacceptable.forEach((finding) => {
      console.log(`   ${finding.file}:${finding.line}:${finding.column}`);
      console.log(`   Pattern: ${finding.pattern}`);
      console.log(`   Context: ${finding.context.substring(0, 80)}...\n`);
    });
  }

  if (acceptable.length > 0) {
    console.log('\n✅ Acceptable casts (documented exceptions):\n');
    acceptable.forEach((finding) => {
      console.log(`   ${finding.file}:${finding.line}:${finding.column}`);
      console.log(`   Pattern: ${finding.pattern}`);
      console.log(`   Context: ${finding.context.substring(0, 80)}...\n`);
    });
  }

  process.exit(unacceptable.length > 0 ? 1 : 0);
}

main();
