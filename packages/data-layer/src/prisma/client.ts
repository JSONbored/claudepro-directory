/**
 * Prisma Client Singleton
 *
 * Provides a singleton Prisma Client instance for use across the application.
 * Uses DATABASE_URL (transaction mode, port 6543) for runtime queries.
 *
 * Note: Prisma Client is NOT isomorphic (doesn't work in Deno/Edge Functions).
 * This is fine because:
 * - Data layer services are used in Next.js (Node.js)
 * - Edge Functions use Prisma client for database operations (Supabase client only for auth/storage)
 * - We can create separate Prisma adapters for different environments
 *
 * Prisma 7.1.0+ requires an adapter for the "client" engine type.
 * We use @prisma/adapter-pg with the pg driver for PostgreSQL.
 */

// Import PrismaClient from generated location
// Use client.ts explicitly for backend (has PrismaClient and all server types)
import { PrismaClient } from '@heyclaude/database-types/prisma/client';
// Prisma namespace is exported from client.ts and used for type annotations

// Import PostgreSQL adapter (Prisma 7.1.0+ requirement)
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { requireEnvVar } from '@heyclaude/shared-runtime';

type PrismaClientInstance = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined;
};

/**
 * Prisma Client singleton instance
 *
 * Reuses the same instance across requests in development to prevent
 * connection pool exhaustion. In production, Next.js handles instance management.
 *
 * Prisma 7.1.0+ requires an adapter when using engine type "client".
 * We use @prisma/adapter-pg with pg Pool for PostgreSQL connection pooling.
 */
export const prisma =
  globalForPrisma.prisma ??
  (() => {
    // Get DATABASE_URL from environment (transaction mode, port 6543)
    const connectionString = requireEnvVar(
      'DATABASE_URL',
      'DATABASE_URL is required for Prisma Client. Set it in your environment variables.'
    );

    // Create pg Pool for connection pooling with SSL configuration
    // Supabase requires SSL connections for security
    const pool = new Pool({
      connectionString,
      ssl: process.env['NODE_ENV'] === 'production' || connectionString.includes('sslmode=require')
        ? { rejectUnauthorized: false } // Supabase uses self-signed certificates
        : undefined, // Allow non-SSL in development if connection string doesn't require it
    });

    // Create Prisma adapter with pg Pool
    const adapter = new PrismaPg(pool);

    // Initialize Prisma Client with adapter
    return new PrismaClient({
      adapter,
      log:
        process.env['NODE_ENV'] === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    });
  })();

// In development, store the instance globally to reuse across hot reloads
if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handling
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });

  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
