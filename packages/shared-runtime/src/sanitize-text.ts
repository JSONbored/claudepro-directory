import sanitizeHtml from 'sanitize-html';

import { logger } from './logger/index.ts';

export interface SanitizeTextOptions {
  allowHtml?: boolean;
  allowNewlines?: boolean;
  maxLength?: number;
}

export function sanitizeText(text: unknown, options: SanitizeTextOptions = {}): string {
  const { maxLength = 10_000, allowNewlines = true, allowHtml = false } = options;

  if (text === null || text === undefined) {
    return '';
  }

  // Handle non-string types safely
  if (typeof text !== 'string') {
    // For primitives, use String() directly
    if (typeof text === 'number' || typeof text === 'boolean') {
      return String(text);
    }
    // For objects, return empty string to avoid [object Object]
    return '';
  }

  let sanitized = text;

  // Remove null bytes (security risk)
  sanitized = sanitized.replaceAll('\0', '');
  // Note: Path-traversal protections (.. and // removal) are handled
  // by context-specific functions (sanitizeUrl, sanitizeFilename)

  sanitized = allowHtml ? sanitizeHtml(sanitized, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'span', 'p'],
      allowedAttributes: {
        a: ['href', 'title', 'target'],
        span: ['style'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
    }) : sanitizeHtml(sanitized, {
      allowedTags: [],
      allowedAttributes: {},
    });

  // Remove dangerous URL schemes that can execute code
  sanitized = sanitized.replaceAll(/javascript:/gi, '');
  sanitized = sanitized.replaceAll(/data:/gi, '');
  sanitized = sanitized.replaceAll(/vbscript:/gi, '');
  sanitized = sanitized.replaceAll('\r\n', '\n');
  sanitized = sanitized.replaceAll('\r', '\n');

  if (!allowNewlines) {
    sanitized = sanitized.replaceAll('\n', ' ');
  }

  sanitized = sanitized.replaceAll(/[ \t]+/g, ' ');
  sanitized = sanitized.trim();

  if (sanitized.length > maxLength) {
    logger.warn({
      function: 'sanitize-text',
      operation: 'text-truncated',
      original_length: text.length,
      max_length: maxLength,
    }, 'Text truncated due to length limit');
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

export function sanitizeUrl(url: unknown): string {
  if (url === null || url === undefined || typeof url !== 'string') {
    return '';
  }

  let sanitized = url.trim();
  sanitized = sanitized.replaceAll('\0', '');
  sanitized = sanitized.replaceAll(/javascript:/gi, '');
  sanitized = sanitized.replaceAll(/data:/gi, '');
  sanitized = sanitized.replaceAll(/vbscript:/gi, '');
  sanitized = sanitized.replaceAll('..', '');

  if (!/^https?:\/\//i.test(sanitized)) {
    return '';
  }

  return sanitized;
}

export function sanitizeFilename(filename: unknown): string {
  if (filename === null || filename === undefined || typeof filename !== 'string') {
    return 'untitled';
  }

  let sanitized = filename.trim();
  sanitized = sanitized.replaceAll('\0', '');
  sanitized = sanitized.replaceAll(/[/\\]/g, '');
  sanitized = sanitized.replaceAll('..', '');
  sanitized = sanitized.replaceAll(/^[.-]+|[.-]+$/g, '');
  sanitized = sanitized.replaceAll(/-{2,}/g, '-');

  if (sanitized.length > 255) {
    sanitized = sanitized.slice(0, 255);
  }

  return sanitized || 'untitled';
}
