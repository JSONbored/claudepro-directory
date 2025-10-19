'use client';

import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { ExamplesArrayInput } from './examples-array-input';

/**
 * ExamplesArrayInput Component Stories
 *
 * Dynamic array input for managing usage examples in forms.
 * Provides add/remove functionality, validation, and JSON serialization.
 *
 * Features:
 * - Add/remove examples dynamically (max 10 by default)
 * - Syntax-highlighted code input with language selection
 * - Real-time validation with visual feedback
 * - Collapsible panels for better UX
 * - Auto-save to hidden form field as JSON
 * - Accessible keyboard navigation
 * - Mobile-responsive
 * - Character count for code/description
 * - Required fields marked with asterisk
 * - Empty state with helpful icon
 *
 * Component: src/components/forms/examples-array-input.tsx (383 LOC)
 * Used in: Submit forms, content creation forms
 * Dependencies: Card, Input, Textarea, Select, Button primitives
 *
 * Example Interface:
 * ```ts
 * interface UsageExample {
 *   id: string; // Internal only, not submitted
 *   title: string; // Max 100 chars
 *   code: string; // Max 10,000 chars
 *   language: ExampleLanguage; // typescript, javascript, json, etc.
 *   description?: string; // Optional, max 500 chars
 * }
 * ```
 *
 * Supported Languages (9):
 * - typescript, javascript, json, bash, shell
 * - python, yaml, markdown, plaintext
 *
 * Validation Rules:
 * - Title: Required, max 100 characters
 * - Code: Required, max 10,000 characters
 * - Language: Must be from SUPPORTED_LANGUAGES
 * - Description: Optional, max 500 characters
 *
 * JSON Serialization:
 * - Hidden input contains JSON array
 * - Internal 'id' field stripped before submission
 * - Array serialized with JSON.stringify()
 *
 * State Management:
 * - examples: Array of UsageExample objects
 * - expandedIndexes: Set of expanded panel indexes
 * - useId for unique field IDs
 *
 * Functions:
 * - toggleExpanded(index): Collapse/expand panel
 * - addExample(): Add new example to array
 * - removeExample(index): Remove example by index
 * - updateExample(index, field, value): Update specific field
 * - validateExample(example): Client-side validation
 *
 * IMPORTANT: This component is STATEFUL and manages complex form data.
 * It serializes to JSON in a hidden input for form submission.
 * In production, examples are stored in database and loaded as defaultValue.
 *
 * @see Research Report: "Form Array Management Best Practices"
 */
const meta = {
  title: 'Forms/ExamplesArrayInput',
  component: ExamplesArrayInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dynamic array input for usage examples. Add/remove examples, validate fields, serialize to JSON. Supports 9 languages with syntax highlighting preparation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: 'Name attribute for hidden input (form field name)',
    },
    defaultValue: {
      control: 'object',
      description: 'Initial array of examples',
    },
    maxExamples: {
      control: 'number',
      description: 'Maximum number of examples allowed',
    },
  },
  decorators: [
    (Story) => (
      <div className="min-w-[700px] max-w-[900px] p-8 bg-background border rounded-lg">
        <form>
          <Story />
        </form>
      </div>
    ),
  ],
} satisfies Meta<typeof ExamplesArrayInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default: Empty State
 *
 * Shows component with no examples.
 * Displays empty state with Code icon and helpful message.
 *
 * Visual:
 * - Dashed border card
 * - Code icon (8x8, muted)
 * - "No examples added yet" message
 * - "Add Example" button in header
 *
 * Usage:
 * ```tsx
 * <ExamplesArrayInput name="examples" />
 * ```
 */
export const Default: Story = {
  args: {
    name: 'examples',
  },
};

/**
 * With Single Example
 *
 * Shows component with one example pre-filled.
 * First example expanded by default.
 *
 * Example contains:
 * - Title: "Basic TypeScript Setup"
 * - Language: typescript
 * - Code snippet
 * - Description
 */
export const WithSingleExample: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'ex1',
        title: 'Basic TypeScript Setup',
        code: 'export default {\n  name: "my-config",\n  version: "1.0.0",\n  enabled: true\n};',
        language: 'typescript',
        description: 'A minimal TypeScript configuration example.',
      },
    ],
  },
};

/**
 * With Multiple Examples
 *
 * Shows component with 3 examples.
 * Demonstrates collapsed/expanded state management.
 */
export const WithMultipleExamples: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'ex1',
        title: 'Basic Setup',
        code: 'export default { name: "config" };',
        language: 'typescript',
        description: 'Minimal configuration',
      },
      {
        id: 'ex2',
        title: 'Advanced Configuration',
        code: '{\n  "name": "advanced-config",\n  "features": ["auth", "cache"]\n}',
        language: 'json',
        description: 'Advanced setup with multiple features',
      },
      {
        id: 'ex3',
        title: 'Shell Script',
        code: '#!/bin/bash\nnpm install\nnpm run build',
        language: 'bash',
        description: 'Installation and build script',
      },
    ],
  },
};

/**
 * Maximum Examples (10)
 *
 * Shows component at max capacity.
 * "Add Example" buttons disabled when limit reached.
 */
export const MaxExamples: Story = {
  args: {
    name: 'examples',
    maxExamples: 10,
    defaultValue: Array.from({ length: 10 }, (_, i) => ({
      id: `ex${i + 1}`,
      title: `Example ${i + 1}`,
      code: `// Code for example ${i + 1}`,
      language: 'typescript' as const,
    })),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Component with 10 examples (default max). Add Example buttons disabled when limit reached.',
      },
    },
  },
};

/**
 * Custom Max Limit
 *
 * Shows component with custom max limit (5 examples).
 * Demonstrates maxExamples prop customization.
 */
export const CustomMaxLimit: Story = {
  args: {
    name: 'examples',
    maxExamples: 5,
    defaultValue: [
      {
        id: 'ex1',
        title: 'Example 1',
        code: 'console.log("Hello");',
        language: 'javascript',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom maxExamples=5. "Add Example" button shows "X/5" when clicked.',
      },
    },
  },
};

/**
 * TypeScript Example
 *
 * Shows example with TypeScript language selected.
 */
export const TypeScriptExample: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'ts',
        title: 'TypeScript Interface',
        code: 'interface Config {\n  name: string;\n  version: number;\n  enabled: boolean;\n}',
        language: 'typescript',
        description: 'Type-safe configuration interface',
      },
    ],
  },
};

/**
 * JavaScript Example
 *
 * Shows example with JavaScript language selected.
 */
export const JavaScriptExample: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'js',
        title: 'JavaScript Function',
        code: 'function greet(name) {\n  return `Hello, ${name}!`;\n}',
        language: 'javascript',
        description: 'Simple greeting function',
      },
    ],
  },
};

/**
 * JSON Example
 *
 * Shows example with JSON language selected.
 */
export const JSONExample: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'json',
        title: 'JSON Configuration',
        code: '{\n  "name": "my-app",\n  "version": "1.0.0",\n  "dependencies": {}\n}',
        language: 'json',
        description: 'Package configuration file',
      },
    ],
  },
};

/**
 * Bash Example
 *
 * Shows example with Bash language selected.
 */
export const BashExample: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'bash',
        title: 'Bash Script',
        code: '#!/bin/bash\nset -e\necho "Starting deployment..."\nnpm run deploy',
        language: 'bash',
        description: 'Deployment automation script',
      },
    ],
  },
};

/**
 * Python Example
 *
 * Shows example with Python language selected.
 */
export const PythonExample: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'py',
        title: 'Python Class',
        code: 'class Config:\n    def __init__(self, name):\n        self.name = name',
        language: 'python',
        description: 'Configuration class in Python',
      },
    ],
  },
};

/**
 * YAML Example
 *
 * Shows example with YAML language selected.
 */
export const YAMLExample: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'yaml',
        title: 'YAML Config',
        code: 'name: my-app\nversion: 1.0.0\nfeatures:\n  - auth\n  - cache',
        language: 'yaml',
        description: 'YAML configuration file',
      },
    ],
  },
};

/**
 * Markdown Example
 *
 * Shows example with Markdown language selected.
 */
export const MarkdownExample: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'md',
        title: 'README Template',
        code: '# My Project\n\n## Installation\n\n```bash\nnpm install\n```',
        language: 'markdown',
        description: 'Documentation example',
      },
    ],
  },
};

/**
 * Empty Example (Validation Error)
 *
 * Shows validation error for empty required fields.
 * Card has red border (border-destructive).
 * Error message shown in CardDescription.
 */
export const ValidationErrorEmpty: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'invalid',
        title: '',
        code: '',
        language: 'typescript',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Validation error for empty title and code. Card border turns red, error message shown.',
      },
    },
  },
};

/**
 * Title Too Long (Validation Error)
 *
 * Shows validation error for title > 100 characters.
 */
export const ValidationErrorTitleTooLong: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'toolong',
        title: 'A'.repeat(101), // 101 characters
        code: 'console.log("test");',
        language: 'typescript',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Validation error for title > 100 characters. Shows "Title must be 100 characters or less".',
      },
    },
  },
};

/**
 * Code Too Long (Validation Error)
 *
 * Shows validation error for code > 10,000 characters.
 */
export const ValidationErrorCodeTooLong: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'codelong',
        title: 'Very Long Code',
        code: '// '.repeat(5001), // > 10,000 characters
        language: 'typescript',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Validation error for code > 10,000 characters. Shows "Code must be 10,000 characters or less".',
      },
    },
  },
};

/**
 * Collapsed State
 *
 * Shows example in collapsed state.
 * Only title visible, chevron points down.
 */
export const CollapsedState: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'collapsed',
        title: 'Collapsed Example',
        code: 'console.log("hidden");',
        language: 'typescript',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Example in collapsed state. Click title to expand and see fields.',
      },
    },
  },
};

/**
 * Character Counter
 *
 * Shows character count for code and description fields.
 * Updates in real-time as user types.
 */
export const CharacterCounter: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'counter',
        title: 'Character Count Demo',
        code: 'const x = 1;',
        language: 'typescript',
        description: 'This is a test description.',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Character counters shown below code (X/10,000) and description (X/500) fields. Updates dynamically.',
      },
    },
  },
};

/**
 * Required Fields Asterisk
 *
 * Shows required fields marked with red asterisk (*).
 * Title, Language, and Code are required.
 * Description is optional.
 */
export const RequiredFieldsMarked: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'req',
        title: 'Required Fields Example',
        code: 'export {};',
        language: 'typescript',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Required fields marked with red asterisk (*): Title, Language, Code. Description is optional.',
      },
    },
  },
};

/**
 * JSON Serialization Output
 *
 * Demonstrates hidden input with JSON serialization.
 * Internal 'id' field stripped before submission.
 */
export const JSONSerialization: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'internal-id-123',
        title: 'Example for JSON',
        code: 'console.log("test");',
        language: 'javascript',
        description: 'This will be JSON serialized',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Hidden input contains JSON without internal "id" field. Check browser DevTools to see serialized value.',
      },
    },
  },
};

/**
 * Keyboard Navigation
 *
 * Component fully keyboard accessible:
 * - Tab: Navigate between fields
 * - Enter: Toggle expand/collapse (on title button)
 * - Tab: Focus on input fields when expanded
 * - Escape: (handled by Select component)
 */
export const KeyboardNavigation: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'kbd',
        title: 'Keyboard Example',
        code: 'const test = true;',
        language: 'typescript',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Fully keyboard accessible. Tab to navigate, Enter to expand/collapse, arrow keys in Select dropdown.',
      },
    },
  },
};

/**
 * Mobile Responsive
 *
 * Component adapts to mobile screens:
 * - Collapsible panels conserve space
 * - Touch-friendly buttons (min 44x44px)
 * - Scrollable text areas
 */
export const MobileResponsive: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'mobile',
        title: 'Mobile Example',
        code: 'const mobile = true;',
        language: 'typescript',
      },
    ],
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile-responsive layout. Collapsible panels help conserve screen space.',
      },
    },
  },
};

// ============================================================================
// PLAY FUNCTION TESTS
// ============================================================================

/**
 * Empty State Test
 * Tests empty state shows Code icon and helpful message
 */
export const EmptyStateTest: Story = {
  args: {
    name: 'examples',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests empty state renders with Code icon and helpful message.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty state message appears', async () => {
      const message = canvas.getByText(/No examples added yet/i);
      await expect(message).toBeInTheDocument();
    });

    await step('Verify Add Example button is present', async () => {
      const addButton = canvas.getByRole('button', { name: /Add Example/i });
      await expect(addButton).toBeInTheDocument();
    });
  },
};

/**
 * Hidden Input Test
 * Tests hidden input is present with correct name
 */
export const HiddenInputTest: Story = {
  args: {
    name: 'test-examples',
    defaultValue: [
      {
        id: 'test',
        title: 'Test',
        code: 'test',
        language: 'typescript',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests hidden input exists with correct name attribute.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify hidden input exists', async () => {
      const hiddenInput = canvasElement.querySelector('input[type="hidden"][name="test-examples"]');
      await expect(hiddenInput).toBeTruthy();
    });

    await step('Verify hidden input contains JSON', async () => {
      const hiddenInput = canvasElement.querySelector(
        'input[type="hidden"][name="test-examples"]'
      ) as HTMLInputElement | null;
      if (hiddenInput) {
        const value = hiddenInput.value;
        await expect(() => JSON.parse(value)).not.toThrow();
      }
    });
  },
};

/**
 * Add Example Button Test
 * Tests Add Example button is functional
 */
export const AddExampleButtonTest: Story = {
  args: {
    name: 'examples',
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests Add Example button appears and is clickable.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Add Example button exists', async () => {
      const addButton = canvas.getByRole('button', { name: /Add Example/i });
      await expect(addButton).toBeInTheDocument();
      await expect(addButton).not.toBeDisabled();
    });
  },
};

/**
 * Example Card Test
 * Tests example renders as card with title
 */
export const ExampleCardTest: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'card-test',
        title: 'Test Card Title',
        code: 'console.log("test");',
        language: 'typescript',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests example renders as Card with title visible.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify example title is displayed', async () => {
      const title = canvas.getByText('Test Card Title');
      await expect(title).toBeInTheDocument();
    });
  },
};

/**
 * Remove Button Test
 * Tests remove button appears for each example
 */
export const RemoveButtonTest: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'remove-test',
        title: 'Removable Example',
        code: 'test',
        language: 'typescript',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests remove button (Trash icon) appears for examples.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify remove button exists', async () => {
      const removeButton = canvas.getByRole('button', { name: /Remove example/i });
      await expect(removeButton).toBeInTheDocument();
    });
  },
};

/**
 * Validation Error Test
 * Tests validation error appears for invalid example
 */
export const ValidationErrorTest: Story = {
  args: {
    name: 'examples',
    defaultValue: [
      {
        id: 'invalid',
        title: '',
        code: '',
        language: 'typescript',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests validation error message appears for empty required fields.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify validation error message appears', async () => {
      const errorMessage = canvas.queryByText(/Title is required|Code is required/i);
      await expect(errorMessage).toBeTruthy();
    });
  },
};

/**
 * Max Examples Disabled Test
 * Tests Add Example button disabled at max
 */
export const MaxExamplesDisabledTest: Story = {
  args: {
    name: 'examples',
    maxExamples: 2,
    defaultValue: [
      {
        id: 'ex1',
        title: 'Example 1',
        code: 'test1',
        language: 'typescript',
      },
      {
        id: 'ex2',
        title: 'Example 2',
        code: 'test2',
        language: 'typescript',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests Add Example button is disabled when max examples reached.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Add Example button is disabled', async () => {
      const addButtons = canvas.getAllByRole('button', { name: /Add Example/i });
      // Should have at least one Add Example button
      const topAddButton = addButtons[0];
      await expect(topAddButton).toBeDisabled();
    });
  },
};
