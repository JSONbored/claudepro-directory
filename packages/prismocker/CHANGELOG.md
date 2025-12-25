# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## \[Unreleased]

## \[0.1.0] - 2025-12-23

### Added

* Initial release of prismocker
* Type-safe, in-memory Prisma Client mock for testing
* Full Prisma API support (findMany, findUnique, findFirst, create, update, updateMany, delete, deleteMany, count, aggregate, groupBy)
* Complete relation support with `include`/`select` and relation filters (`some`, `every`, `none`)
* Transaction support with automatic rollback on errors and state snapshotting
* Middleware support via `$use()` for intercepting and modifying operations
* Event listeners via `$on()` for query events and lifecycle hooks
* Lifecycle methods: `$connect()`, `$disconnect()`, and `$metrics()` API compatibility
* Enhanced error messages with comprehensive debugging hints
* Prisma ecosystem compatibility:
  * Generated Zod schema validation (optional, via `prisma-zod-generator`)
  * PrismaJson types support (via `prisma-json-types-generator`)
  * Prisma Client extensions (`$extends`)
* Type-safe helpers:
  * `ExtractModels<T>` - Extract and preserve model types from PrismaClient
  * `ModelName<T>` - Extract valid Prisma model names
  * `ModelType<TClient, TModel>` - Extract specific model delegate type
  * `setDataTyped()` and `getDataTyped()` - Type-safe data seeding and retrieval
  * `isPrismockerClient()` - Type guard for Prismocker instances
* Performance optimizations:
  * Automatic index management for primary keys, foreign keys, and custom fields
  * Query caching with configurable TTL and automatic invalidation
  * Lazy relation loading for improved memory usage
* Raw SQL support:
  * `$queryRaw` and `$queryRawUnsafe` with configurable executors and SQL parsing
  * `$executeRaw` and `$executeRawUnsafe` with DML parsing (INSERT, UPDATE, DELETE)
* Advanced query features:
  * Full `where` clause support (equals, not, in, notIn, lt, lte, gt, gte, contains, startsWith, endsWith, mode, search, array\_contains, path for JSON fields, isSet)
  * Complex sorting with `orderBy` (single and multiple fields, ascending/descending)
  * Pagination with `skip` and `take`
  * Aggregations: `_count`, `_avg`, `_sum`, `_min`, `_max`, `_stddev`, `_variance`, `_countDistinct`
  * GroupBy operations with `_count`, `_avg`, `_sum`, `_min`, `_max`
* Debugging utilities:
  * `enableDebugMode()` - Enable detailed query logging
  * `getQueryStats()` - Get query performance statistics
  * `visualizeState()` - Visualize current in-memory state
* CLI tools:
  * `prismocker generate-enums` - Auto-generate enum stubs from Prisma schema
  * `prismocker setup` - Auto-setup Prismocker in your project (Jest/Vitest detection)
  * `prismocker verify` - Verify Prismocker setup
  * `prismocker fix` - Fix common setup issues
  * `prismocker rollback` - Rollback Prismocker setup
* Comprehensive test suite (202 tests, all passing)
* Example files demonstrating various usage patterns:
  * Basic CRUD operations
  * Complex queries with filters, sorting, and pagination
  * Relation loading (one-to-one, one-to-many, many-to-many)
  * Transaction testing with rollback
  * Zod validation integration
  * PrismaJson types integration
  * Service layer testing
  * API route testing
  * Opinionated test patterns
* Complete documentation with comprehensive examples
* Dual CJS/ESM builds for maximum compatibility
* Standalone package structure (can be extracted to separate repo)

### Features

* ✅ Type-safe mocking with full TypeScript support
* ✅ Works perfectly with pnpm (solves module resolution issues)
* ✅ Zero dependencies (only `@prisma/client` as peer dependency)
* ✅ Environment agnostic (works with any Prisma generator setup)
* ✅ Full Prisma API compatibility
* ✅ Complete relation support with nested includes
* ✅ Transaction isolation and rollback
* ✅ Middleware and event listener support
* ✅ Performance optimizations (indexing, caching, lazy loading)
* ✅ Enhanced error messages with debugging hints
* ✅ Prisma ecosystem compatibility (Zod, PrismaJson, extensions)
* ✅ Comprehensive test coverage
* ✅ Auto-setup CLI for easy integration
