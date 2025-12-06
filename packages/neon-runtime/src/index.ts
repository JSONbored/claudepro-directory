/**
 * @heyclaude/neon-runtime
 * 
 * Neon/Prisma runtime package for ClaudePro Directory migration.
 * 
 * This package is completely isolated from the existing Supabase codebase.
 * It will not be used in production until Phase 8 (Cutover).
 * 
 * Provides:
 * - Prisma Client for type-safe ORM queries
 * - Neon Pool via `withClient()` for raw SQL queries (RPC functions, pg_search)
 * - Prisma-based services that replace Supabase services
 * 
 * @see .cursor/neon-migration/ for migration planning documents
 */

// Export Prisma client and raw SQL helper
export { prisma, withClient } from './client';

// Export configuration
export * from './config';

// Export services
export * from './services';

// Export RPC functions and types
export * from './rpc';
export * as RpcTypes from './rpc/types';

// Re-export Prisma types and utilities
// Note: Prisma namespace is available via type imports, not value exports
export * from './types';
