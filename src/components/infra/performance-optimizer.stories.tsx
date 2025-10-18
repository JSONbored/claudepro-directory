'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { PerformanceOptimizer } from './performance-optimizer';

const meta = {
  title: 'Infra/PerformanceOptimizer',
  component: PerformanceOptimizer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Critical resource preloader for optimal Core Web Vitals. Uses Intersection Observer to lazy-load non-critical content, prefetches critical API routes, and optimizes LCP by preloading hero content. This component renders nothing but runs performance optimizations in the background.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PerformanceOptimizer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default performance optimizer
 */
export const Default: Story = {
  render: () => (
    <div className="p-8 border rounded-lg bg-card max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Performance Optimizer Active</h2>
      <p className="text-muted-foreground mb-4">
        The PerformanceOptimizer component is running in the background. It's performing the
        following optimizations:
      </p>
      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2">
          <span className="text-green-500">✓</span>
          <span>Prefetching critical API routes (/api/all-configurations.json)</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-500">✓</span>
          <span>Setting up Intersection Observer for lazy-loadable elements</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-500">✓</span>
          <span>Observing elements with [data-lazy] attribute</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-green-500">✓</span>
          <span>Optimizing LCP for hero content</span>
        </li>
      </ul>
      <PerformanceOptimizer />
    </div>
  ),
};

/**
 * With lazy-loadable content
 */
export const WithLazyContent: Story = {
  render: () => (
    <div className="p-8 space-y-8 max-w-4xl">
      <div className="border rounded-lg bg-card p-6">
        <h2 className="text-2xl font-bold mb-4">Performance Optimizer Demo</h2>
        <p className="text-muted-foreground">
          Scroll down to see lazy-loaded content. Elements with data-lazy attribute will be
          optimized by the PerformanceOptimizer.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div data-lazy className="p-6 border rounded-lg bg-card min-h-[200px]">
          <h3 className="font-semibold mb-2">Lazy Content 1</h3>
          <p className="text-sm text-muted-foreground">
            This content is marked with data-lazy and will be observed by the Intersection Observer.
          </p>
        </div>

        <div data-lazy className="p-6 border rounded-lg bg-card min-h-[200px]">
          <h3 className="font-semibold mb-2">Lazy Content 2</h3>
          <p className="text-sm text-muted-foreground">
            When scrolled into view, the will-change property is reset for better performance.
          </p>
        </div>

        <div data-lazy className="p-6 border rounded-lg bg-card min-h-[200px]">
          <h3 className="font-semibold mb-2">Lazy Content 3</h3>
          <p className="text-sm text-muted-foreground">
            The Intersection Observer automatically unobserves elements after they're loaded.
          </p>
        </div>

        <div data-lazy className="p-6 border rounded-lg bg-card min-h-[200px]">
          <h3 className="font-semibold mb-2">Lazy Content 4</h3>
          <p className="text-sm text-muted-foreground">
            This helps reduce initial page load time and improve Core Web Vitals.
          </p>
        </div>
      </div>

      <PerformanceOptimizer />
    </div>
  ),
};

/**
 * In layout context
 */
export const InLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4">
        <h1 className="text-2xl font-bold">Website Header</h1>
      </header>

      <main className="container mx-auto p-8">
        <div className="space-y-8">
          <section className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Hero Section</h2>
            <p className="text-muted-foreground">
              The PerformanceOptimizer is included in the layout and runs optimizations for all
              pages.
            </p>
          </section>

          <section data-lazy className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">Below-fold Content</h2>
            <p className="text-muted-foreground">
              This section is below the fold and marked as lazy-loadable.
            </p>
          </section>

          <section data-lazy className="p-6 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">More Content</h2>
            <p className="text-muted-foreground">Additional content optimized for performance.</p>
          </section>
        </div>
      </main>

      <footer className="border-t p-4 mt-8">
        <p className="text-sm text-muted-foreground text-center">Website Footer</p>
      </footer>

      <PerformanceOptimizer />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

/**
 * How it works explanation
 */
export const HowItWorks: Story = {
  render: () => (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="border rounded-lg bg-card p-6">
        <h2 className="text-2xl font-bold mb-4">How PerformanceOptimizer Works</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">1. Resource Prefetching</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Prefetches critical API routes to reduce latency when they're needed:
            </p>
            <div className="p-3 bg-muted rounded font-mono text-xs">
              /api/all-configurations.json
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">2. Intersection Observer</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Sets up an Intersection Observer to watch for elements with the data-lazy attribute:
            </p>
            <div className="p-3 bg-muted rounded">
              <code className="text-xs">{'<div data-lazy>Content</div>'}</code>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">3. Lazy Loading</h3>
            <p className="text-sm text-muted-foreground">
              When lazy elements scroll into view, the component resets their will-change property
              and stops observing them. This optimizes rendering performance.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">4. Cleanup</h3>
            <p className="text-sm text-muted-foreground">
              The component properly cleans up observers when unmounted to prevent memory leaks.
            </p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg bg-muted/50 p-6">
        <h3 className="font-semibold mb-2">Benefits</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Improved Largest Contentful Paint (LCP)</li>
          <li>• Reduced initial page load time</li>
          <li>• Better Core Web Vitals scores</li>
          <li>• Optimized resource loading</li>
          <li>• Automatic cleanup to prevent memory leaks</li>
        </ul>
      </div>

      <PerformanceOptimizer />
    </div>
  ),
};

/**
 * Multiple pages scenario
 */
export const MultiplePages: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl p-8">
      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">Page 1</h2>
        <p className="text-muted-foreground">
          Each page in your app can include the PerformanceOptimizer.
        </p>
        <PerformanceOptimizer />
      </div>

      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">Page 2</h2>
        <p className="text-muted-foreground">
          Multiple instances work independently without conflicts.
        </p>
        <PerformanceOptimizer />
      </div>

      <div className="p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-2">Page 3</h2>
        <p className="text-muted-foreground">
          However, it's recommended to include it once at the layout level.
        </p>
        <PerformanceOptimizer />
      </div>
    </div>
  ),
};

/**
 * Note about visibility
 */
export const VisibilityNote: Story = {
  render: () => (
    <div className="p-8 border rounded-lg bg-card max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">About This Component</h2>
      <div className="space-y-4 text-muted-foreground">
        <p>
          The PerformanceOptimizer component does not render any visible UI elements. It returns
          null.
        </p>
        <p>All optimizations happen in the useEffect hook:</p>
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Runs once when the component mounts</li>
          <li>Sets up observers and prefetches resources</li>
          <li>Cleans up when the component unmounts</li>
        </ul>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            <strong>Note:</strong> This component should typically be included once at the root
            layout level (e.g., in app/layout.tsx) rather than on individual pages.
          </p>
        </div>
      </div>
      <PerformanceOptimizer />
    </div>
  ),
};

/**
 * Best practices
 */
export const BestPractices: Story = {
  render: () => (
    <div className="p-8 max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold mb-4">Best Practices</h2>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">
            ✓ DO: Include in Root Layout
          </h3>
          <div className="p-3 bg-muted rounded font-mono text-xs">
            {`// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PerformanceOptimizer />
        {children}
      </body>
    </html>
  );
}`}
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">
            ✓ DO: Mark Below-fold Content as Lazy
          </h3>
          <div className="p-3 bg-muted rounded font-mono text-xs">
            {'<section data-lazy>Below-fold content</section>'}
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">
            ✗ DON'T: Include Multiple Times
          </h3>
          <p className="text-sm text-muted-foreground">
            Avoid including PerformanceOptimizer on every page. One instance at the layout level is
            sufficient.
          </p>
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">
            ✗ DON'T: Mark Hero Content as Lazy
          </h3>
          <p className="text-sm text-muted-foreground">
            Don't use data-lazy on above-the-fold content. Only mark content that's initially hidden
            below the fold.
          </p>
        </div>
      </div>

      <PerformanceOptimizer />
    </div>
  ),
};

/**
 * MobileSmall: Small Mobile Viewport (320px)
 * Tests component on smallest modern mobile devices
 */
export const MobileSmall: Story = {
  globals: {
    viewport: { value: 'mobile1' },
  },
};

/**
 * MobileLarge: Large Mobile Viewport (414px)
 * Tests component on larger modern mobile devices
 */
export const MobileLarge: Story = {
  globals: {
    viewport: { value: 'mobile2' },
  },
};

/**
 * Tablet: Tablet Viewport (834px)
 * Tests component on tablet devices
 */
export const Tablet: Story = {
  globals: {
    viewport: { value: 'tablet' },
  },
};

/**
 * DarkTheme: Dark Mode Theme
 * Tests component appearance in dark mode
 */
export const DarkTheme: Story = {
  globals: {
    theme: 'dark',
  },
};

/**
 * LightTheme: Light Mode Theme
 * Tests component appearance in light mode
 */
export const LightTheme: Story = {
  globals: {
    theme: 'light',
  },
};
