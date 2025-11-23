# Web App (`apps/web`)

This directory contains the [Next.js](https://nextjs.org/) application for the frontend.

## Architecture: The "Thin Consumer"

This application follows a "Hollow Core" architecture. `apps/web` is designed to be a **Thin Consumer** of logic defined in the runtime packages.

### Guiding Principles

1.  **No Business Logic**: All business logic, data fetching, state management, and complex utilities should reside in `packages/web-runtime` or `packages/shared-runtime`.
2.  **Routing Only**: The primary responsibility of `apps/web` is to define the URL structure (Next.js App Router) and wire up components to data.
3.  **Visuals & Layout**: Page layouts and page-specific visual compositions belong here, but reusable UI components should live in the design system or `web-runtime/ui`.

## Usage

Everything you need should be imported from `@heyclaude/web-runtime`.

### Importing

```typescript
// ✅ GOOD: Importing from the runtime
import { getFeaturedJobs } from '@heyclaude/web-runtime/data';
import { Button } from '@heyclaude/web-runtime/ui';
import { useToast } from '@heyclaude/web-runtime/hooks';
import { actionClient } from '@heyclaude/web-runtime/actions';

// ❌ BAD: Defining logic locally
// apps/web/src/lib/my-helper.ts -> SHOULD BE IN WEB-RUNTIME
```

### Directory Structure

-   `src/app/`: Next.js App Router files (`page.tsx`, `layout.tsx`, `route.ts`).
-   `src/components/`: **Visual-only** components specific to this app.
-   `public/`: Static assets.

## Development

Run the dev server:

```bash
pnpm dev
```
