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
 * Requirements:
 * - wrangler.jsonc must have `compatibility_flags: ["nodejs_compat"]` enabled
 * - Prisma schema must have `engineType = "client"` and `moduleFormat = "esm"`
 *
 * Usage:
 * ```typescript
 * const prisma = createPrismaClient(env.HYPERDRIVE);
 * const users = await prisma.user.findMany();
 * ```
 */

// Import Node.js globals polyfill FIRST (before Prisma)
// This ensures module and require are available when Prisma's CommonJS wrapper loads
import './node-globals-polyfill.js';

// Import PrismaClient from standard @prisma/client package
// With nodejs_compat, Cloudflare Workers supports Node.js APIs
// Prisma's runtime uses import.meta.url which should be available with nodejs_compat
// Note: Prisma's package.json selects default.js (CommonJS) for workerd condition,
// but with nodejs_compat, Node.js globals (module, require) should be available
import { PrismaClient } from '@prisma/client';
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a6ff234e-b9b0-4505-81c3-e5b21fd3c031',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma/client.ts:40',message:'createPrismaClient entry',data:{hasHyperdrive:!!hyperdrive,hasConnectionString:!!hyperdrive?.connectionString},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a6ff234e-b9b0-4505-81c3-e5b21fd3c031',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma/client.ts:61',message:'Before PrismaClient instantiation',data:{hasAdapter:!!adapter,adapterType:adapter?.constructor?.name,hasConnectionString:!!connectionString},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  // Initialize Prisma Client with adapter
  try {
    const client = new PrismaClient({
    adapter,
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a6ff234e-b9b0-4505-81c3-e5b21fd3c031',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma/client.ts:69',message:'PrismaClient created successfully',data:{hasClient:!!client},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return client;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a6ff234e-b9b0-4505-81c3-e5b21fd3c031',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma/client.ts:75',message:'PrismaClient creation failed',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined,errorName:error instanceof Error?error.name:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}
