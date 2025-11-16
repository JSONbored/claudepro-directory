#!/usr/bin/env tsx
/**
 * Audit script to find unsafe type casts in the codebase
 * Detects patterns like: as unknown as, as any, as never (except in specific contexts)
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { logger } from '@/src/lib/logger';

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

    for (const [index, line] of lines.entries()) {
      for (const pattern of UNSAFE_PATTERNS) {
        const matches = [...line.matchAll(pattern)];
        for (const match of matches) {
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
        }
      }
    }
  } catch (error) {
    logger.error(
      `Error reading ${filePath}`,
      error instanceof Error ? error : new Error(String(error)),
      {
        script: 'audit-unsafe-casts',
        filePath,
      }
    );
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

  logger.info('🔍 Scanning for unsafe type casts...\n', { script: 'audit-unsafe-casts' });

  const findings = [...scanDirectory(srcDir), ...scanDirectory(supabaseDir)];

  const acceptable = findings.filter((f) => f.isAcceptable);
  const unacceptable = findings.filter((f) => !f.isAcceptable);

  logger.info('\n📊 Summary:');
  logger.info(`   Total findings: ${findings.length}`, {
    script: 'audit-unsafe-casts',
    totalFindings: findings.length,
  });
  logger.info(`   Acceptable: ${acceptable.length}`, {
    script: 'audit-unsafe-casts',
    acceptableCount: acceptable.length,
  });
  logger.info(`   ⚠️  Needs review: ${unacceptable.length}\n`, {
    script: 'audit-unsafe-casts',
    unacceptableCount: unacceptable.length,
  });

  if (unacceptable.length > 0) {
    logger.warn('⚠️  Unsafe casts that need review:\n', { script: 'audit-unsafe-casts' });
    for (const finding of unacceptable) {
      logger.warn(`   ${finding.file}:${finding.line}:${finding.column}`, {
        script: 'audit-unsafe-casts',
        file: finding.file,
        line: finding.line,
        column: finding.column,
      });
      logger.warn(`   Pattern: ${finding.pattern}`, {
        script: 'audit-unsafe-casts',
        pattern: finding.pattern,
      });
      logger.warn(`   Context: ${finding.context.substring(0, 80)}...\n`, {
        script: 'audit-unsafe-casts',
        context: finding.context.substring(0, 80),
      });
    }
  }

  if (acceptable.length > 0) {
    logger.info('\n✅ Acceptable casts (documented exceptions):\n', {
      script: 'audit-unsafe-casts',
    });
    for (const finding of acceptable) {
      logger.info(`   ${finding.file}:${finding.line}:${finding.column}`, {
        script: 'audit-unsafe-casts',
        file: finding.file,
        line: finding.line,
        column: finding.column,
      });
      logger.info(`   Pattern: ${finding.pattern}`, {
        script: 'audit-unsafe-casts',
        pattern: finding.pattern,
      });
      logger.info(`   Context: ${finding.context.substring(0, 80)}...\n`, {
        script: 'audit-unsafe-casts',
        context: finding.context.substring(0, 80),
      });
    }
  }

  process.exit(unacceptable.length > 0 ? 1 : 0);
}

main();
