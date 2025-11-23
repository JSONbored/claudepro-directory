# @heyclaude/data-layer

The central data access layer for the ClaudePro Directory monorepo. This package provides **isomorphic** services that work seamlessly in both Node.js (Next.js) and Deno (Supabase Edge Functions) environments.

## Architecture

The Data Layer is built around the **Service Pattern**. Each domain (Content, Users, Jobs, etc.) has a dedicated Service class that wraps Supabase RPC calls and provides a typed API.

### Key Principles

1.  **Isomorphic**: Code MUST run in both Node.js and Deno. Do not use Node-specific built-ins (like `fs`, `path`, `crypto`) without polyfills or abstraction.
2.  **RPC-First**: All complex queries should be encapsulated in PostgreSQL functions (RPCs) and called via `supabase.rpc()`. This keeps the application layer thin and performant.
3.  **Type Safety**: All services must return strictly typed data derived from `@heyclaude/database-types`.
4.  **No State**: Services are instantiated per request with a `SupabaseClient`. They do not hold state.

## Usage

### In Next.js (Web App)

Use the `fetchCached` helper from `@heyclaude/web-runtime` to wrap service calls with Next.js Data Cache (`unstable_cache`).

```typescript
import { ContentService } from '@heyclaude/data-layer';
import { fetchCached } from '@heyclaude/web-runtime';

// Server Component / Server Action
export async function getLatestPosts() {
  return fetchCached(
    (client) => new ContentService(client).getLatestPosts(),
    {
      key: 'latest-posts',
      tags: ['content'],
      ttlKey: 'cache.content_list.ttl_seconds',
      fallback: []
    }
  );
}
```

### In Edge Functions (Deno)

Instantiate the service directly with the Supabase client provided by the edge runtime.

```typescript
import { ContentService } from '@heyclaude/data-layer';
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(...);
  const service = new ContentService(supabase);
  const posts = await service.getLatestPosts();
  
  return new Response(JSON.stringify(posts));
});
```

## Adding a New Service

1.  Create a new file in `src/services/` (e.g., `src/services/my-feature.ts`).
2.  Define a class `MyFeatureService` with a constructor accepting `SupabaseClient<Database>`.
3.  Implement methods that call `this.supabase.rpc(...)`.
4.  Export the service from `src/index.ts`.

## Testing

Run `pnpm lint:data-layer` to ensure compliance with architectural rules (e.g., no direct table access, only RPCs).
