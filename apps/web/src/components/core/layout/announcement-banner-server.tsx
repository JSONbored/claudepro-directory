/**
 * Announcement Banner Server Data - ISR-compatible with edge-layer caching
 * Uses anonymous client for static/ISR pages
 * Database-first: Uses generated types directly from @heyclaude/database-types
 * Edge caching: Static config-controlled TTL for global cache
 *
 * NOTE: This file now just re-exports the factory-created function.
 * Error handling and caching are handled by the factory function itself.
 */

// Re-export the factory-created function - it already has error handling and caching
export { getActiveAnnouncement } from '@heyclaude/web-runtime/data/announcements';
