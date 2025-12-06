/**
 * Prisma Client and Neon Pool for PostgreSQL
 * 
 * This setup provides:
 * - Prisma Client for type-safe ORM queries
 * - Neon Pool for raw SQL queries (RPC functions, pg_search, etc.)
 * 
 * IMPORTANT: This is completely isolated from the existing Supabase client.
 * It will not interfere with production until Phase 8 (Cutover).
 * 
 * @see https://neon.tech/docs/guides/prisma for Neon/Prisma best practices
 */

import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import type { PoolClient } from 'pg';
import { getNeonDatabaseUrl, validateNeonConnection } from './config/env';

// Configure Neon for Node.js environment (WebSocket support)
// This is needed for server-side usage
if (typeof window === 'undefined') {
  // Dynamic import to avoid bundling issues
  import('ws')
    .then((ws) => {
      neonConfig.webSocketConstructor = ws.default;
    })
    .catch((error) => {
      console.warn('[neon-runtime] Could not load ws module for WebSocket support:', error);
    });
}

// Get and validate connection string
const connectionString = getNeonDatabaseUrl();
validateNeonConnection(connectionString);

// Global Prisma client instance (for development hot-reload)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Prisma Client instance for Neon database
 * 
 * Use this for type-safe ORM queries:
 * ```typescript
 * import { prisma } from '@heyclaude/neon-runtime/client';
 * 
 * const users = await prisma.user.findMany();
 * ```
 */
export const prisma: PrismaClient =
  global.prisma ||
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// In development, store in global to prevent multiple instances during hot-reload
if (process.env['NODE_ENV'] !== 'production') {
  global.prisma = prisma;
}

/**
 * Neon connection pool for raw SQL queries
 * 
 * Use this for:
 * - RPC function calls
 * - pg_search queries
 * - Complex SQL that Prisma doesn't support
 * 
 * Example:
 * ```typescript
 * import { withClient } from '@heyclaude/neon-runtime/client';
 * 
 * const result = await withClient(async (client) => {
 *   const { rows } = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
 *   return rows[0];
 * });
 * ```
 */
const pool = new Pool({
  connectionString,
});

/**
 * Execute a callback with a database client from the pool
 * 
 * This provides direct Postgres access through Neon's serverless driver.
 * Critical for operations that require raw SQL beyond Prisma's capabilities:
 * - RPC function calls
 * - pg_search full-text search
 * - Complex queries with custom SQL
 * 
 * @param callback - Function that receives a PoolClient and returns a Promise
 * @returns The result of the callback
 * 
 * @example
 * ```typescript
 * const result = await withClient(async (client) => {
 *   const { rows } = await client.query('SELECT * FROM content WHERE slug = $1', [slug]);
 *   return rows[0];
 * });
 * ```
 */
export async function withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = (await pool.connect()) as PoolClient;
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
    await pool.end();
  });
}
