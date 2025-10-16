/**
 * Test Data Factories - Central Registry
 *
 * Type-safe test data generation using Fishery and Faker.
 * Provides realistic, production-like test data for all entity types.
 *
 * **Architecture:**
 * - Factory pattern for consistent data generation
 * - Type-safe using Zod schemas and TypeScript inference
 * - Faker.js for realistic fake data (dates, names, URLs, etc.)
 * - Fishery for factory management (sequences, traits, associations)
 *
 * **Benefits:**
 * - DRY: Single source of truth for test data
 * - Type-safe: Catches schema mismatches at compile time
 * - Realistic: Generated data matches production patterns
 * - Maintainable: Easy to update when schemas change
 * - Flexible: Supports overrides and custom traits
 *
 * **Usage:**
 * ```ts
 * import { agentFactory, userFactory } from '@/tests/factories';
 *
 * // Generate single entity
 * const agent = agentFactory.build();
 *
 * // Generate multiple entities
 * const agents = agentFactory.buildList(5);
 *
 * // Override specific fields
 * const featuredAgent = agentFactory.build({ featured: true });
 *
 * // Use transient params for complex logic
 * const agentWithTags = agentFactory.build({}, { transient: { tagCount: 5 } });
 * ```
 *
 * @see https://github.com/thoughtbot/fishery
 * @see https://fakerjs.dev/
 */

// biome-ignore lint/performance/noBarrelFile: Test factories barrel - intentional convenience exports
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './content/agent.factory';
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './content/collection.factory';
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './content/command.factory';
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './content/hook.factory';
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './content/mcp.factory';
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './content/rule.factory';
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './content/statusline.factory';
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './shared/usage-example.factory';
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './user/bookmark.factory';
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './user/review.factory';
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './user/user.factory';
