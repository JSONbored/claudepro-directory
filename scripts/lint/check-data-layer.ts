import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type Violation = {
  file: string;
  line: number;
  message: string;
};

const __dirname = path.dirname(fileURLToPath(new URL(import.meta.url)));
const repoRoot = path.resolve(__dirname, '../../');
const srcDir = path.join(repoRoot, 'src');

const allowedSocialLinksFiles = new Set([
  'src/lib/data/config/constants.ts',
  'src/lib/data/marketing/contact.ts',
]);

const socialLinksToken = 'SOCIAL_LINKS';
const marketingBarrelRegex = /from\s+['"]@\/src\/lib\/data\/marketing['"]/g;

async function main() {
  const violations: Violation[] = [];
  await walk(srcDir, async (file) => {
    const relative = normalizeRelative(path.relative(repoRoot, file));
    const content = await fs.readFile(file, 'utf8');

    if (!allowedSocialLinksFiles.has(relative) && content.includes(socialLinksToken)) {
      collectLines(content, socialLinksToken).forEach((line) => {
        violations.push({
          file: relative,
          line,
          message: `Disallowed ${socialLinksToken} usage outside data layer.`,
        });
      });
    }

    const barrelMatches = content.match(marketingBarrelRegex);
    if (barrelMatches) {
      collectLines(content, '@/src/lib/data/marketing').forEach((line) => {
        violations.push({
          file: relative,
          line,
          message: 'Importing from "@/src/lib/data/marketing" barrel is prohibited.',
        });
      });
    }
  });

  if (violations.length) {
    console.error('Data layer lint violations detected:\n');
    for (const violation of violations) {
      console.error(`- ${violation.file}:${violation.line} ${violation.message}`);
    }
    process.exit(1);
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
  content.split('\n').forEach((line, index) => {
    if (line.includes(needle)) {
      lines.push(index + 1);
    }
  });
  return lines;
}

function normalizeRelative(relativePath: string): string {
  return relativePath.split(path.sep).join('/');
}

main().catch((error) => {
  console.error('Failed to run data layer lint:', error);
  process.exit(1);
});
