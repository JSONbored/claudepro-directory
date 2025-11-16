#!/usr/bin/env tsx

/**
 * Generates the minimal `_shared/database.types.ts` file used by Supabase edge functions.
 *
 * Reads the canonical `src/types/database.types.ts` (full schema), selects only the
 * definitions listed in `supabase/functions/_shared/edge-types.manifest.json`, and writes
 * a trimmed version that keeps the bundle size small without manual edits.
 *
 * Run via:
 *   pnpm edge:types
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Manifest {
  tables?: string[];
  functions?: string[];
  enums?: string[];
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '../..');
const MANIFEST_PATH = join(ROOT, 'supabase/functions/_shared/edge-types.manifest.json');
const SOURCE_TYPES_PATH = join(ROOT, 'src/types/database.types.ts');
const OUTPUT_PATH = join(ROOT, 'supabase/functions/_shared/database.types.ts');

const manifest: Manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
const source = readFileSync(SOURCE_TYPES_PATH, 'utf-8');

const tablesStart = source.indexOf('    Tables: {');
const functionsStart = source.indexOf('    Functions: {', tablesStart);
const enumsStart = source.indexOf('    Enums: {', functionsStart);
const enumsEnd = source.indexOf('    CompositeTypes:', enumsStart) || source.length;

if (tablesStart === -1 || functionsStart === -1 || enumsStart === -1) {
  throw new Error('Failed to locate Tables/Functions/Enums sections in database.types.ts');
}

function extractStructuredBlock(name: string, sectionStart: number, sectionEnd: number): string {
  const marker = `      ${name}: {`;
  const startIndex = source.indexOf(marker, sectionStart);
  if (startIndex === -1 || startIndex > sectionEnd) {
    throw new Error(`Unable to find definition for "${name}"`);
  }

  const braceStart = source.indexOf('{', startIndex);
  if (braceStart === -1) {
    throw new Error(`Malformed block for "${name}"`);
  }

  let depth = 0;
  let index = braceStart;
  while (index < sectionEnd) {
    const char = source[index];
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        index++;
        break;
      }
    }
    index++;
  }

  if (depth !== 0) {
    throw new Error(`Unbalanced braces while parsing "${name}"`);
  }

  if (source[index] === ';') {
    index++;
  }

  while (source[index] === '\r' || source[index] === '\n') {
    index++;
  }

  return source.slice(startIndex, index).trimEnd();
}

function extractEnumBlock(name: string): string {
  const marker = `      ${name}:`;
  const startIndex = source.indexOf(marker, enumsStart);
  if (startIndex === -1 || startIndex > enumsEnd) {
    throw new Error(`Unable to find enum "${name}"`);
  }

  const searchSlice = source.slice(startIndex + 1, enumsEnd);
  const nextEntryMatch = searchSlice.match(/\n {6}[a-z_]+\s*:/);
  const closingIndex = searchSlice.indexOf('\n      CompositeTypes:');

  let endIndexRelative = searchSlice.length;
  if (nextEntryMatch?.index !== undefined) {
    endIndexRelative = Math.min(endIndexRelative, nextEntryMatch.index);
  }
  if (closingIndex !== -1) {
    endIndexRelative = Math.min(endIndexRelative, closingIndex);
  }

  const endIndex = startIndex + 1 + endIndexRelative;
  const lines = source.slice(startIndex, endIndex).trimEnd().split('\n');
  if (lines[lines.length - 1]?.trim() === '}') {
    lines.pop();
  }
  return lines.join('\n').trimEnd();
}

const tablesOutput =
  manifest.tables?.map((table) => extractStructuredBlock(table, tablesStart, functionsStart)) ?? [];
const functionsOutput =
  manifest.functions?.map((fn) => extractStructuredBlock(fn, functionsStart, enumsStart)) ?? [];
const enumsOutput = manifest.enums?.map((enumeration) => extractEnumBlock(enumeration)) ?? [];

const header = `/**
 * AUTO-GENERATED FILE.
 * Do not edit directly. Instead, update edge-types.manifest.json and run:
 *
 *    pnpm edge:types
 */
`;

const jsonDefinition =
  'export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\n';

function formatSection(entries: string[]): string {
  if (!entries.length) {
    return '      // No definitions selected';
  }
  return entries.map((block) => `      ${block.trimStart()}`).join('\n\n');
}

// Extract PostgrestVersion from source
const postgrestVersionMatch = source.match(/PostgrestVersion:\s*"([^"]+)"/);
const postgrestVersion = postgrestVersionMatch?.[1] ?? '13.0.5';

const outputLines = [
  `${header}${jsonDefinition}`,
  '',
  'export interface Database {',
  '  __InternalSupabase: {',
  `    PostgrestVersion: '${postgrestVersion}';`,
  '  };',
  '  public: {',
  '    Tables: {',
  formatSection(tablesOutput),
  '    };',
  '    Functions: {',
  formatSection(functionsOutput),
  '    };',
  '    Enums: {',
  formatSection(enumsOutput),
  '    };',
  '  };',
  '}',
];

writeFileSync(OUTPUT_PATH, `${outputLines.join('\n').trimEnd()}\n`);
console.log('✔ Generated _shared/database.types.ts from manifest');
