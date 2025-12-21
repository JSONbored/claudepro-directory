# Prisma PostgreSQL Types Generator

A Prisma custom generator that generates TypeScript types and Zod schemas for PostgreSQL functions (RPCs) and composite types directly from database introspection.

## Overview

This generator extends Prisma's type generation capabilities by adding support for:

- ✅ **PostgreSQL Functions (RPCs)** - Function argument and return types
- ✅ **PostgreSQL Composite Types** - User-defined structured types
- ✅ **TypeScript Types** - Full type safety with autocomplete
- ✅ **Zod Schemas** - Runtime validation for function arguments and returns

## Installation

The generator is included in the `@heyclaude/generators` package. No additional installation needed.

## Configuration

Add the generator to your `schema.prisma` file:

```prisma
generator postgres-types {
  provider = "./packages/generators/src/prisma-postgres-types-generator"
  output   = "../generated/prisma/postgres-types"
  schema   = "public"              // Optional: schema to introspect (default: "public")
  generateTypes = true              // Optional: generate TypeScript types (default: true)
  generateZod = true                // Optional: generate Zod schemas (default: true)
  includeFunctions = ["get_*"]      // Optional: include only matching functions
  excludeFunctions = ["internal_*"] // Optional: exclude matching functions
}
```

## Usage

The generator runs automatically when you execute:

```bash
pnpm prisma generate
```

### Generated Output

The generator creates TypeScript types and Zod schemas in the specified output directory:

```
generated/prisma/postgres-types/
├── index.ts                        # Main exports
├── functions/
│   ├── index.ts                    # Functions barrel export
│   ├── get_content_by_slug.ts      # Individual function types
│   └── ...
└── composites/
    ├── index.ts                    # Composites barrel export
    ├── user_complete_data_result.ts
    └── ...
```

### Example Generated Code

#### Function Types

```typescript
// generated/prisma/postgres-types/functions/get_content_by_slug.ts
import { z } from 'zod';

/**
 * Arguments for PostgreSQL function: get_content_by_slug
 */
export type GetContentBySlugArgs = {
  p_slug: string;
  p_category?: 'agents' | 'mcp' | 'rules' | null;
};

/**
 * Zod schema for get_content_by_slug function arguments
 */
export const getContentBySlugArgsSchema = z.object({
  p_slug: z.string(),
  p_category: z.enum(['agents', 'mcp', 'rules']).nullable().optional(),
});

/**
 * Type inference from Zod schema
 */
export type GetContentBySlugArgs = z.infer<typeof getContentBySlugArgsSchema>;
```

#### Composite Types

```typescript
// generated/prisma/postgres-types/composites/user_complete_data_result.ts
import { z } from 'zod';

/**
 * PostgreSQL composite type: user_complete_data_result
 */
export type UserCompleteDataResult = {
  account_dashboard: {
    bookmark_count: number;
    profile: {
      created_at: string;
      name: string | null;
    };
  } | null;
  user_dashboard: {
    submissions: Array<{ id: string; title: string }>;
  } | null;
};

/**
 * Zod schema for user_complete_data_result composite type
 */
export const userCompleteDataResultSchema = z.object({
  account_dashboard: z
    .object({
      bookmark_count: z.number(),
      profile: z.object({
        created_at: z.string(),
        name: z.string().nullable(),
      }),
    })
    .nullable(),
  user_dashboard: z
    .object({
      submissions: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
        })
      ),
    })
    .nullable(),
});

/**
 * Type inference from Zod schema
 */
export type UserCompleteDataResult = z.infer<typeof userCompleteDataResultSchema>;
```

### Using Generated Types

#### In API Routes

```typescript
import { getContentBySlugArgsSchema } from '@heyclaude/data-layer/prisma/postgres-types/functions';
import type {
  GetContentBySlugArgs,
  GetContentBySlugReturns,
} from '@heyclaude/data-layer/prisma/postgres-types/functions';

export const POST = createApiRoute({
  bodySchema: getContentBySlugArgsSchema,
  handler: async ({ body }) => {
    // body is typed as GetContentBySlugArgs
    const result: GetContentBySlugReturns = await rpc('get_content_by_slug', body);
    return jsonResponse(result, 200);
  },
});
```

#### In Server Actions

```typescript
import { getContentBySlugArgsSchema } from '@heyclaude/data-layer/prisma/postgres-types/functions';
import type { GetContentBySlugArgs } from '@heyclaude/data-layer/prisma/postgres-types/functions';

export const getContent = actionClient
  .inputSchema(getContentBySlugArgsSchema)
  .action(async ({ parsedInput }) => {
    // parsedInput is typed as GetContentBySlugArgs
    const result = await rpc('get_content_by_slug', parsedInput);
    return result;
  });
```

## Features

### Type Safety

- ✅ Full TypeScript type coverage for all PostgreSQL functions and composite types
- ✅ Type inference from Zod schemas ensures types and schemas stay in sync
- ✅ IDE autocomplete and IntelliSense support

### Runtime Validation

- ✅ Zod schemas for all function arguments and returns
- ✅ Validation for composite types
- ✅ Proper handling of nullables, optionals, and defaults

### Performance

- ✅ Tree-shakeable exports (individual files per function/composite)
- ✅ Type-only imports (no runtime overhead)
- ✅ Fast generation (< 5 seconds for typical schema)

### Quality

- ✅ Comprehensive JSDoc comments
- ✅ Clear naming conventions
- ✅ Handles edge cases (nested composites, arrays, nullables)
- ✅ Production-ready code quality

## Supported PostgreSQL Types

### Scalar Types

- `uuid`, `text`, `varchar`, `bpchar` → `string`
- `int2`, `int4`, `int8`, `float4`, `float8`, `numeric` → `number`
- `bool` → `boolean`
- `json`, `jsonb` → `Record<string, unknown>`
- `timestamptz`, `timestamp`, `date` → `string` (ISO 8601)

### Array Types

- `_text`, `_varchar` → `string[]`
- `_uuid` → `string[]`
- `_int4`, `_int8` → `number[]`
- `_bool` → `boolean[]`
- Multi-dimensional arrays supported

### Composite Types

- User-defined composite types → TypeScript interfaces
- Nested composite types supported
- Proper nullability handling

### Enum Types

- PostgreSQL enums → TypeScript union types
- Referenced from Prisma-generated enums when available
- **Enum Zod Schemas**: The generator also generates enum Zod schemas matching `prisma-zod-generator` format, but using actual database enum values (from introspection) instead of Prisma enum names. This properly handles `@map()` directives that map Prisma enum names to database values.

## Configuration Options

| Option             | Type     | Default                             | Description                                                  |
| ------------------ | -------- | ----------------------------------- | ------------------------------------------------------------ |
| `output`           | string   | `./generated/prisma/postgres-types` | Output directory for generated files                         |
| `schema`           | string   | `"public"`                          | PostgreSQL schema to introspect                              |
| `generateTypes`    | boolean  | `true`                              | Generate TypeScript types                                    |
| `generateZod`      | boolean  | `true`                              | Generate Zod schemas                                         |
| `includeFunctions` | string[] | `undefined`                         | Include only functions matching patterns (e.g., `["get_*"]`) |
| `excludeFunctions` | string[] | `undefined`                         | Exclude functions matching patterns (e.g., `["internal_*"]`) |

## Troubleshooting

### Generator Not Running

Ensure the generator is properly configured in `schema.prisma` and the provider path is correct.

### Database Connection Errors

The generator requires access to the database. Ensure:

- `POSTGRES_PRISMA_URL` or the datasource URL environment variable is set
- Database is accessible from the generation environment
- Connection string is valid

### Type Errors

If generated types have errors:

1. Check that all PostgreSQL types are supported
2. Verify database schema is correct
3. Check generator logs for warnings about unsupported types

## Development

### Project Structure

```
packages/generators/src/prisma-postgres-types-generator/
├── index.ts                    # Generator entry point
├── introspect.ts               # Database introspection
├── function-generator.ts        # Function type generation
├── composite-generator.ts      # Composite type generation
├── type-mapper.ts              # PostgreSQL → TypeScript mapping
├── types.ts                    # Type definitions
└── README.md                   # This file
```

### Reusing Existing Utilities

The generator leverages existing utilities from the generators toolkit:

- `toolkit/introspection.ts` - Database introspection queries
- `toolkit/zod-mapper.ts` - PostgreSQL → Zod type mapping

## Future Enhancements

- [ ] Support for multiple schemas
- [ ] Incremental generation (only regenerate changed types)
- [ ] Type guards generation
- [ ] Validation helpers
- [ ] API documentation generation
- [ ] Custom type mappings via config

## License

Internal use only (part of @heyclaude/generators package).
