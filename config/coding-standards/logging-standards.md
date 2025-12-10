# Logging & Error Instrumentation Standards

This document defines the standards and patterns for logging and error handling across the codebase.

---

## Core Principles

1. **Structured Logging**: Always use structured logging (logger.*), never raw console.*
2. **Request Correlation**: Always include requestId for log correlation
3. **Context**: Always include route, operation, and relevant metadata
4. **Performance Tracking**: Track performance metrics when needed (duration tracking removed - use external monitoring)
5. **Error Normalization**: Always use `normalizeError()` for error handling

---

## Logging Patterns

### Server Components / Pages

```typescript
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';

export default async function MyPage() {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const logContext = createWebAppContextWithId(requestId, '/my-route', 'MyPage');

  try {
    // Your code here
    const data = await fetchData();
    
    logger.info(
      'MyPage: data loaded',
        {
          ...logContext,
          dataCount: data.length,
        },
        startTime
      )
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load data');
    logger.error(
      'MyPage: data load failed',
      normalized,
logContext, startTime)
    );
    throw normalized;
  }

  // Final summary log
  logger.info(
    'MyPage: page render completed',
  );
}
```

**Required Elements**:
- ✅ `startTime = Date.now()` at page start
- ✅ Single `requestId` per request
- ✅ `logContext` with route, operation, requestId
- ✅ Performance metrics tracked via external monitoring (duration tracking removed)
- ✅ All errors use `normalizeError()` and include context
- ✅ Final summary log

---

### API Routes

```typescript
import { createErrorResponse } from '@heyclaude/web-runtime/utils/error-handler';
import { generateRequestId } from '@heyclaude/web-runtime/core';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    // Your code here
    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, {
      route: '/api/my-route',
      operation: 'POST',
      method: 'POST',
      logContext: { requestId },
    });
  }
}
```

**Required Elements**:
- ✅ Use `createErrorResponse` for all errors
- ✅ Include route, operation, method in context
- ✅ RequestId included in logContext

---

### Server Actions

```typescript
import { actionClient } from '@heyclaude/web-runtime/actions/safe-action';

export const myAction = actionClient
  .metadata({ actionName: 'myAction', category: 'user' })
  .inputSchema(z.object({ ... }))
  .action(async ({ parsedInput, ctx }) => {
    // Your code here
    // Errors are automatically logged by actionClient
  });
```

**Required Elements**:
- ✅ Use `actionClient` wrapper (automatically logs errors)
- ✅ Include `actionName` and `category` in metadata
- ✅ RequestId is automatically generated

---

### Client Components

```typescript
'use client';

import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';

export function MyComponent() {
  const runLoggedAsync = useLoggedAsync({
    scope: 'MyComponent',
    defaultMessage: 'Operation failed',
    defaultRethrow: false,
  });

  const handleAction = async () => {
    await runLoggedAsync(
      async () => {
        // Your async operation
        await someAsyncOperation();
      },
      {
        message: 'Custom error message',
        context: { additional: 'context' },
      }
    );
  };

  return <button onClick={handleAction}>Click me</button>;
}
```

**Required Elements**:
- ✅ Use `useLoggedAsync` for all async operations
- ✅ Include `scope` (component name)
- ✅ Provide meaningful error messages
- ✅ Include relevant context

---

### Database Queries (RPC Calls)

**Approach**: Focus on error logging and critical operations. Use Supabase dashboard for query performance monitoring.

```typescript
import { logger, normalizeError } from '@heyclaude/web-runtime/core';

async function myRpcCall(args: RpcArgs) {
  try {
    const { data, error } = await this.supabase.rpc('my_rpc', args);
    if (error) {
      // Log errors with business context
      logger.error('RPC call failed', normalizeError(error), {
        rpcName: 'my_rpc',
        requestId,
        userId, // if available
        operation: 'myOperation',
        args: sanitizeArgs(args), // sanitize sensitive data
      });
      throw error;
    }
    return data;
  } catch (error) {
    // Error already logged above
    throw error;
  }
}

// For critical operations (mutations, sensitive queries), use wrapper:
import { withRpcErrorLogging } from '@heyclaude/data-layer/utils/rpc-error-logging';

async function criticalMutation(args: RpcArgs) {
  return withRpcErrorLogging(
    async () => {
      const { data, error } = await this.supabase.rpc('critical_mutation', args);
      if (error) throw error;
      return data;
    },
    {
      rpcName: 'critical_mutation',
      requestId,
      userId,
      operation: 'criticalOperation',
      isMutation: true, // Flag for audit trail
    }
  );
}
```

**Required Elements**:
- ✅ Log all RPC errors with business context (requestId, userId, operation)
- ✅ Log critical operations (mutations, sensitive queries) for audit trail
- ✅ Never use `console.*` - always use structured logging
- ❌ **Do NOT** log query durations (use Supabase dashboard for performance)
- ❌ **Do NOT** log successful query completions (too noisy)
- ✅ Use `normalizeError()` for all errors

---

### External API Calls

```typescript
import { withExternalApiLogging } from '@heyclaude/edge-runtime/utils/external-api-logging';

async function callExternalApi() {
  return withExternalApiLogging(
    async () => {
      const response = await fetch('https://api.example.com/endpoint', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.json();
    },
    {
      apiName: 'ExampleAPI',
      method: 'POST',
      path: '/endpoint',
      requestId: generateRequestId(),
    }
  );
}
```

**Required Elements**:
- ✅ Use `withExternalApiLogging` wrapper (when available)
- ✅ Log API name, method, path
- ✅ Track performance via external monitoring
- ✅ Log status code
- ✅ Log request/response size (if applicable)

---

### Error Boundaries

```typescript
'use client';

import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';

export default function MyErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const normalized = normalizeError(error, 'MyErrorBoundary triggered');
    const logContext = createWebAppContextWithId(requestId, route, 'MyErrorBoundary', {
      segment: 'my-segment',
      ...(error.digest && { digest: error.digest }),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('MyErrorBoundary triggered', normalized, logContext);
  }, [error]);

  return <ErrorFallback error={error} reset={reset} />;
}
```

**Required Elements**:
- ✅ Log error with `logger.error()`
- ✅ Use `normalizeError()` for error
- ✅ Include route, operation, requestId in context
- ✅ Include segment name (if applicable)
- ✅ Include error digest (if available)
- ✅ Include userAgent and url

---

## Error Handling Patterns

### Catch Blocks

```typescript
try {
  // Your code
} catch (error) {
  const normalized = normalizeError(error, 'Fallback error message');
  logger.error('Operation failed', normalized, logContext);
  throw normalized; // Or handle gracefully
}
```

**Required Elements**:
- ✅ Always use `normalizeError()`
- ✅ Always log with `logger.error()`
- ✅ Always include context
- ✅ Never use empty catch blocks

---

## Log Context Structure

All logs should include:

```typescript
{
  requestId: string;        // Required: For log correlation
  route: string;            // Required: Current route/pathname
  operation: string;        // Required: Function/component name
  [key: string]: unknown;   // Optional: Additional context
}
```

---

## Log Levels

- **`logger.error()`**: Errors, exceptions, failures
- **`logger.warn()`**: Warnings, slow operations (>1s), recoverable issues
- **`logger.info()`**: Normal operations, successful completions
- **`logger.debug()`**: Detailed debugging (development only)

---

## Performance Tracking

Duration tracking has been removed from the codebase. Use external monitoring tools (e.g., Vercel Analytics, DataDog, etc.) for performance metrics instead of logging duration in application code.

---

## Request ID Patterns

### Current Pattern
```typescript
const requestId = generateRequestId(); // Generate in each page/component
```

### Server Actions
```typescript
// Server actions use separate requestId (acceptable pattern)
const actionRequestId = generateRequestId();
```

---

## ESLint Rules

The following ESLint rules enforce these standards:

- `require-error-logging-in-catch`: Ensures all catch blocks log errors
- `require-use-logged-async-in-client`: Ensures client async operations use useLoggedAsync
- `require-normalize-error-before-logging`: Ensures errors are normalized before logging
- `require-record-string-unknown-for-log-context`: Enforces proper log context types
- `prevent-base-log-context-usage`: Prevents deprecated BaseLogContext usage
- `prevent-direct-pino-logger-usage`: Prevents direct Pino logger usage outside implementations

See [ESLint Architectural Rules](../tools/ESLINT_RULES.md) for complete documentation.

---

## Common Mistakes to Avoid

❌ **Don't**:
- Use `console.*` instead of `logger.*`
- Generate multiple requestIds in same request lifecycle
- Skip error logging in catch blocks
- Use empty catch blocks
- Log without context

✅ **Do**:
- Use structured logging (`logger.*`)
- Use single requestId per request
- Always log errors in catch blocks
- Always include context in logs
- Use `normalizeError()` for all errors

---

## Migration Checklist

When updating existing code:

- [ ] Replace `console.*` with `logger.*`
- [ ] Add `requestId` to all logs
- [ ] Add `route` and `operation` to all logs
- [ ] Add error logging to all catch blocks
- [ ] Use `normalizeError()` for all errors
- [ ] Use `useLoggedAsync` in client components
- [ ] Verify ESLint rules pass

---

## Reference

- **ESLint Rules**: `config/tools/ESLINT_RULES.md`
- **Logger Configuration**: `packages/shared-runtime/src/logger/config.ts`
- **Error Handling Utilities**: `packages/shared-runtime/src/error-handling.ts`
