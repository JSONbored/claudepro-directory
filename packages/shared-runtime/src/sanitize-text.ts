import sanitizeHtml from 'sanitize-html';
import { createUtilityContext } from './logging.ts';

export interface SanitizeTextOptions {
  maxLength?: number;
  allowNewlines?: boolean;
  allowHtml?: boolean;
}

export function sanitizeText(text: unknown, options: SanitizeTextOptions = {}): string {
  const { maxLength = 10000, allowNewlines = true, allowHtml = false } = options;

  if (text === null || text === undefined) {
    return '';
  }

  if (typeof text !== 'string') {
    return String(text);
  }

  let sanitized = text;

  sanitized = sanitized.replace(/\0/g, '');
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/\/\/+/g, '/');

  if (allowHtml) {
    sanitized = sanitizeHtml(sanitized, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'span', 'p'],
      allowedAttributes: {
        a: ['href', 'title', 'target'],
        span: ['style'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
    });
  } else {
    sanitized = sanitizeHtml(sanitized, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }

  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/\r\n/g, '\n');
  sanitized = sanitized.replace(/\r/g, '\n');

  if (!allowNewlines) {
    sanitized = sanitized.replace(/\n/g, ' ');
  }

  sanitized = sanitized.replace(/[ \t]+/g, ' ');
  sanitized = sanitized.trim();

  if (sanitized.length > maxLength) {
    const logContext = createUtilityContext('sanitize-text', 'text-truncated', {
      original_length: text.length,
      max_length: maxLength,
    });
    console.warn('[sanitize-text] Text truncated due to length limit', logContext);
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

export function sanitizeUrl(url: unknown): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let sanitized = url.trim();
  sanitized = sanitized.replace(/\0/g, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/\.\./g, '');

  if (!/^https?:\/\//i.test(sanitized)) {
    return '';
  }

  return sanitized;
}

export function sanitizeFilename(filename: unknown): string {
  if (!filename || typeof filename !== 'string') {
    return 'untitled';
  }

  let sanitized = filename.trim();
  sanitized = sanitized.replace(/\0/g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/^[.-]+|[.-]+$/g, '');
  sanitized = sanitized.replace(/-{2,}/g, '-');

  if (sanitized.length > 255) {
    sanitized = sanitized.slice(0, 255);
  }

  return sanitized || 'untitled';
}
