# Prismocker

A type-safe, in-memory Prisma Client mock for testing. Works perfectly with pnpm and supports all Prisma operations.

## Features

- ✅ **Type-safe** - Uses Prisma's generated types
- ✅ **pnpm compatible** - No module resolution issues
- ✅ **Full Prisma API** - Supports findMany, findUnique, create, update, delete, count, aggregate, groupBy
- ✅ **In-memory storage** - Fast and isolated
- ✅ **Test utilities** - `reset()` method for test isolation
- ✅ **Zero dependencies** - Only requires `@prisma/client` as peer dependency
- ✅ **Enum support** - Auto-generate enum stubs for Vitest with `npx prismocker generate-enums`

## Installation

```bash
npm install prismocker --save-dev
# or
pnpm add -D prismocker
# or
yarn add -D prismocker
```

## Usage

### Basic Usage

```typescript
import { createPrismocker } from 'prismocker';
import type { PrismaClient } from '@prisma/client';

const prisma = createPrismocker<PrismaClient>();

// Use just like PrismaClient
const users = await prisma.user.findMany();
await prisma.user.create({ data: { name: 'John' } });
const user = await prisma.user.findUnique({ where: { id: '1' } });
```

### With Vitest

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createPrismocker } from 'prismocker';
import type { PrismaClient } from '@prisma/client';

describe('MyService', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = createPrismocker<PrismaClient>();
    // Reset data before each test
    prisma.reset();
  });

  it('should create a user', async () => {
    const user = await prisma.user.create({
      data: { name: 'John', email: 'john@example.com' },
    });

    expect(user.name).toBe('John');
    expect(user.email).toBe('john@example.com');
  });
});
```

### With Auto-mocking (Vitest)

Create `__mocks__/@prisma/client.ts`:

```typescript
import { createPrismocker } from 'prismocker';
import type { PrismaClient } from '@prisma/client';

// Create PrismockerClient instance
const PrismockerClientClass = createPrismocker<PrismaClient>();

// Export as PrismaClient for Vitest auto-mocking
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

// Export Prisma enum stubs (auto-generated - see below)
// ... enum exports here ...
```

Then register the mock in `vitest.setup.ts`:

```typescript
import { vi } from 'vitest';

// Explicitly mock @prisma/client to use Prismocker
vi.mock('@prisma/client', async () => {
  const mockModule = await import('./__mocks__/@prisma/client.ts');
  return mockModule;
});
```

Then in your tests:

```typescript
import { PrismaClient } from '@prisma/client';
import { job_status } from '@prisma/client'; // ✅ Enum stubs work!

// PrismaClient is automatically PrismockerClient in tests
const prisma = new PrismaClient();
```

### Enum Support

Prismocker supports Prisma enums via auto-generated stubs. After adding or modifying enums in your Prisma schema, run:

```bash
npx prismocker generate-enums
```

This will:
1. Parse your `prisma/schema.prisma` file
2. Extract all enum definitions (handles `@map()` directives)
3. Generate enum stub exports in `__mocks__/@prisma/client.ts`

**Options:**
- `--schema <path>` - Path to Prisma schema (default: `./prisma/schema.prisma`)
- `--mock <path>` - Path to mock file (default: `./__mocks__/@prisma/client.ts`)

**Example:**
```bash
npx prismocker generate-enums --schema ./prisma/schema.prisma --mock ./__mocks__/@prisma/client.ts
```

The generated enum stubs allow you to import enums normally in tests:
```typescript
import { job_status, job_type } from '@prisma/client';

// Enum stubs work just like real Prisma enums
expect(job_status.active).toBe('active');
expect(job_type.full_time).toBe('full-time'); // Handles @map() correctly
```

**Note:** After running `prisma generate` or modifying enums in your schema, run `npx prismocker generate-enums` to update the enum stubs in your mock file.

**Standalone Usage:** The `generate-enums` CLI tool is included in the Prismocker package and works in any project. It has no dependencies beyond Node.js built-in modules, making it perfect for standalone OSS use.

### Query Logging

Enable query logging for debugging:

```typescript
const prisma = createPrismocker<PrismaClient>({
  logQueries: true,
  logger: (message, data) => {
    console.log(message, data);
  },
});
```

## API

### `createPrismocker<T>(options?)`

Creates a new PrismockerClient instance.

**Options:**
- `logQueries?: boolean` - Enable query logging (default: `false`)
- `logger?: (message: string, data?: any) => void` - Custom logger (default: `console.log`)

### `prisma.reset()`

Reset all in-memory data. Useful for test isolation.

### `prisma.getData(modelName: string)`

Get all data for a model (useful for debugging).

### `prisma.setData(modelName: string, data: any[])`

Set data for a model (useful for test setup).

## Supported Operations

- ✅ `findMany` - Query multiple records
- ✅ `findUnique` - Query single record by unique field
- ✅ `findFirst` - Query first matching record
- ✅ `create` - Create single record
- ✅ `createMany` - Create multiple records
- ✅ `update` - Update single record
- ✅ `updateMany` - Update multiple records
- ✅ `delete` - Delete single record
- ✅ `deleteMany` - Delete multiple records
- ✅ `count` - Count matching records
- ✅ `aggregate` - Aggregate operations (basic support)
- ✅ `groupBy` - Group by operations (basic support)
- ✅ `$queryRaw` - Raw SQL queries (stub - typically mocked in tests)
- ✅ `$queryRawUnsafe` - Unsafe raw SQL queries (stub - typically mocked in tests)
- ✅ `$transaction` - Transactions (simplified - just executes callback)

## Where Clause Support

Prismocker supports most Prisma where clause operators:

- `equals` - Equality
- `not` - Not equal
- `in` - In array
- `notIn` - Not in array
- `lt` - Less than
- `lte` - Less than or equal
- `gt` - Greater than
- `gte` - Greater than or equal
- `contains` - String contains
- `startsWith` - String starts with
- `endsWith` - String ends with

## TypeScript Type Resolution

When using Prismocker with Vitest, TypeScript may resolve types from the mocked module instead of the real `@prisma/client` package. This can cause TypeScript errors like:

```
Module '"@prisma/client"' has no exported member 'PrismaClient'.
```

### Solution

Configure TypeScript to resolve types from the real package while Vitest uses the mock for runtime. Add this to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@prisma/client": ["./node_modules/@prisma/client"]
    }
  }
}
```

Alternatively, you can use a type declaration file to re-export types from the real package. Create `types/prisma-client-types.d.ts`:

```typescript
// Re-export types from real package for TypeScript resolution
export type {
  PrismaClient,
  Prisma,
  // Add your enum types here
  job_plan,
  job_tier,
  // ... other enums
} from '@prisma/client';
```

Then in your test files, import types from this declaration file instead:

```typescript
import type { PrismaClient } from './types/prisma-client-types';
```

**Note:** The mock file (`__mocks__/@prisma/client.ts`) exports runtime values (PrismockerClientClass, enum const objects) but cannot import types from `@prisma/client` due to circular references. TypeScript configuration is required to resolve types from the real package.

## Limitations

- **Relations**: Basic support only (nested where clauses work, but include/select for relations is simplified)
- **Aggregations**: Basic support for `_count`, other aggregations coming soon
- **Raw Queries**: Stub implementations (typically mocked in tests anyway)
- **Transactions**: Simplified (just executes callback, no rollback)
- **TypeScript Types**: Requires configuration to resolve types from real `@prisma/client` package (see above)

## Why Prismocker?

Prismocker was created to solve the pnpm compatibility issues with Prismock. It:

- ✅ Works perfectly with pnpm (no module resolution issues)
- ✅ Is simpler and faster (no schema parsing overhead)
- ✅ Is type-safe (uses Prisma's generated types)
- ✅ Is maintainable (you control the code)
- ✅ Can be extended with features you need

## License

MIT

## Author

JSONbored

