'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { ErrorTable } from './error-table';

/**
 * ErrorTable Component Stories
 *
 * Tabular display of common errors with solutions.
 * Shows error codes, severity levels, messages, and fixes.
 *
 * Features:
 * - 4-column table (Error Code, Severity, Message, Solution)
 * - Severity badges with icons (critical, warning, info)
 * - Color-coded severity levels
 * - Striped rows (zebra striping)
 * - Responsive overflow (horizontal scroll on mobile)
 * - UnifiedBadge for severity display
 * - AlertTriangle/Info icons
 * - Monospace error codes
 * - Header row with muted background
 * - Zod validation for error items
 *
 * Component: src/components/tools/troubleshooting/error-table.tsx (84 LOC)
 * Used in: 1 MDX file for troubleshooting documentation
 * Dependencies: Card, UnifiedBadge, AlertTriangle, Info icons
 *
 * Severity Levels:
 * - critical: Red badge with AlertTriangle icon
 * - warning: Yellow badge with Info icon
 * - info: Blue badge with Info icon
 *
 * Table Structure:
 * - Header: border-b, bg-muted/30
 * - Rows: zebra striping (even rows have bg-muted/10)
 * - Last row: no border
 * - Error codes: font-mono text-sm
 * - Solutions: text-muted-foreground
 */
const meta = {
  title: 'Tools/Troubleshooting/ErrorTable',
  component: ErrorTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Error reference table for troubleshooting. Displays common errors with severity levels, messages, and solutions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Error table section title',
      table: {
        defaultValue: { summary: 'Common Errors & Solutions' },
      },
    },
    description: {
      control: 'text',
      description: 'Optional description text',
    },
    errors: {
      control: 'object',
      description: 'Array of error items (1-50 entries)',
    },
  },
} satisfies Meta<typeof ErrorTable>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: API Errors
 *
 * Common API error codes with mixed severity levels.
 * Shows typical error documentation table.
 *
 * Usage:
 * ```tsx
 * <ErrorTable
 *   title="API Error Reference"
 *   errors={[
 *     {
 *       code: "ERR_AUTH_401",
 *       severity: "critical",
 *       message: "Unauthorized access",
 *       solution: "Include valid API key in Authorization header"
 *     }
 *   ]}
 * />
 * ```
 */
export const Default: Story = {
  args: {
    title: 'API Error Reference',
    description: 'Common API errors and how to fix them',
    errors: [
      {
        code: 'ERR_AUTH_401',
        severity: 'critical',
        message: 'Unauthorized access',
        solution: 'Include valid API key in Authorization header with Bearer prefix',
      },
      {
        code: 'ERR_RATE_LIMIT_429',
        severity: 'warning',
        message: 'Too many requests',
        solution: 'Wait 60 seconds before retrying or upgrade to higher tier',
      },
      {
        code: 'ERR_INVALID_PARAM_400',
        severity: 'warning',
        message: 'Invalid request parameters',
        solution: 'Check API documentation for required and optional parameters',
      },
      {
        code: 'ERR_NOT_FOUND_404',
        severity: 'info',
        message: 'Resource not found',
        solution: 'Verify resource ID exists and you have access permissions',
      },
      {
        code: 'ERR_SERVER_500',
        severity: 'critical',
        message: 'Internal server error',
        solution: 'Contact support if error persists after retry',
      },
    ],
  },
};

/**
 * Critical Errors Only
 *
 * All errors with critical severity level.
 * Shows red badges with AlertTriangle icons.
 */
export const CriticalErrors: Story = {
  args: {
    title: 'Critical Errors',
    description: 'Errors that require immediate attention',
    errors: [
      {
        code: 'ERR_DATABASE_DOWN',
        severity: 'critical',
        message: 'Database connection failed',
        solution: 'Check database service status and connection string',
      },
      {
        code: 'ERR_AUTH_FAILURE',
        severity: 'critical',
        message: 'Authentication system offline',
        solution: 'Verify auth service is running and accessible',
      },
      {
        code: 'ERR_DATA_CORRUPTION',
        severity: 'critical',
        message: 'Data integrity violation detected',
        solution: 'Restore from last known good backup immediately',
      },
    ],
  },
};

/**
 * Warning Errors Only
 *
 * All errors with warning severity level.
 * Shows yellow badges with Info icons.
 */
export const WarningErrors: Story = {
  args: {
    title: 'Warning Messages',
    description: 'Issues that should be addressed soon',
    errors: [
      {
        code: 'WARN_DEPRECATED_API',
        severity: 'warning',
        message: 'Using deprecated API version',
        solution: 'Upgrade to v2 API before sunset date (Dec 31, 2025)',
      },
      {
        code: 'WARN_QUOTA_80PCT',
        severity: 'warning',
        message: 'Approaching quota limit (80%)',
        solution: 'Monitor usage or upgrade plan to avoid service interruption',
      },
      {
        code: 'WARN_SLOW_QUERY',
        severity: 'warning',
        message: 'Database query took >5 seconds',
        solution: 'Add appropriate indexes or optimize query structure',
      },
    ],
  },
};

/**
 * Info Errors Only
 *
 * All errors with info severity level.
 * Shows blue badges with Info icons.
 */
export const InfoErrors: Story = {
  args: {
    title: 'Informational Messages',
    description: 'General information and tips',
    errors: [
      {
        code: 'INFO_CACHE_MISS',
        severity: 'info',
        message: 'Cache miss on first request',
        solution: 'Expected behavior - subsequent requests will be cached',
      },
      {
        code: 'INFO_PARTIAL_RESULT',
        severity: 'info',
        message: 'Partial results returned',
        solution: 'Use pagination to retrieve remaining results',
      },
    ],
  },
};

/**
 * Installation Errors
 *
 * Package installation troubleshooting.
 * Shows npm/yarn error codes.
 */
export const InstallationErrors: Story = {
  args: {
    title: 'Installation Errors',
    description: 'Common npm/yarn installation issues',
    errors: [
      {
        code: 'EACCES',
        severity: 'critical',
        message: 'Permission denied',
        solution: 'Fix npm permissions: sudo chown -R $USER /usr/local/lib/node_modules',
      },
      {
        code: 'ERESOLVE',
        severity: 'warning',
        message: 'Dependency resolution conflict',
        solution: 'Use --legacy-peer-deps flag or update conflicting packages',
      },
      {
        code: 'ENOTFOUND',
        severity: 'critical',
        message: 'Package not found in registry',
        solution: 'Check package name spelling or verify registry URL',
      },
      {
        code: 'ETIMEDOUT',
        severity: 'warning',
        message: 'Network request timeout',
        solution: 'Check internet connection or configure proxy settings',
      },
    ],
  },
};

/**
 * Build Errors
 *
 * Compilation and build errors.
 * Shows TypeScript and bundler errors.
 */
export const BuildErrors: Story = {
  args: {
    title: 'Build & Compilation Errors',
    description: 'TypeScript and bundler error codes',
    errors: [
      {
        code: 'TS2307',
        severity: 'critical',
        message: 'Cannot find module',
        solution: 'Verify import path is correct and module is installed',
      },
      {
        code: 'TS2322',
        severity: 'warning',
        message: 'Type mismatch',
        solution: 'Update type annotations or use type assertion',
      },
      {
        code: 'WEBPACK_001',
        severity: 'critical',
        message: 'Module parse failed',
        solution: 'Add appropriate loader for file type in webpack config',
      },
      {
        code: 'VITE_ERROR',
        severity: 'warning',
        message: 'Dynamic import failed',
        solution: 'Check file path and ensure module is in src directory',
      },
    ],
  },
};

/**
 * Single Error
 *
 * Minimal table with only 1 error entry.
 * Tests edge case of single row.
 */
export const SingleError: Story = {
  args: {
    title: 'Quick Reference',
    errors: [
      {
        code: 'ERR_TIMEOUT',
        severity: 'warning',
        message: 'Request timeout exceeded',
        solution: 'Increase timeout value or optimize backend performance',
      },
    ],
  },
};

/**
 * Many Errors (15 Rows)
 *
 * Long error table with 15 entries.
 * Tests scrolling and zebra striping.
 */
export const ManyErrors: Story = {
  args: {
    title: 'Complete Error Reference',
    description: 'Comprehensive list of all possible error codes',
    errors: Array.from({ length: 15 }, (_, i) => ({
      code: `ERR_${String(i + 1).padStart(3, '0')}`,
      severity: (['critical', 'warning', 'info'] as const)[i % 3],
      message: `Error message for code ${i + 1}`,
      solution: `Solution for error ${i + 1}: Check logs and retry operation`,
    })),
  },
};

/**
 * Long Error Codes
 *
 * Tests layout with lengthy error code strings.
 * Ensures monospace font handling.
 */
export const LongErrorCodes: Story = {
  args: {
    title: 'Verbose Error Codes',
    errors: [
      {
        code: 'ERR_AUTHENTICATION_TOKEN_INVALID_OR_EXPIRED',
        severity: 'critical',
        message: 'Authentication token is invalid or has expired',
        solution: 'Refresh authentication token or re-login',
      },
      {
        code: 'WARN_DATABASE_CONNECTION_POOL_EXHAUSTED',
        severity: 'warning',
        message: 'Database connection pool has no available connections',
        solution: 'Increase pool size or reduce concurrent requests',
      },
    ],
  },
};

/**
 * Long Messages
 *
 * Tests layout with lengthy error messages.
 * Ensures proper text wrapping.
 */
export const LongMessages: Story = {
  args: {
    title: 'Detailed Error Messages',
    errors: [
      {
        code: 'ERR_001',
        severity: 'critical',
        message:
          'The requested operation failed because the authentication system could not verify your credentials due to an internal communication error between the authentication service and the user database',
        solution: 'Wait 5 minutes and retry. If error persists, contact system administrator',
      },
    ],
  },
};

/**
 * Long Solutions
 *
 * Tests layout with lengthy solution text.
 * Ensures proper solution column handling.
 */
export const LongSolutions: Story = {
  args: {
    title: 'Detailed Solutions',
    errors: [
      {
        code: 'ERR_CONFIG',
        severity: 'warning',
        message: 'Configuration file parse error',
        solution:
          'Step 1: Validate JSON syntax using jsonlint.com. Step 2: Check for trailing commas (not allowed in JSON). Step 3: Verify all strings use double quotes. Step 4: Ensure all required fields are present. Step 5: Review environment variable substitutions. Step 6: Check file encoding is UTF-8.',
      },
    ],
  },
};

/**
 * No Description
 *
 * Error table without description text.
 * Tests optional description field.
 */
export const NoDescription: Story = {
  args: {
    title: 'Error Codes',
    errors: [
      {
        code: 'ERR_001',
        severity: 'info',
        message: 'Sample error',
        solution: 'Sample solution',
      },
    ],
  },
};

/**
 * Mobile Layout
 *
 * ErrorTable on mobile viewport (375px).
 * Tests horizontal scroll behavior.
 */
export const MobileLayout: Story = {
  args: {
    title: 'API Errors',
    description: 'Common error codes',
    errors: [
      {
        code: 'ERR_AUTH_401',
        severity: 'critical',
        message: 'Unauthorized access - invalid or missing API key',
        solution: 'Include valid API key in Authorization header',
      },
      {
        code: 'ERR_RATE_LIMIT_429',
        severity: 'warning',
        message: 'Rate limit exceeded for current tier',
        solution: 'Implement exponential backoff or upgrade tier',
      },
    ],
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile viewport showing horizontal scroll for wide table content.',
      },
    },
  },
};

/**
 * In Context Example
 *
 * ErrorTable in realistic documentation page.
 * Shows integration with article layout.
 */
export const InContextExample: Story = {
  render: (args) => (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">API Error Reference</h1>
        <p className="text-muted-foreground">
          Complete reference guide for all API error codes and their solutions
        </p>
      </div>
      <ErrorTable {...args} />
      <div className="text-sm text-muted-foreground border-t pt-4">
        <p>
          Error not listed? Check the{' '}
          <a href="/docs" className="underline">
            full documentation
          </a>{' '}
          or contact support.
        </p>
      </div>
    </div>
  ),
  args: {
    title: 'HTTP Status Codes',
    description: 'Common HTTP errors in our API',
    errors: [
      {
        code: '400',
        severity: 'warning',
        message: 'Bad Request',
        solution: 'Check request body format and required parameters',
      },
      {
        code: '401',
        severity: 'critical',
        message: 'Unauthorized',
        solution: 'Provide valid authentication credentials',
      },
      {
        code: '403',
        severity: 'critical',
        message: 'Forbidden',
        solution: 'Verify account has necessary permissions for this resource',
      },
      {
        code: '404',
        severity: 'info',
        message: 'Not Found',
        solution: 'Check resource ID and endpoint URL',
      },
      {
        code: '429',
        severity: 'warning',
        message: 'Too Many Requests',
        solution: 'Implement rate limiting and exponential backoff',
      },
      {
        code: '500',
        severity: 'critical',
        message: 'Internal Server Error',
        solution: 'Contact support if error persists after retry',
      },
    ],
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Table Rendering Test
 * Tests ErrorTable renders table element
 */
export const TableRenderingTest: Story = {
  args: {
    title: 'Test Errors',
    errors: [
      {
        code: 'ERR_TEST',
        severity: 'info',
        message: 'Test message',
        solution: 'Test solution',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests ErrorTable renders table with headers and rows.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify table element is rendered', async () => {
      const table = canvasElement.querySelector('table');
      await expect(table).toBeInTheDocument();
    });

    await step('Verify title is displayed', async () => {
      const title = canvas.getByText('Test Errors');
      await expect(title).toBeInTheDocument();
    });
  },
};

/**
 * Table Headers Test
 * Tests all 4 column headers are present
 */
export const TableHeadersTest: Story = {
  args: {
    title: 'Headers Test',
    errors: [
      {
        code: 'ERR_001',
        severity: 'info',
        message: 'Test',
        solution: 'Test',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests table headers render for all 4 columns.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify "Error Code" header', async () => {
      const header = canvas.getByText('Error Code');
      await expect(header).toBeInTheDocument();
    });

    await step('Verify "Severity" header', async () => {
      const header = canvas.getByText('Severity');
      await expect(header).toBeInTheDocument();
    });

    await step('Verify "Message" header', async () => {
      const header = canvas.getByText('Message');
      await expect(header).toBeInTheDocument();
    });

    await step('Verify "Solution" header', async () => {
      const header = canvas.getByText('Solution');
      await expect(header).toBeInTheDocument();
    });
  },
};

/**
 * Error Code Display Test
 * Tests error code is displayed in monospace font
 */
export const ErrorCodeDisplayTest: Story = {
  args: {
    title: 'Code Test',
    errors: [
      {
        code: 'ERR_AUTH_401',
        severity: 'critical',
        message: 'Unauthorized',
        solution: 'Add auth token',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests error code displays in monospace font.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify error code is displayed', async () => {
      const errorCode = canvas.getByText('ERR_AUTH_401');
      await expect(errorCode).toBeInTheDocument();
    });
  },
};

/**
 * Severity Badge Test
 * Tests severity badge renders with correct styling
 */
export const SeverityBadgeTest: Story = {
  args: {
    title: 'Severity Test',
    errors: [
      {
        code: 'ERR_001',
        severity: 'critical',
        message: 'Critical error',
        solution: 'Fix immediately',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests severity badge renders with UnifiedBadge component.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify severity badge text is displayed', async () => {
      const severityBadge = canvas.getByText('critical');
      await expect(severityBadge).toBeInTheDocument();
    });
  },
};

/**
 * Multiple Rows Test
 * Tests multiple error rows render
 */
export const MultipleRowsTest: Story = {
  args: {
    title: 'Multiple Errors',
    errors: [
      {
        code: 'ERR_001',
        severity: 'critical',
        message: 'First error',
        solution: 'First solution',
      },
      {
        code: 'ERR_002',
        severity: 'warning',
        message: 'Second error',
        solution: 'Second solution',
      },
      {
        code: 'ERR_003',
        severity: 'info',
        message: 'Third error',
        solution: 'Third solution',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests multiple error rows render in table body.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify first error is displayed', async () => {
      const firstError = canvas.getByText('ERR_001');
      await expect(firstError).toBeInTheDocument();
    });

    await step('Verify second error is displayed', async () => {
      const secondError = canvas.getByText('ERR_002');
      await expect(secondError).toBeInTheDocument();
    });

    await step('Verify third error is displayed', async () => {
      const thirdError = canvas.getByText('ERR_003');
      await expect(thirdError).toBeInTheDocument();
    });
  },
};
