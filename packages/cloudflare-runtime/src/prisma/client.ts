/**
 * Prisma Client Factory for Cloudflare Workers
 *
 * Creates a Prisma Client instance configured for Cloudflare Workers with Hyperdrive.
 * Uses @prisma/adapter-pg with pg Pool for PostgreSQL connection pooling.
 *
 * IMPORTANT: This is a factory function, not a singleton, because:
 * - Cloudflare Workers don't have a global state that persists across requests
 * - Each request may need its own Prisma client instance
 * - Hyperdrive connection string is provided via binding, not env var
 *
 * Usage:
 * ```typescript
 * const prisma = createPrismaClient(env.HYPERDRIVE);
 * const users = await prisma.user.findMany();
 * ```
 */

// Import PrismaClient directly from ESM file to avoid CommonJS wrapper issues in Cloudflare Workers
// @prisma/client resolves to node_modules/.prisma/client which has CommonJS wrappers
// We need to import from the ESM file directly
import { PrismaClient } from '@prisma/client/default';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import type { Hyperdrive } from '@cloudflare/workers-types';

/**
 * Create a Prisma Client instance for Cloudflare Workers
 *
 * @param hyperdrive - Hyperdrive binding from Cloudflare Workers env
 * @returns Prisma Client instance configured with Hyperdrive
 */
export function createPrismaClient(hyperdrive: Hyperdrive): PrismaClient {
  // Get connection string from Hyperdrive binding
  // Hyperdrive provides a connection string that includes connection pooling
  const connectionString = hyperdrive.connectionString;

  // Create pg Pool for connection pooling
  // Hyperdrive handles connection pooling, so we use a smaller pool
  const pool = new Pool({
    connectionString,
    // Hyperdrive handles connection pooling, so we use minimal pool settings
    max: 10, // Maximum connections (Hyperdrive manages the actual pool)
    min: 1, // Minimum connections
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Return error after 10s if connection cannot be established
    // SSL is handled by Hyperdrive automatically
  });

  // Create Prisma adapter with pg Pool
  const adapter = new PrismaPg(pool);

  // Initialize Prisma Client with adapter
  return new PrismaClient({
    adapter,
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}
