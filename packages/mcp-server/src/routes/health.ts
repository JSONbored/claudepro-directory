/**
 * Health Check Endpoint
 *
 * Returns server health, version information, and dependency status.
 * Enhanced with dependency health checks for better observability.
 */

import { MCP_SERVER_VERSION, MCP_PROTOCOL_VERSION } from '../lib/types.js';
// Note: Metrics and cache stats are optional (may not be available in all runtimes)
// Use dynamic imports to avoid module resolution issues
async function getMetrics() {
  try {
    const { getAllToolMetrics } = await import('../observability/metrics.js');
    return getAllToolMetrics();
  } catch {
    return [];
  }
}

async function getCacheStats() {
  try {
    const { getCacheStats: getStats } = await import('../middleware/request-deduplication.js');
    return getStats();
  } catch {
    return { size: 0 };
  }
}

/**
 * Dependency health status
 */
interface DependencyHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  lastChecked?: number;
}

/**
 * Health check result
 */
interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'unhealthy';
  service: string;
  version: string;
  protocol: string;
  timestamp: string;
  dependencies?: DependencyHealth[];
  metrics?: {
    cacheSize: number;
    toolMetricsCount: number;
  };
}

/**
 * Check database connectivity (placeholder - implement based on runtime)
 *
 * @param prisma - Prisma client (optional, for database check)
 * @returns Dependency health status
 */
async function checkDatabaseHealth(prisma?: unknown): Promise<DependencyHealth> {
  // If Prisma client is available, check connectivity
  if (prisma && typeof prisma === 'object' && 'queryRaw' in prisma) {
    try {
      // Simple connectivity check
      await (prisma as { queryRaw: (query: string) => Promise<unknown[]> }).queryRaw('SELECT 1');
      return {
        name: 'database',
        status: 'healthy',
        lastChecked: Date.now(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database connection failed',
        lastChecked: Date.now(),
      };
    }
  }

  // Database check not available
  return {
    name: 'database',
    status: 'degraded',
    message: 'Database health check not available',
    lastChecked: Date.now(),
  };
}

/**
 * Handle health check request
 *
 * @param options - Health check options
 * @param options.prisma - Prisma client (optional, for database health check)
 * @returns Health check response
 */
export async function handleHealth(options: { prisma?: unknown } = {}): Promise<Response> {
  const { prisma } = options;

  // Check dependencies
  const dependencies: DependencyHealth[] = [];

  // Database health check
  const dbHealth = await checkDatabaseHealth(prisma);
  dependencies.push(dbHealth);

  // Determine overall status
  const hasUnhealthy = dependencies.some((dep) => dep.status === 'unhealthy');
  const hasDegraded = dependencies.some((dep) => dep.status === 'degraded');
  const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'ok';

  // Get metrics (if available)
  const toolMetrics = await getMetrics();
  const cacheStats = await getCacheStats();

  const healthResult: HealthCheckResult = {
    status: overallStatus,
    service: 'heyclaude-mcp',
    version: MCP_SERVER_VERSION,
    protocol: MCP_PROTOCOL_VERSION,
    timestamp: new Date().toISOString(),
    dependencies,
    metrics: {
      cacheSize: cacheStats.size,
      toolMetricsCount: toolMetrics.length,
    },
  };

  // Return appropriate status code
  const statusCode = overallStatus === 'unhealthy' ? 503 : overallStatus === 'degraded' ? 200 : 200;

  return new Response(JSON.stringify(healthResult), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
