import { promises as fs } from 'node:fs';
import path from 'node:path';
import { logger } from '../toolkit/logger.js';
import { resolveRepoPath } from '../utils/paths.js';

type Violation = {
  file: string;
  line: number;
  message: string;
};

const srcDir = path.join(resolveRepoPath(), 'apps/web/src');

const allowedSocialLinksFiles = new Set([
  'apps/web/src/lib/data/config/constants.ts',
  'apps/web/src/lib/data/marketing/contact.ts',
]);

const socialLinksToken = 'SOCIAL_LINKS';
const marketingBarrelRegex = /from\s+['"]@\/src\/lib\/data\/marketing['"]/g;

export async function runLintDataLayer(): Promise<void> {
  const violations: Violation[] = [];
  await walk(srcDir, async (file) => {
    const relative = normalizeRelative(path.relative(resolveRepoPath(), file));
    const content = await fs.readFile(file, 'utf8');

    if (!allowedSocialLinksFiles.has(relative) && content.includes(socialLinksToken)) {
      for (const line of collectLines(content, socialLinksToken)) {
        violations.push({
          file: relative,
          line,
          message: `Disallowed ${socialLinksToken} usage outside data layer.`,
        });
      }
    }

    const barrelMatches = content.match(marketingBarrelRegex);
    if (barrelMatches) {
      for (const line of collectLines(content, '@/src/lib/data/marketing')) {
        violations.push({
          file: relative,
          line,
          message: 'Importing from "@/src/lib/data/marketing" barrel is prohibited.',
        });
      }
    }
  });

  if (violations.length) {
    logger.error('Data layer lint violations detected:\n', undefined, {
      script: 'check-data-layer',
      violationCount: violations.length,
    });
    for (const violation of violations) {
      logger.error(`- ${violation.file}:${violation.line} ${violation.message}`, undefined, {
        script: 'check-data-layer',
        file: violation.file,
        line: violation.line,
        message: violation.message,
      });
    }
    throw new Error('Data layer lint violations detected.');
  }
}

async function walk(dir: string, onFile: (filePath: string) => Promise<void>): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, onFile);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      await onFile(fullPath);
    }
  }
}

function collectLines(content: string, needle: string): number[] {
  const lines: number[] = [];
  for (const [index, line] of content.split('\n').entries()) {
    if (line.includes(needle)) {
      lines.push(index + 1);
    }
  }
  return lines;
}

function normalizeRelative(relativePath: string): string {
  return relativePath.split(path.sep).join('/');
}
