import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';

import fg from 'fast-glob';

const PROJECT_ROOT = resolve(process.cwd());
const SRC_GLOB = 'src/**/*.{ts,tsx}';

async function main() {
  const files = await fg(SRC_GLOB, {
    cwd: PROJECT_ROOT,
    absolute: true,
    ignore: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.stories.tsx', '**/__tests__/**'],
  });

  const reportLines: string[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    if (!content.includes('trackEvent')) continue;

    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (line.includes('trackEvent(')) {
        const eventMatch = line.match(/trackEvent\(([^,]+),?/);
        const eventName = eventMatch ? eventMatch[1].trim() : 'UNKNOWN_EVENT';
        reportLines.push(`${file}:${index + 1}:${eventName}`);
      }
    });
  }

  await fs.mkdir('.reports', { recursive: true });
  await fs.writeFile('.reports/analytics-usage.txt', reportLines.join('\n'), 'utf8');

  console.log(
    `Analytics usage report written to .reports/analytics-usage.txt with ${reportLines.length} entries.`
  );
}

main().catch((error) => {
  console.error('Failed to build analytics usage report', error);
  process.exit(1);
});
