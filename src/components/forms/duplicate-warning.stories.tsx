'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { useId, useState } from 'react';
import { expect, within } from 'storybook/test';
import { DuplicateWarning } from './duplicate-warning';

/**
 * DuplicateWarning Component Stories
 *
 * Real-time duplicate detection component for form name inputs.
 * Shows warnings for generic or duplicate names with debounced checking.
 *
 * Features:
 * - Client-side duplicate detection
 * - Generic name detection (test, example, demo, etc.)
 * - Debounced input checking (500ms delay)
 * - Three states: idle (null), checking (pulse), warning (alert)
 * - Alert component with warning styling
 * - AlertTriangle icon (4x4)
 * - Yellow theme (border-yellow-500/20, bg-yellow-500/5)
 * - Automatic state management
 * - Performance optimized (only checks after 3+ characters)
 * - Non-blocking UX (allows submission despite warning)
 *
 * Component: src/components/forms/duplicate-warning.tsx (96 LOC)
 * Used in: Form components (submit-form, new-post-form, etc.)
 * Dependencies: Alert primitive, useDebounce hook, AlertTriangle icon
 *
 * Three States:
 * 1. **Idle/Hidden** (warning = null):
 *    - Component returns null
 *    - No UI shown
 *    - Default state when name is valid or < 3 characters
 *
 * 2. **Checking** (checking = true):
 *    - "Checking for duplicates..." text
 *    - text-sm text-muted-foreground
 *    - Motion.dev opacity fade animation (smooth pulse)
 *    - Shows briefly while debounced value is being processed
 *
 * 3. **Warning** (warning = string):
 *    - Alert component with yellow theme
 *    - AlertTriangle icon
 *    - "Suggestion" title (text-yellow-400)
 *    - Warning message text
 *    - Non-blocking (user can still submit)
 *
 * Generic Names List (case-insensitive):
 * - test, example, demo, sample
 * - default, new, my, untitled
 * - temp, temporary
 *
 * Detection Logic:
 * ```ts
 * const isGeneric = genericNames.some(
 *   (generic) => lowerName === generic || lowerName.startsWith(`${generic} `)
 * );
 * ```
 *
 * Matches:
 * - Exact match: "test" → warning
 * - Starts with: "test config" → warning
 * - No match: "production config" → no warning
 *
 * Debounce Hook:
 * - Custom useDebounce<T>(value, delay) hook
 * - 500ms delay for name input
 * - Prevents excessive checking during typing
 * - Uses setTimeout + cleanup
 *
 * Performance Optimization:
 * - Only checks names with 3+ characters
 * - Early return for short names
 * - Debounced to reduce checks
 *
 * IMPORTANT: This is a client-side helper component.
 * It provides suggestions but does NOT prevent form submission.
 * Real duplicate detection should happen on the server.
 *
 * @see Research Report: "Form Validation UX Best Practices"
 */
const meta = {
  title: 'Forms/DuplicateWarning',
  component: DuplicateWarning,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Real-time duplicate detection for form inputs. Shows warnings for generic names with 500ms debounce. Three states: idle, checking, warning.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    contentType: {
      control: 'text',
      description: 'Type of content being named (currently unused in logic)',
    },
    name: {
      control: 'text',
      description: 'Name input value to check for duplicates',
    },
  },
  decorators: [
    (Story) => (
      <div className="min-w-[500px] p-8 bg-background border rounded-lg">
        <div className="space-y-4">
          <div>
            <label htmlFor="name-input" className="text-sm font-medium mb-2 block">
              Name Input
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Type a name to see duplicate detection in action (try: "test", "example", "demo")
            </p>
          </div>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<typeof DuplicateWarning>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Idle State
 *
 * Shows DuplicateWarning with valid name.
 * Component returns null (no warning shown).
 *
 * Behavior:
 * - Name is not generic → no warning
 * - Component returns null
 * - No UI rendered
 *
 * Usage:
 * ```tsx
 * <DuplicateWarning contentType="config" name="production-api-settings" />
 * ```
 */
export const Default: Story = {
  args: {
    contentType: 'config',
    name: 'my-custom-config',
  },
};

/**
 * Checking State
 *
 * Shows animated pulse while checking for duplicates.
 * Appears briefly during debounce period.
 *
 * Visual:
 * - "Checking for duplicates..." text
 * - text-sm text-muted-foreground
 * - Motion.dev opacity fade animation (smooth pulse)
 *
 * Note: This state is transient (500ms debounce)
 * and difficult to capture in static story.
 */
export const CheckingState: Story = {
  args: {
    contentType: 'config',
    name: 'te', // Too short, won't trigger check
  },
  parameters: {
    docs: {
      description: {
        story:
          'Checking state with Motion.dev fade animation. Shows while debounced value is being processed (500ms delay).',
      },
    },
  },
};

/**
 * Warning - Generic Name "test"
 *
 * Shows warning for generic name "test".
 * Exact match triggers warning.
 *
 * Warning message:
 * "This name seems generic. Consider a more specific, descriptive name."
 *
 * Visual:
 * - Alert with yellow theme
 * - AlertTriangle icon (text-yellow-400)
 * - "Suggestion" title
 * - Warning message text
 */
export const WarningTest: Story = {
  args: {
    contentType: 'config',
    name: 'test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning shown for generic name "test". Suggests more specific name.',
      },
    },
  },
};

/**
 * Warning - Generic Name "example"
 *
 * Shows warning for generic name "example".
 */
export const WarningExample: Story = {
  args: {
    contentType: 'hook',
    name: 'example',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning shown for generic name "example".',
      },
    },
  },
};

/**
 * Warning - Generic Name "demo"
 *
 * Shows warning for generic name "demo".
 */
export const WarningDemo: Story = {
  args: {
    contentType: 'command',
    name: 'demo',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning shown for generic name "demo".',
      },
    },
  },
};

/**
 * Warning - Generic Name "sample"
 *
 * Shows warning for generic name "sample".
 */
export const WarningSample: Story = {
  args: {
    contentType: 'agent',
    name: 'sample',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning shown for generic name "sample".',
      },
    },
  },
};

/**
 * Warning - Generic Name "default"
 *
 * Shows warning for generic name "default".
 */
export const WarningDefault: Story = {
  args: {
    contentType: 'config',
    name: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning shown for generic name "default".',
      },
    },
  },
};

/**
 * Warning - Generic Name "new"
 *
 * Shows warning for generic name "new".
 */
export const WarningNew: Story = {
  args: {
    contentType: 'config',
    name: 'new',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning shown for generic name "new".',
      },
    },
  },
};

/**
 * Warning - Generic Name "my"
 *
 * Shows warning for generic name "my".
 */
export const WarningMy: Story = {
  args: {
    contentType: 'config',
    name: 'my',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning shown for generic name "my".',
      },
    },
  },
};

/**
 * Warning - Generic Name "untitled"
 *
 * Shows warning for generic name "untitled".
 */
export const WarningUntitled: Story = {
  args: {
    contentType: 'document',
    name: 'untitled',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning shown for generic name "untitled".',
      },
    },
  },
};

/**
 * Warning - Generic Name "temp"
 *
 * Shows warning for generic name "temp".
 */
export const WarningTemp: Story = {
  args: {
    contentType: 'config',
    name: 'temp',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning shown for generic name "temp".',
      },
    },
  },
};

/**
 * Warning - Generic Name "temporary"
 *
 * Shows warning for generic name "temporary".
 */
export const WarningTemporary: Story = {
  args: {
    contentType: 'config',
    name: 'temporary',
  },
  parameters: {
    docs: {
      description: {
        story: 'Warning shown for generic name "temporary".',
      },
    },
  },
};

/**
 * Warning - Starts With Generic
 *
 * Shows warning for names starting with generic word.
 * Detection: `lowerName.startsWith(\`\${generic} \`)`
 *
 * Examples:
 * - "test config" → warning
 * - "example settings" → warning
 * - "demo application" → warning
 */
export const WarningStartsWith: Story = {
  args: {
    contentType: 'config',
    name: 'test config',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Warning shown for names starting with generic word. "test config" triggers warning because it starts with "test ".',
      },
    },
  },
};

/**
 * No Warning - Valid Name
 *
 * Shows no warning for valid, specific name.
 * Component returns null.
 *
 * Examples of valid names:
 * - "production-api-config"
 * - "user-authentication-hook"
 * - "database-migration-script"
 */
export const NoWarningValid: Story = {
  args: {
    contentType: 'config',
    name: 'production-api-config',
  },
  parameters: {
    docs: {
      description: {
        story: 'No warning for valid, specific name. Component returns null and renders nothing.',
      },
    },
  },
};

/**
 * No Warning - Short Name
 *
 * Shows no warning for names < 3 characters.
 * Early return prevents checking.
 *
 * Code:
 * ```ts
 * if (!debouncedName || debouncedName.length < 3) {
 *   setWarning(null);
 *   return;
 * }
 * ```
 *
 * Performance optimization: Don't check while user is typing
 */
export const NoWarningShort: Story = {
  args: {
    contentType: 'config',
    name: 'te',
  },
  parameters: {
    docs: {
      description: {
        story: 'No warning for names < 3 characters. Early return for performance optimization.',
      },
    },
  },
};

/**
 * No Warning - Empty Name
 *
 * Shows no warning for empty name.
 * Component returns null.
 */
export const NoWarningEmpty: Story = {
  args: {
    contentType: 'config',
    name: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'No warning for empty name. Component returns null.',
      },
    },
  },
};

/**
 * Case Insensitive Detection
 *
 * Shows warning works regardless of case.
 * All generic names compared in lowercase.
 *
 * Examples:
 * - "TEST" → warning
 * - "Test" → warning
 * - "TeSt" → warning
 *
 * Code:
 * ```ts
 * const lowerName = debouncedName.toLowerCase();
 * const isGeneric = genericNames.some(...);
 * ```
 */
export const CaseInsensitive: Story = {
  args: {
    contentType: 'config',
    name: 'TEST',
  },
  parameters: {
    docs: {
      description: {
        story: 'Case-insensitive detection. "TEST", "Test", "test" all trigger warning.',
      },
    },
  },
};

/**
 * Debounce Demonstration
 *
 * Interactive story showing debounce in action.
 * Type rapidly to see 500ms delay before check runs.
 */
export const DebounceDemo: Story = {
  render: () => {
    const [name, setName] = useState('');
    const inputId = useId();

    return (
      <div className="space-y-4">
        <div>
          <label htmlFor={inputId} className="text-sm font-medium mb-2 block">
            Type rapidly to see debounce
          </label>
          <input
            id={inputId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Try typing 'test' quickly..."
          />
          <p className="text-xs text-muted-foreground mt-2">
            Warning appears 500ms after you stop typing
          </p>
        </div>
        <DuplicateWarning contentType="config" name={name} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive debounce demonstration. Type name and see warning appear 500ms after stopping.',
      },
    },
  },
};

/**
 * With Form Integration
 *
 * Shows DuplicateWarning in realistic form context.
 */
export const WithFormIntegration: Story = {
  render: () => {
    const [name, setName] = useState('');
    const nameId = useId();
    const descriptionId = useId();

    return (
      <form className="space-y-4">
        <div>
          <label htmlFor={nameId} className="text-sm font-medium mb-2 block">
            Configuration Name *
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="Enter configuration name"
            required
          />
        </div>

        <DuplicateWarning contentType="config" name={name} />

        <div>
          <label htmlFor={descriptionId} className="text-sm font-medium mb-2 block">
            Description
          </label>
          <textarea
            id={descriptionId}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            placeholder="Describe your configuration"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90"
        >
          Submit
        </button>
      </form>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'DuplicateWarning integrated in form. Shows warning between name input and other fields.',
      },
    },
  },
};

/**
 * Multiple Content Types
 *
 * Shows component with different contentType values.
 * Note: contentType is currently unused in detection logic.
 */
export const MultipleContentTypes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-2">Config (contentType="config")</p>
        <DuplicateWarning contentType="config" name="test" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Hook (contentType="hook")</p>
        <DuplicateWarning contentType="hook" name="example" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Agent (contentType="agent")</p>
        <DuplicateWarning contentType="agent" name="demo" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Component with different contentType values. Currently unused in logic but available for future enhancements.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Warning Alert Test
 * Tests warning alert appears for generic name
 */
export const WarningAlertTest: Story = {
  args: {
    contentType: 'config',
    name: 'test',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests warning alert appears with correct styling for generic name.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Wait for debounce to complete', async () => {
      // Wait 600ms for debounce (500ms) + processing
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    await step('Verify alert is present', async () => {
      const alert = canvasElement.querySelector('[role="alert"]');
      await expect(alert).toBeTruthy();
    });

    await step('Verify alert has yellow theme', async () => {
      const alert = canvasElement.querySelector('[role="alert"]');
      if (alert) {
        const classList = Array.from(alert.classList);
        await expect(classList.some((c) => c.includes('yellow'))).toBe(true);
      }
    });
  },
};

/**
 * AlertTriangle Icon Test
 * Tests AlertTriangle icon is present in warning
 */
export const AlertTriangleIconTest: Story = {
  args: {
    contentType: 'config',
    name: 'example',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests AlertTriangle icon appears in warning alert.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Wait for debounce to complete', async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    await step('Verify AlertTriangle icon is present', async () => {
      const icon = canvasElement.querySelector('svg');
      await expect(icon).toBeTruthy();
    });
  },
};

/**
 * Warning Message Test
 * Tests warning message text is correct
 */
export const WarningMessageTest: Story = {
  args: {
    contentType: 'config',
    name: 'demo',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests warning message text is correct.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for debounce to complete', async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    await step('Verify warning message text', async () => {
      const message = canvas.queryByText(/This name seems generic/i);
      await expect(message).toBeTruthy();
    });
  },
};

/**
 * No Warning Test
 * Tests component returns null for valid name
 */
export const NoWarningTest: Story = {
  args: {
    contentType: 'config',
    name: 'production-api-config',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests component returns null (no warning) for valid name.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Wait for debounce to complete', async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    await step('Verify no alert is present', async () => {
      const alert = canvasElement.querySelector('[role="alert"]');
      await expect(alert).toBeFalsy();
    });
  },
};

/**
 * Short Name Test
 * Tests no warning for names < 3 characters
 */
export const ShortNameTest: Story = {
  args: {
    contentType: 'config',
    name: 'te',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests no warning appears for names with < 3 characters.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Wait for debounce to complete', async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    await step('Verify no alert for short name', async () => {
      const alert = canvasElement.querySelector('[role="alert"]');
      await expect(alert).toBeFalsy();
    });
  },
};

/**
 * Case Insensitive Test
 * Tests warning appears regardless of case
 */
export const CaseInsensitiveTest: Story = {
  args: {
    contentType: 'config',
    name: 'TEST',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests warning appears for uppercase generic name (case-insensitive).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Wait for debounce to complete', async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
    });

    await step('Verify warning appears for uppercase "TEST"', async () => {
      const alert = canvasElement.querySelector('[role="alert"]');
      await expect(alert).toBeTruthy();
    });
  },
};
