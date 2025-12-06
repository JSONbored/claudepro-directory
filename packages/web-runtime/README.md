# Web Runtime

The **Web Runtime** (`@heyclaude/web-runtime`) is the standard library for the Next.js application. It contains all business logic, data access, UI components, and utility functions.

## Architecture

This package acts as the "SDK" for `apps/web`. It encapsulates:
-   **Server Actions**: Type-safe mutations using `next-safe-action`.
-   **Data Access**: Functions to fetch data from Supabase, handling caching and validation.
-   **UI System**: Reusable components, hooks, and design tokens.
-   **Integrations**: wrappers for Logging and Analytics.

## Exports by Category

### ⚡ Actions (`@heyclaude/web-runtime/actions`)
Server Actions for mutations and side effects.
-   `actionClient`: Base client for defining safe actions.
-   `authedAction`: Client for authenticated actions.
-   `trackInteractionAction`, `trackUsageAction`: Analytics tracking.
-   `subscribeViaOAuthAction`: Newsletter subscriptions.
-   **Modules**: `user`, `company`, `jobs`, `content`, `feedback`.

### 🎣 Hooks (`@heyclaude/web-runtime/hooks`)
React hooks for client-side logic.
-   `useToast`: Toast notifications.
-   `useUser`: Client-side user session.
-   `useSupabase`: Access the Supabase client.
-   `useOptimistic`: Optimistic UI updates.
-   `useLocalStorage`: Persist state.

### 🎨 UI (`@heyclaude/web-runtime/ui`)
UI components and design assets.
-   `icons`: Centralized Lucide icon exports.
-   `Button`, `Input`, `Dialog`: Core UI components (if moved here).
-   `cn`: Class name merger utility.
-   **Design Tokens**: Colors, spacing, typography constants.

### 💾 Data (`@heyclaude/web-runtime/data`)
Data fetching and Supabase interactions.
-   **Supabase Clients**: `createSupabaseServerClient`, `createSupabaseBrowserClient`.
-   **Content**: `getContentBySlug`, `getFeaturedJobs`, `getChangelog`.
-   **User**: `getAuthenticatedUser`, `getUserProfile`.
-   **RPC**: Direct Supabase RPC calls with Cache Components (`'use cache'` / `'use cache: private'`).

### 🛠 Core & Utils
Essential utilities and configuration.
-   **Logging**: `logger` (Pino wrapper), `logActionFailure`.
-   **Errors**: `normalizeError`, `sanitizeError`.
-   **Config**: `SOCIAL_LINKS`, static configuration defaults.
-   **Utils**: `formatDate`, `safeParse`, `hashUserId`.

### 🚀 Edge (`@heyclaude/web-runtime/edge`)
Utilities for Edge Runtimes (Middleware / Edge Functions).
-   `callEdgeFunction`: Invoke Supabase Edge Functions.
-   `processContentEdge`: Server-side content processing helpers.

### 📦 Cache (`@heyclaude/web-runtime/cache`)
Caching strategies and tag management.
-   `getCacheTtl`: Standardized TTLs.
-   `revalidateCacheTags`: Tag invalidation.
-   `generateContentCacheKey`: Consistent key generation.

## Usage

```typescript
import { logger } from '@heyclaude/web-runtime';
import { getFeaturedJobs } from '@heyclaude/web-runtime/data';
import { useToast } from '@heyclaude/web-runtime/hooks';

// Example: Fetch data with logging
export async function loadPage() {
  try {
    const jobs = await getFeaturedJobs();
    return jobs;
  } catch (error) {
    logger.error({ error }, 'Failed to load jobs');
    return [];
  }
}
```
