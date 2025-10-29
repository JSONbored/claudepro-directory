/**
 * Test Data Factories - Central Registry
 *
 * Type-safe test data generation using Fishery and Faker.
 * Provides realistic, production-like test data for user entities.
 *
 * **MODERNIZATION NOTE (Oct 2025):**
 * Content factories (agent, mcp, command, etc.) have been removed.
 * Use database-generated types (Tables<'category'>) and seed data instead.
 *
 * **Architecture:**
 * - Factory pattern for consistent data generation
 * - Type-safe using database types and TypeScript inference
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
 * import { userFactory, bookmarkFactory } from '@/tests/factories';
 *
 * // Generate single entity
 * const user = userFactory.build();
 *
 * // Generate multiple entities
 * const users = userFactory.buildList(5);
 *
 * // Override specific fields
 * const admin = userFactory.build({ role: 'admin' });
 * ```
 *
 * @see https://github.com/thoughtbot/fishery
 * @see https://fakerjs.dev/
 */

// biome-ignore lint/performance/noBarrelFile: Test factories barrel - intentional convenience exports
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './user/bookmark.factory';
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './user/review.factory';
// biome-ignore lint/performance/noReExportAll: Test factories barrel - intentional convenience exports
export * from './user/user.factory';
