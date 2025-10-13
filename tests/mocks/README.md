# MSW (Mock Service Worker) Setup

Production-grade API mocking for unit and integration tests using MSW v2.

## 📁 Directory Structure

```
tests/mocks/
├── README.md                    # This file
├── server.ts                    # Node.js MSW server (Vitest)
├── browser.ts                   # Browser MSW worker (E2E, Storybook)
├── handlers/                    # Request handlers organized by domain
│   ├── index.ts                 # Central handler registry
│   ├── content-handlers.ts      # /api/[contentType] endpoints
│   ├── api-handlers.ts          # Other API routes
│   ├── auth-handlers.ts         # Authentication/authorization
│   └── external-handlers.ts     # External services (Supabase, Redis, etc.)
└── fixtures/                    # Mock data
    ├── content.ts               # Agents, MCP, commands, etc.
    └── users.ts                 # User authentication data
```

## 🚀 Quick Start

### Automatic Setup (Recommended)

MSW is automatically configured in `tests/setup.tsx`. All tests inherit this setup:

```ts
// tests/setup.tsx
import { server } from './mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**No additional setup needed in individual test files!**

### Manual Setup (Advanced)

For tests that need custom MSW configuration:

```ts
import { server } from '@/tests/mocks/server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 📝 Writing Tests with MSW

### Basic Test Example

```ts
import { describe, it, expect } from 'vitest';

describe('Content API', () => {
  it('should fetch agents', async () => {
    const response = await fetch('http://localhost:3000/api/agents.json');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('agents');
    expect(data.agents.length).toBeGreaterThan(0);
  });
});
```

**MSW automatically intercepts the fetch call and returns mock data!**

### Override Handlers for Specific Tests

Test error scenarios by overriding handlers:

```ts
import { server } from '@/tests/mocks/server';
import { http, HttpResponse } from 'msw';

it('should handle server error', async () => {
  // Override handler for this test only
  server.use(
    http.get('http://localhost:3000/api/agents.json', () => {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    })
  );

  const response = await fetch('http://localhost:3000/api/agents.json');
  expect(response.status).toBe(500);
});
```

**Handler override is automatically reset after the test!**

### Test Rate Limiting

```ts
import { server, contentErrorHandlers } from '@/tests/mocks/server';

it('should handle rate limiting', async () => {
  server.use(contentErrorHandlers.rateLimitExceeded);

  const response = await fetch('http://localhost:3000/api/agents.json');
  const data = await response.json();

  expect(response.status).toBe(429);
  expect(data).toHaveProperty('error', 'Rate limit exceeded');
  expect(response.headers.get('retry-after')).toBe('60');
});
```

### Test Network Failures

```ts
import { server } from '@/tests/mocks/server';
import { http, HttpResponse } from 'msw';

it('should handle network error', async () => {
  server.use(
    http.get('http://localhost:3000/api/agents.json', () => {
      return HttpResponse.error();
    })
  );

  await expect(fetch('http://localhost:3000/api/agents.json')).rejects.toThrow();
});
```

## 🎯 Available Mock Handlers

### Content API Handlers

```ts
GET /api/agents.json          → Mock agents data
GET /api/mcp.json             → Mock MCP servers
GET /api/commands.json        → Mock commands
GET /api/hooks.json           → Mock hooks
GET /api/rules.json           → Mock rules
GET /api/statuslines.json     → Mock statuslines
GET /api/all-configurations.json → All content combined
```

### Error Handlers

```ts
import { contentErrorHandlers } from '@/tests/mocks/server';

contentErrorHandlers.rateLimitExceeded  // 429 Rate limit
contentErrorHandlers.serverError        // 500 Server error
contentErrorHandlers.networkTimeout     // Network timeout
contentErrorHandlers.emptyContent       // Empty response
```

### Authentication Handlers

```ts
POST /auth/v1/token     → Login
GET  /auth/v1/user      → Get current user
POST /auth/v1/logout    → Logout
POST /auth/v1/signup    → Registration
POST /auth/v1/recover   → Password reset
```

### External Service Handlers

```ts
GET/POST/PATCH/DELETE https://*.supabase.co/rest/v1/:table  → Supabase DB
GET/POST https://*.upstash.io/*                              → Redis
POST https://api.resend.com/emails                           → Resend Email
GET https://api.github.com/repos/:owner/:repo                → GitHub API
```

## 🔧 Creating Custom Handlers

### Add New Handler

Create handler in appropriate file:

```ts
// tests/mocks/handlers/api-handlers.ts
export const apiHandlers = [
  // ... existing handlers

  http.get('http://localhost:3000/api/new-endpoint', async () => {
    await delay(100); // Simulate network latency

    return HttpResponse.json({
      data: 'mock response',
      success: true,
    });
  }),
];
```

### Export Handler in Index

```ts
// tests/mocks/handlers/index.ts
export const handlers = [
  ...contentHandlers,
  ...apiHandlers, // Your handler is automatically included!
  ...authHandlers,
  ...externalHandlers,
];
```

## 📦 Mock Data Fixtures

### Using Existing Fixtures

```ts
import { mockAgents, mockMcp, mockUsers } from '@/tests/mocks/fixtures';

test('should display agents', () => {
  render(<AgentList agents={mockAgents} />);
  expect(screen.getByText(mockAgents[0].name)).toBeInTheDocument();
});
```

### Creating Custom Fixtures

```ts
import { createMockAgent } from '@/tests/mocks/fixtures/content';

const customAgent = createMockAgent({
  name: 'Custom Test Agent',
  tags: ['test', 'custom'],
  featured: true,
});
```

## 🎨 Browser Mocking (E2E, Storybook)

For browser-based testing or development mode mocking:

```ts
// app initialization or test setup
if (process.env.NODE_ENV === 'development') {
  const { worker } = await import('@/tests/mocks/browser');
  await worker.start();
}
```

**Note:** Generate service worker first:

```bash
npx msw init public/ --save
```

## 🐛 Debugging

### View All Requests

MSW warns about unhandled requests by default:

```bash
[MSW] Warning: captured a request without a matching request handler:
  • GET http://localhost:3000/api/unknown-endpoint
```

### Silent Mode (No Warnings)

```ts
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});
```

### Log All Requests

```ts
server.events.on('request:start', ({ request }) => {
  console.log('MSW intercepted:', request.method, request.url);
});
```

## 📚 Resources

- [MSW Documentation](https://mswjs.io/docs/)
- [MSW Recipes](https://mswjs.io/docs/recipes/)
- [MSW Best Practices](https://mswjs.io/docs/best-practices/)

## ✅ Benefits

- **Fast**: No real network calls = 10-100x faster tests
- **Deterministic**: Consistent responses = no flaky tests
- **Offline**: Works without internet connection
- **Type-Safe**: Full TypeScript support with inferred types
- **Isolated**: Each test is independent, no shared state
- **Realistic**: Simulates real API behavior (delays, errors, headers)
- **Secure**: No production API calls, no real credentials needed
