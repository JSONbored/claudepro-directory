/**
 * Text sanitization utility
 * Removes XSS vectors and normalizes user input
 */

import { createUtilityContext } from './logging.ts';

export interface SanitizeTextOptions {
  maxLength?: number;
  allowNewlines?: boolean;
  allowHtml?: boolean;
}

/**
 * Sanitize text input to prevent XSS and normalize whitespace
 * @param text - Text to sanitize
 * @param options - Sanitization options
 * @returns Sanitized text
 */
export function sanitizeText(text: unknown, options: SanitizeTextOptions = {}): string {
  const { maxLength = 10000, allowNewlines = true, allowHtml = false } = options;

  // Handle non-string input
  if (text === null || text === undefined) {
    return '';
  }

  if (typeof text !== 'string') {
    return String(text);
  }

  let sanitized = text;

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove path traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/\/\/+/g, '/');

  // Remove HTML tags if not allowed
  if (!allowHtml) {
    // Remove script tags and event handlers
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/<[^>]+>/g, '');
  }

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Normalize whitespace
  sanitized = sanitized.replace(/\r\n/g, '\n');
  sanitized = sanitized.replace(/\r/g, '\n');

  // Remove newlines if not allowed
  if (!allowNewlines) {
    sanitized = sanitized.replace(/\n/g, ' ');
  }

  // Normalize multiple spaces to single space
  sanitized = sanitized.replace(/[ \t]+/g, ' ');

  // Trim
  sanitized = sanitized.trim();

  // Limit length
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

/**
 * Sanitize URL to prevent XSS
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: unknown): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let sanitized = url.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/data:/gi, '');

  // Remove path traversal
  sanitized = sanitized.replace(/\.\./g, '');

  // Basic URL validation (must start with http:// or https://)
  if (!/^https?:\/\//i.test(sanitized)) {
    return '';
  }

  return sanitized;
}

/**
 * Sanitize filename to prevent path traversal
 * @param filename - Filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: unknown): string {
  if (!filename || typeof filename !== 'string') {
    return 'untitled';
  }

  let sanitized = filename.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove path separators
  sanitized = sanitized.replace(/[/\\]/g, '');

  // Remove path traversal
  sanitized = sanitized.replace(/\.\./g, '');

  // Remove leading/trailing dots and dashes
  sanitized = sanitized.replace(/^[.-]+|[.-]+$/g, '');

  // Remove multiple consecutive dashes
  sanitized = sanitized.replace(/-{2,}/g, '-');

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.slice(0, 255);
  }

  return sanitized || 'untitled';
}
