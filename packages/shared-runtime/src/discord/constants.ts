/**
 * Discord Constants
 * 
 * Common constants for Discord embed building and formatting.
 */

/**
 * Discord embed color palette (in decimal format)
 */
export const DISCORD_COLORS = {
  // Brand colors
  brand: {
    orange: 0xff6b35,
    purple: 0x7c3aed,
  },
  
  // Status colors
  status: {
    success: 0x22c55e,  // Green
    warning: 0xf59e0b,  // Amber
    error: 0xef4444,    // Red
    info: 0x3b82f6,     // Blue
    neutral: 0x6b7280,  // Gray
  },
  
  // Content type colors
  content: {
    job: 0xff6b35,         // Brand orange for jobs
    submission: 0x3b82f6,  // Blue for submissions
    announcement: 0x22c55e, // Green for announcements
    changelog: 0x7c3aed,   // Purple for changelog
    error: 0xef4444,       // Red for errors
  },
  
  // Job tier colors
  tier: {
    featured: 0xf59e0b,    // Amber/gold for featured
    standard: 0x3b82f6,    // Blue for standard
  },
} as const;

/**
 * Discord embed field limits
 */
export const DISCORD_LIMITS = {
  title: 256,
  description: 4096,
  fieldName: 256,
  fieldValue: 1024,
  footerText: 2048,
  authorName: 256,
  embedsPerMessage: 10,
  fieldsPerEmbed: 25,
  totalEmbedCharacters: 6000,
} as const;

/**
 * Common emoji constants for Discord messages
 */
export const DISCORD_EMOJI = {
  // Status
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  
  // Content
  job: '💼',
  submission: '📝',
  announcement: '🎉',
  changelog: '📋',
  newContent: '🆕',
  
  // Job fields
  company: '🏢',
  location: '📍',
  salary: '💰',
  type: '💼',
  tier: '⭐',
  
  // Actions
  link: '🔗',
  calendar: '📅',
  clock: '🕐',
} as const;
