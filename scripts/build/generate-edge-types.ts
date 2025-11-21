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
import { logger } from '@/src/lib/logger';

interface Manifest {
  tables?: string[];
  functions?: string[];
  enums?: string[];
  compositeTypes?: string[];
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
const compositeTypesIndex = source.indexOf('    CompositeTypes:', enumsStart);
const enumsEnd = compositeTypesIndex === -1 ? source.length : compositeTypesIndex;

// Find the end of CompositeTypes section (look for the closing brace of the public namespace)
let compositeTypesEnd = source.length;
if (compositeTypesIndex !== -1) {
  // Find the closing brace of the CompositeTypes object
  const compositeTypesBraceStart = source.indexOf('{', compositeTypesIndex);
  if (compositeTypesBraceStart !== -1) {
    let depth = 0;
    let index = compositeTypesBraceStart;
    while (index < source.length) {
      const char = source[index];
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          compositeTypesEnd = index + 1;
          break;
        }
      }
      index++;
    }
  }
}

if (tablesStart === -1 || functionsStart === -1 || enumsStart === -1) {
  throw new Error('Failed to locate Tables/Functions/Enums sections in database.types.ts');
}

function extractStructuredBlock(name: string, sectionStart: number, sectionEnd: number): string {
  // Try simple format first: `name: {`
  let marker = `      ${name}: {`;
  let startIndex = source.indexOf(marker, sectionStart);

  // If not found, try union type format: `name:\n        | {`
  if (startIndex === -1 || startIndex > sectionEnd) {
    marker = `      ${name}:`;
    startIndex = source.indexOf(marker, sectionStart);
    if (startIndex === -1 || startIndex > sectionEnd) {
      throw new Error(`Unable to find definition for "${name}"`);
    }
    // For union types, start from the function name itself
    // Find where the union ends by looking for the next function definition
  }

  // Find the end of this block by looking for the next function or end of section
  // For union types, we need to find all union members
  let endIndex = sectionEnd;

  // Look for the next function definition after this one
  const nextFunctionPattern = /\n {6}[a-z_]+:\s*(?:\{|\|)/;
  const afterStart = source.slice(startIndex + 1);
  const nextMatch = afterStart.match(nextFunctionPattern);
  if (nextMatch && nextMatch.index !== undefined) {
    endIndex = Math.min(endIndex, startIndex + 1 + nextMatch.index);
  }

  // For union types, find the end of the union (when we hit the next function or closing brace)
  // Count braces to find the end of the union type
  let braceStart = source.indexOf('{', startIndex);
  if (braceStart === -1) {
    // For union types starting with `|`, find the first `| {`
    const unionStart = source.indexOf('| {', startIndex);
    if (unionStart !== -1) {
      braceStart = unionStart + 2; // Point to the `{` after `| `
    } else {
      throw new Error(`Malformed block for "${name}"`);
    }
  }

  // Find the end by counting braces, but stop at the next function definition
  let depth = 0;
  let index = braceStart;
  let foundFirstBrace = false;

  while (index < endIndex) {
    const char = source[index];
    if (char === '{') {
      depth++;
      foundFirstBrace = true;
    } else if (char === '}') {
      depth--;
      // For union types, we're done when we've closed all braces AND we're past the union
      // Check if we've hit the next function definition
      if (depth === 0 && foundFirstBrace) {
        // Check if there's another union member (`| {`) or if we're done
        const remaining = source.slice(index + 1, endIndex).trimStart();
        if (!remaining.startsWith('|')) {
          index++;
          break;
        }
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

function extractCompositeTypeBlock(name: string): string {
  if (compositeTypesIndex === -1) {
    throw new Error('CompositeTypes section not found in source');
  }
  const marker = `      ${name}:`;
  const startIndex = source.indexOf(marker, compositeTypesIndex);
  if (startIndex === -1 || startIndex > compositeTypesEnd) {
    throw new Error(`Unable to find composite type "${name}"`);
  }

  // Find the opening brace
  const braceStart = source.indexOf('{', startIndex);
  if (braceStart === -1) {
    throw new Error(`Malformed composite type block for "${name}"`);
  }

  // Find the matching closing brace
  let depth = 0;
  let index = braceStart;
  while (index < compositeTypesEnd) {
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
    throw new Error(`Unbalanced braces while parsing composite type "${name}"`);
  }

  // Include the closing brace
  return source.slice(startIndex, index).trimEnd();
}

const tablesOutput =
  manifest.tables?.map((table) => extractStructuredBlock(table, tablesStart, functionsStart)) ?? [];
const functionsOutput =
  manifest.functions?.map((fn) => extractStructuredBlock(fn, functionsStart, enumsStart)) ?? [];
const enumsOutput = manifest.enums?.map((enumeration) => extractEnumBlock(enumeration)) ?? [];
const compositeTypesOutput =
  manifest.compositeTypes?.map((type) => extractCompositeTypeBlock(type)) ?? [];

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
  ...(compositeTypesOutput.length > 0
    ? ['    CompositeTypes: {', formatSection(compositeTypesOutput), '    };']
    : []),
  '  };',
  '}',
];

writeFileSync(OUTPUT_PATH, `${outputLines.join('\n').trimEnd()}\n`);
logger.info('✔ Generated _shared/database.types.ts from manifest', {
  script: 'generate-edge-types',
  outputPath: OUTPUT_PATH,
});
