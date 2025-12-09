#!/usr/bin/env tsx

/**
 * Changelog Entry Extractor
 *
 * Extracts the latest changelog entry from CHANGELOG.md and converts it to JSON format
 * for database synchronization.
 *
 * **Format:**
 * - Parses markdown changelog entry (first entry after header)
 * - Extracts: title, date, version, tldr, content, sections
 * - Outputs JSON to stdout
 *
 * **Changelog Structure:**
 * ```markdown
 * # Changelog
 * ## YYYY-MM-DD - Version Name
 * **TL;DR:** Summary
 * ### What Changed
 * ...
 * ### Added
 * ...
 * ### Changed
 * ...
 * ### Fixed
 * ...
 * ```
 *
 * @example
 * ```bash
 * pnpm exec heyclaude-extract-changelog-entry
 * # Outputs JSON to stdout
 * ```
 *
 * @see {@link ../../../../apps/web/src/app/api/changelog/sync/route.ts | Database Sync API}
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { normalizeError } from '@heyclaude/shared-runtime';

import { logger } from '../toolkit/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '../../../../');
const CHANGELOG_PATH = join(ROOT, 'CHANGELOG.md');

/**
 * Extracts the latest changelog entry from CHANGELOG.md.
 *
 * @returns JSON string with changelog entry data
 */
function extractLatestEntry(): string {
  const content = readFileSync(CHANGELOG_PATH, 'utf8');

  // Find the first entry after the header
  // Pattern: ## YYYY-MM-DD - Version Name
  const entryMatch = content.match(/^##\s+(\d{4}-\d{2}-\d{2})\s+-\s+(.+?)$/m);

  if (!entryMatch) {
    throw new Error('No changelog entry found');
  }

  const date = entryMatch[1];
  const versionName = entryMatch[2]?.trim() ?? '';

  // Extract everything from this entry until the next ## or end of file
  const entryStart = (entryMatch.index ?? 0) + entryMatch[0].length;
  const nextEntryMatch = content.slice(entryStart).match(/^##\s+/m);
  const entryEnd = nextEntryMatch
    ? entryStart + (nextEntryMatch.index ?? 0)
    : content.length;

  const entryContent = content.slice(entryStart, entryEnd).trim();

  // Extract TL;DR
  const tldrMatch = entryContent.match(/\*\*TL;DR:\*\*\s*(.+?)(?=\n|$)/);
  const tldr = tldrMatch?.[1]?.trim() ?? '';

  // Extract sections (excluding Technical Details, Deployment, Statistics - these are metadata)
  const sections: Record<string, string[]> = {};
  const metadataSections = ['Technical Details', 'Deployment', 'Statistics'];
  const sectionRegex = /###\s+(.+?)\n([\s\S]*?)(?=###|$)/g;
  let sectionMatch;

  while ((sectionMatch = sectionRegex.exec(entryContent)) !== null) {
    const sectionTitle = sectionMatch[1]?.trim();
    
    // Skip metadata sections (they're not part of the structured changes)
    if (!sectionTitle || metadataSections.includes(sectionTitle)) {
      continue;
    }

    const sectionContent = sectionMatch[2]?.trim() ?? '';

    // Parse bullet points
    const bullets = sectionContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-'))
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter((line) => line.length > 0);

    if (bullets.length > 0) {
      sections[sectionTitle] = bullets;
    }
  }

  // Extract "What Changed" section (if exists)
  const whatChangedMatch = entryContent.match(/###\s+What Changed\n([\s\S]*?)(?=###|$)/);
  const whatChanged = whatChangedMatch?.[1]?.trim() ?? '';

  // Build JSON object
  const entry = {
    version: versionName,
    date,
    tldr,
    whatChanged,
    sections,
    content: entryContent,
    rawContent: entryContent,
  };

  return JSON.stringify(entry, null, 2);
}

/**
 * Main entry point for changelog extraction.
 */
export async function runExtractChangelogEntry() {
  try {
    const json = extractLatestEntry();
    // Output to stdout (for use in scripts)
    process.stdout.write(json);
    process.exit(0);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to extract changelog entry');
    logger.error('❌ Failed to extract changelog entry', normalized, {
      script: 'extract-changelog-entry',
    });
    // Output empty JSON on error
    process.stdout.write('{}\n');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExtractChangelogEntry();
}
