'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/src/components/primitives/button';
import { ErrorBoundary } from './error-boundary';

// Component that throws an error on button click
function ThrowErrorComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('This is a test error from Storybook');
  }
  return (
    <div className="p-4 border rounded-lg">
      <p className="text-lg font-medium">Component loaded successfully</p>
      <p className="text-muted-foreground mt-2">Everything is working fine. No errors detected.</p>
    </div>
  );
}

// Interactive wrapper to trigger errors
function ErrorTrigger() {
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div className="space-y-4">
      <Button onClick={() => setShouldThrow(true)} variant="destructive">
        Trigger Error
      </Button>
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  );
}

const meta = {
  title: 'Infra/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'React Error Boundary wrapper that catches JavaScript errors in child components. Provides user-friendly error UI with recovery options and detailed error info in development mode.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: false,
      description: 'Child components to wrap with error boundary',
    },
    fallback: {
      control: false,
      description: 'Optional custom fallback component',
    },
  },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default error boundary wrapping successful component
 */
export const Default: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-4">Working Component</h2>
        <p className="text-muted-foreground">
          This component is working correctly. No errors to catch.
        </p>
      </div>
    </ErrorBoundary>
  ),
};

/**
 * Interactive error trigger demo
 */
export const InteractiveError: Story = {
  render: () => (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Interactive Error Demo</h2>
      <p className="text-muted-foreground mb-4">
        Click the button to trigger an error and see the error boundary in action.
      </p>
      <ErrorTrigger />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Click "Trigger Error" to see how the error boundary catches and displays errors.',
      },
    },
  },
};

/**
 * Error boundary with immediate error
 */
export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <ThrowErrorComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Shows the error fallback UI that appears when a child component throws an error. In production, stack traces are hidden.',
      },
    },
  },
};

/**
 * Nested error boundaries
 */
export const NestedBoundaries: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Nested Error Boundaries</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ErrorBoundary>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Section 1 (Working)</h3>
            <p className="text-muted-foreground">This section is working fine.</p>
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Section 2 (Error)</h3>
            <ThrowErrorComponent shouldThrow={true} />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates how error boundaries can be nested to isolate errors to specific sections of the UI. One section fails while others continue working.',
      },
    },
  },
};

/**
 * Custom fallback component
 */
export const CustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md p-8 border rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-center">Oops!</h2>
            <p className="text-muted-foreground text-center">
              This is a custom error fallback. You can design it however you want!
            </p>
          </div>
        </div>
      }
    >
      <ThrowErrorComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows how to provide a custom fallback UI instead of the default error page.',
      },
    },
  },
};

/**
 * Multiple components showcase
 */
export const MultipleComponents: Story = {
  render: () => (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Multiple Error Boundaries</h2>
        <p className="text-muted-foreground mb-6">
          Each section is wrapped in its own error boundary for isolation.
        </p>
      </div>

      <div className="space-y-4">
        <ErrorBoundary>
          <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
            <h3 className="font-semibold mb-2">Component A</h3>
            <p className="text-sm text-muted-foreground">Working correctly</p>
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
            <h3 className="font-semibold mb-2">Component B</h3>
            <p className="text-sm text-muted-foreground">Working correctly</p>
          </div>
        </ErrorBoundary>

        <ErrorBoundary>
          <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950">
            <h3 className="font-semibold mb-2">Component C</h3>
            <p className="text-sm text-muted-foreground">Working correctly</p>
          </div>
        </ErrorBoundary>
      </div>
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
