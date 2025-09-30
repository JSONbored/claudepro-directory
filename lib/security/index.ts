/**
 * Security Module - Barrel Export
 * Unified security, validation, and sanitization system
 *
 * Usage:
 * ```typescript
 * import { validation, sanitizeApiError, DOMPurify } from '@/lib/security';
 * ```
 *
 * Architecture:
 * - patterns.ts: Shared regex patterns and constants
 * - validators.ts: Input validation with Zod
 * - error-sanitizer.ts: Error sanitization for API responses
 * - html-sanitizer.ts: HTML/XSS sanitization
 */

// Error sanitization (from error-sanitizer.ts)
export {
  ErrorSanitizer,
  type ErrorSeverity,
  errorSanitizer,
  isSanitizedError,
  sanitizeApiError,
} from './error-sanitizer';
// HTML sanitization (from html-sanitizer.ts)
export { DOMPurify, sanitizeHtml, stripHtmlTags } from './html-sanitizer';
// Shared patterns
export {
  HTML_PATTERNS,
  SAFE_HTML_ATTRIBUTES,
  SAFE_HTML_TAGS,
  SENSITIVE_PATTERNS,
  VALIDATION_PATTERNS,
} from './patterns';
// Input validation (from validators.ts)
// Re-export commonly used functions for convenience
// Default export
export {
  apiSchemas,
  baseSchemas,
  contentSchemas,
  sanitizers,
  sanitizeSearchQuery,
  transforms,
  ValidationError,
  validation,
  validation as default,
} from './validators';
