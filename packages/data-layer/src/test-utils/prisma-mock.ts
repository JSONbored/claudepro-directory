/**
 * Prisma Mock Utilities for Testing
 *
 * Provides mock factories and utilities for testing Prisma-based services.
 * Uses Prismock for in-memory Prisma Client that reads schema.prisma.
 *
 * Uses default Prismock implementation with @prisma/client.
 *
 * WORKAROUND: Prismock 1.35.4 has a compatibility issue with Prisma 7.2.0.
 * PrismockClient tries to access `instance.dmmf.datamodel.models` but Prisma 7
 * doesn't expose `dmmf` the same way. We use `generatePrismockSync` (deprecated
 * but functional) and create model clients manually to provide the expected API.
 */

import { vi } from 'vitest';
import { generatePrismockSync } from 'prismock';
import { PrismaClient } from '@prisma/client';

/**
 * Create a mock Prisma Client instance using Prismock
 *
 * WORKAROUND for Prismock 1.35.4 + Prisma 7.2.0 compatibility:
 * - PrismockClient and createPrismock both fail with "Cannot read properties of undefined (reading 'datamodel')"
 * - generatePrismockSync works but returns getData/setData API instead of model clients
 * - We use generatePrismockSync and manually create model clients with Vitest mocks
 *
 * IMPORTANT: This function must be called AFTER @prisma/client is fully loaded.
 * In test files, use lazy getter pattern in vi.mock() to ensure proper initialization order.
 *
 * Note: Prismock doesn't support $queryRawUnsafe for RPC calls, so we add
 * a mock for that method which is used by BasePrismaService.callRpc().
 *
 * @example
 * ```typescript
 * const mockPrisma = createMockPrismaClient();
 * mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: '123', name: 'Test' }]);
 * mockPrisma.category_configs.findMany.mockResolvedValue([{ id: '1', name: 'Test' }]);
 * ```
 */
export function createMockPrismaClient(): any {
  // Ensure @prisma/client is imported and loaded
  // Reference PrismaClient to ensure it's loaded before Prismock tries to read datamodel
  void PrismaClient;
  
  // Use generatePrismockSync (deprecated but works with Prisma 7)
  // This successfully reads the datamodel from PrismaClient
  // Type assertion needed because generatePrismockSync expects OptionsSync but PrismaClient works
  const prismockData = generatePrismockSync(PrismaClient as any);
  
  // Get model names - use comprehensive fallback list
  // In Prisma 7, accessing _runtimeDataModel requires instantiating PrismaClient
  // which is complex, so we use a known list of model names
  
  // Create PrismaClient-like interface with model clients
  // Start with prismockData but ensure we can add our own model clients
  const prismock = Object.assign({}, prismockData) as any;
  
  // Get model names - use comprehensive fallback list
  // In Prisma 7, accessing _runtimeDataModel requires instantiating PrismaClient
  // which is complex, so we use a known list of model names
  // Model names must match the exact table names from schema.prisma (snake_case)
  // These are the models actually used in service tests
  const modelNames = [
    'account',
    'bookmarks', // Table name is 'bookmarks' (plural)
    'category_configs',
    'changelog',
    'changelog_entries', // Used by ChangelogService
    'collection',
    'collection_items', // Used by AccountService for user library
    'companies', // Table name is 'companies' (plural)
    'contact_submissions', // Table name is 'contact_submissions' (plural)
    'content',
    'content_submissions', // Used by AccountService for getUserDashboard
    'content_templates',
    'followers', // Used by AccountService for isFollowing methods
    'identities', // Used by AccountService for getUserIdentities
    'jobs', // Table name is 'jobs' (plural)
    'misc',
    'newsletter_subscriptions', // Used by NewsletterService (table name is plural)
    'notifications', // Used by MiscService for getActiveNotifications
    'announcements', // Used by MiscService for getActiveAnnouncement
    'contact_commands', // Used by MiscService for getContactCommands
    'form_field_configs', // Used by MiscService for getFormFieldConfig
    'app_settings', // Used by MiscService for getAppSetting and upsertAppSetting
    'email_engagement_summary', // Used by MiscService for getEmailEngagementSummary and upsertEmailEngagementSummary
    'email_blocklist', // Used by MiscService for upsertEmailBlocklist
    'webhook_events', // Used by MiscService for getWebhookEventBySvixId and insertWebhookEvent
    'public_users', // Used by AccountService
    'review',
    'search',
    'sponsored_content', // Used by AccountService for getSponsorshipAnalytics and getUserSponsorships
    'trending',
    'user',
    'user_collections',
    'user_interactions',
    'payment_plan_catalog', // Used by JobsService for getPaymentPlanCatalog
    'v_content_list_slim', // View: reads from mv_content_list_slim materialized view
    'v_trending_searches', // View: reads from trending_searches materialized view
  ];
  
  // Create model clients for each model using Vitest mocks
  // IMPORTANT: Use vi.fn() and ensure they're properly typed as Vitest mocks
  // This provides the expected Prisma API that tests use and allows vi.mocked() to work
  for (const modelName of modelNames) {
    const modelNameLower = modelName.toLowerCase();
    
    // Create mock functions that vi.mocked() can recognize
    const findManyMock = vi.fn(() => Promise.resolve([]));
    const findFirstMock = vi.fn(() => Promise.resolve(null));
    const findUniqueMock = vi.fn(() => Promise.resolve(null));
    const createMock = vi.fn((_args: any) =>
      Promise.resolve({ ..._args.data, id: _args.data.id || `mock-${Date.now()}-${Math.random()}` })
    );
    const createManyMock = vi.fn((_args: any) => Promise.resolve({ count: _args.data?.length || 0 }));
    const updateMock = vi.fn((_args: any) => Promise.resolve({ ..._args.data }));
    const deleteMock = vi.fn(() => Promise.resolve({}));
    const deleteManyMock = vi.fn(() => Promise.resolve({ count: 0 }));
    const updateManyMock = vi.fn(() => Promise.resolve({ count: 0 }));
    const countMock = vi.fn(() => Promise.resolve({ count: 0 }));
    const upsertMock = vi.fn((_args: any) => Promise.resolve({ ..._args.create }));
    // Aggregate can return _count, _sum, _avg, _min, _max, etc.
    // Default to a structure that works for most cases
    // AccountService accesses _sum.item_count and _sum.view_count
    const aggregateMock = vi.fn(() => Promise.resolve({ 
      _count: { _all: 0 },
      _sum: { item_count: 0, view_count: 0 },
      _avg: {},
      _min: {},
      _max: {},
    }));
    const groupByMock = vi.fn(() => Promise.resolve([]));
    
    prismock[modelNameLower] = {
      findMany: findManyMock,
      findFirst: findFirstMock,
      findUnique: findUniqueMock,
      create: createMock,
      createMany: createManyMock,
      update: updateMock,
      delete: deleteMock,
      deleteMany: deleteManyMock,
      updateMany: updateManyMock,
      count: countMock,
      upsert: upsertMock,
      aggregate: aggregateMock,
      groupBy: groupByMock,
    };
  }
  
  // Add mocks for raw query methods (used by BasePrismaService for RPC calls)
  // Prismock doesn't support these methods, so we mock them with Vitest
  (prismock as any).$queryRawUnsafe = vi.fn();
  (prismock as any).$queryRaw = vi.fn();
  (prismock as any).$executeRawUnsafe = vi.fn();
  (prismock as any).$executeRaw = vi.fn();
  (prismock as any).$transaction = vi.fn();
  
  // Add reset method that clears all model mocks
  (prismock as any).reset = () => {
    // Reset all model clients by clearing their mock implementations
    for (const modelName of modelNames) {
      const modelNameLower = modelName.toLowerCase();
      const modelClient = (prismock as any)[modelNameLower];
      if (modelClient) {
        // Reset all methods
        Object.keys(modelClient).forEach((method) => {
          if (vi.isMockFunction(modelClient[method])) {
            modelClient[method].mockClear();
            // Reset to default return values
            if (method === 'findMany') {
              modelClient[method].mockResolvedValue([]);
            } else if (method === 'findFirst' || method === 'findUnique') {
              modelClient[method].mockResolvedValue(null);
            } else if (method === 'create') {
              modelClient[method].mockImplementation((args: any) =>
                Promise.resolve({ ...args.data, id: args.data.id || `mock-${Date.now()}` })
              );
            } else if (method === 'createMany') {
              modelClient[method].mockImplementation((args: any) =>
                Promise.resolve({ count: args.data?.length || 0 })
              );
            } else if (method === 'deleteMany' || method === 'updateMany') {
              modelClient[method].mockResolvedValue({ count: 0 });
            } else if (method === 'count') {
              modelClient[method].mockResolvedValue({ count: 0 });
            }
          }
        });
      }
    }
    // Reset raw query methods
    if (vi.isMockFunction((prismock as any).$queryRawUnsafe)) {
      (prismock as any).$queryRawUnsafe.mockClear();
    }
    if (vi.isMockFunction((prismock as any).$queryRaw)) {
      (prismock as any).$queryRaw.mockClear();
    }
  };

  // Store model names for reset functionality
  (prismock as any)._modelNames = modelNames;
  
          // Clean up was already handled in try block
  
  return prismock;
}

/**
 * Create a mock Prisma Client instance (async version - for compatibility)
 *
 * @deprecated Use createMockPrismaClient() instead - no longer needs to be async
 */
export async function createMockPrismaClientAsync(): Promise<any> {
  return createMockPrismaClient();
}

/**
 * Type for mock Prisma Client
 *
 * This is the return type from createMockPrismaClient, which is compatible with PrismaClient.
 */
export type MockPrismaClient = ReturnType<typeof createMockPrismaClient>;

/**
 * Setup Prismock mock for the prisma singleton
 *
 * Use this in test files to mock the prisma singleton from '../prisma/client.ts'
 * Returns a lazy getter that initializes Prismock only when accessed.
 *
 * @example
 * ```typescript
 * // In your test file
 * vi.mock('../prisma/client.ts', async () => {
 *   const { setupPrismockMock } = await import('../test-utils/prisma-mock.ts');
 *   return {
 *     get prisma() {
 *       return setupPrismockMock();
 *     },
 *   };
 * });
 * ```
 */
// Global singleton instance to ensure vi.mocked() can track mocks correctly
let globalPrismockInstance: any = null;

export function setupPrismockMock() {
  // Lazy initialization - create Prismock only when accessed
  // This ensures @prisma/client is fully loaded before Prismock tries to read the datamodel
  // IMPORTANT: Use singleton pattern so vi.mocked() can track the same mock instances
  // This is critical because vi.mocked() needs to reference the exact same function objects
  if (!globalPrismockInstance) {
    globalPrismockInstance = createMockPrismaClient();
  }
  return globalPrismockInstance;
}

/**
 * Reset the global Prismock instance (useful for test cleanup)
 */
export function resetPrismockInstance() {
  globalPrismockInstance = null;
}

/**
 * Setup Prismock mock for the prisma singleton (async version - for compatibility)
 *
 * @deprecated Use setupPrismockMock() instead - no longer needs to be async
 */
export async function setupPrismockMockAsync() {
  return createMockPrismaClient();
}

/**
 * Helper function to seed mock Prisma database with test data
 *
 * @example
 * ```typescript
 * const mockPrisma = await createMockPrismaClientAsync();
 * await seedMockData(mockPrisma, {
 *   users: [{ id: '1', email: 'test@example.com' }],
 *   content: [{ id: '1', title: 'Test Content' }],
 * });
 * ```
 */
export async function seedMockData(
  mockPrisma: MockPrismaClient,
  data: Record<string, any[]>
): Promise<void> {
  for (const [model, records] of Object.entries(data)) {
    const modelClient = (mockPrisma as any)[model];
    if (modelClient && typeof modelClient.createMany === 'function') {
      await modelClient.createMany({ data: records });
    } else {
      // Fallback: create records individually
      for (const record of records) {
        await modelClient.create({ data: record });
      }
    }
  }
}

/**
 * Helper function to reset mock Prisma database
 *
 * @example
 * ```typescript
 * const mockPrisma = await createMockPrismaClientAsync();
 * await resetMockDatabase(mockPrisma);
 * ```
 */
export async function resetMockDatabase(mockPrisma: MockPrismaClient): Promise<void> {
  // Use the reset method we added
  if (typeof (mockPrisma as any).reset === 'function') {
    (mockPrisma as any).reset();
  }
}

/**
 * Helper function to create a mock RPC response
 *
 * @example
 * ```typescript
 * const mockPrisma = await createMockPrismaClientAsync();
 * mockRpcResponse(mockPrisma, [{ id: '1', name: 'Test' }]);
 * ```
 */
export function mockRpcResponse<T = any>(mockPrisma: MockPrismaClient, data: T[]): void {
  (mockPrisma as any).$queryRawUnsafe.mockResolvedValue(data);
  (mockPrisma as any).$queryRaw.mockResolvedValue(data);
}

/**
 * Helper function to create a mock transaction
 *
 * @example
 * ```typescript
 * const mockPrisma = await createMockPrismaClientAsync();
 * mockTransaction(mockPrisma, async (tx) => {
 *   await tx.user.create({ data: { email: 'test@example.com' } });
 * });
 * ```
 */
export function mockTransaction<T = any>(
  mockPrisma: MockPrismaClient,
  callback: (tx: any) => Promise<T>
): void {
  (mockPrisma as any).$transaction.mockImplementation(callback);
}

/**
 * Helper function to create a factory for common test data
 *
 * @example
 * ```typescript
 * const userFactory = createTestDataFactory('user', {
 *   email: (i) => `user${i}@example.com`,
 *   name: (i) => `User ${i}`,
 * });
 * const users = userFactory.create(3); // Creates 3 users
 * ```
 */
export function createTestDataFactory<T extends Record<string, any>>(
  _model: string,
  defaults: Partial<Record<keyof T, ((index: number) => any) | any>>
) {
  return {
    create: (count: number, overrides?: Partial<T>[]): T[] => {
      return Array.from({ length: count }, (_, i) => {
        const base: any = {};
        for (const [key, value] of Object.entries(defaults)) {
          base[key] = typeof value === 'function' ? value(i) : value;
        }
        return { ...base, ...(overrides?.[i] || {}) } as T;
      });
    },
    createOne: (overrides?: Partial<T>): T => {
      const base: any = {};
      for (const [key, value] of Object.entries(defaults)) {
        base[key] = typeof value === 'function' ? value(0) : value;
      }
      return { ...base, ...overrides } as T;
    },
  };
}
