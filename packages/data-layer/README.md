# @heyclaude/data-layer

The central data access layer for the ClaudePro Directory monorepo. This package provides services that work seamlessly in Node.js (Next.js) and Cloudflare Workers environments.

## Architecture

The Data Layer is built around the **Service Pattern**. Each domain (Content, Users, Jobs, etc.) has a dedicated Service class that wraps Supabase RPC calls and provides a typed API.

### Key Principles

1.  **Runtime Compatible**: Code works in Node.js (Next.js) and Cloudflare Workers. Services use Supabase client which is compatible with both runtimes.
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
  return fetchCached((client) => new ContentService(client).getLatestPosts(), {
    key: 'latest-posts',
    tags: ['content'],
    ttlKey: 'cache.content_list.ttl_seconds',
    fallback: [],
  });
}
```

### In Cloudflare Workers

Instantiate the service directly with the Supabase client created from environment variables.

```typescript
import { ContentService } from '@heyclaude/data-layer';
import { createSupabaseClient } from '@heyclaude/cloudflare-runtime';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const supabase = createSupabaseClient(env);
  const service = new ContentService(supabase);
  const posts = await service.getLatestPosts();

    return Response.json(posts);
  },
};
```

## Adding a New Service

1.  Create a new file in `src/services/` (e.g., `src/services/my-feature.ts`).
2.  Define a class `MyFeatureService` with a constructor accepting `SupabaseClient<Database>`.
3.  Implement methods that call `this.supabase.rpc(...)`.
4.  Export the service from `src/index.ts`.

## Testing

Run `pnpm lint:data-layer` to ensure compliance with architectural rules (e.g., no direct table access, only RPCs).
