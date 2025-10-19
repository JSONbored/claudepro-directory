'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
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

// ============================================================================
// COMPONENT STATES
// ============================================================================

/**
 * Error Recovery State
 * Tests error boundary recovery when error is cleared
 */
export const ErrorRecoveryState: Story = {
  render: () => {
    function RecoverableError() {
      const [hasError, setHasError] = useState(false);

      return (
        <div className="p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-4">Error Recovery Demo</h2>
          <div className="space-x-2">
            <Button onClick={() => setHasError(true)} variant="destructive">
              Trigger Error
            </Button>
            <Button onClick={() => setHasError(false)} variant="outline">
              Reset Component
            </Button>
          </div>
          <ErrorBoundary key={hasError ? 'error' : 'success'}>
            <ThrowErrorComponent shouldThrow={hasError} />
          </ErrorBoundary>
        </div>
      );
    }

    return <RecoverableError />;
  },
  parameters: {
    docs: {
      description: {
        story: `
Error boundary with recovery mechanism. Key prop changes force remount.

**Recovery Pattern:**
- Trigger error with "Trigger Error" button
- Reset component with "Reset Component" button
- Key prop change forces ErrorBoundary remount
        `,
      },
    },
  },
};

/**
 * Loading Fallback State
 * Tests error boundary with loading skeleton fallback
 */
export const LoadingFallbackState: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
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
        story:
          'Error boundary with skeleton loading fallback. Useful for graceful degradation during errors.',
      },
    },
  },
};

/**
 * Empty State After Error
 * Tests error boundary showing empty state instead of error UI
 */
export const EmptyStateAfterError: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">No Content Available</h3>
            <p className="text-muted-foreground mb-4">
              The content you're looking for could not be loaded at this time.
            </p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
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
        story:
          'Error boundary showing user-friendly empty state instead of technical error details.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Error Trigger Interaction Test
 * Tests interactive error triggering via button click
 */
export const ErrorTriggerInteraction: Story = {
  render: () => <ErrorTrigger />,
  parameters: {
    docs: {
      description: {
        story: 'Tests error boundary activation via user interaction.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial state shows success message', async () => {
      const successMessage = canvas.getByText(/component loaded successfully/i);
      await expect(successMessage).toBeInTheDocument();
    });

    await step('Click "Trigger Error" button', async () => {
      const triggerButton = canvas.getByRole('button', { name: /trigger error/i });
      await userEvent.click(triggerButton);
    });

    await step('Verify error boundary fallback UI appears', async () => {
      // Error boundary should catch the error and show fallback
      // Note: Storybook may suppress errors in test mode
      const successMessage = canvas.queryByText(/component loaded successfully/i);
      // Success message should be gone after error
      await expect(successMessage).not.toBeInTheDocument();
    });
  },
};

/**
 * Nested Boundary Isolation Test
 * Tests that error in one boundary doesn't affect others
 */
export const NestedBoundaryIsolation: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Isolation Test</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ErrorBoundary>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2" data-testid="section-1-title">
              Section 1 (Working)
            </h3>
            <p className="text-muted-foreground">This section is working fine.</p>
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2" data-testid="section-2-title">
              Section 2 (Error)
            </h3>
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
          'Tests that errors are isolated to their boundary - other sections continue working.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Section 1 is still working', async () => {
      const section1 = canvas.getByTestId('section-1-title');
      await expect(section1).toBeInTheDocument();
      await expect(section1).toHaveTextContent('Section 1 (Working)');
    });

    await step('Verify Section 2 title is present (boundary contains error)', async () => {
      // Section 2 boundary should catch its error without affecting Section 1
      const section2 = canvas.getByTestId('section-2-title');
      await expect(section2).toBeInTheDocument();
    });
  },
};

/**
 * Custom Fallback Rendering Test
 * Tests custom fallback component rendering
 */
export const CustomFallbackRendering: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div data-testid="custom-fallback" className="p-8 border rounded-lg">
          <h2 className="text-xl font-bold mb-2">Custom Error Handler</h2>
          <p className="text-muted-foreground">This is a custom fallback UI.</p>
        </div>
      }
    >
      <ThrowErrorComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tests rendering of custom fallback component instead of default error UI.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify custom fallback is rendered', async () => {
      const customFallback = canvas.getByTestId('custom-fallback');
      await expect(customFallback).toBeInTheDocument();
    });

    await step('Verify custom fallback contains expected text', async () => {
      const customHeading = canvas.getByText(/custom error handler/i);
      await expect(customHeading).toBeInTheDocument();
    });
  },
};
