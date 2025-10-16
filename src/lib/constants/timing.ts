/**
 * Timing Configuration
 * Centralized time constants, delays, timeouts, and animation durations
 *
 * Moved from src/lib/constants.ts for better organization
 * Used across API retry logic, UI interactions, polling, and animations
 *
 * @see src/lib/services - Service retry logic
 * @see src/components - UI animations and transitions
 */

/**
 * Time Constants
 * Common time conversions for consistency across the codebase
 */
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Service Delays Configuration
 * Standardized delays for API calls, retries, and service interactions
 */
export const SERVICE_DELAYS = {
  // API retry delays
  retry: {
    initial: 1000, // 1 second
    exponential: 2000, // Base for exponential backoff
    maximum: 10000, // 10 seconds max
  },
  // Email service delays
  email: {
    send: 1000, // 1 second between sends
    retry: 2000, // 2 seconds on failure
  },
  // External API delays
  api: {
    github: 1000, // 1 second (respect GitHub rate limits)
    resend: 1000, // 1 second between requests
    external: 500, // 500ms default for external APIs
  },
  // Database operation delays
  database: {
    query: 100, // 100ms between queries
    write: 200, // 200ms between writes
    transaction: 500, // 500ms for transaction retry
  },
} as const;

/**
 * Polling Intervals Configuration
 * Standardized intervals for periodic checks and updates
 */
export const POLLING_INTERVALS = {
  // Real-time updates
  realtime: 1000, // 1 second
  // Badge notifications
  badges: 30000, // 30 seconds
  // Status checks
  status: {
    health: 60000, // 1 minute
    api: 30000, // 30 seconds
    database: 120000, // 2 minutes
  },
  // Analytics polling
  analytics: {
    views: 60000, // 1 minute
    stats: 300000, // 5 minutes
  },
} as const;

/**
 * Timeout Configuration
 * Standardized timeouts for various operations
 */
export const TIMEOUTS = {
  // API timeouts
  api: {
    default: 5000, // 5 seconds
    long: 10000, // 10 seconds
    short: 2000, // 2 seconds
  },
  // UI interaction timeouts
  ui: {
    debounce: 150, // Search debounce
    tooltip: 300, // Tooltip delay
    animation: 300, // Animation duration
    transition: 200, // Transition duration
  },
  // Test timeouts
  test: {
    default: 5000, // 5 seconds
    long: 10000, // 10 seconds
    network: 5000, // 5 seconds for network idle
  },
} as const;

/**
 * Animation Durations Configuration
 * Standardized animation durations for consistent UX
 */
export const ANIMATION_DURATIONS = {
  // Number ticker animations
  ticker: {
    default: 1500, // 1.5 seconds
    fast: 1000, // 1 second
    slow: 2000, // 2 seconds
  },
  // Stagger delays for sequential animations
  stagger: {
    fast: 100, // 100ms between items
    medium: 200, // 200ms between items
    slow: 300, // 300ms between items
  },
  // Border beam animations
  beam: {
    default: 15000, // 15 seconds (from border-beam component)
  },
} as const;
