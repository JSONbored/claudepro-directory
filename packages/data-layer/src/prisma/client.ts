/**
 * Prisma Client Singleton
 *
 * Provides a singleton Prisma Client instance for use across the application.
 * Uses POSTGRES_PRISMA_URL (transaction mode, port 6543) for runtime queries.
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

// Import PrismaClient from default Prisma location
// In test environment, Jest automatically uses __mocks__/@prisma/client.ts
// which provides PrismockerClient instead of the real PrismaClient
import { PrismaClient } from '@prisma/client';

// Import PostgreSQL adapter (Prisma 7.1.0+ requirement)
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { logger } from '@heyclaude/shared-runtime';
import { env } from '@heyclaude/shared-runtime/schemas/env';

// Initialize Infisical secrets before Prisma client creation
// This ensures database connection strings are available from Infisical if enabled
// Fire-and-forget: If Infisical fails, env will fallback to process.env
if (typeof process !== 'undefined' && process.env) {
  // Trigger lazy initialization (non-blocking)
  // First env access will use process.env, subsequent accesses will use Infisical cache
  void import('@heyclaude/shared-runtime/infisical/cache')
    .then((cacheModule) => {
      return cacheModule.initializeInfisicalSecrets([
        'POSTGRES_PRISMA_URL',
        'DIRECT_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
      ]);
    })
    .catch(() => {
      // Silently fail - fallback to process.env
    });
}

type PrismaClientInstance = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined;
};

/**
 * Check if we're running in Cloudflare Workers
 * Cloudflare Workers don't have process.env or have a different globalThis structure
 */
function isCloudflareWorkers(): boolean {
  // Cloudflare Workers have navigator but no process.env (or process.env is limited)
  // Also check for Cloudflare-specific globals
  return (
    typeof globalThis.navigator !== 'undefined' &&
    (typeof process === 'undefined' ||
      typeof process.env === 'undefined' ||
      !process.env['NODE_ENV'])
  );
}

/**
 * Prisma Client singleton instance
 *
 * Reuses the same instance across requests in development to prevent
 * connection pool exhaustion. In production, Next.js handles instance management.
 *
 * Prisma 7.1.0+ requires an adapter when using engine type "client".
 * We use @prisma/adapter-pg with pg Pool for PostgreSQL connection pooling.
 *
 * NOTE: In Cloudflare Workers, this will throw an error during module evaluation.
 * This is expected - Cloudflare Workers should use createPrismaClient from @heyclaude/cloudflare-runtime.
 */
export const prisma =
  globalForPrisma.prisma ??
  (() => {
    // In Cloudflare Workers, don't create PrismaClient (will be injected via services)
    // This check prevents PrismaClient creation during Cloudflare Workers bundling
    if (isCloudflareWorkers()) {
      // Return a dummy object that will throw if used
      // This prevents the module from being evaluated during bundling
      throw new Error(
        'PrismaClient is not available in Cloudflare Workers. Use createPrismaClient from @heyclaude/cloudflare-runtime instead.'
      );
    }
    // Get POSTGRES_PRISMA_URL from environment (transaction mode, port 6543)
    // During build time or tests, POSTGRES_PRISMA_URL may not be available - handle gracefully
    // Type assertion needed because these are server-only env vars but Prisma client runs at build time
    const dbUrl = (env as { POSTGRES_PRISMA_URL?: string }).POSTGRES_PRISMA_URL;
    // Check both env schema and process.env for test detection (env schema might not have VITEST)
    const isTest =
      env.NODE_ENV === 'test' ||
      (env as { VITEST?: string }).VITEST === 'true' ||
      (env as { VITEST?: string }).VITEST === '1' ||
      (typeof process !== 'undefined' &&
        process.env &&
        (process.env['NODE_ENV'] === 'test' ||
          process.env['VITEST'] === 'true' ||
          process.env['VITEST'] === '1'));

    // #region agent log
    if (typeof process !== 'undefined' && process.env) {
      fetch('http://127.0.0.1:7242/ingest/a6ff234e-b9b0-4505-81c3-e5b21fd3c031', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'client.ts:90',
          message: 'Test environment detection',
          data: {
            isTest,
            nodeEnv: env.NODE_ENV,
            processNodeEnv: process.env['NODE_ENV'],
            vitest: process.env['VITEST'],
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'A',
        }),
      }).catch(() => {});
    }
    // #endregion

    // In test environment, Prismocker is used (via __mocks__/@prisma/client.ts)
    // Prismocker doesn't require a connection string, so allow missing POSTGRES_PRISMA_URL
    // However, if POSTGRES_PRISMA_URL is provided (via Infisical), use it
    let connectionString: string;
    if (isTest && !dbUrl) {
      // Test environment without POSTGRES_PRISMA_URL - use dummy value
      // Prismocker will be used instead via __mocks__/@prisma/client.ts
      connectionString = 'postgresql://test:test@localhost:5432/test';
    } else if (!dbUrl) {
      // Only throw if we're in Vercel (production deployment) - not during local builds
      // Local builds with Infisical will have POSTGRES_PRISMA_URL injected, so this check is for Vercel only
      if (env.VERCEL === '1') {
        throw new Error(
          'POSTGRES_PRISMA_URL is required for Prisma Client. Set it in your environment variables.'
        );
      }
      // During local build (even with NODE_ENV=production), allow missing POSTGRES_PRISMA_URL
      // This allows the build to complete even if POSTGRES_PRISMA_URL is not set
      // Runtime errors will still occur if POSTGRES_PRISMA_URL is missing when actually used
      // Use dummy value for build-time
      connectionString = 'postgresql://test:test@localhost:5432/test';
    } else {
      // POSTGRES_PRISMA_URL is provided - use it
      connectionString = dbUrl;
    }

    // Diagnostic: Log connection string (sanitized) to verify which database we're connecting to
    // Extract project-ref from Supabase connection string format: postgresql://prisma.[project-ref]:...
    // POSTGRES_PRISMA_URL always uses 'prisma.' prefix for transaction mode (port 6543)
    const projectRefMatch = connectionString.match(/postgresql:\/\/prisma\.([^:]+):/);
    const projectRef = projectRefMatch?.[1] || 'unknown';

    if (
      env.NODE_ENV === 'development' ||
      (env as { PRISMA_DEBUG?: string }).PRISMA_DEBUG === 'true' ||
      (env as { PRISMA_DEBUG?: string }).PRISMA_DEBUG === '1'
    ) {
      logger.info({ projectRef }, '[Prisma Client] Connecting to Supabase project');
    }

    // Use connection string exactly as provided by Infisical
    // The connection string already contains all necessary SSL and connection parameters
    // Do NOT modify the connection string - use it as-is

    // In test environment, skip creating Pool and adapter (Prismocker doesn't need them)
    // PrismockerClient (via __mocks__/@prisma/client.ts) accepts empty object {} but not adapter or log config
    // NOTE: Even if POSTGRES_PRISMA_URL is set (via vitest.setup.ts), we should use Prismocker in test mode
    if (isTest) {
      // #region agent log
      if (typeof process !== 'undefined' && process.env) {
        fetch('http://127.0.0.1:7242/ingest/a6ff234e-b9b0-4505-81c3-e5b21fd3c031', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'client.ts:145',
            message: 'BEFORE new PrismaClient({})',
            data: {
              isTest,
              dbUrl: !!dbUrl,
              PrismaClientName: PrismaClient.name,
              PrismaClientType: typeof PrismaClient,
              PrismaClientIsFunction: typeof PrismaClient === 'function',
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'C',
          }),
        }).catch(() => {});
      }
      // #endregion
      const client = new PrismaClient({} as any); // PrismockerClient via __mocks__/@prisma/client.ts accepts {}
      // #region agent log
      if (typeof process !== 'undefined' && process.env) {
        fetch('http://127.0.0.1:7242/ingest/a6ff234e-b9b0-4505-81c3-e5b21fd3c031', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'client.ts:150',
            message: 'AFTER new PrismaClient({})',
            data: {
              clientType: client.constructor.name,
              clientPrototype: Object.getPrototypeOf(client).constructor.name,
              hasReset: typeof (client as any).reset === 'function',
              clientKeys: Object.keys(client).slice(0, 10),
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'D',
          }),
        }).catch(() => {});
      }
      // #endregion
      return client;
    }

    // Create pg Pool for connection pooling with SSL configuration
    // Supabase ALWAYS requires SSL connections, even in development/build
    // Supabase uses self-signed certificates, so we must set rejectUnauthorized: false
    // This is safe because we're connecting to Supabase's managed database
    //
    // CRITICAL: Always enable SSL and accept self-signed certificates
    // This is required for Supabase connections which use self-signed certs
    const sslConfig = {
      rejectUnauthorized: false, // Accept self-signed certificates (Supabase uses self-signed certs)
    };

    const pool = new Pool({
      connectionString: connectionString, // Use connection string exactly as provided by Infisical
      // Always enable SSL and accept self-signed certificates (required for Supabase)
      ssl: sslConfig,
      // OPTIMIZATION: Connection pool configuration for Supabase
      // Supabase connection limits: ~100 connections per database
      // We use conservative limits to prevent connection exhaustion
      max: 20, // Maximum number of clients in the pool (Supabase limit: ~100 connections)
      min: 2, // Minimum number of clients to keep in pool (reduces connection churn)
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return error after 10s if connection cannot be established
    });

    // OPTIMIZATION: Add connection pool monitoring (development only)
    // Enhanced monitoring for better observability and debugging
    if (env.NODE_ENV === 'development') {
      pool.on('connect', (_client) => {
        // Connection established - useful for debugging
        // Log connection details in development
        if (
          (env as { PRISMA_DEBUG?: string }).PRISMA_DEBUG === 'true' ||
          (env as { PRISMA_DEBUG?: string }).PRISMA_DEBUG === '1'
        ) {
          logger.info(
            {
              totalCount: pool.totalCount,
              idleCount: pool.idleCount,
              waitingCount: pool.waitingCount,
            },
            '[Prisma Pool] Client connected'
          );
        }
      });

      pool.on('error', (err, _client) => {
        // Log pool errors for debugging
        // These are unexpected errors on idle clients
        logger.error(
          {
            error: err.message,
            stack: err.stack,
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
          },
          '[Prisma Pool] Unexpected error on idle client'
        );
      });

      pool.on('acquire', (_client) => {
        // Client acquired from pool - useful for monitoring pool usage
        if (
          (env as { PRISMA_DEBUG?: string }).PRISMA_DEBUG === 'true' ||
          (env as { PRISMA_DEBUG?: string }).PRISMA_DEBUG === '1'
        ) {
          logger.info(
            {
              totalCount: pool.totalCount,
              idleCount: pool.idleCount,
              waitingCount: pool.waitingCount,
            },
            '[Prisma Pool] Client acquired'
          );
        }
      });

      pool.on('remove', (_client) => {
        // Client removed from pool - useful for debugging
        if (
          (env as { PRISMA_DEBUG?: string }).PRISMA_DEBUG === 'true' ||
          (env as { PRISMA_DEBUG?: string }).PRISMA_DEBUG === '1'
        ) {
          logger.info(
            {
              totalCount: pool.totalCount,
              idleCount: pool.idleCount,
            },
            '[Prisma Pool] Client removed'
          );
        }
      });
    }

    // Create Prisma adapter with pg Pool
    const adapter = new PrismaPg(pool);

    // Initialize Prisma Client with adapter
    // Production/development: use full config with adapter and log
    const clientConfig: { adapter: typeof adapter; log: string[] } = {
      adapter,
      log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    };
    const client = new PrismaClient(clientConfig as any);

    // #region agent log
    if (typeof process !== 'undefined' && process.env) {
      fetch('http://127.0.0.1:7242/ingest/a6ff234e-b9b0-4505-81c3-e5b21fd3c031', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'client.ts:260',
          message: 'After PrismaClient instantiation',
          data: { isTest, clientType: client.constructor.name },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        }),
      }).catch(() => {});
    }
    // #endregion
    return client;
  })();

// In development, store the instance globally to reuse across hot reloads
if (env.NODE_ENV !== 'production') {
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
