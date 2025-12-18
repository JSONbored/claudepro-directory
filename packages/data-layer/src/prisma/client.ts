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
    let connectionString = requireEnvVar(
      'DATABASE_URL',
      'DATABASE_URL is required for Prisma Client. Set it in your environment variables.'
    );

    // Parse and normalize connection string for SSL configuration
    // Remove sslmode from connection string to avoid conflicts with Pool SSL config
    // We'll handle SSL via Pool config instead of connection string params
    // Note: URL constructor doesn't support postgresql:// protocol, so we parse manually
    const urlMatch = connectionString.match(/^(postgresql:\/\/[^?]+)(\?.*)?$/);
    if (urlMatch && urlMatch[1]) {
      const baseUrl = urlMatch[1];
      const queryString = urlMatch[2] || '';
      const params = new URLSearchParams(queryString.replace(/^\?/, ''));
      params.delete('sslmode'); // Remove sslmode - we handle SSL via Pool config
      const newQuery = params.toString();
      connectionString = newQuery ? `${baseUrl}?${newQuery}` : baseUrl;
    }

    // Create pg Pool for connection pooling with SSL configuration
    // Supabase ALWAYS requires SSL connections, even in development/build
    // Supabase uses self-signed certificates, so we must set rejectUnauthorized: false
    // This is safe because we're connecting to Supabase's managed database
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Always enable SSL for Supabase (required for all connections)
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
