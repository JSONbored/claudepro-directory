"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// Import PrismaClient from default Prisma location
var client_1 = require("@prisma/client");
// Import PostgreSQL adapter (Prisma 7.1.0+ requirement)
var adapter_pg_1 = require("@prisma/adapter-pg");
var pg_1 = require("pg");
var shared_runtime_1 = require("@heyclaude/shared-runtime");
var env_1 = require("@heyclaude/shared-runtime/schemas/env");
// Initialize Infisical secrets before Prisma client creation
// This ensures database connection strings are available from Infisical if enabled
// Fire-and-forget: If Infisical fails, env will fallback to process.env
if (typeof process !== 'undefined' && process.env) {
    // Trigger lazy initialization (non-blocking)
    // First env access will use process.env, subsequent accesses will use Infisical cache
    void Promise.resolve().then(function () { return require('@heyclaude/shared-runtime/infisical/cache'); }).then(function (cacheModule) {
        return cacheModule.initializeInfisicalSecrets([
            'POSTGRES_PRISMA_URL',
            'DIRECT_URL',
            'SUPABASE_SERVICE_ROLE_KEY',
        ]);
    }).catch(function () {
        // Silently fail - fallback to process.env
    });
}
var globalForPrisma = globalThis;
/**
 * Check if we're running in Cloudflare Workers
 * Cloudflare Workers don't have process.env or have a different globalThis structure
 */
function isCloudflareWorkers() {
    // Cloudflare Workers have navigator but no process.env (or process.env is limited)
    // Also check for Cloudflare-specific globals
    return (typeof globalThis.navigator !== 'undefined' &&
        (typeof process === 'undefined' || typeof process.env === 'undefined' || !process.env['NODE_ENV']));
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
exports.prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : (function () {
    // In Cloudflare Workers, don't create PrismaClient (will be injected via services)
    // This check prevents PrismaClient creation during Cloudflare Workers bundling
    if (isCloudflareWorkers()) {
        // Return a dummy object that will throw if used
        // This prevents the module from being evaluated during bundling
        throw new Error('PrismaClient is not available in Cloudflare Workers. Use createPrismaClient from @heyclaude/cloudflare-runtime instead.');
    }
    // Get POSTGRES_PRISMA_URL from environment (transaction mode, port 6543)
    // During build time or tests, POSTGRES_PRISMA_URL may not be available - handle gracefully
    // Type assertion needed because these are server-only env vars but Prisma client runs at build time
    var dbUrl = env_1.env.POSTGRES_PRISMA_URL;
    // Check both env schema and process.env for test detection (env schema might not have VITEST)
    var isTest = env_1.env.NODE_ENV === 'test' ||
        env_1.env.VITEST === 'true' ||
        env_1.env.VITEST === '1' ||
        (typeof process !== 'undefined' && process.env && (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST === '1'));
    // #region agent log
    if (typeof process !== 'undefined' && process.env) {
        fetch('http://127.0.0.1:7242/ingest/a6ff234e-b9b0-4505-81c3-e5b21fd3c031', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client.ts:90', message: 'Test environment detection', data: { isTest: isTest, nodeEnv: env_1.env.NODE_ENV, processNodeEnv: process.env.NODE_ENV, vitest: process.env.VITEST }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(function () { });
    }
    // #endregion
    // In test environment, Prismocker is used (via __mocks__/@prisma/client.ts)
    // Prismocker doesn't require a connection string, so allow missing POSTGRES_PRISMA_URL
    // However, if POSTGRES_PRISMA_URL is provided (via Infisical), use it
    var connectionString;
    if (isTest && !dbUrl) {
        // Test environment without POSTGRES_PRISMA_URL - use dummy value
        // Prismocker will be used instead via __mocks__/@prisma/client.ts
        connectionString = 'postgresql://test:test@localhost:5432/test';
    }
    else if (!dbUrl) {
        // Only throw if we're in Vercel (production deployment) - not during local builds
        // Local builds with Infisical will have POSTGRES_PRISMA_URL injected, so this check is for Vercel only
        if (env_1.env.VERCEL === '1') {
            throw new Error('POSTGRES_PRISMA_URL is required for Prisma Client. Set it in your environment variables.');
        }
        // During local build (even with NODE_ENV=production), allow missing POSTGRES_PRISMA_URL
        // This allows the build to complete even if POSTGRES_PRISMA_URL is not set
        // Runtime errors will still occur if POSTGRES_PRISMA_URL is missing when actually used
        // Use dummy value for build-time
        connectionString = 'postgresql://test:test@localhost:5432/test';
    }
    else {
        // POSTGRES_PRISMA_URL is provided - use it
        connectionString = dbUrl;
    }
    // Diagnostic: Log connection string (sanitized) to verify which database we're connecting to
    // Extract project-ref from Supabase connection string format: postgresql://prisma.[project-ref]:...
    // POSTGRES_PRISMA_URL always uses 'prisma.' prefix for transaction mode (port 6543)
    var projectRefMatch = connectionString.match(/postgresql:\/\/prisma\.([^:]+):/);
    var projectRef = (projectRefMatch === null || projectRefMatch === void 0 ? void 0 : projectRefMatch[1]) || 'unknown';
    if (env_1.env.NODE_ENV === 'development' || env_1.env.PRISMA_DEBUG === 'true' || env_1.env.PRISMA_DEBUG === '1') {
        shared_runtime_1.logger.info({ projectRef: projectRef }, '[Prisma Client] Connecting to Supabase project');
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
            fetch('http://127.0.0.1:7242/ingest/a6ff234e-b9b0-4505-81c3-e5b21fd3c031', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client.ts:145', message: 'BEFORE new PrismaClient({})', data: { isTest: isTest, dbUrl: !!dbUrl, PrismaClientName: client_1.PrismaClient.name, PrismaClientType: typeof client_1.PrismaClient, PrismaClientIsFunction: typeof client_1.PrismaClient === 'function' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' }) }).catch(function () { });
        }
        // #endregion
        var client_2 = new client_1.PrismaClient({}); // PrismockerClient via __mocks__/@prisma/client.ts accepts {}
        // #region agent log
        if (typeof process !== 'undefined' && process.env) {
            fetch('http://127.0.0.1:7242/ingest/a6ff234e-b9b0-4505-81c3-e5b21fd3c031', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client.ts:150', message: 'AFTER new PrismaClient({})', data: { clientType: client_2.constructor.name, clientPrototype: Object.getPrototypeOf(client_2).constructor.name, hasReset: typeof client_2.reset === 'function', clientKeys: Object.keys(client_2).slice(0, 10) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(function () { });
        }
        // #endregion
        return client_2;
    }
    // Create pg Pool for connection pooling with SSL configuration
    // Supabase ALWAYS requires SSL connections, even in development/build
    // Supabase uses self-signed certificates, so we must set rejectUnauthorized: false
    // This is safe because we're connecting to Supabase's managed database
    // 
    // CRITICAL: Always enable SSL and accept self-signed certificates
    // This is required for Supabase connections which use self-signed certs
    var sslConfig = {
        rejectUnauthorized: false, // Accept self-signed certificates (Supabase uses self-signed certs)
    };
    var pool = new pg_1.Pool({
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
    if (env_1.env.NODE_ENV === 'development') {
        pool.on('connect', function (_client) {
            // Connection established - useful for debugging
            // Log connection details in development
            if (env_1.env.PRISMA_DEBUG === 'true' || env_1.env.PRISMA_DEBUG === '1') {
                shared_runtime_1.logger.info({
                    totalCount: pool.totalCount,
                    idleCount: pool.idleCount,
                    waitingCount: pool.waitingCount,
                }, '[Prisma Pool] Client connected');
            }
        });
        pool.on('error', function (err, _client) {
            // Log pool errors for debugging
            // These are unexpected errors on idle clients
            shared_runtime_1.logger.error({
                error: err.message,
                stack: err.stack,
                totalCount: pool.totalCount,
                idleCount: pool.idleCount,
            }, '[Prisma Pool] Unexpected error on idle client');
        });
        pool.on('acquire', function (_client) {
            // Client acquired from pool - useful for monitoring pool usage
            if (env_1.env.PRISMA_DEBUG === 'true' || env_1.env.PRISMA_DEBUG === '1') {
                shared_runtime_1.logger.info({
                    totalCount: pool.totalCount,
                    idleCount: pool.idleCount,
                    waitingCount: pool.waitingCount,
                }, '[Prisma Pool] Client acquired');
            }
        });
        pool.on('remove', function (_client) {
            // Client removed from pool - useful for debugging
            if (env_1.env.PRISMA_DEBUG === 'true' || env_1.env.PRISMA_DEBUG === '1') {
                shared_runtime_1.logger.info({
                    totalCount: pool.totalCount,
                    idleCount: pool.idleCount,
                }, '[Prisma Pool] Client removed');
            }
        });
    }
    // Create Prisma adapter with pg Pool
    var adapter = new adapter_pg_1.PrismaPg(pool);
    // Initialize Prisma Client with adapter
    // Production/development: use full config with adapter and log
    var clientConfig = {
        adapter: adapter,
        log: env_1.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    };
    var client = new client_1.PrismaClient(clientConfig);
    // #region agent log
    if (typeof process !== 'undefined' && process.env) {
        fetch('http://127.0.0.1:7242/ingest/a6ff234e-b9b0-4505-81c3-e5b21fd3c031', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'client.ts:260', message: 'After PrismaClient instantiation', data: { isTest: isTest, clientType: client.constructor.name }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(function () { });
    }
    // #endregion
    return client;
})();
// In development, store the instance globally to reuse across hot reloads
if (env_1.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
// Graceful shutdown handling
if (typeof process !== 'undefined') {
    process.on('beforeExit', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.prisma.$disconnect()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    process.on('SIGINT', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.prisma.$disconnect()];
                case 1:
                    _a.sent();
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    }); });
    process.on('SIGTERM', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, exports.prisma.$disconnect()];
                case 1:
                    _a.sent();
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    }); });
}
