/**
 * Tests for Health Check Route
 * 
 * These tests are located externally from the source package to keep
 * packages/mcp-server clean for community distribution.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @prisma/client to use PrismockerClient from __mocks__/@prisma/client.ts
// This must be called before any imports that use PrismaClient
// Vitest will hoist this call to the top of the file
vi.mock('@prisma/client');

import { handleHealth } from '../../../../packages/mcp-server/src/routes/health.js';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

describe('Health Check Route', () => {
  let prismocker: PrismaClient;
  let queryRawSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Prismocker doesn't support queryRaw, so we add it as a mock function
    // The health route uses queryRaw (not $queryRaw)
    queryRawSpy = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
    (prismocker as any).queryRaw = queryRawSpy;

    vi.clearAllMocks();
  });

  it('should return healthy status when database is available', async () => {
    queryRawSpy.mockResolvedValue([{ '?column?': 1 }]);

    const response = await handleHealth({ prisma: prismocker });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.service).toBe('heyclaude-mcp');
    expect(data.version).toBeDefined();
    expect(data.protocol).toBeDefined();
    expect(data.timestamp).toBeDefined();
    expect(data.dependencies).toBeDefined();
    expect(data.dependencies).toHaveLength(1);
    expect(data.dependencies[0].name).toBe('database');
    expect(data.dependencies[0].status).toBe('healthy');
  });

  it('should return unhealthy status (503) when database check fails', async () => {
    queryRawSpy.mockRejectedValue(new Error('Connection failed'));

    const response = await handleHealth({ prisma: prismocker });
    const data = await response.json();

    // Health route returns 503 when status is 'unhealthy'
    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.dependencies[0].status).toBe('unhealthy');
    expect(data.dependencies[0].message).toContain('Connection failed');
  });

  it('should return degraded status when prisma is not provided', async () => {
    const response = await handleHealth();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('degraded');
    expect(data.dependencies[0].status).toBe('degraded');
    expect(data.dependencies[0].message).toBe('Database health check not available');
  });

  it('should include metrics in response', async () => {
    queryRawSpy.mockResolvedValue([{ '?column?': 1 }]);

    const response = await handleHealth({ prisma: prismocker });
    const data = await response.json();

    expect(data.metrics).toBeDefined();
    expect(data.metrics.cacheSize).toBeDefined();
    expect(data.metrics.toolMetricsCount).toBeDefined();
  });

  it('should set correct CORS headers', async () => {
    queryRawSpy.mockResolvedValue([{ '?column?': 1 }]);

    const response = await handleHealth({ prisma: prismocker });

    expect(response.headers.get('Content-Type')).toBe('application/json');
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

