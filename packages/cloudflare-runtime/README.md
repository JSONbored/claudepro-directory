# @heyclaude/cloudflare-runtime

Cloudflare Workers runtime utilities for HeyClaude MCP server and future Cloudflare Workers.

---

## Overview

This package provides Cloudflare Workers-specific utilities that complement `@heyclaude/shared-runtime`:

- **Environment Configuration** - Type-safe environment variable access for Cloudflare Workers
- **Prisma Client Factory** - Prisma client creation with Hyperdrive connection pooling
- **Supabase Auth** - JWT validation utilities for Supabase Auth in Workers
- **Logging** - Pino logger configured for Workers Logs
- **Error Handling** - Error normalization and response utilities

---

## Exports

### Environment Configuration

```typescript
import { parseEnv, getEnvVar, requireEnvVar } from '@heyclaude/cloudflare-runtime/config/env';

const config = parseEnv(env); // Validated environment configuration
```

### Prisma Client

```typescript
import { createPrismaClient } from '@heyclaude/cloudflare-runtime/prisma/client';

const prisma = createPrismaClient(env.HYPERDRIVE);
const users = await prisma.user.findMany();
```

### Supabase Auth

```typescript
import { createSupabaseServiceRoleClient, requireAuthUser } from '@heyclaude/cloudflare-runtime/auth/supabase';

const supabase = createSupabaseServiceRoleClient(env);
const authResult = await requireAuthUser(supabase, request);
```

### Logging

```typescript
import { createLogger } from '@heyclaude/cloudflare-runtime/logging/pino';

const logger = createLogger({ name: 'my-worker' });
logger.info({ userId: '123' }, 'User action');
```

### Error Handling

```typescript
import { normalizeError, createErrorResponse } from '@heyclaude/cloudflare-runtime/utils/errors';

try {
  // ...
} catch (error) {
  const normalized = normalizeError(error, 'Operation failed');
  return createErrorResponse(normalized, 500);
}
```

---

## Differences from Edge Runtime

This package replaces `@heyclaude/edge-runtime` for Cloudflare Workers:

| Feature | Edge Runtime (Deno) | Cloudflare Runtime |
|---------|---------------------|-------------------|
| **Environment** | `Deno.env.get()` | `env` parameter in handler |
| **Prisma** | Singleton pattern | Factory function (per-request) |
| **Auth** | Deno-specific imports | Cloudflare Workers compatible |
| **Logging** | Deno console | Pino → Workers Logs |

---

## Usage

This package is designed for Cloudflare Workers only. For Next.js apps, use:
- `@heyclaude/web-runtime` - Next.js/React utilities
- `@heyclaude/shared-runtime` - Universal utilities
- `@heyclaude/data-layer` - Prisma services (works in both)

---

## Dependencies

- `@heyclaude/shared-runtime` - Universal utilities
- `@heyclaude/database-types` - Database types
- `@prisma/adapter-pg` - Prisma PostgreSQL adapter
- `pg` - PostgreSQL driver
- `@supabase/supabase-js` - Supabase client
- `pino` - Structured logging
