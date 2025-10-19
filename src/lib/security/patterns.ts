/**
 * Security Patterns - Shared Regex & Constants
 * Centralized patterns used across validation and sanitization
 * Extracted for DRY principle and easier maintenance
 */

import { VALID_CATEGORIES } from '@/src/lib/config/category-types';

/**
 * Security-focused regex patterns for strict validation
 */
export const VALIDATION_PATTERNS = {
  // Alphanumeric with safe special characters only
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,!?()[\]{}'"]+$/,

  // Strict slug format (URL-safe)
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

  // Content type validation (exact match) - Auto-generated from UNIFIED_CATEGORY_REGISTRY
  CONTENT_TYPE: new RegExp(`^(${VALID_CATEGORIES.join('|')})\\.json$`),

  // File extensions (security-focused)
  SAFE_FILE_EXT: /^[a-zA-Z0-9_-]+\.(json|md|txt|yaml|yml)$/i,

  // Version strings (semantic versioning)
  VERSION:
    /^v?(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*))?(?:\+([a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*))?$/,

  // UUID format
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  // Email (strict RFC 5322 subset)
  EMAIL:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  // URL (strict HTTP/HTTPS only)
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/,

  // GitHub URL specifically
  GITHUB_URL: /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(?:\/.*)?$/,

  // IP address (IPv4 and IPv6)
  IP_ADDRESS:
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,

  // Safe search query (no SQL injection patterns)
  SEARCH_QUERY: /^[a-zA-Z0-9\s\-_.,!?()[\]{}'"]*$/,

  // Cache keys (Redis-safe)
  CACHE_KEY: /^[a-zA-Z0-9:_-]{1,250}$/,

  // Auth tokens (base64 format)
  AUTH_TOKEN: /^[A-Za-z0-9+/=]{40,2048}$/,
} as const;

/**
 * Sensitive patterns that must be removed from error messages
 * Used by error sanitizer to prevent information disclosure
 */
export const SENSITIVE_PATTERNS = [
  // File system paths (absolute and relative)
  /\/[a-zA-Z0-9_\-/.]+\.(ts|js|tsx|jsx|json|env|config|yaml|yml)/gi,
  /\b[A-Z]:\\[a-zA-Z0-9_\-\\/.]+/gi,
  /\.\.[/\\]([a-zA-Z0-9_\-/\\.])+/gi,
  /\/home\/[a-zA-Z0-9_\-/.]+/gi,
  /\/Users\/[a-zA-Z0-9_\-/.]+/gi,
  /\/var\/[a-zA-Z0-9_\-/.]+/gi,
  /\/tmp\/[a-zA-Z0-9_\-/.]+/gi,

  // Database connection strings and credentials
  /postgres:\/\/[^@]+@[^/]+\/[^?]+/gi,
  /mysql:\/\/[^@]+@[^/]+\/[^?]+/gi,
  /mongodb:\/\/[^@]+@[^/]+\/[^?]+/gi,
  /redis:\/\/[^@]*@?[^/]+\/[0-9]+/gi,
  /\b(user|username|password|passwd|pass|pwd|secret|key|token)[:=]\s*['"]*[a-zA-Z0-9_\-+/=]{4,}['"]*\b/gi,

  // API keys and tokens
  /\b[a-zA-Z0-9_]{32,}\b/g,
  /\bsk-[a-zA-Z0-9]{48,}\b/gi,
  /\bpk-[a-zA-Z0-9]{48,}\b/gi,
  /\bBearer\s+[a-zA-Z0-9_\-+/=]{20,}\b/gi,
  /\bApiKey\s+[a-zA-Z0-9_\-+/=]{20,}\b/gi,

  // Environment variables and configuration
  /process\.env\.[A-Z_]+/gi,
  /\$\{[A-Z_]+\}/gi,

  // IP addresses and ports
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b/g,
  /localhost:\d+/gi,

  // Stack traces and line numbers
  /at\s+[^(]+\([^)]+:\d+:\d+\)/gi,
  /\([^)]+\.(?:ts|js|tsx|jsx):\d+:\d+\)/gi,
] as const;
