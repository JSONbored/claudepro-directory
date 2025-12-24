# Generalized AST-Grep Rules

This directory contains **generalized** AST-grep rule files that have been adapted for reuse across different projects.

## What Does "Generalized" Mean?

These rule files have been modified to:

1. **Remove codebase-specific paths**: File paths like `apps/web/src/app` have been replaced with standard paths like `app`
2. **Parameterize imports**: Import paths like `@heyclaude/web-runtime` have been replaced with placeholders like `YOUR_WEB_RUNTIME_PACKAGE`
3. **Add customization documentation**: Headers explain what needs to be customized for your project

**Note:** The codebase-specific versions (with actual paths restored) are in the parent directory and are used by this codebase. The generalized versions here are for sharing with other projects.

## How to Use

1. **Copy files** to your project's AST-grep rules directory
2. **Customize file paths** to match your project structure:
   - Replace `app/**/*.tsx` with your app directory structure (e.g., `src/app/**/*.tsx`)
   - Replace `src/**/hooks` with your hooks directory structure (e.g., `hooks/**/*.ts` or `src/hooks/**/*.ts`)
   - Replace `src/**/data` with your data directory structure (e.g., `lib/data/**/*.ts`)
3. **Update import references** in message strings:
   - Replace `YOUR_PRISMA_PACKAGE` with your Prisma package path (e.g., `@prisma/client` or `./prisma/client`)
   - Replace `YOUR_LOGGER_PACKAGE (server)` with your server logger import
   - Replace `YOUR_LOGGER_PACKAGE (client)` with your client logger import
   - Replace `YOUR_SHARED_RUNTIME_PACKAGE` with your shared runtime utilities
   - Replace `YOUR_WEB_RUNTIME_PACKAGE` with your web runtime package
   - Replace `YOUR_ACTIONS_PACKAGE` with your server actions package
4. **Update references** in your tooling (e.g., lefthook.yml, CI scripts)

## Files Included

### High Generalizability (Ready to Use)
- `react-hooks-best-practices.yml` - React hooks patterns
- `react-optimization-patterns.yml` - React performance patterns
- `nextjs-16-patterns.yml` - Next.js 16 async patterns
- `nextjs-route-patterns.yml` - Next.js route structure patterns
- `connection-deferral.yml` - Next.js Cache Components patterns
- `nextresponse-promises.yml` - Next.js response patterns
- `security-patterns-enhanced.yml` - Security best practices
- `zod-validation-patterns.yml` - Zod validation patterns
- `code-quality-patterns.yml` - Code quality patterns
- `type-safety-patterns.yml` - TypeScript type safety
- `pino-logging-patterns.yml` - Pino logging patterns
- `prisma-best-practices.yml` - Prisma ORM best practices
- `performance-patterns.yml` - General performance patterns
- `database-optimization-patterns.yml` - Database optimization
- `bundle-optimization-patterns.yml` - Bundle optimization
- `accessibility-patterns.yml` - WCAG accessibility patterns
- `error-handling-enhanced.yml` - Error handling patterns
- `single-dev-team-patterns.yml` - Single dev team patterns
- `client-server-boundaries.yml` - Next.js client/server boundaries
- `api-routes-patterns.yml` - API route factory patterns
- `page-data-flow-patterns.yml` - Server/client data serialization patterns

## Customization Guide

### File Path Patterns

Replace these patterns with your project structure:

- `app/**/*.tsx` → Your Next.js app directory (e.g., `src/app/**/*.tsx`)
- `src/**/hooks` → Your hooks directory (e.g., `hooks/**/*.ts` or `src/hooks/**/*.ts`)
- `src/**/data` → Your data directory (e.g., `lib/data/**/*.ts`)

### Import Path Placeholders

Replace these placeholders with your actual package paths:

- `YOUR_PRISMA_PACKAGE` → Your Prisma client import (e.g., `@prisma/client` or `./prisma/client`)
- `YOUR_LOGGER_PACKAGE (server)` → Your server logger import
- `YOUR_LOGGER_PACKAGE (client)` → Your client logger import
- `YOUR_SHARED_RUNTIME_PACKAGE` → Your shared runtime utilities
- `YOUR_WEB_RUNTIME_PACKAGE` → Your web runtime package
- `YOUR_ACTIONS_PACKAGE` → Your server actions package

### Example Customizations

#### Example 1: Logger Import

**Before (generalized):**
```yaml
message: "Import logger from YOUR_LOGGER_PACKAGE (server)"
files:
  - 'app/**/*.tsx'
```

**After (customized for your project):**
```yaml
message: "Import logger from @mycompany/logger/server"
files:
  - 'src/app/**/*.tsx'
```

#### Example 2: API Route Factory Pattern

**Before (generalized):**
```yaml
files:
  - 'app/api/**/*.ts'
message: "Import from YOUR_WEB_RUNTIME_PACKAGE/server"
```

**After (customized for your project):**
```yaml
files:
  - 'src/app/api/**/*.ts'
message: "Import from @mycompany/web-runtime/server"
```

#### Example 3: Serialization Utility

**Before (generalized):**
```yaml
message: "Import from YOUR_SHARED_RUNTIME_PACKAGE/utils/serialize"
```

**After (customized for your project):**
```yaml
message: "Import from @mycompany/utils/serialize"
```

### Use Case Examples

#### Use Case 1: React Hooks Validation

The `react-hooks-best-practices.yml` file helps enforce React's Rules of Hooks:

**What it catches:**
- Hooks called conditionally
- Hooks called in loops
- Hooks called in nested functions
- Missing cleanup functions in useEffect

**Example violation:**
```typescript
// ❌ Bad: Hook called conditionally
if (condition) {
  const [state, setState] = useState(0);
}

// ✅ Good: Hook at top level
const [state, setState] = useState(0);
if (condition) {
  // Use state
}
```

#### Use Case 2: Next.js 16 Async Patterns

The `nextjs-16-patterns.yml` file ensures proper async handling in Next.js 16:

**What it catches:**
- Async params accessed without await
- Async searchParams accessed without await
- Async cookies accessed without await

**Example violation:**
```typescript
// ❌ Bad: params accessed directly
export default async function Page({ params }: { params: { slug: string } }) {
  return <div>{params.slug}</div>; // Error in Next.js 16
}

// ✅ Good: params awaited first
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <div>{slug}</div>;
}
```

#### Use Case 3: API Route Factory Pattern

The `api-routes-patterns.yml` file ensures all API routes use the factory pattern:

**What it catches:**
- Raw NextRequest handlers
- Missing factory configuration properties
- Missing validation schemas

**Example violation:**
```typescript
// ❌ Bad: Raw NextRequest handler
export async function GET(request: NextRequest) {
  return NextResponse.json({ data: 'hello' });
}

// ✅ Good: Using factory
export const GET = createApiRoute({
  route: '/api/hello',
  operation: 'HelloAPI',
  method: 'GET',
  cors: 'anon',
  handler: async () => {
    return { data: 'hello' };
  },
});
```

#### Use Case 4: Data Serialization

The `page-data-flow-patterns.yml` file prevents serialization errors:

**What it catches:**
- Date objects passed to client components
- Non-serializable data passed to client components
- Functions passed to client components

**Example violation:**
```typescript
// ❌ Bad: Date object passed directly
export default async function Page() {
  const date = new Date();
  return <ClientComponent date={date} />; // Serialization error
}

// ✅ Good: Serialized first
export default async function Page() {
  const date = new Date().toISOString();
  return <ClientComponent date={date} />;
}
```

## Notes

- These rules follow industry-standard patterns and are not tied to any specific codebase
- Rules are designed to be framework-agnostic where possible (React, Next.js, Prisma patterns are framework-specific but generalizable)
- Some rules may need additional customization based on your project's architecture
- Rules are maintained as separate from codebase-specific rules to enable easy updates and sharing

## Original Source

These rules were generalized from a Next.js + Prisma + TypeScript codebase. They have been adapted to work with any similar stack by parameterizing codebase-specific references.

## For This Codebase

**Note:** This codebase uses the **codebase-specific versions** (with `apps/web/src/app` and `@heyclaude/*` imports) from the parent directory. The generalized versions here are maintained for sharing with other projects and for future reuse.
