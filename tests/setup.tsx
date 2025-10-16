/**
 * Vitest Global Setup
 *
 * Runs before all test files. Configures global test environment,
 * mocks Next.js APIs, and sets up cleanup hooks.
 *
 * **Security Note:** This file only runs in test environment,
 * never included in production bundle.
 *
 * **Key Features:**
 * - MSW (Mock Service Worker) for API mocking
 * - Mock Next.js 15 navigation APIs (async headers, cookies)
 * - Mock Next.js Image and Link components
 * - Auto-cleanup after each test (prevents memory leaks)
 * - Mock browser APIs (IntersectionObserver, ResizeObserver)
 * - Configure environment variables for tests
 *
 * @see https://vitest.dev/config/#setupfiles
 */

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { toHaveNoViolations } from 'jest-axe';
import { server } from './mocks/server';

// =============================================================================
// jest-axe Setup
// =============================================================================

/**
 * Extend Vitest matchers with jest-axe
 * Adds toHaveNoViolations() matcher for accessibility testing
 */
expect.extend(toHaveNoViolations);

// =============================================================================
// MSW Setup
// =============================================================================

/**
 * Start MSW server before all tests
 * Intercepts HTTP requests and provides mock responses
 */
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unmocked requests
  });
});

/**
 * Reset MSW handlers after each test
 * Ensures test isolation and prevents handler leakage
 */
afterEach(() => {
  server.resetHandlers();
});

/**
 * Close MSW server after all tests
 * Clean shutdown of mock server
 */
afterAll(() => {
  server.close();
});

// =============================================================================
// Cleanup Hook
// =============================================================================

/**
 * Auto-cleanup after each test
 * Prevents memory leaks and test pollution
 */
afterEach(() => {
  cleanup();
});

// =============================================================================
// Next.js Navigation Mocks
// =============================================================================

/**
 * Mock next/navigation (client-side navigation)
 * Next.js 15+ uses these hooks for App Router
 */
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

/**
 * Mock next/headers (server-side headers/cookies)
 * Next.js 15+ made these async functions
 */
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => {
    const headerMap = new Map([
      ['user-agent', 'vitest-test-agent'],
      ['accept', 'text/html'],
    ]);
    return {
      get: (key: string) => headerMap.get(key),
      has: (key: string) => headerMap.has(key),
      // biome-ignore lint/complexity/noBannedTypes: Headers.forEach callback type is generic in test mock
      forEach: (fn: Function) => headerMap.forEach(fn),
      entries: () => headerMap.entries(),
      keys: () => headerMap.keys(),
      values: () => headerMap.values(),
    };
  }),
  cookies: vi.fn(async () => ({
    get: vi.fn((name: string) => ({ name, value: 'test-value' })),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(() => true),
    getAll: vi.fn(() => []),
  })),
  draftMode: vi.fn(async () => ({
    isEnabled: false,
    enable: vi.fn(),
    disable: vi.fn(),
  })),
}));

// =============================================================================
// Next.js Component Mocks
// =============================================================================

/**
 * Mock next/image
 * Renders as standard <img> in tests (no optimization)
 */
vi.mock('next/image', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: Mock for Next.js Image component - props type is internal to Next.js
  default: (props: any) => {
    const { src, alt, width, height, ...rest } = props;
    // biome-ignore lint/performance/noImgElement: Test mock intentionally uses img element for simplicity
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img src={src} alt={alt} width={width} height={height} {...rest} />;
  },
}));

/**
 * Mock next/link
 * Renders as standard <a> in tests (no prefetching)
 */
vi.mock('next/link', () => ({
  // biome-ignore lint/suspicious/noExplicitAny: Mock for Next.js Link component - props type is internal to Next.js
  default: ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// =============================================================================
// Environment Variables
// =============================================================================

/**
 * Set test environment variables
 * Ensures consistent test environment
 */
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_VERCEL_ENV = 'test';
process.env.NODE_ENV = 'test';

// =============================================================================
// Browser API Mocks
// =============================================================================

/**
 * Mock IntersectionObserver
 * Used by many UI libraries for lazy loading, animations
 */
global.IntersectionObserver = class IntersectionObserver {
  constructor(
    public callback: IntersectionObserverCallback,
    public options?: IntersectionObserverInit
  ) {}

  observe() {
    return null;
  }

  disconnect() {
    return null;
  }

  unobserve() {
    return null;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  root = null;
  rootMargin = '';
  thresholds = [];
  // biome-ignore lint/suspicious/noExplicitAny: Browser API mock requires type assertion for global assignment
} as any;

/**
 * Mock ResizeObserver
 * Used by many UI libraries for responsive behavior
 */
global.ResizeObserver = class ResizeObserver {
  constructor(public callback: ResizeObserverCallback) {}

  observe() {
    return null;
  }

  disconnect() {
    return null;
  }

  unobserve() {
    return null;
  }
  // biome-ignore lint/suspicious/noExplicitAny: Browser API mock requires type assertion for global assignment
} as any;

/**
 * Mock matchMedia
 * Used for responsive design and media queries
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Mock scrollTo
 * Prevents errors when components call window.scrollTo
 */
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

/**
 * Mock requestAnimationFrame
 * Already available in happy-dom, but ensure it's present
 */
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(callback, 0) as unknown as number;
  };
}

if (!global.cancelAnimationFrame) {
  global.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

// =============================================================================
// Console Mocks (Optional)
// =============================================================================

/**
 * Optionally suppress console output in tests
 * Uncomment if tests are too noisy
 */
// const originalConsole = {
//   log: console.log,
//   error: console.error,
//   warn: console.warn,
// };

// global.console = {
//   ...console,
//   log: vi.fn(),
//   error: vi.fn(),
//   warn: vi.fn(),
// };

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Global test helper: Wait for async operations
 * Useful for testing async state updates
 */
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Global test helper: Flush promises
 * Ensures all pending promises resolve before continuing
 */
export const flushPromises = () => new Promise((resolve) => setImmediate(resolve));
