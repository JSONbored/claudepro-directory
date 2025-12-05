/**
 * Discord Sanitization Utilities
 * 
 * Functions for safely formatting user-provided content for Discord embeds.
 * Prevents markdown injection, link spoofing, and excessive content.
 */

import { DISCORD_LIMITS } from './constants.ts';

/**
 * Sanitize a string for safe use in Discord embeds
 * 
 * - Removes markdown link syntax that could be used for link injection
 * - Truncates to specified maxLength
 * - Handles null/undefined gracefully
 * 
 * @param str - String to sanitize
 * @param maxLength - Maximum length (default: 200)
 * @returns Sanitized string
 */
export function sanitizeForDiscord(str: string | null | undefined, maxLength = 200): string {
  if (!str) return '';
  
  // Remove markdown link syntax [text](url) to prevent link injection
  // Keep the text part, discard the URL
  let sanitized = str.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1');
  
  // Remove any remaining raw URLs that could be misleading
  // This is optional - uncomment if needed
  // sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '[link removed]');
  
  // Escape backticks to prevent code block injection
  sanitized = sanitized.replace(/`/g, "'");
  
  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength - 3) + '...';
  }
  
  return sanitized;
}

/**
 * Sanitize text for Discord embed title
 * 
 * @param title - Title string to sanitize
 * @returns Sanitized title string
 */
export function sanitizeEmbedTitle(title: string | null | undefined): string {
  return sanitizeForDiscord(title, DISCORD_LIMITS.title);
}

/**
 * Sanitize text for Discord embed description
 * 
 * @param description - Description string to sanitize
 * @returns Sanitized description string
 */
export function sanitizeEmbedDescription(description: string | null | undefined): string {
  return sanitizeForDiscord(description, DISCORD_LIMITS.description);
}

/**
 * Sanitize text for Discord embed field value
 * 
 * @param value - Field value string to sanitize
 * @returns Sanitized field value string
 */
export function sanitizeFieldValue(value: string | null | undefined): string {
  return sanitizeForDiscord(value, DISCORD_LIMITS.fieldValue);
}

/**
 * Validate a slug for use in URLs
 * 
 * Checks if the slug contains only valid URL-safe characters
 * to prevent URL injection attacks.
 * 
 * @param slug - Slug to validate
 * @returns true if valid, false otherwise
 */
export function isValidSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  // Allow alphanumeric, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(slug);
}

/**
 * Sanitize error text for Discord code blocks
 * 
 * Prevents code block injection by replacing triple backticks
 * with single quotes.
 * 
 * @param errorText - Error text to sanitize
 * @param maxLength - Maximum length (default: 1000)
 * @returns Sanitized error text safe for code blocks
 */
export function sanitizeErrorForCodeBlock(errorText: string, maxLength = 1000): string {
  // Replace triple backticks with single quotes to prevent code block injection
  let sanitized = errorText.replace(/```/g, "'''");
  
  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength - 3) + '...';
  }
  
  return sanitized;
}
