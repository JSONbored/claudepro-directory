/**
 * Custom Test Utilities
 *
 * Provides custom render function with all necessary providers
 * for testing React components in the claudepro-directory app.
 *
 * **Usage:**
 * ```tsx
 * import { render, screen } from '@/tests/utils/test-utils'
 *
 * test('renders component', () => {
 *   render(<MyComponent />)
 *   expect(screen.getByText('Hello')).toBeInTheDocument()
 * })
 * ```
 *
 * **Features:**
 * - Wraps components with ThemeProvider (next-themes)
 * - Provides ErrorBoundary for error testing
 * - Re-exports all @testing-library/react utilities
 * - Type-safe with full TypeScript support
 *
 * @see https://testing-library.com/docs/react-testing-library/setup
 */

import { type RenderOptions, render } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import type { ReactElement, ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// =============================================================================
// Provider Wrapper
// =============================================================================

/**
 * ErrorFallback Component
 * Simple fallback for error boundary in tests
 */
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert" data-testid="error-boundary">
      <p>Error: {error.message}</p>
    </div>
  );
}

/**
 * AllTheProviders Component
 *
 * Wraps test components with all necessary providers.
 * Add any global providers your app uses here.
 *
 * **Current Providers:**
 * - ThemeProvider (next-themes) - for dark/light mode
 * - ErrorBoundary - for testing error states
 */
interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        {children}
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// =============================================================================
// Custom Render Function
// =============================================================================

/**
 * Custom Render Function
 *
 * Extends @testing-library/react's render function with app providers.
 *
 * **Usage:**
 * ```tsx
 * import { render } from '@/tests/utils/test-utils'
 *
 * render(<Button>Click me</Button>)
 * ```
 *
 * **With Custom Options:**
 * ```tsx
 * render(<Button>Click me</Button>, {
 *   wrapper: CustomWrapper, // Override default wrapper
 * })
 * ```
 *
 * @param ui - React element to render
 * @param options - Render options (optional)
 * @returns Render result with testing utilities
 */
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// =============================================================================
// Exports
// =============================================================================

/**
 * Re-export everything from React Testing Library
 * This allows: import { render, screen, waitFor } from '@/tests/utils/test-utils'
 */
export * from '@testing-library/react';

/**
 * Export custom render as default render
 * Overrides the default render from @testing-library/react
 */
export { customRender as render };

/**
 * Export userEvent from @testing-library/user-event
 * Provides more realistic user interactions than fireEvent
 */
export { userEvent } from '@testing-library/user-event';

// =============================================================================
// Custom Test Helpers
// =============================================================================

/**
 * waitForLoadingToFinish
 *
 * Helper to wait for loading states to complete.
 * Useful for components with Suspense or async data fetching.
 *
 * @example
 * ```tsx
 * render(<AsyncComponent />)
 * await waitForLoadingToFinish()
 * expect(screen.getByText('Data loaded')).toBeInTheDocument()
 * ```
 */
export async function waitForLoadingToFinish() {
  const { queryByTestId } = await import('@testing-library/react');

  // Wait for loading indicator to disappear
  const loadingIndicator = queryByTestId(document.body, 'loading');
  if (loadingIndicator) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

/**
 * withinErrorBoundary
 *
 * Helper to test components that should throw errors.
 *
 * @example
 * ```tsx
 * const { getByTestId } = render(<ComponentThatThrows />)
 * expect(getByTestId('error-boundary')).toBeInTheDocument()
 * ```
 */
export function expectErrorBoundary() {
  const { getByTestId } = require('@testing-library/react');
  return expect(getByTestId(document.body, 'error-boundary'));
}

/**
 * mockMatchMedia
 *
 * Helper to mock window.matchMedia for responsive tests.
 *
 * @example
 * ```tsx
 * mockMatchMedia('(min-width: 768px)', true) // Simulate desktop
 * render(<ResponsiveComponent />)
 * ```
 */
export function mockMatchMedia(query: string, matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({
      matches: q === query ? matches : false,
      media: q,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
}

/**
 * mockIntersectionObserver
 *
 * Helper to trigger IntersectionObserver callbacks in tests.
 *
 * @example
 * ```tsx
 * const mockObserver = mockIntersectionObserver()
 * render(<LazyComponent />)
 * mockObserver.triggerIntersection(true) // Simulate element in viewport
 * ```
 */
export function mockIntersectionObserver() {
  const callbacks: IntersectionObserverCallback[] = [];

  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      callbacks.push(callback);
    }

    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }

    root = null;
    rootMargin = '';
    thresholds = [];
  } as any;

  return {
    triggerIntersection(isIntersecting: boolean) {
      callbacks.forEach((cb) => {
        cb(
          [
            {
              isIntersecting,
              intersectionRatio: isIntersecting ? 1 : 0,
              target: document.createElement('div'),
              boundingClientRect: {} as DOMRectReadOnly,
              intersectionRect: {} as DOMRectReadOnly,
              rootBounds: null,
              time: Date.now(),
            },
          ],
          {} as IntersectionObserver
        );
      });
    },
  };
}
