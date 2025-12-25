# Prismocker

A type-safe, in-memory Prisma Client mock for testing. Works perfectly with pnpm, Jest, and Vitest. Fully compatible with the Prisma ecosystem including generated Zod schemas, PrismaJson types, and Prisma extensions.

**Why Prismocker?** Prismocker solves the critical problem of testing Prisma-based applications without a real database. It provides a complete, type-safe mock that works seamlessly with all Prisma generators and extensions, making it the perfect testing companion for modern Prisma applications.

[![npm version](https://img.shields.io/npm/v/prisma)](https://www.npmjs.com/package/prisma)
[![License](https://img.shields.io/npm/l/prisma)](https://github.com/JSONbored/prisma/blob/main/LICENSE)

## Table of Contents

* [Overview](#overview)
* [Installation](#installation)
* [Auto-Setup (Recommended)](#auto-setup-recommended)
* [Quick Start](#quick-start)
  * [Basic Usage](#basic-usage)
  * [Jest Integration](#jest-integration)
  * [Vitest Integration](#vitest-integration)
* [API Reference](#api-reference)
  * [Factory Functions](#factory-functions)
  * [Type-Safe Helpers](#type-safe-helpers)
  * [Configuration Options](#configuration-options)
* [Usage Examples](#usage-examples)
  * [Service Layer Testing](#service-layer-testing)
  * [API Route Testing](#api-route-testing)
  * [Complex Query Testing](#complex-query-testing)
  * [Relation Testing](#relation-testing)
  * [Transaction Testing](#transaction-testing)
  * [Zod Validation Testing](#zod-validation-testing)
* [Advanced Features](#advanced-features)
  * [Prisma Ecosystem Compatibility](#prisma-ecosystem-compatibility)
  * [Type Safety](#type-safety)
  * [Test Utilities](#test-utilities)
  * [Query Logging](#query-logging)
* [How It Works](#how-it-works)
  * [In-Memory Storage](#in-memory-storage)
  * [Query Engine](#query-engine)
  * [Type System](#type-system)
* [Example Files](#example-files)
* [Caveats & Considerations](#caveats--considerations)
* [Troubleshooting](#troubleshooting)
* [Migration Guide](#migration-guide)
* [CLI Commands](#cli-commands)
* [Contributing](#contributing)

## Overview

Prismocker provides a complete, type-safe mock for Prisma Client that:

* ✅ **Works with pnpm** - Solves module resolution issues that plague other Prisma mocks
* ✅ **Type-safe** - Uses Prisma's generated types, eliminates `as any` assertions
* ✅ **Full Prisma API** - Supports all Prisma operations (findMany, create, update, delete, count, aggregate, groupBy, etc.)
* ✅ **Full Relation Support** - Complete `include`/`select` support with relation filters (`some`, `every`, `none`)
* ✅ **Transaction Rollback** - Automatic rollback on errors with state snapshotting
* ✅ **Middleware Support** - Full `$use()` middleware support for intercepting and modifying operations
* ✅ **Event Listeners** - `$on()` event listener support for query events and lifecycle hooks
* ✅ **Lifecycle Methods** - `$connect()`, `$disconnect()`, and `$metrics()` API compatibility
* ✅ **Enhanced Error Messages** - Comprehensive, actionable errors with debugging hints
* ✅ **Prisma Ecosystem Compatible** - Works with generated Zod schemas, PrismaJson types, and Prisma extensions
* ✅ **Fast & Isolated** - In-memory storage with automatic indexing for performance, perfect for unit tests
* ✅ **Performance Optimized** - Automatic index management for primary keys, foreign keys, and custom fields
* ✅ **Zero Dependencies** - Only requires `@prisma/client` as peer dependency
* ✅ **Environment Agnostic** - Works with any Prisma generator setup, not tied to specific environments
* ✅ **Standalone Package** - Can be extracted to separate repo for OSS distribution

## Installation

```bash
npm install prisma --save-dev
# or
pnpm add -D prisma
# or
yarn add -D prisma
```

**Peer Dependencies:**

* `@prisma/client` (^7.0.0 or higher)
* `zod` (optional, for Zod validation support)

## Auto-Setup (Recommended)

The easiest way to get started with Prismocker is using the auto-setup command:

```bash
npx prisma setup
```

This command will:

1. ✅ Detect your testing framework (Jest or Vitest)
2. ✅ Create the `__mocks__/@prisma/client.ts` file
3. ✅ Update your test setup files (`jest.setup.ts` or `vitest.setup.ts`)
4. ✅ Generate enum stubs from your Prisma schema
5. ✅ Create example test files (optional)

**Options:**

```bash
# Specify framework manually
npx prisma setup --framework jest

# Custom schema/mock paths
npx prisma setup --schema ./prisma/schema.prisma --mock ./__mocks__/@prisma/client.ts

# Skip example files
npx prisma setup --skip-examples
```

After setup, run `npx prisma generate-enums` whenever you add or modify enums in your Prisma schema.

## Quick Start

<details>
<summary><strong>Basic Usage</strong></summary>

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

// ✅ Fully type-safe! Returns ExtractModels<PrismaClient>
const prisma = createPrismocker<PrismaClient>();

// ✅ All model access is fully typed - no `as any` needed!
const companies = await prisma.companies.findMany();
// companies is typed as Company[] (from your Prisma schema)

const company = await prisma.companies.findUnique({
  where: { id: 'company-1' },
});
// company is typed as Company | null

await prisma.companies.create({
  data: {
    name: 'Company 1',
    owner_id: 'user-1',
    slug: 'company-1',
  },
});
// ✅ Full type checking - TypeScript will error if fields don't match schema

// ✅ Prismocker methods are also fully typed
prisma.reset();
prisma.setData('companies', []);
const data = prisma.getData('companies');
```

**Key Benefits:**

* ✅ **Full Type Safety** - All model access is typed using Prisma's generated types
* ✅ **No Type Assertions** - No need for `as any` or `as unknown` assertions
* ✅ **IntelliSense Support** - Full autocomplete and type checking in your IDE
* ✅ **Type Preservation** - `ExtractModels<T>` preserves all model types through Proxy

</details>

<details>
<summary><strong>Jest Integration</strong></summary>

> **💡 Tip:** Use `npx prisma setup` to automatically set up Jest integration!

### Manual Setup

### Step 1: Create Mock File

Create `__mocks__/@prisma/client.ts` in your project root:

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

// Create PrismockerClient instance
const PrismockerClientClass = createPrismocker<PrismaClient>();

// Export as PrismaClient for Jest auto-mocking
export { PrismockerClientClass as PrismaClient };

// Export Prisma namespace (for Prisma.Decimal, etc.)
export const Prisma = {
  Decimal: class Decimal {
    value: any;
    constructor(value: any) {
      this.value = value;
    }
    toString() {
      return String(this.value);
    }
    toNumber() {
      return Number(this.value);
    }
    toFixed(decimalPlaces?: number) {
      return Number(this.value).toFixed(decimalPlaces);
    }
    toJSON() {
      return this.value;
    }
  },
};

// Export Prisma enum stubs (auto-generated - see Enum Support section)
// Run: npx prisma generate-enums
export { job_status, job_type /* ... other enums */ } from './enums';
```

### Step 2: Use in Tests

```typescript
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

describe('MyService', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    // PrismaClient is automatically PrismockerClient in tests
    prisma = prisma;

    // Reset data before each test
    if ('reset' in prisma && typeof (prisma as any).reset === 'function') {
      (prisma as any).reset();
    }

    // Seed test data
    if ('setData' in prisma && typeof (prisma as any).setData === 'function') {
      (prisma as any).setData('companies', [
        { id: 'company-1', name: 'Company 1', owner_id: 'user-1' },
      ]);
    }
  });

  it('should query companies', async () => {
    const companies = await prisma.companies.findMany();
    expect(companies).toHaveLength(1);
  });
});
```

### Step 3: Verify Jest Auto-Mock

Jest will automatically use `__mocks__/@prisma/client.ts` when you import `@prisma/client` in your code. No additional configuration needed!

</details>

<details>
<summary><strong>Vitest Integration</strong></summary>

> **💡 Tip:** Use `npx prisma setup` to automatically set up Vitest integration!

### Manual Setup

### Step 1: Create Mock File

Create `__mocks__/@prisma/client.ts` (same as Jest):

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

const PrismockerClientClass = createPrismocker<PrismaClient>();
export { PrismockerClientClass as PrismaClient };

// ... Prisma namespace and enum exports ...
```

### Step 2: Register Mock

Add to `vitest.setup.ts`:

```typescript
import { vi } from 'vitest';

// Explicitly mock @prisma/client to use Prismocker
vi.mock('@prisma/client', async () => {
  const mockModule = await import('./__mocks__/@prisma/client.ts');
  return mockModule;
});
```

### Step 3: Use in Tests

```typescript
import { PrismaClient } from '@prisma/client';
import { job_status } from '@prisma/client'; // ✅ Enum stubs work!

// PrismaClient is automatically PrismockerClient in tests
const prisma = new PrismaClient();
```

</details>

## API Reference

### Factory Functions

<details>
<summary><strong>createPrismocker&lt;T&gt;(options?)</strong></summary>

Creates a new PrismockerClient instance that implements the PrismaClient interface.

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

const prisma = createPrismocker<PrismaClient>({
  logQueries: true,
  validateWithZod: true,
  zodSchemasPath: '@prisma/zod',
});
```

**Type Parameters:**

* `T` - PrismaClient type (must extend `PrismaClient`, defaults to `PrismaClient`)

**Options:**

* `logQueries?: boolean` - Enable query logging (default: `false`)
* `logger?: (message: string, data?: any) => void` - Custom logger (default: `console.log`)
* `validateWithZod?: boolean` - Enable Zod validation for create/update (default: `false`)
* `zodSchemasPath?: string` - Path to generated Zod schemas (default: `'@prisma/zod'`)
* `zodSchemaLoader?: (modelName: string, operation: string) => Promise<any> | any | undefined` - Custom schema loader

**Returns:** `ExtractModels<T>` - PrismockerClient instance with full type preservation

**Type Safety:**

The returned instance is typed as `ExtractModels<T>`, which:

* ✅ Preserves all model types from `PrismaClient` (e.g., `prisma.companies` is fully typed)
* ✅ Preserves all Prisma methods (`$queryRaw`, `$transaction`, etc.)
* ✅ Adds Prismocker-specific methods (`reset`, `setData`, `getData`, etc.)
* ✅ Eliminates the need for `as any` assertions for models in your schema

**Example:**

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';
import type { ExtractModels } from 'prisma/prisma-types';

const prisma = createPrismocker<PrismaClient>();

// ✅ prisma is typed as ExtractModels<PrismaClient>
const _typeCheck: ExtractModels<PrismaClient> = prisma;

// ✅ prisma.companies is fully typed as PrismaClient['companies']
const companies = await prisma.companies.findMany();
// companies is typed as Company[] (from your Prisma schema)

// ✅ No type assertions needed!
prisma.reset();
prisma.setData('companies', []);
```

</details>

<details>
<summary><strong>createTestPrisma()</strong></summary>

Convenience function for creating a test PrismaClient instance with sensible defaults.

```typescript
import { createTestPrisma } from 'prisma/test-utils';
import type { PrismaClient } from '@prisma/client';

const prisma = createTestPrisma();
// Equivalent to: createPrismocker<PrismaClient>()
```

</details>

### Type-Safe Helpers

<details>
<summary><strong>Jest Helpers</strong></summary>

Type-safe utilities for Jest testing:

```typescript
import { isPrismockerClient, createMockQueryRawUnsafe } from 'prisma/jest-helpers';
import type { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

beforeEach(() => {
  prisma = createPrismocker<PrismaClient>();

  // ✅ Type-safe check
  if (isPrismockerClient(prisma)) {
    prisma.reset(); // ✅ No type assertion needed
    prisma.setData('companies', []); // ✅ Type-safe
  }

  // ✅ Type-safe mock
  const mockQuery = createMockQueryRawUnsafe(prisma);
  prisma.$queryRawUnsafe = mockQuery;
});
```

**Available Helpers:**

* `isPrismockerClient(prisma: PrismaClient): boolean` - Type guard for PrismockerClient
* `createMockQueryRawUnsafe(prisma: PrismaClient): MockQueryRawUnsafe` - Type-safe mock for `$queryRawUnsafe`
* `createMockQueryRaw(prisma: PrismaClient): MockQueryRaw` - Type-safe mock for `$queryRaw`
* `createMockTransaction(prisma: PrismaClient): MockTransaction` - Type-safe mock for `$transaction`

</details>

<details>
<summary><strong>Test Utilities</strong></summary>

Convenient helpers for test setup and data management:

```typescript
import {
  createTestPrisma,
  resetAndSeed,
  createTestDataFactory,
  snapshotPrismocker,
  restorePrismocker,
} from 'prisma/test-utils';
import type { PrismaClient } from '@prisma/client';

const prisma = createTestPrisma();

// Create data factory for consistent test data
const companyFactory = createTestDataFactory({
  name: 'Test Company',
  owner_id: 'test-user',
  slug: 'test-company',
});

beforeEach(() => {
  // Reset and seed in one call
  resetAndSeed(prisma, {
    companies: [companyFactory({ name: 'Company 1' }), companyFactory({ name: 'Company 2' })],
    jobs: [{ id: 'job-1', company_id: 'company-1', title: 'Job 1' }],
  });
});

// Snapshot and restore for complex test scenarios
it('should handle complex state', async () => {
  const snapshot = snapshotPrismocker(prisma);

  // Make changes
  await prisma.companies.create({ data: { name: 'New Company' } });

  // Restore original state
  restorePrismocker(prisma, snapshot);
});
```

**Available Utilities:**

* `createTestPrisma(): PrismaClient` - Create test PrismaClient instance
* `resetAndSeed(prisma: PrismaClient, data: Record<string, any[]>): void` - Reset and seed data
* `createTestDataFactory<T>(defaults: Partial<T>): (overrides?: Partial<T>) => T` - Create data factory
* `snapshotPrismocker(prisma: PrismaClient, modelNames?: string[]): Record<string, any[]>` - Snapshot current state
* `restorePrismocker(prisma: PrismaClient, snapshot: Record<string, any[]>): void` - Restore from snapshot

</details>

<details>
<summary><strong>Prisma Type Helpers</strong></summary>

Type-safe utilities for working with Prisma models and types:

### ExtractModels<T> - Type Preservation

The core type utility that preserves all model types from `PrismaClient`:

```typescript
import type { ExtractModels } from 'prisma/prisma-types';
import type { PrismaClient } from '@prisma/client';

// ExtractModels<T> preserves all model types
type PrismockerClient = ExtractModels<PrismaClient>;

// This means:
// - prisma.companies → PrismaClient['companies'] (fully typed)
// - prisma.jobs → PrismaClient['jobs'] (fully typed)
// - All Prisma methods preserved
// - Prismocker methods added

const prisma = createPrismocker<PrismaClient>();
// prisma is typed as ExtractModels<PrismaClient>

// ✅ Full type safety - no assertions needed!
const companies = await prisma.companies.findMany();
// companies is typed as Company[] (from your Prisma schema)
```

### Type Helpers

```typescript
import {
  ExtractModels,
  ModelName,
  ModelType,
  setDataTyped,
  getDataTyped,
} from 'prisma/prisma-types';
import type { PrismaClient } from '@prisma/client';

const prisma = createPrismocker<PrismaClient>();

// ExtractModels<T> - Preserves all model types
type PrismockerClient = ExtractModels<PrismaClient>;

// ModelName<T> - Extract model name type
type CompanyModelName = ModelName<'companies'>; // 'companies'

// ModelType<TClient, TModel> - Extract model delegate type
type CompanyModel = ModelType<PrismaClient, 'companies'>;
// CompanyModel is the type of prisma.companies

// ✅ Type-safe setData with model type inference
setDataTyped(prisma, 'companies', [
  { id: '1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
]);

// ✅ Type-safe getData
const companies = getDataTyped(prisma, 'companies');
// companies is typed as any[] (can be explicitly typed if needed)
```

**Available Type Helpers:**

* `ExtractModels<T>` - **Core type utility** that preserves all model types from `PrismaClient`
* `ModelName<T>` - Extract model name type from `Prisma.ModelName`
* `ModelType<TClient, TModel>` - Extract model delegate type from `PrismaClient`
* `setDataTyped<TClient>(prisma: TClient, model: string, data: any[]): void` - Type-safe data seeding
* `getDataTyped<TClient>(prisma: TClient, model: string): any[]` - Type-safe data retrieval

**Note:** `setDataTyped` and `getDataTyped` accept `string` for model names to support dynamic models. For models in your schema, you can use direct model access without these helpers:

```typescript
// ✅ Direct model access (fully typed for models in schema)
const companies = await prisma.companies.findMany();

// ✅ Helper functions (useful for dynamic models or test utilities)
setDataTyped(prisma, 'companies', []);
const data = getDataTyped(prisma, 'companies');
```

</details>

### Configuration Options

<details>
<summary><strong>PrismockerOptions</strong></summary>

```typescript
interface PrismockerOptions {
  /**
   * Whether to log queries (useful for debugging)
   * @default false
   */
  logQueries?: boolean;

  /**
   * Custom logger function
   * @default console.log
   */
  logger?: (message: string, data?: any) => void;

  /**
   * Enable Zod schema validation for create/update operations
   * Requires prisma-zod-generator to be configured
   * @default false
   */
  validateWithZod?: boolean;

  /**
   * Path to generated Zod schemas
   * Defaults to '@prisma/zod' or '@heyclaude/database-types/prisma/zod'
   * @default '@prisma/zod'
   */
  zodSchemasPath?: string;

  /**
   * Custom Zod schema loader function
   * Allows custom loading logic for Zod schemas
   */
  zodSchemaLoader?: (
    modelName: string,
    operation: 'create' | 'update' | 'where' | 'select' | 'include'
  ) => Promise<any> | any | undefined;
}
```

</details>

## Usage Examples

<details>
<summary><strong>Service Layer Testing</strong></summary>

Test your service layer with Prismocker - fully type-safe:

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';
import { isPrismockerClient } from 'prisma/jest-helpers';
import { CompaniesService } from './companies-service';

describe('CompaniesService', () => {
  let prisma: PrismaClient;
  let service: CompaniesService;

  beforeEach(() => {
    // ✅ Create Prismocker instance - fully typed!
    prisma = createPrismocker<PrismaClient>();

    // ✅ Type-safe reset and seeding
    if (isPrismockerClient(prisma)) {
      prisma.reset(); // ✅ No type assertion needed
      prisma.setData('companies', [
        { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
        { id: 'company-2', name: 'Company 2', owner_id: 'user-2', slug: 'company-2' },
      ]); // ✅ Fully typed
    }

    service = new CompaniesService(prisma);
  });

  it('should get company by slug', async () => {
    const company = await service.getCompanyBySlug('company-1');

    expect(company).toMatchObject({
      id: 'company-1',
      name: 'Company 1',
      slug: 'company-1',
    });
  });

  it('should create company', async () => {
    const company = await service.createCompany({
      name: 'New Company',
      owner_id: 'user-1',
      slug: 'new-company',
    });

    expect(company.name).toBe('New Company');

    // Verify it was created
    const allCompanies = await prisma.companies.findMany();
    expect(allCompanies).toHaveLength(3);
  });
});
```

</details>

<details>
<summary><strong>API Route Testing</strong></summary>

Test Next.js API routes with Prismocker:

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { GET } from './route';

describe('GET /api/company', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = prisma;

    if ('reset' in prisma && typeof (prisma as any).reset === 'function') {
      (prisma as any).reset();
    }

    // Seed test data
    if ('setData' in prisma && typeof (prisma as any).setData === 'function') {
      (prisma as any).setData('companies', [
        { id: 'company-1', name: 'Company 1', slug: 'company-1', owner_id: 'user-1' },
      ]);
    }
  });

  it('should return company by slug', async () => {
    const request = new NextRequest('http://localhost/api/company?slug=company-1');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      id: 'company-1',
      name: 'Company 1',
      slug: 'company-1',
    });
  });

  it('should return 404 for non-existent company', async () => {
    const request = new NextRequest('http://localhost/api/company?slug=non-existent');
    const response = await GET(request);

    expect(response.status).toBe(404);
  });
});
```

</details>

<details>
<summary><strong>Complex Query Testing</strong></summary>

Test complex Prisma queries with filters, sorting, and pagination - fully type-safe:

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';
import { isPrismockerClient } from 'prisma/jest-helpers';

describe('Complex Queries', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    // ✅ Create Prismocker instance - fully typed!
    prisma = createPrismocker<PrismaClient>();

    // ✅ Type-safe reset and seeding
    if (isPrismockerClient(prisma)) {
      prisma.reset(); // ✅ No type assertion needed
      prisma.setData('jobs', [
        { id: 'job-1', title: 'Senior Engineer', status: 'published', view_count: 100 },
        { id: 'job-2', title: 'Junior Engineer', status: 'published', view_count: 50 },
        { id: 'job-3', title: 'Product Manager', status: 'draft', view_count: 200 },
      ]); // ✅ Fully typed
    }
  });

  it('should filter by status and sort by view_count', async () => {
    // ✅ Model access and queries are fully typed!
    const jobs = await prisma.jobs.findMany({
      where: {
        status: 'published',
      },
      orderBy: {
        view_count: 'desc',
      },
    });

    expect(jobs).toHaveLength(2);
    expect(jobs[0].view_count).toBe(100);
    expect(jobs[1].view_count).toBe(50);
  });

  it('should paginate results', async () => {
    // ✅ Pagination is fully typed!
    const page1 = await prisma.jobs.findMany({
      skip: 0,
      take: 2,
      orderBy: { view_count: 'desc' },
    });
    // page1 is typed as Job[]

    expect(page1).toHaveLength(2);

    const page2 = await prisma.jobs.findMany({
      skip: 2,
      take: 2,
      orderBy: { view_count: 'desc' },
    });
    // page2 is typed as Job[]

    expect(page2).toHaveLength(1);
  });

  it('should use complex where clauses', async () => {
    const jobs = await prisma.jobs.findMany({
      where: {
        AND: [{ status: 'published' }, { view_count: { gte: 75 } }],
        OR: [{ title: { contains: 'Engineer' } }, { title: { contains: 'Manager' } }],
      },
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe('Senior Engineer');
  });
});
```

</details>

<details>
<summary><strong>Aggregation Testing</strong></summary>

Prismocker supports comprehensive aggregation operations including statistical functions:

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

describe('Aggregations', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = prisma;

    if ('reset' in prisma && typeof (prisma as any).reset === 'function') {
      (prisma as any).reset();
    }

    // Seed test data with numeric values
    if ('setData' in prisma && typeof (prisma as any).setData === 'function') {
      (prisma as any).setData('jobs', [
        { id: 'job-1', company_id: 'company-1', title: 'Job 1', view_count: 100 },
        { id: 'job-2', company_id: 'company-1', title: 'Job 2', view_count: 200 },
        { id: 'job-3', company_id: 'company-2', title: 'Job 3', view_count: 150 },
        { id: 'job-4', company_id: 'company-2', title: 'Job 4', view_count: 75 },
        { id: 'job-5', company_id: 'company-3', title: 'Job 5', view_count: 50 },
      ]);
    }
  });

  it('should aggregate with _count, _avg, _sum, _min, _max', async () => {
    const stats = await prisma.jobs.aggregate({
      _count: { id: true },
      _avg: { view_count: true },
      _sum: { view_count: true },
      _min: { view_count: true },
      _max: { view_count: true },
    });

    expect(stats._count?.id).toBe(5);
    expect(stats._avg?.view_count).toBe(115); // (100 + 200 + 150 + 75 + 50) / 5
    expect(stats._sum?.view_count).toBe(575);
    expect(stats._min?.view_count).toBe(50);
    expect(stats._max?.view_count).toBe(200);
  });

  it('should aggregate with _stddev (standard deviation)', async () => {
    const stats = await prisma.jobs.aggregate({
      _stddev: { view_count: true },
    });

    // Mean = (100 + 200 + 150 + 75 + 50) / 5 = 115
    // Variance = ((100-115)^2 + (200-115)^2 + (150-115)^2 + (75-115)^2 + (50-115)^2) / 5
    //          = (225 + 7225 + 1225 + 1600 + 4225) / 5 = 14500 / 5 = 2900
    // Stddev = sqrt(2900) ≈ 53.85
    expect(stats._stddev?.view_count).toBeCloseTo(53.85, 1);
  });

  it('should aggregate with _variance', async () => {
    const stats = await prisma.jobs.aggregate({
      _variance: { view_count: true },
    });

    // Mean = 115, Variance = 2900
    expect(stats._variance?.view_count).toBeCloseTo(2900, 0);
  });

  it('should aggregate with _countDistinct', async () => {
    const stats = await prisma.jobs.aggregate({
      _countDistinct: { company_id: true },
    });

    // Should have 3 distinct company_id values: company-1, company-2, company-3
    expect(stats._countDistinct?.company_id).toBe(3);
  });

  it('should handle _stddev with single value', async () => {
    // Reset and create single record
    if ('reset' in prisma && typeof (prisma as any).reset === 'function') {
      (prisma as any).reset();
    }
    await prisma.jobs.create({
      data: { id: 'job-1', company_id: 'company-1', title: 'Job 1', view_count: 100 },
    });

    const stats = await prisma.jobs.aggregate({
      _stddev: { view_count: true },
    });

    // Single value: stddev should be 0
    expect(stats._stddev?.view_count).toBe(0);
  });

  it('should handle _variance with single value', async () => {
    // Reset and create single record
    if ('reset' in prisma && typeof (prisma as any).reset === 'function') {
      (prisma as any).reset();
    }
    await prisma.jobs.create({
      data: { id: 'job-1', company_id: 'company-1', title: 'Job 1', view_count: 100 },
    });

    const stats = await prisma.jobs.aggregate({
      _variance: { view_count: true },
    });

    // Single value: variance should be 0
    expect(stats._variance?.view_count).toBe(0);
  });

  it('should handle aggregations with where clause', async () => {
    const stats = await prisma.jobs.aggregate({
      where: { company_id: 'company-1' },
      _count: { id: true },
      _avg: { view_count: true },
      _sum: { view_count: true },
    });

    // Only company-1 jobs: job-1 (100) and job-2 (200)
    expect(stats._count?.id).toBe(2);
    expect(stats._avg?.view_count).toBe(150); // (100 + 200) / 2
    expect(stats._sum?.view_count).toBe(300);
  });
});
```

**Supported Aggregation Operations:**

* ✅ `_count` - Count records
* ✅ `_sum` - Sum numeric fields
* ✅ `_avg` - Average numeric fields
* ✅ `_min` - Minimum value (numeric or date)
* ✅ `_max` - Maximum value (numeric or date)
* ✅ `_stddev` - Standard deviation (statistical)
* ✅ `_variance` - Variance (statistical)
* ✅ `_countDistinct` - Count distinct values

**Edge Cases:**

* Single value: `_stddev` and `_variance` return `0`
* No values: `_stddev` and `_variance` return `null`, `_countDistinct` returns `0`
* All operations support `where` clause filtering
* Non-numeric values are automatically filtered out for numeric operations

</details>

<details>
<summary><strong>findUniqueOrThrow and findFirstOrThrow</strong></summary>

Prismocker supports `findUniqueOrThrow` and `findFirstOrThrow` methods that throw errors when records are not found:

### findUniqueOrThrow

Similar to `findUnique`, but throws an error if no record is found:

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

describe('findUniqueOrThrow', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();
    if ('reset' in prisma && typeof (prisma as any).reset === 'function') {
      (prisma as any).reset();
    }
  });

  it('should return record when found', async () => {
    await prisma.companies.create({
      data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
    });

    const company = await prisma.companies.findUniqueOrThrow({ where: { id: 'company-1' } });
    expect(company.name).toBe('Company 1');
  });

  it('should throw error when not found', async () => {
    await expect(
      prisma.companies.findUniqueOrThrow({ where: { id: 'non-existent' } })
    ).rejects.toThrow('Record not found');
  });

  it('should include helpful error message with context', async () => {
    await prisma.companies.create({
      data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
    });

    try {
      await prisma.companies.findUniqueOrThrow({ where: { id: 'non-existent' } });
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.message).toContain('Record not found');
      expect(error.message).toContain('Where clause');
      expect(error.message).toContain('Total records');
      expect(error.message).toContain('Sample records');
    }
  });
});
```

### findFirstOrThrow

Similar to `findFirst`, but throws an error if no record is found:

```typescript
it('should return record when found', async () => {
  await prisma.companies.create({
    data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
  });

  const company = await prisma.companies.findFirstOrThrow({ where: { name: 'Company 1' } });
  expect(company.name).toBe('Company 1');
});

it('should throw error when not found', async () => {
  await expect(
    prisma.companies.findFirstOrThrow({ where: { name: 'Non-existent Company' } })
  ).rejects.toThrow('Record not found');
});
```

**Key Features:**

* ✅ Throws descriptive error when record not found
* ✅ Enhanced error messages with context and suggestions
* ✅ Supports `include` and `select` (same as `findUnique`/`findFirst`)
* ✅ Works with all where clause operators
* ✅ Perfect for testing error scenarios

**When to Use:**

* Testing error handling when records don't exist
* Ensuring code fails fast when required records are missing
* Matching Prisma's real behavior in production

</details>

<details>
<summary><strong>Relation Testing</strong></summary>

Prismocker supports full relation functionality including `include`, `select`, and relation filters (`some`, `every`, `none`).

### Basic Relation Loading

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';
import { isPrismockerClient } from 'prisma/jest-helpers';

describe('Relations', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    // ✅ Create Prismocker instance - fully typed!
    prisma = createPrismocker<PrismaClient>();

    // ✅ Type-safe reset and seeding
    if (isPrismockerClient(prisma)) {
      prisma.reset(); // ✅ No type assertion needed
      prisma.setData('companies', [{ id: 'company-1', name: 'Company 1', owner_id: 'user-1' }]); // ✅ Fully typed
      prisma.setData('jobs', [
        { id: 'job-1', company_id: 'company-1', title: 'Job 1', status: 'published' },
        { id: 'job-2', company_id: 'company-1', title: 'Job 2', status: 'draft' },
      ]); // ✅ Fully typed
    }
  });

  it('should load one-to-many relations with include', async () => {
    // ✅ Model access and relations are fully typed!
    const company = await prisma.companies.findUnique({
      where: { id: 'company-1' },
      include: {
        jobs: true, // Include all job fields
      },
    });

    expect(company?.jobs).toHaveLength(2);
    expect(company?.jobs[0].title).toBe('Job 1');
  });

  it('should load relations with select', async () => {
    const company = await prisma.companies.findUnique({
      where: { id: 'company-1' },
      select: {
        id: true,
        name: true,
        jobs: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    expect(company?.jobs).toHaveLength(2);
    expect(company?.jobs[0]).toHaveProperty('id');
    expect(company?.jobs[0]).toHaveProperty('title');
    expect(company?.jobs[0]).not.toHaveProperty('status'); // Not selected
  });

  it('should load nested relations', async () => {
    const company = await prisma.companies.findUnique({
      where: { id: 'company-1' },
      include: {
        jobs: {
          include: {
            // Nested relation (if jobs has relations)
            // Example: applications: true
          },
        },
      },
    });

    expect(company?.jobs).toHaveLength(2);
  });
});
```

### Relation Filters (some, every, none)

Prismocker supports filtering records based on related records:

```typescript
it('should filter by relation with some', async () => {
  // ✅ Find companies that have at least one published job - fully typed!
  const companies = await prisma.companies.findMany({
    where: {
      jobs: {
        some: {
          status: 'published',
        },
      },
    },
  });
  // companies is typed as Company[]

  expect(companies).toHaveLength(1);
  expect(companies[0].id).toBe('company-1');
});

it('should filter by relation with every', async () => {
  // ✅ Find companies where ALL jobs are published - fully typed!
  const companies = await prisma.companies.findMany({
    where: {
      jobs: {
        every: {
          status: 'published',
        },
      },
    },
  });
  // companies is typed as Company[]

  // This company has both published and draft jobs, so it won't match
  expect(companies).toHaveLength(0);
});

it('should filter by relation with none', async () => {
  // ✅ Find companies that have NO draft jobs - fully typed!
  const companies = await prisma.companies.findMany({
    where: {
      jobs: {
        none: {
          status: 'draft',
        },
      },
    },
  });
  // companies is typed as Company[]

  // This company has a draft job, so it won't match
  expect(companies).toHaveLength(0);
});
```

### One-to-One Relations

```typescript
it('should load one-to-one relations', async () => {
  // Seed one-to-one relation data
  (prisma as any).setData('profiles', [
    { id: 'profile-1', company_id: 'company-1', bio: 'Company bio' },
  ]);

  const company = await prisma.companies.findUnique({
    where: { id: 'company-1' },
    include: {
      profile: true,
    },
  });

  expect(company?.profile).toBeDefined();
  expect(company?.profile.bio).toBe('Company bio');
});
```

**Key Features:**

* ✅ Full `include` support (loads all fields + relations)
* ✅ Full `select` support (selective field loading)
* ✅ Nested `include`/`select` in relations
* ✅ Relation filters: `some`, `every`, `none`
* ✅ One-to-many and one-to-one relations
* ✅ Automatic foreign key inference

</details>

<details>
<summary><strong>Transaction Testing</strong></summary>

Prismocker supports full transaction functionality with automatic rollback on errors.

### Successful Transactions

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';
import { isPrismockerClient } from 'prisma/jest-helpers';

describe('Transactions', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    // ✅ Create Prismocker instance - fully typed!
    prisma = createPrismocker<PrismaClient>();

    // ✅ Type-safe reset
    if (isPrismockerClient(prisma)) {
      prisma.reset(); // ✅ No type assertion needed
    }
  });

  it('should commit transaction on success', async () => {
    // ✅ Model access is fully typed!
    await prisma.companies.create({
      data: { name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
    });

    // ✅ Transaction callback receives fully typed tx!
    await prisma.$transaction(async (tx) => {
      // tx is typed as ExtractModels<PrismaClient> - full type safety!
      await tx.companies.create({
        data: { name: 'Company 2', owner_id: 'user-2', slug: 'company-2' },
      });
      await tx.companies.create({
        data: { name: 'Company 3', owner_id: 'user-3', slug: 'company-3' },
      });
    });

    // ✅ Verify all changes were committed - fully typed!
    const companies = await prisma.companies.findMany();
    // companies is typed as Company[]
    expect(companies).toHaveLength(3);
  });

  it('should return transaction result', async () => {
    // ✅ Transaction result is fully typed!
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.companies.create({
        data: { name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
      });

      const job = await tx.jobs.create({
        data: { company_id: company.id, title: 'Job 1' },
      });

      return { company, job };
    });

    expect(result.company.name).toBe('Company 1');
    expect(result.job.title).toBe('Job 1');
  });
});
```

### Transaction Rollback

Prismocker automatically rolls back all changes if an error occurs:

```typescript
it('should rollback transaction on error', async () => {
  // ✅ Create initial data - fully typed!
  await prisma.companies.create({
    data: { name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
  });

  // ✅ Execute transaction that fails - tx is fully typed!
  try {
    await prisma.$transaction(async (tx) => {
      // tx is typed as ExtractModels<PrismaClient> - full type safety!
      await tx.companies.create({
        data: { name: 'Company 2', owner_id: 'user-2', slug: 'company-2' },
      });
      // Force an error
      throw new Error('Transaction failed');
    });
    // Should not reach here
    expect(true).toBe(false);
  } catch (error: any) {
    expect(error.message).toBe('Transaction failed');
  }

  // Verify rollback - only original company should exist
  const companies = await prisma.companies.findMany();
  expect(companies).toHaveLength(1);
  expect(companies[0].name).toBe('Company 1');
});

it('should rollback all changes in transaction on error', async () => {
  // Create initial data
  await prisma.companies.create({
    data: { name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
  });

  // Execute transaction with multiple operations that fails
  try {
    await prisma.$transaction(async (tx) => {
      await tx.companies.create({
        data: { name: 'Company 2', owner_id: 'user-2', slug: 'company-2' },
      });
      await tx.companies.create({
        data: { name: 'Company 3', owner_id: 'user-3', slug: 'company-3' },
      });
      // Force an error after multiple operations
      throw new Error('Transaction failed');
    });
    // Should not reach here
    expect(true).toBe(false);
  } catch (error: any) {
    expect(error.message).toBe('Transaction failed');
  }

  // Verify rollback - none of the transaction changes should be committed
  const companies = await prisma.companies.findMany();
  expect(companies).toHaveLength(1);
  expect(companies[0].name).toBe('Company 1');
});

it('should rollback updates and deletes in transaction', async () => {
  // Create initial data
  const company1 = await prisma.companies.create({
    data: { name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
  });
  const company2 = await prisma.companies.create({
    data: { name: 'Company 2', owner_id: 'user-2', slug: 'company-2' },
  });

  // Execute transaction with updates and delete that fails
  try {
    await prisma.$transaction(async (tx) => {
      await tx.companies.update({
        where: { id: company1.id },
        data: { name: 'Updated Company 1' },
      });
      await tx.companies.delete({
        where: { id: company2.id },
      });
      // Force an error
      throw new Error('Transaction failed');
    });
    // Should not reach here
    expect(true).toBe(false);
  } catch (error: any) {
    expect(error.message).toBe('Transaction failed');
  }

  // Verify rollback - original state should be restored
  const companies = await prisma.companies.findMany();
  expect(companies).toHaveLength(2);
  expect(companies.find((c) => c.id === company1.id)?.name).toBe('Company 1');
  expect(companies.find((c) => c.id === company2.id)?.name).toBe('Company 2');
});
```

**Key Features:**

* ✅ Automatic state snapshotting before transaction
* ✅ Automatic rollback on any error
* ✅ All-or-nothing atomicity
* ✅ Supports all operations (create, update, delete)
* ✅ State restoration preserves data integrity
* ✅ Works with nested operations and complex scenarios

</details>

<details>
<summary><strong>Zod Validation Testing</strong></summary>

Test with optional Zod validation from `prisma-zod-generator`:

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

describe('Zod Validation', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    // Enable Zod validation
    prisma = createPrismocker<PrismaClient>({
      validateWithZod: true,
      zodSchemasPath: '@prisma/zod', // Path to your generated schemas
    });
  });

  it('should validate data against Zod schemas', async () => {
    // This will validate against CompaniesCreateInputSchema if available
    const company = await prisma.companies.create({
      data: {
        name: 'Valid Company',
        owner_id: 'user-1',
        slug: 'valid-company',
      },
    });

    expect(company.name).toBe('Valid Company');
  });

  it('should reject invalid data', async () => {
    await expect(
      prisma.companies.create({
        data: {
          name: '', // Invalid: empty string
          owner_id: 'user-1',
          slug: 'valid-company',
        },
      })
    ).rejects.toThrow('Zod validation failed');
  });
});
```

</details>

## Advanced Features

<details>
<summary><strong>Prisma Ecosystem Compatibility</strong></summary>

Prismocker is fully compatible with the Prisma ecosystem:

### Generated Zod Schemas

If you use `prisma-zod-generator`, you can enable optional validation:

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

const prisma = createPrismocker<PrismaClient>({
  validateWithZod: true,
  zodSchemasPath: '@prisma/zod', // Path to your generated schemas
});

// Data will be validated against generated Zod schemas
await prisma.companies.create({
  data: { name: 'Test Company', slug: 'test-company' },
});
```

### PrismaJson Types

Prismocker automatically supports PrismaJson types from `prisma-json-types-generator`:

```typescript
import type { PrismaClient } from '@prisma/client';
import type { PrismaJson } from '@prisma/client';

const prisma = createPrismocker<PrismaClient>();

// PrismaJson types work seamlessly
const metadata: PrismaJson.ContentMetadata = {
  dependencies: ['react', 'next'],
};

await prisma.content.create({
  data: {
    title: 'Test',
    metadata, // Fully typed!
  },
});
```

### Prisma Extensions

Prismocker supports Prisma Client extensions:

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

const basePrisma = createPrismocker<PrismaClient>();

// Extensions work transparently (if your codebase uses $extends)
// Prismocker's $extends() method returns the same instance
const extended = basePrisma.$extends({
  // Your extensions here
});
```

</details>

<details>
<summary><strong>Prisma Lifecycle & Middleware Support</strong></summary>

Prismocker supports Prisma's lifecycle methods and middleware for complete API compatibility:

### Connection Management ($connect / $disconnect)

Prismocker provides no-op implementations of `$connect()` and `$disconnect()` for API compatibility:

```typescript
// Connect (no-op for in-memory mocking)
await prisma.$connect();

// Disconnect (no-op for in-memory mocking)
await prisma.$disconnect();
```

**Event Emission:**

* `$connect()` emits a `connect` event
* `$disconnect()` emits a `disconnect` event

### Middleware Support ($use)

Prismocker supports Prisma middleware via `$use()`:

```typescript
// Register middleware
prisma.$use(async (params, next) => {
  console.log(`Executing ${params.model}.${params.action}`);
  return next(params);
});

// Middleware executes before all operations
await prisma.companies.findMany(); // Logs: "Executing companies.findMany"
await prisma.companies.create({ data: { name: 'Test' } }); // Logs: "Executing companies.create"
```

**Middleware Features:**

* ✅ Executes before all operations (findMany, create, update, delete, etc.)
* ✅ Can modify operation parameters
* ✅ Can intercept and return custom results
* ✅ Supports multiple middleware (executed in registration order)
* ✅ Works with all Prisma operations

**Example: Logging Middleware**

```typescript
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  console.log(`${params.model}.${params.action} took ${duration}ms`);
  return result;
});
```

**Example: Parameter Modification**

```typescript
prisma.$use(async (params, next) => {
  // Add default filter to all findMany operations
  if (params.action === 'findMany' && !params.args?.where) {
    params.args = { ...params.args, where: { active: true } };
  }
  return next(params);
});
```

**Example: Result Interception**

```typescript
prisma.$use(async (params, next) => {
  // Intercept and return custom result for specific operations
  if (params.model === 'companies' && params.action === 'findMany') {
    return [{ id: 'custom-1', name: 'Custom Company' }];
  }
  return next(params);
});
```

### Event Listeners ($on)

Prismocker supports Prisma event listeners via `$on()`:

```typescript
// Register query event listener
prisma.$on('query', (event) => {
  console.log('Query executed:', event.model, event.action);
});

// Register multiple listeners
prisma.$on('query', (event) => console.log('Listener 1:', event));
prisma.$on('query', (event) => console.log('Listener 2:', event));

// Operations emit query events
await prisma.companies.findMany(); // Both listeners fire
```

**Supported Event Types:**

* ✅ `query` - Emitted for all database operations
* ✅ `connect` - Emitted when `$connect()` is called
* ✅ `disconnect` - Emitted when `$disconnect()` is called
* ✅ `info` - For informational messages (not emitted by default)
* ✅ `warn` - For warnings (not emitted by default)
* ✅ `error` - For errors (not emitted by default)

**Event Data Structure:**

```typescript
prisma.$on('query', (event) => {
  // event.model - Model name (e.g., 'companies')
  // event.action - Operation name (e.g., 'findMany', 'create')
  // event.args - Operation arguments
});
```

### Metrics API ($metrics)

Prismocker provides a stub implementation of Prisma's metrics API (Prisma 7.1.0+):

```typescript
const metrics = await prisma.$metrics();

// Returns metrics structure matching Prisma's API
console.log(metrics.counters); // Query count metrics
console.log(metrics.gauges); // Active query metrics
console.log(metrics.histograms); // Query duration histograms
```

**Metrics Structure:**

```typescript
{
  counters: [
    {
      key: 'prisma_client_queries_total',
      value: 10, // Total queries executed
      labels: {},
    },
  ],
  gauges: [
    {
      key: 'prisma_client_queries_active',
      value: 0, // Active queries (always 0 for in-memory)
      labels: {},
    },
  ],
  histograms: [
    {
      key: 'prisma_client_queries_duration_histogram_ms',
      value: [1, 2, 5, 10, 50], // Query durations in milliseconds
      labels: {},
      buckets: [1, 5, 10, 50, 100, 500, 1000, 5000],
    },
  ],
  // In debug mode, includes detailed query statistics
  queryStats?: {
    totalQueries: 10,
    queriesByModel: { companies: 5, jobs: 5 },
    queriesByOperation: { findMany: 3, create: 2 },
    averageDuration: 2.5,
  },
}
```

**Integration with Debug Mode:**
When debug mode is enabled (`prisma.enableDebugMode()`), metrics include detailed query statistics:

```typescript
prisma.enableDebugMode();
await prisma.companies.findMany();
await prisma.companies.create({ data: { name: 'Test' } });

const metrics = await prisma.$metrics();
console.log(metrics.queryStats); // Detailed statistics available
```

**Use Cases:**

* ✅ Testing metrics collection in your application
* ✅ Verifying query performance in tests
* ✅ Monitoring query patterns during testing
* ✅ Integration with monitoring/observability tools

</details>

<details>
<summary><strong>Type Safety</strong></summary>

Prismocker provides **full type safety** through a type-preserving Proxy system that eliminates the need for `as any` type assertions.

### How It Works

Prismocker uses `ExtractModels<T>` to preserve all model types from your `PrismaClient`:

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';
import type { ExtractModels } from 'prisma/prisma-types';

// ✅ Returns ExtractModels<PrismaClient> - full type preservation!
const prisma = createPrismocker<PrismaClient>();

// ✅ prisma.companies is fully typed as PrismaClient['companies']
const companies = await prisma.companies.findMany();
// companies is typed as Company[] (from your Prisma schema)

// ✅ All Prisma operations are fully typed
const company = await prisma.companies.findUnique({
  where: { id: 'company-1' },
});
// company is typed as Company | null

await prisma.companies.create({
  data: {
    name: 'Company 1',
    owner_id: 'user-1',
    slug: 'company-1',
  },
});
// ✅ TypeScript will error if fields don't match your schema

// ✅ Prismocker methods are also fully typed
prisma.reset();
prisma.setData('companies', []);
const data = prisma.getData('companies');
```

### Type Preservation with ExtractModels<T>

The `ExtractModels<T>` type utility:

1. **Preserves Model Types** - Maps all `Prisma.ModelName` values to their corresponding model delegate types
2. **Preserves Prisma Methods** - Maintains types for `$queryRaw`, `$transaction`, `$connect`, etc.
3. **Adds Prismocker Methods** - Includes `reset`, `setData`, `getData`, `enableDebugMode`, etc.

**Example:**

```typescript
import type { ExtractModels } from 'prisma/prisma-types';

// ExtractModels<PrismaClient> preserves:
// - prisma.companies → PrismaClient['companies'] (fully typed)
// - prisma.jobs → PrismaClient['jobs'] (fully typed)
// - prisma.$transaction → PrismaClient['$transaction'] (fully typed)
// - prisma.reset() → void (Prismocker method)
// - prisma.setData() → void (Prismocker method)
```

### Before vs After

**Before (with type assertions):**

```typescript
const prisma = createPrismocker<PrismaClient>();

// ❌ Requires type assertions for model access
const companies = await (prisma as any).companies.findMany();
(prisma as any).reset();
(prisma as any).setData('companies', []);
```

**After (fully type-safe):**

```typescript
const prisma = createPrismocker<PrismaClient>();

// ✅ Fully typed - no assertions needed!
const companies = await prisma.companies.findMany();
// companies is typed as Company[]

prisma.reset(); // ✅ Fully typed
prisma.setData('companies', []); // ✅ Fully typed
```

### Transaction Type Safety

Transaction callbacks also receive fully typed transaction clients:

```typescript
await prisma.$transaction(async (tx) => {
  // ✅ tx is typed as ExtractModels<PrismaClient>
  // ✅ All model access is fully typed
  const companies = await tx.companies.findMany();
  await tx.companies.create({
    data: { name: 'New Company', owner_id: 'user-1', slug: 'new-company' },
  });
  // ✅ Full type checking - TypeScript will error if fields don't match
});
```

### Dynamic Models (Not in Schema)

For dynamic models that don't exist in your Prisma schema (e.g., test-only models), you may still need `as any`:

```typescript
// If 'users' doesn't exist in your Prisma schema:
const users = await (prisma as any).users.findMany();
// TypeScript can't infer types for models not in Prisma.ModelName
```

**Note:** This is expected behavior - TypeScript can only provide type safety for models that exist in your Prisma schema. For models in your schema, full type safety is guaranteed without any assertions.

### Type Helpers

Prismocker provides additional type helpers for advanced use cases:

```typescript
import type { ExtractModels, ModelName, ModelType } from 'prisma/prisma-types';

// ExtractModels<T> - Preserves all model types
type PrismockerClient = ExtractModels<PrismaClient>;

// ModelName<T> - Extract model name type
type CompanyModelName = ModelName<'companies'>; // 'companies'

// ModelType<TClient, TModel> - Extract model delegate type
type CompanyModel = ModelType<PrismaClient, 'companies'>;
// CompanyModel is the type of prisma.companies
```

### Module Augmentation

Prismocker uses TypeScript module augmentation to add Prismocker-specific methods to `PrismaClient`:

```typescript
// types-augmentation.d.ts automatically extends PrismaClient
declare module '@prisma/client' {
  interface PrismaClient {
    reset(): void;
    setData<T = any>(modelName: string, data: T[]): void;
    getData<T = any>(modelName: string): T[];
    enableDebugMode(enabled?: boolean): void;
    getQueryStats(): QueryStats;
    visualizeState(options?: VisualizationOptions): string;
  }
}
```

This means all Prismocker methods are available on any `PrismaClient` instance when using Prismocker, with full type safety.

</details>

<details>
<summary><strong>Test Utilities</strong></summary>

Prismocker provides convenient test utilities:

```typescript
import { createTestPrisma, resetAndSeed, createTestDataFactory } from 'prisma/test-utils';

const prisma = createTestPrisma();

// Create data factory for consistent test data
const companyFactory = createTestDataFactory({
  name: 'Test Company',
  owner_id: 'test-user',
  slug: 'test-company',
});

beforeEach(() => {
  // Reset and seed in one call
  resetAndSeed(prisma, {
    companies: [companyFactory({ name: 'Company 1' }), companyFactory({ name: 'Company 2' })],
  });
});
```

</details>

<details>
<summary><strong>Performance Optimization (Index Manager)</strong></summary>

Prismocker includes an automatic index manager that optimizes query performance by maintaining indexes for:

* **Primary keys** (`id` fields) - For fast `findUnique` lookups
* **Foreign keys** (fields ending in `_id`) - For fast relation loading
* **All fields** - Automatically indexed for fast filtering

**Automatic Indexing:**

Indexes are enabled by default and automatically maintained:

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

// Indexes are enabled by default
const prisma = createPrismocker<PrismaClient>();

// findUnique with id uses index (O(1) lookup instead of O(n) scan)
const company = await prisma.companies.findUnique({
  where: { id: 'company-1' },
});
```

**Disabling Indexes:**

If you don't need performance optimization, you can disable indexes:

```typescript
const prisma = createPrismocker<PrismaClient>({
  enableIndexes: false, // Disable indexes
});
```

**Performance Benefits:**

* **findUnique** with indexed fields: O(1) lookup instead of O(n) scan
* **Relation loading**: Fast foreign key lookups
* **Large datasets**: Significant performance improvement with 100+ records

**Note:** Indexes are automatically maintained when data changes (create, update, delete, setData). No manual index management required.

</details>

<details>
<summary><strong>Query Result Caching</strong></summary>

Prismocker can cache query results to improve performance for repeated queries:

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

// Enable query caching
const prisma = createPrismocker<PrismaClient>({
  enableQueryCache: true,
  queryCacheMaxSize: 100, // Maximum cache entries (default: 100)
  queryCacheTTL: 0, // Time to live in ms (0 = no expiration, default: 0)
});

// First call - executes query and caches result
const companies1 = await prisma.companies.findMany();

// Second call - uses cached result (same query args)
const companies2 = await prisma.companies.findMany();
// companies2 === companies1 (same reference, instant return)

// Cache is automatically invalidated when data changes
await prisma.companies.create({ data: { name: 'New Company', ... } });
// Next findMany() will execute fresh query (cache invalidated)
```

**Cache Invalidation:**

The cache is automatically invalidated when:

* Records are created (`create`, `createMany`)
* Records are updated (`update`, `updateMany`)
* Records are deleted (`delete`, `deleteMany`)
* Data is set via `setData()`
* Client is reset via `reset()`

**Configuration:**

* `enableQueryCache`: Enable/disable query caching (default: `false`)
* `queryCacheMaxSize`: Maximum number of cache entries (default: `100`)
* `queryCacheTTL`: Time to live in milliseconds (default: `0` = no expiration)

</details>

<details>
<summary><strong>Lazy Relation Loading</strong></summary>

Prismocker can load relations lazily (on-demand) instead of eagerly:

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

// Enable lazy relation loading
const prisma = createPrismocker<PrismaClient>({
  enableLazyRelations: true,
});

// Query with include - relation is a Proxy that loads on first access
const company = await prisma.companies.findUnique({
  where: { id: 'company-1' },
  include: { jobs: true },
});

// Relation is not loaded yet (Proxy object)
console.log(company.jobs); // Proxy object

// Access relation - loads on first access
const jobs = company.jobs; // Now loads the actual data
console.log(jobs.length); // 5
console.log(jobs[0].title); // "Job 1"

// Works with both include and select
const company2 = await prisma.companies.findUnique({
  where: { id: 'company-2' },
  select: { id: true, name: true, jobs: true },
});

// Access relation - loads on first access
const jobs2 = company2.jobs; // Loads data
```

**Benefits:**

* **Memory Efficiency**: Relations are only loaded when accessed
* **Performance**: Faster initial queries (no eager loading overhead)
* **Flexibility**: Access relations conditionally in your code

**When to Use:**

* Large datasets with many relations
* Queries that may not always access all relations
* Memory-constrained test environments

</details>

<details>
<summary><strong>Query Logging</strong></summary>

Enable query logging for debugging:

```typescript
const prisma = createPrismocker<PrismaClient>({
  logQueries: true,
  logger: (message, data) => {
    console.log(`[Prismocker] ${message}`, data);
  },
});

// All queries will be logged
await prisma.companies.findMany();
// Logs: [Prismocker] companies.findMany { where: undefined }
```

</details>

<details>
<summary><strong>Debugging Utilities</strong></summary>

Prismocker provides powerful debugging utilities to help you understand what's happening in your tests.

### Enable Debug Mode

Enable comprehensive debugging with a single call:

```typescript
const prisma = createPrismocker<PrismaClient>();

// Enable debug mode (enables logging and statistics tracking)
prisma.enableDebugMode();

// Now all queries are logged and tracked
await prisma.companies.findMany();
await prisma.companies.create({
  data: { name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
});
```

### Get Query Statistics

Track all queries executed and analyze performance:

```typescript
// Execute some queries
await prisma.companies.findMany();
await prisma.companies.findUnique({ where: { id: 'company-1' } });
await prisma.companies.create({
  data: { name: 'Company 2', owner_id: 'user-2', slug: 'company-2' },
});

// Get statistics
const stats = prisma.getQueryStats();

console.log(`Total queries: ${stats.totalQueries}`);
// Output: Total queries: 3

console.log(`Queries by model:`, stats.queriesByModel);
// Output: { companies: 3 }

console.log(`Queries by operation:`, stats.queriesByOperation);
// Output: { findMany: 1, findUnique: 1, create: 1 }

console.log(`Average duration: ${stats.averageDuration.toFixed(2)}ms`);
// Output: Average duration: 0.50ms

// Access individual query details
stats.queries.forEach((query) => {
  console.log(`${query.modelName}.${query.operation} - ${query.duration}ms`);
});
```

### Visualize State

Get a formatted view of all data in all stores:

```typescript
// Set up some data
await prisma.companies.create({
  data: { id: 'company-1', name: 'Company 1', owner_id: 'user-1', slug: 'company-1' },
});
await prisma.jobs.create({
  data: {
    id: 'job-1',
    company_id: 'company-1',
    title: 'Job 1',
    description: 'Test job description',
    type: 'full_time',
    category: 'engineering',
    link: 'https://example.com/job-1',
  },
});

// Visualize state
const visualization = prisma.visualizeState({
  maxRecordsPerModel: 5, // Show up to 5 records per model
  includeIndexes: true, // Include index statistics
  includeCache: true, // Include cache statistics
});

console.log(visualization);
// Output:
// === Prismocker State ===
//
// 📦 Stores:
//   companies: 1 record
//     [0] {
//       "id": "company-1",
//       "name": "Company 1",
//       ...
//     }
//
//   jobs: 1 record
//     [0] {
//       "id": "job-1",
//       "company_id": "company-1",
//       ...
//     }
//
// 🔍 Indexes:
//   Models indexed: 2
//   Total indexes: 8
//   companies:
//     Fields: id, name, owner_id, slug
//     Total entries: 4
//   jobs:
//     Fields: id, company_id, title, ...
//     Total entries: 4
//
// 💾 Query Cache:
//   Entries: 0/100
//   TTL: 0ms
//
// 📊 Query Statistics:
//   Total queries: 2
//   Average duration: 0.45ms
//   By model: { "companies": 1, "jobs": 1 }
//   By operation: { "create": 2 }
```

**Benefits:**

* ✅ **Quick debugging** - See all data at a glance
* ✅ **Performance analysis** - Track query counts and durations
* ✅ **State inspection** - Understand what data exists in stores
* ✅ **Index visibility** - See which fields are indexed
* ✅ **Cache monitoring** - Track cache hit/miss rates

**Use Cases:**

* Debugging test failures (see what data exists)
* Performance profiling (identify slow queries)
* Understanding test state (verify data setup)
* Cache analysis (optimize cache configuration)

</details>

<details>
<summary><strong>Enhanced Error Messages</strong></summary>

Prismocker provides comprehensive, actionable error messages with debugging hints and suggestions.

### Error Message Features

All Prismocker errors include:

* ✅ **Context** - What operation failed and why
* ✅ **Suggestions** - How to fix the issue
* ✅ **Debugging hints** - Sample data, where clauses, record counts
* ✅ **Examples** - Code examples showing correct usage

### Example Error Messages

**Record Not Found (Update/Delete):**

```
Prismocker: Record not found for update in companies.

Where clause: { "id": "non-existent-id" }
Total records in companies: 2
Sample records (first 3):
  { "id": "company-1", "name": "Company 1", "slug": "company-1" }
  { "id": "company-2", "name": "Company 2", "slug": "company-2" }

This usually means:
  1. The record doesn't exist in your test data
  2. The where clause doesn't match any records
  3. The field names in where clause are incorrect

To fix:
  - Check that the record exists in your seed data
  - Verify the where clause matches your data structure
  - Use findUnique() first to verify the record exists
```

**Unique Constraint Violation:**

```
Prismocker: findUnique found 2 records (expected 0 or 1). Unique constraint violation.

Where clause: { "slug": "duplicate-slug" }

This usually means:
  1. Multiple records match the unique constraint in your test data
  2. The unique constraint fields are not actually unique in your seed data

To fix:
  - Ensure your test data has unique values for the constraint fields
  - Check that you're using the correct unique field(s) in your where clause
  - Use findFirst() instead if you expect multiple matches
```

**Zod Validation Error:**

```
Prismocker: Zod validation failed for companies.create

Validation error: Required field 'name' is missing

Data being validated:
{
  "owner_id": "user-1",
  "slug": "test-company"
}

Validation issues:
[
  {
    "path": ["name"],
    "message": "Required"
  }
]

This usually means:
  1. The data doesn't match the Zod schema requirements
  2. Required fields are missing or have invalid values
  3. Field types don't match the schema

To fix:
  - Check your Zod schema requirements
  - Ensure all required fields are provided
  - Verify field types match the schema
```

**Prismocker Instance Error:**

```
Prismocker: seedTestData requires a PrismockerClient instance.

You passed a real PrismaClient. In tests, use createTestPrisma() or createPrismocker<PrismaClient>() to get a PrismockerClient instance.

Example:
  import { createTestPrisma } from 'prisma/test-utils';
  const prisma = createTestPrisma();
  seedTestData(prisma, { companies: [...] });
```

### Benefits

* **Faster debugging** - Errors tell you exactly what's wrong
* **Actionable suggestions** - Know how to fix issues immediately
* **Better test quality** - Catch data setup issues early
* **Reduced frustration** - Clear, helpful error messages

</details>

## How It Works

<details>
<summary><strong>In-Memory Storage</strong></summary>

Prismocker uses `Map<string, any[]>` to store data in memory:

* Each model has its own store (e.g., `stores.get('companies')`)
* Data is stored as plain JavaScript objects
* No database connection required
* Fast and isolated for unit tests

</details>

<details>
<summary><strong>Query Engine</strong></summary>

Prismocker includes a query engine that:

* Filters records based on Prisma `where` clauses
* Sorts records based on `orderBy` clauses
* Supports complex logical operators (`AND`, `OR`, `NOT`)
* Handles comparison operators (`equals`, `lt`, `gt`, `contains`, etc.)
* Supports advanced operators (`search`, `array_contains`, `path`, `isSet`)

**Supported Where Clause Operators:**

* **Basic:** `equals`, `not`, `in`, `notIn`
* **Comparison:** `lt`, `lte`, `gt`, `gte`
* **String:** `contains`, `startsWith`, `endsWith`, `search` (full-text search)
* **Array:** `array_contains`, `has` (PostgreSQL alias)
* **JSON:** `path` (nested JSON field querying)
* **Nullability:** `isSet` (check if field is set)
* **Relations:** `some`, `every`, `none` (relation filters)
* **Logical:** `AND`, `OR`, `NOT`

</details>

<details>
<summary><strong>Advanced Where Clause Operators</strong></summary>

Prismocker supports advanced where clause operators for PostgreSQL-specific features and complex queries:

### Full-Text Search (`search`)

Case-insensitive full-text search for string fields:

```typescript
const results = await prisma.companies.findMany({
  where: {
    name: {
      search: 'Corporation', // Case-insensitive search
    },
  },
});
```

### Array Contains (`array_contains` / `has`)

Check if an array field contains a specific value:

```typescript
// Using array_contains
const reactJobs = await prisma.jobs.findMany({
  where: {
    tags: {
      array_contains: 'react',
    },
  },
});

// Using has (PostgreSQL alias)
const pythonJobs = await prisma.jobs.findMany({
  where: {
    tags: {
      has: 'python',
    },
  },
});
```

### JSON Path (`path`)

Query nested JSON fields using path navigation:

```typescript
// Query nested JSON: metadata.author.name
const results = await prisma.content.findMany({
  where: {
    metadata: {
      path: ['author', 'name'],
      equals: 'John Doe',
    },
  },
});

// JSON path with array_contains
const tutorialContent = await prisma.content.findMany({
  where: {
    metadata: {
      path: ['tags'],
      array_contains: 'tutorial',
    },
  },
});
```

### Is Set (`isSet`)

Check if a field is set (not null/undefined):

```typescript
// Find records with field set
const withDescription = await prisma.companies.findMany({
  where: {
    description: {
      isSet: true,
    },
  },
});

// Find records without field set
const withoutDescription = await prisma.companies.findMany({
  where: {
    description: {
      isSet: false,
    },
  },
});
```

</details>

<details>
<summary><strong>Type System</strong></summary>

Prismocker leverages TypeScript's advanced type system to provide full type safety:

### Type Preservation Architecture

**ExtractModels<T> Type Utility:**

```typescript
import type { ExtractModels } from 'prisma/prisma-types';

// ExtractModels<T> preserves all model types from PrismaClient
type PrismockerClient = ExtractModels<PrismaClient>;

// This means:
// - prisma.companies → PrismaClient['companies'] (fully typed)
// - prisma.jobs → PrismaClient['jobs'] (fully typed)
// - All Prisma methods preserved with original types
// - Prismocker methods added with proper types
```

**How It Works:**

1. **Model Type Mapping** - Maps all `Prisma.ModelName` values to their corresponding model delegate types from `PrismaClient`
2. **Method Preservation** - Preserves types for all Prisma-specific methods (`$queryRaw`, `$transaction`, `$connect`, etc.)
3. **Prismocker Methods** - Adds Prismocker-specific methods (`reset`, `setData`, `getData`, etc.) with proper types
4. **Proxy Type Safety** - Uses TypeScript's type system to preserve types through Proxy interception

### Type Flow

```
createPrismocker<PrismaClient>()
  → Returns ExtractModels<PrismaClient>
  → Proxy intercepts property access
  → prisma.companies → Returns PrismaClient['companies'] (fully typed)
  → ModelProxy.findMany() → Returns Company[] (from Prisma schema)
```

### Key Features

* ✅ **Uses Prisma's Generated Types** - Leverages types from `@prisma/client`
* ✅ **Module Augmentation** - Extends `PrismaClient` with Prismocker methods
* ✅ **Type Guards** - `isPrismockerClient()` for runtime type narrowing
* ✅ **Full IntelliSense** - Complete autocomplete and type checking in IDEs
* ✅ **No Type Assertions** - Eliminates need for `as any` for models in schema
* ✅ **Transaction Type Safety** - Transaction callbacks receive fully typed clients

### Example: Full Type Safety

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

const prisma = createPrismocker<PrismaClient>();

// ✅ All operations are fully typed
const companies = await prisma.companies.findMany();
// Type: Company[]

const company = await prisma.companies.findUnique({
  where: { id: 'company-1' },
});
// Type: Company | null

await prisma.companies.create({
  data: {
    name: 'Company 1',
    owner_id: 'user-1',
    slug: 'company-1',
  },
});
// ✅ TypeScript validates all fields match schema

// ✅ Prismocker methods are also typed
prisma.reset(); // Type: () => void
prisma.setData('companies', []); // Type: (modelName: string, data: any[]) => void
const data = prisma.getData('companies'); // Type: any[]
```

</details>

## Example Files

The Prismocker package includes comprehensive examples demonstrating its power:

<details>
<summary><strong>examples/service-layer.test.ts</strong></summary>

Real-world service layer testing with Prismocker. Demonstrates:

* Service class testing
* Complex query testing
* Data seeding patterns
* Type-safe test utilities

**Features Demonstrated:**

* ✅ Service layer isolation
* ✅ Complex Prisma queries
* ✅ Type-safe data seeding
* ✅ Test data factories

</details>

<details>
<summary><strong>examples/api-route.test.ts</strong></summary>

Next.js API route testing with Prismocker. Demonstrates:

* API route handler testing
* Request/response testing
* Error handling
* Authentication testing

**Features Demonstrated:**

* ✅ API route testing
* ✅ Request validation
* ✅ Error responses
* ✅ Status code testing

</details>

<details>
<summary><strong>examples/complex-scenarios.test.ts</strong></summary>

Complex testing scenarios demonstrating Prismocker's capabilities:

* Multi-model relationships
* Complex where clauses
* Aggregations and grouping
* Transaction testing
* Edge case handling
* Performance testing patterns

**Features Demonstrated:**

* ✅ Complex query patterns
* ✅ Advanced aggregations
* ✅ Transaction rollback
* ✅ Edge case coverage
* ✅ Performance optimization

</details>

<details>
<summary><strong>examples/zod-validation.test.ts</strong></summary>

Comprehensive Zod validation integration example. Demonstrates:

* Generated Zod schema validation
* Type-safe data creation with Zod
* Error handling for invalid data
* Integration with Prisma Client Extensions
* Custom validation logic

**Features Demonstrated:**

* ✅ Zod schema validation
* ✅ Type-safe data operations
* ✅ Error handling patterns
* ✅ Prisma extensions integration
* ✅ Complex validation scenarios

**Prerequisites:**

* `prisma-zod-generator` configured
* Generated Zod schemas available

</details>

<details>
<summary><strong>examples/prismajson-types.test.ts</strong></summary>

PrismaJson types integration example. Demonstrates:

* PrismaJson type definitions
* Strongly-typed JSON fields
* JSON field validation
* Nested JSON structures
* Type-safe JSON queries

**Features Demonstrated:**

* ✅ PrismaJson type safety
* ✅ Strongly-typed JSON fields
* ✅ Nested JSON structures
* ✅ JSON field queries
* ✅ Type preservation

**Prerequisites:**

* `prisma-json-types-generator` configured
* Generated PrismaJson types available

</details>

<details>
<summary><strong>examples/opinionated-tests.test.ts</strong></summary>

Opinionated testing patterns that provide direct benefit. Demonstrates:

* Type-safe test utilities
* Data factory patterns
* Test isolation best practices
* Error scenario testing
* Performance testing patterns
* Edge case coverage
* Real-world testing scenarios

**Features Demonstrated:**

* ✅ Type-safe helpers usage
* ✅ Data factory patterns
* ✅ Error scenario testing
* ✅ Edge case coverage
* ✅ Performance testing
* ✅ Comprehensive relation testing
* ✅ Transaction testing patterns

**Why Opinionated?**

These patterns enforce best practices that have proven effective in real-world applications, making tests more maintainable and catching bugs early.

* Transaction testing
* Zod validation integration

**Features Demonstrated:**

* ✅ Complex relations
* ✅ Advanced queries
* ✅ Aggregations
* ✅ Transactions
* ✅ Ecosystem compatibility

</details>

## Caveats & Considerations

<details>
<summary><strong>Relations</strong></summary>

**Current Support:**

* ✅ Full `include` support (loads all fields + relations)
* ✅ Full `select` support (selective field loading)
* ✅ Nested `include`/`select` in relations
* ✅ Relation filters: `some`, `every`, `none`
* ✅ Foreign key inference (tries common patterns)
* ✅ One-to-many and one-to-one relations

**Limitations:**

* Many-to-many relations require explicit junction table data
* Complex nested relations may require manual setup for edge cases

**Workaround:** For complex many-to-many relations, manually seed junction table data in your test setup.

</details>

<details>
<summary><strong>Transactions</strong></summary>

**Current Support:**

* ✅ Transaction callbacks execute normally
* ✅ All operations within transaction complete
* ✅ **Automatic rollback on errors** - All changes are rolled back if any error occurs
* ✅ **State snapshotting** - Complete state is captured before transaction
* ✅ **Atomicity** - All-or-nothing behavior (all changes commit or all rollback)

**Limitations:**

* No isolation level simulation (all transactions see the same state)
* No nested transaction support
* No transaction timeout simulation

**Note:** Prismocker provides realistic transaction behavior with automatic rollback, making it perfect for testing error scenarios and ensuring data consistency.

</details>

<details>
<summary><strong>Raw Queries</strong></summary>

Prismocker provides enhanced support for `$queryRaw`, `$queryRawUnsafe`, `$executeRaw`, and `$executeRawUnsafe` methods, allowing for configurable execution and basic SQL parsing.

**Current Support:**

* ✅ **Configurable Executor**: Provide a custom function to handle raw SQL queries.
* ✅ **Basic SQL Parsing**: Enable simple `SELECT`, `INSERT`, `UPDATE`, and `DELETE` statement parsing and execution against in-memory data.
* ✅ **Parameter Handling**: Correctly handles `$1`, `$2` style parameters in raw queries.
* ✅ **Template String Support**: Works with `$queryRaw` and `$executeRaw` template literal syntax.

**Configuration Options:**

You can configure raw query behavior via `PrismockerOptions`:

```typescript
const prisma = createPrismocker<PrismaClient>({
  // Enable basic SQL parsing for SELECT, INSERT, UPDATE, DELETE statements
  enableSqlParsing: true,
  // Or provide a custom executor function for queries
  queryRawExecutor: async (sql, params, stores) => {
    // Implement your custom logic here
    // Example: return data from stores based on SQL
    if (sql.includes('SELECT * FROM users')) {
      return stores.get('users') || [];
    }
    return [];
  },
  // Or provide a custom executor function for DML operations
  executeRawExecutor: async (sql, params, stores) => {
    // Implement your custom logic here
    // Example: update stores based on SQL
    if (sql.includes('UPDATE users SET name =')) {
      const users = stores.get('users') || [];
      // Update logic...
      return users.length; // Return count of affected rows
    }
    return 0;
  },
});
```

**Usage Examples:**

### `$queryRaw` and `$queryRawUnsafe` (Returns Data)

```typescript
// Template literal syntax
const userId = 'user-1';
const result = await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
// If enableSqlParsing is true, this will attempt to parse and execute
// If queryRawExecutor is provided, it will be used
// Otherwise, returns [] by default

// Plain string syntax
const userName = 'Alice';
const result = await prisma.$queryRawUnsafe('SELECT * FROM users WHERE name = $1', userName);
// Similar execution logic as $queryRaw
```

### `$executeRaw` and `$executeRawUnsafe` (Returns Affected Row Count)

```typescript
// Template literal syntax
const userId = 'user-1';
const newName = 'John';
const affectedRows =
  await prisma.$executeRaw`UPDATE users SET name = ${newName} WHERE id = ${userId}`;
// If enableSqlParsing is true, this will attempt to parse and execute
// If executeRawExecutor is provided, it will be used
// Otherwise, returns 0 by default

// Plain string syntax
const affectedRows = await prisma.$executeRawUnsafe(
  'UPDATE users SET name = $1 WHERE id = $2',
  'John',
  'user-1'
);
// Similar execution logic as $executeRaw
```

**Recommendation:**

For complex raw queries or RPC calls, it's often best to provide a custom executor or mock the methods directly in your tests:

```typescript
// Mock $queryRawUnsafe for RPC calls
prisma.$queryRawUnsafe = jest.fn().mockResolvedValue([{ id: 'result-1' }]);

// Mock $executeRawUnsafe for DML operations
prisma.$executeRawUnsafe = jest.fn().mockResolvedValue(1); // 1 row affected
```

</details>

<details>
<summary><strong>TypeScript Type Resolution</strong></summary>

**Problem:** TypeScript may resolve types from the mocked module instead of the real `@prisma/client` package.

**Solution:** Configure TypeScript to resolve types from the real package:

```json
{
  "compilerOptions": {
    "paths": {
      "@prisma/client": ["./node_modules/@prisma/client"]
    }
  }
}
```

</details>

## Troubleshooting

<details>
<summary><strong>Jest: "Cannot find module '@prisma/client'"</strong></summary>

**Problem:** Jest cannot find the `@prisma/client` module.

**Solution:** Ensure your `__mocks__/@prisma/client.ts` file is in the correct location (project root or `__mocks__` directory at package level).

**Verify:**

```bash
# Check mock file exists
ls __mocks__/@prisma/client.ts

# Check Jest is using the mock
# Add console.log in your mock file to verify it's being loaded
```

</details>

<details>
<summary><strong>Vitest: Mock not working</strong></summary>

**Problem:** Vitest isn't using the mock.

**Solution:** Ensure `vi.mock('@prisma/client', ...)` is called before any imports that use `@prisma/client`.

**Best Practice:** Put mock setup in `vitest.setup.ts` or at the top of your test file before any imports.

</details>

<details>
<summary><strong>Type Errors: "Module has no exported member"</strong></summary>

**Problem:** TypeScript shows errors about missing exports from `@prisma/client`.

**Solution:** Configure TypeScript paths to resolve types from the real package (see TypeScript Type Resolution section).

</details>

<details>
<summary><strong>Relations not loading</strong></summary>

**Problem:** `include` or `select` with relations returns empty/null.

**Solution:** Ensure related data is seeded in your test setup. Prismocker infers foreign keys, but you may need to manually set up complex relations.

**Example:**

```typescript
beforeEach(() => {
  // Seed related data
  (prisma as any).setData('companies', [{ id: 'company-1', name: 'Company 1' }]);
  (prisma as any).setData('jobs', [{ id: 'job-1', company_id: 'company-1', title: 'Job 1' }]);
});
```

</details>

<details>
<summary><strong>Zod validation not working</strong></summary>

**Problem:** Zod validation is enabled but not validating.

**Solution:**

1. Ensure `prisma-zod-generator` is configured and schemas are generated
2. Check `zodSchemasPath` matches your generator output path
3. Verify Zod is installed (`zod` is an optional peer dependency)

**Verify:**

```typescript
const prisma = createPrismocker<PrismaClient>({
  validateWithZod: true,
  zodSchemasPath: '@prisma/zod', // Or your custom path
  logQueries: true, // Enable to see validation warnings
});
```

</details>

## Migration Guide

<details>
<summary><strong>From Prismock</strong></summary>

**Before (Prismock):**

```typescript
import { PrismockClient } from 'prismock';

const prismock = new PrismockClient();
```

**After (Prismocker):**

```typescript
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

const prisma = createPrismocker<PrismaClient>();
```

**Benefits:**

* ✅ Works with pnpm (no module resolution issues)
* ✅ Type-safe (no `as any` assertions needed)
* ✅ Faster (no schema parsing overhead)
* ✅ Prisma ecosystem compatible

</details>

<details>
<summary><strong>From Manual Mocks</strong></summary>

**Before (Manual Mock):**

```typescript
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    companies: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  })),
}));
```

**After (Prismocker):**

```typescript
// __mocks__/@prisma/client.ts
import { createPrismocker } from 'prisma';
import type { PrismaClient } from '@prisma/client';

export const PrismaClient = createPrismocker<PrismaClient>();
```

**Benefits:**

* ✅ Less boilerplate
* ✅ Real Prisma API behavior
* ✅ Type-safe
* ✅ Easier to maintain

</details>

## CLI Commands

### `npx prisma setup`

Automatically sets up Prismocker in your project. See [Auto-Setup](#auto-setup-recommended) section for details.

**Options:**

* `--schema <path>` - Path to Prisma schema file (default: `./prisma/schema.prisma`)
* `--mock <path>` - Path to mock file (default: `./__mocks__/@prisma/client.ts`)
* `--framework <name>` - Testing framework: `jest` or `vitest` (auto-detected if not specified)
* `--skip-examples` - Skip creating example test files
* `--only-mock` - Only create mock file (skip enum generation and setup file updates)
* `--only-enums` - Only generate enum stubs (skip mock file and setup file updates)

**Examples:**

```bash
# Full setup
npx prisma setup

# Only create mock file
npx prisma setup --only-mock

# Only generate enums
npx prisma setup --only-enums
```

### `npx prisma verify`

Verifies that Prismocker is properly set up in your project.

```bash
# Verify setup
npx prisma verify

# Custom paths
npx prisma verify --schema ./prisma/schema.prisma --mock ./__mocks__/@prisma/client.ts
```

**Checks:**

* ✅ Mock file exists
* ✅ Schema file exists
* ✅ Setup file is configured correctly

**Exit Code:** Returns `0` if all checks pass, `1` if any issues are found.

### `npx prisma fix`

Automatically fixes Prismocker setup issues.

```bash
# Fix setup issues
npx prisma fix

# Custom paths
npx prisma fix --schema ./prisma/schema.prisma --mock ./__mocks__/@prisma/client.ts
```

**Actions:**

* Creates missing mock file
* Updates setup file configuration
* Generates enum stubs

### `npx prisma rollback`

Removes Prismocker setup from your project.

```bash
# Remove mock file only
npx prisma rollback

# Remove mock file and setup file references
npx prisma rollback --remove-setup
```

**Options:**

* `--remove-setup` - Also prompts to remove setup file references (manual removal required)

### `npx prisma generate-enums`

Generates enum stubs from your Prisma schema for use in mock files.

```bash
# Basic usage (uses defaults)
npx prisma generate-enums

# Custom paths
npx prisma generate-enums --schema ./prisma/schema.prisma --mock ./__mocks__/@prisma/client.ts
```

**When to run:**

* After adding new enums to your Prisma schema
* After modifying enum values in your Prisma schema
* After running `prisma generate` (consider adding to postgenerate hook)

## Contributing

This package is designed to be standalone and extractable. Contributions welcome!

**Areas for Contribution:**

* Comprehensive JSDoc documentation
* Additional test utilities

## Why Prismocker?

Prismocker was created to solve real problems in Prisma testing:

1. **pnpm Compatibility** - Other Prisma mocks (like Prismock) have module resolution issues with pnpm
2. **Type Safety** - Eliminates `as any` assertions with proper TypeScript integration
3. **Ecosystem Compatibility** - Works with all Prisma generators and extensions
4. **Simplicity** - No schema parsing overhead, just fast in-memory storage
5. **Maintainability** - You control the code, can extend as needed
6. **Standalone** - Environment-agnostic, works with any Prisma setup

**Perfect For:**

* ✅ Unit testing Prisma-based services
* ✅ API route testing
* ✅ Complex query testing
* ✅ Integration testing (without database)
* ✅ CI/CD pipelines (fast, no database setup)

## License

MIT

## Author

JSONbored

## Related Projects

* [Prisma](https://www.prisma.io/) - The ORM being mocked
* [prisma-zod-generator](https://github.com/omar-dulaimi/prisma-zod-generator) - Zod schema generator for Prisma
* [prisma-json-types-generator](https://github.com/olivierwilkinson/prisma-json-types-generator) - JSON type generator for Prisma
