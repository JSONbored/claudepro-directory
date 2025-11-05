/**
 * Markdown to Plain Text Converter - Simplified
 * Converts markdown to AI-friendly plain text for llms.txt
 */

import { logger } from '@/src/lib/logger';

export type ConversionOptions = {
  preserveHeadings?: boolean;
  preserveLists?: boolean;
  preserveCodeBlocks?: boolean;
  preserveLinks?: boolean;
  removeHtml?: boolean;
  normalizeWhitespace?: boolean;
};

function convertHeading(line: string): string {
  const match = line.match(/^(#{1,6})\s+(.+)$/);
  if (!match) return line;

  const level = match[1]?.length ?? 1;
  const text = match[2]?.trim() ?? '';

  return level <= 2 ? text.toUpperCase() : text;
}

function convertLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
}

function convertListItem(line: string): string {
  const unordered = line.match(/^(\s*)[*-]\s+(.+)$/);
  if (unordered) {
    return `${unordered[1]}• ${unordered[2]}`;
  }

  const ordered = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
  if (ordered) {
    return `${ordered[1]}${ordered[2]}) ${ordered[3]}`;
  }

  return line;
}

function stripHtmlTags(text: string): string {
  // Use iterative approach to handle nested/malformed tags (CodeQL security recommendation)
  let prev: string;
  let stripped = text;
  do {
    prev = stripped;
    stripped = stripped.replace(/<[^>]*>/g, '');
  } while (stripped !== prev);
  return stripped;
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/ {2,}/g, ' ')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function markdownToPlainText(
  markdown: string,
  options?: Partial<ConversionOptions>
): Promise<string> {
  try {
    const opts = {
      preserveHeadings: true,
      preserveLists: true,
      preserveCodeBlocks: true,
      preserveLinks: true,
      removeHtml: true,
      normalizeWhitespace: true,
      ...options,
    };

    let text = markdown;

    if (opts.removeHtml) {
      text = stripHtmlTags(text);
    }

    const lines = text.split('\n');
    const processed: string[] = [];

    let inCodeBlock = false;
    let codeBlockLines: string[] = [];

    for (const currentLine of lines) {
      if (!currentLine) continue;

      let line = currentLine;

      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLines = [];
          continue;
        }
        inCodeBlock = false;
        if (opts.preserveCodeBlocks && codeBlockLines.length > 0) {
          processed.push('');
          processed.push(...codeBlockLines.map((l) => `    ${l}`));
          processed.push('');
        }
        codeBlockLines = [];
        continue;
      }

      if (inCodeBlock) {
        codeBlockLines.push(line);
        continue;
      }

      if (opts.preserveHeadings && line.match(/^#{1,6}\s+/)) {
        line = convertHeading(line);
      } else {
        line = line.replace(/^#{1,6}\s+/, '');
      }

      if (opts.preserveLists && line.match(/^\s*[*-]\s+|^\s*\d+\.\s+/)) {
        line = convertListItem(line);
      }

      if (opts.preserveLinks) {
        line = convertLinks(line);
      } else {
        line = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      }

      line = line
        .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/___(.+?)___/g, '$1')
        .replace(/__(.+?)__/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^>\s+/, '');

      if (line.match(/^[-*_]{3,}$/)) {
        continue;
      }

      processed.push(line);
    }

    let result = processed.join('\n');

    if (opts.normalizeWhitespace) {
      result = normalizeWhitespace(result);
    }

    return result;
  } catch (error) {
    logger.error(
      'Failed to convert markdown to plain text',
      error instanceof Error ? error : new Error(String(error)),
      {
        markdownLength: markdown?.length || 0,
      }
    );
    throw new Error('Failed to convert markdown content to plain text');
  }
}

export async function quickConvert(markdown: string): Promise<string> {
  return markdownToPlainText(markdown);
}
