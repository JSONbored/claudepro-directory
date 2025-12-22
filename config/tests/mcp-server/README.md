# MCP Server Tests

This directory contains tests for the `@heyclaude/mcp-server` package.

## Structure

Tests are organized externally from the source package to keep `packages/mcp-server` clean for community distribution.

## Running Tests

```bash
# Run all mcp-server tests
pnpm test:mcp-server

# Run tests in watch mode
pnpm test:mcp-server:watch

# Run tests with coverage
pnpm test:mcp-server:coverage
```

## Test Organization

Tests mirror the structure of `packages/mcp-server/src/`:

- `tools/` - Tests for MCP tools
- `resources/` - Tests for MCP resources
- `middleware/` - Tests for middleware (rate limiting, etc.)
- `lib/` - Tests for utility functions
- `routes/` - Tests for route handlers (health, OAuth, etc.)
- `fixtures/` - Test utilities and mock factories
- `server.test.ts` - Tests for server factory

## Test Utilities

The `fixtures/test-utils.ts` file provides reusable mock factories:

- `createMockLogger()` - Mock logger instance
- `createMockUser()` - Mock user object
- `createMockToken()` - Mock OAuth token
- `createMockKvCache()` - Mock KV cache (in-memory Map-based)
- `createMockEnv()` - Mock environment object

### Prisma Client in Tests

**IMPORTANT**: `createMockPrisma()` is deprecated. Tests should import `prisma` directly:

```typescript
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// In beforeEach:
prismocker = prisma; // Automatically PrismockerClient via __mocks__/@prisma/client.ts
if ('reset' in prismocker && typeof prismocker.reset === 'function') {
  prismocker.reset();
}
```

The `prisma` singleton is automatically mocked by Prismocker via `__mocks__/@prisma/client.ts`, ensuring uniform implementation across all tests.

## Importing Source Code

Tests import from the package using workspace imports:

```typescript
import { createMcpServer } from '@heyclaude/mcp-server';
```

